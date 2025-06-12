// Funciones para cálculos correctos de beneficios y márgenes

/**
 * Calcula el beneficio real de una línea de venta
 * @param {Object} linea - Línea de factura
 * @returns {number} - Beneficio calculado
 */
export const calcularBeneficio = (linea) => {
  const importe = linea.imp_pvp || 0;
  const coste = linea.cos || 0;
  return importe - coste;
};

/**
 * Calcula el margen de beneficio en porcentaje
 * @param {Object} linea - Línea de factura
 * @returns {number} - Margen en porcentaje
 */
export const calcularMargen = (linea) => {
  const importe = linea.imp_pvp || 0;
  const coste = linea.cos || 0;
  
  if (importe === 0) return 0;
  
  const beneficio = importe - coste;
  return (beneficio / importe) * 100;
};

/**
 * Calcula el margen sobre el coste (markup)
 * @param {Object} linea - Línea de factura
 * @returns {number} - Markup en porcentaje
 */
export const calcularMarkup = (linea) => {
  const importe = linea.imp_pvp || 0;
  const coste = linea.cos || 0;
  
  if (coste === 0) return 0;
  
  const beneficio = importe - coste;
  return (beneficio / coste) * 100;
};

/**
 * Verifica si los datos de beneficio en BD están correctos
 * @param {Array} lineas - Array de líneas de factura
 * @returns {Object} - Resumen de inconsistencias
 */
export const verificarBeneficios = (lineas) => {
  let correctos = 0;
  let incorrectos = 0;
  let inconsistencias = [];
  
  lineas.forEach(linea => {
    const beneficioBD = linea.ben || 0;
    const beneficioCalculado = calcularBeneficio(linea);
    const diferencia = Math.abs(beneficioBD - beneficioCalculado);
    
    if (diferencia > 0.01) { // Tolerancia de 1 céntimo
      incorrectos++;
      inconsistencias.push({
        lineaId: linea.id,
        facturaId: linea.fac,
        articulo: linea.name,
        beneficioBD,
        beneficioCalculado,
        diferencia
      });
    } else {
      correctos++;
    }
  });
  
  return {
    total: lineas.length,
    correctos,
    incorrectos,
    porcentajeCorrectos: lineas.length > 0 ? (correctos / lineas.length) * 100 : 0,
    inconsistencias: inconsistencias.slice(0, 10) // Primeras 10 inconsistencias
  };
};

/**
 * Calcula estadísticas de beneficio por familia
 * @param {Array} lineas - Array de líneas de factura
 * @param {Array} familias - Array de familias
 * @returns {Array} - Estadísticas por familia
 */
export const calcularBeneficiosPorFamilia = (lineas, familias = []) => {
  const familiasMap = new Map(familias.map(f => [f.id, f.name]));
  const stats = {};
  
  lineas.forEach(linea => {
    const familiaId = linea.fam;
    const familiaName = familiasMap.get(familiaId) || `Familia ${familiaId}`;
    
    if (!stats[familiaId]) {
      stats[familiaId] = {
        familiaId,
        familiaName,
        ventasTotales: 0,
        costeTotal: 0,
        beneficioTotal: 0,
        cantidadLineas: 0,
        margenPromedio: 0
      };
    }
    
    const importe = linea.imp_pvp || 0;
    const coste = linea.cos || 0;
    const beneficio = importe - coste;
    
    stats[familiaId].ventasTotales += importe;
    stats[familiaId].costeTotal += coste;
    stats[familiaId].beneficioTotal += beneficio;
    stats[familiaId].cantidadLineas += 1;
  });
  
  // Calcular margen promedio por familia
  Object.values(stats).forEach(familia => {
    if (familia.ventasTotales > 0) {
      familia.margenPromedio = (familia.beneficioTotal / familia.ventasTotales) * 100;
    }
  });
  
  return Object.values(stats).sort((a, b) => b.beneficioTotal - a.beneficioTotal);
};

/**
 * Calcula el punto de equilibrio para un artículo
 * @param {number} costeFijo - Costes fijos
 * @param {number} costeVariable - Coste variable por unidad
 * @param {number} precioVenta - Precio de venta por unidad
 * @returns {number} - Unidades necesarias para punto de equilibrio
 */
export const calcularPuntoEquilibrio = (costeFijo, costeVariable, precioVenta) => {
  const margenContribucion = precioVenta - costeVariable;
  
  if (margenContribucion <= 0) {
    return Infinity; // No es rentable
  }
  
  return Math.ceil(costeFijo / margenContribucion);
};

/**
 * Analiza la rentabilidad de los artículos
 * @param {Array} lineas - Array de líneas de factura
 * @param {Array} articulos - Array de artículos
 * @returns {Array} - Análisis de rentabilidad
 */
export const analizarRentabilidad = (lineas, articulos = []) => {
  const articulosMap = new Map(articulos.map(a => [a.id, a]));
  const rentabilidad = {};
  
  lineas.forEach(linea => {
    const articuloId = linea.art;
    const articulo = articulosMap.get(articuloId);
    
    if (!rentabilidad[articuloId]) {
      rentabilidad[articuloId] = {
        articuloId,
        nombre: articulo?.name || linea.name || 'Sin nombre',
        referencia: articulo?.ref || '',
        ventasTotales: 0,
        costeTotal: 0,
        beneficioTotal: 0,
        cantidadVendida: 0,
        numeroVentas: 0,
        precioPromedio: 0,
        margenPromedio: 0
      };
    }
    
    const importe = linea.imp_pvp || 0;
    const coste = linea.cos || 0;
    const cantidad = linea.can || 0;
    const beneficio = importe - coste;
    
    rentabilidad[articuloId].ventasTotales += importe;
    rentabilidad[articuloId].costeTotal += coste;
    rentabilidad[articuloId].beneficioTotal += beneficio;
    rentabilidad[articuloId].cantidadVendida += cantidad;
    rentabilidad[articuloId].numeroVentas += 1;
  });
  
  // Calcular promedios
  Object.values(rentabilidad).forEach(item => {
    if (item.cantidadVendida > 0) {
      item.precioPromedio = item.ventasTotales / item.cantidadVendida;
    }
    if (item.ventasTotales > 0) {
      item.margenPromedio = (item.beneficioTotal / item.ventasTotales) * 100;
    }
  });
  
  return Object.values(rentabilidad)
    .sort((a, b) => b.beneficioTotal - a.beneficioTotal);
};

/**
 * Formatea un resumen de inconsistencias para mostrar al usuario
 * @param {Object} verificacion - Resultado de verificarBeneficios
 * @returns {string} - Mensaje formateado
 */
export const formatearResumenInconsistencias = (verificacion) => {
  const { total, correctos, incorrectos, porcentajeCorrectos } = verificacion;
  
  if (incorrectos === 0) {
    return `✅ Todos los beneficios están correctos (${total} líneas verificadas)`;
  }
  
  return `⚠️ ${incorrectos} de ${total} líneas tienen beneficios incorrectos (${porcentajeCorrectos.toFixed(1)}% correctos)`;
};