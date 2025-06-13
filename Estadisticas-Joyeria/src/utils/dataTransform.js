// src/utils/dataTransform.js
import { calcularBeneficio, calcularMargen } from './calculations';
import { formatDate, formatVelneoTime } from './formatters';

/**
 * Transforma los datos raw de Velneo en un formato estructurado para la aplicación
 * @param {Object} rawData - Datos obtenidos de la API de Velneo
 * @returns {Object} - Datos transformados
 */
export const transformSalesData = (rawData) => {
  const { facturas, lineas, articulos, usuarios, familias, formasPago, proveedores } = rawData;
  
  if (!facturas || !lineas) {
    return { ventasCompletas: [], resumen: null };
  }
  
  // Crear mapas para lookup rápido
  const articulosMap = new Map(articulos?.map(a => [a.id, a]) || []);
  const usuariosMap = new Map(usuarios?.map(u => [u.id, u]) || []);
  const familiasMap = new Map(familias?.map(f => [f.id, f]) || []);
  const formasPagoMap = new Map(formasPago?.map(f => [f.id, f]) || []);
  const proveedoresMap = new Map(proveedores?.map(p => [p.id, p]) || []);
  const facturasMap = new Map(facturas.map(f => [f.id, f]));
  
  // Transformar líneas en ventas completas
  const ventasCompletas = lineas.map(linea => {
    const factura = facturasMap.get(linea.fac) || {};
    const articulo = articulosMap.get(linea.art) || {};
    const usuario = usuariosMap.get(factura.alt_usr) || {};
    const familia = familiasMap.get(linea.fam) || {};
    const formaPago = formasPagoMap.get(factura.fpg) || {};
    
    // Buscar proveedor: primero en la línea, luego en el artículo
    const proveedorId = linea.prv || articulo.prv;
    const proveedor = proveedorId ? proveedoresMap.get(proveedorId) : null;
    
    // Calcular beneficio real
    const beneficioCalculado = calcularBeneficio(linea);
    const margen = calcularMargen(linea);
    
    // Calcular peso total de la línea
    const pesoUnitario = articulo.peso || 0;
    const cantidad = linea.can || 0;
    const pesoTotalLinea = pesoUnitario * cantidad;
    
    return {
      // IDs de referencia
      lineaId: linea.id,
      facturaId: factura.id,
      articuloId: linea.art,
      vendedorId: factura.alt_usr,
      familiaId: linea.fam,
      formaPagoId: factura.fpg,
      proveedorId: proveedorId,
      
      // Información de fecha y hora
      fecha: factura.fch ? factura.fch.split('T')[0] : null,
      hora: factura.hor ? formatVelneoTime(factura.hor) : null,
      fechaCompleta: factura.fch,
      
      // Información de factura
      numeroFactura: factura.num_fac || factura.id,
      serieFactura: factura.ser || '',
      division: factura.emp_div || '',
      finalizada: factura.fin || false,
      
      // Información del vendedor
      vendedor: usuario.name || `Usuario ${factura.alt_usr}`,
      codigoVendedor: usuario.cod || '',
      
      // Información del artículo
      nombreArticulo: articulo.name || linea.name || 'Sin nombre',
      referenciaArticulo: articulo.ref || '',
      codigoArticulo: articulo.cod || '',
      descripcionArticulo: articulo.des || '',
      pesoUnitario: pesoUnitario,
      
      // Información de familia
      familia: familia.name || `Familia ${linea.fam}`,
      codigoFamilia: familia.cod || '',
      
      // Información del proveedor (buscar por ID)
      proveedor: proveedor?.name || linea.prv || 'Sin proveedor',
      codigoProveedor: proveedor || '',
      esProveedor: proveedor || false,
      
      // Información de la forma de pago
      formaPago: formaPago.name || 'Sin especificar',
      codigoFormaPago: formaPago.cod || '',
      
      // Cantidades y precios
      cantidad: cantidad,
      precioVenta: linea.imp_pvp || 0,
      precioUnitario: cantidad > 0 ? (linea.imp_pvp || 0) / cantidad : 0,
      importeTotal: linea.imp_pvp || 0,
      
      // Costes y beneficios
      coste: linea.cos || 0,
      costeTotal: (linea.cos || 0) * cantidad,
      beneficioBD: linea.ben || 0, // Beneficio de la BD (puede estar mal)
      beneficioCalculado: beneficioCalculado, // Beneficio calculado correctamente
      margen: margen,
      
      // Pesos
      pesoTotalLinea: pesoTotalLinea,
      
      // Descuentos
      descuento: linea.dto || 0,
      
      // Datos originales para referencia
      _linea: linea,
      _factura: factura,
      _articulo: articulo
    };
  });
  
  // Generar resumen
  const resumen = generateSummary(ventasCompletas);
  
  return {
    ventasCompletas,
    resumen
  };
};

/**
 * Filtra los datos de ventas según los criterios especificados
 * @param {Array} ventasData - Array de ventas completas
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} - Ventas filtradas
 */
export const filterSalesData = (ventasData, filters = {}) => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  return ventasData.filter(venta => {
    // Filtro por fecha
    if (filters.fechaDesde && venta.fecha < filters.fechaDesde) {
      return false;
    }
    
    if (filters.fechaHasta && venta.fecha > filters.fechaHasta) {
      return false;
    }
    
    // Filtro por vendedor
    if (filters.vendedorId && venta.vendedorId !== parseInt(filters.vendedorId)) {
      return false;
    }
    
    // Filtro por familia
    if (filters.familiaId && venta.familiaId !== parseInt(filters.familiaId)) {
      return false;
    }
    
    // Filtro por forma de pago
    if (filters.formaPagoId && venta.formaPagoId !== parseInt(filters.formaPagoId)) {
      return false;
    }
    
    // Filtro por proveedor
    if (filters.proveedorId && venta.proveedorId !== parseInt(filters.proveedorId)) {
      return false;
    }
    
    // Filtro por monto mínimo
    if (filters.montoMinimo && venta.importeTotal < filters.montoMinimo) {
      return false;
    }
    
    // Filtro por monto máximo
    if (filters.montoMaximo && venta.importeTotal > filters.montoMaximo) {
      return false;
    }
    
    // Filtro por artículo (búsqueda de texto)
    if (filters.busquedaArticulo) {
      const busqueda = filters.busquedaArticulo.toLowerCase();
      const coincide = venta.nombreArticulo.toLowerCase().includes(busqueda) ||
                      venta.referenciaArticulo.toLowerCase().includes(busqueda) ||
                      venta.codigoArticulo.toLowerCase().includes(busqueda);
      if (!coincide) return false;
    }
    
    // Filtro por vendedor (búsqueda de texto)
    if (filters.busquedaVendedor) {
      const busqueda = filters.busquedaVendedor.toLowerCase();
      if (!venta.vendedor.toLowerCase().includes(busqueda)) {
        return false;
      }
    }
    
    // Solo ventas finalizadas
    if (filters.soloFinalizadas !== false && !venta.finalizada) {
      return false;
    }
    
    // Filtro por margen mínimo
    if (filters.margenMinimo && venta.margen < filters.margenMinimo) {
      return false;
    }
    
    return true;
  });
};

/**
 * Agrupa las ventas por período (día, semana, mes)
 * @param {Array} ventasData - Array de ventas
 * @param {string} periodo - 'dia', 'semana', 'mes'
 * @returns {Array} - Ventas agrupadas
 */
export const groupSalesByPeriod = (ventasData, periodo = 'dia') => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  const grupos = {};
  
  ventasData.forEach(venta => {
    let clave;
    const fecha = new Date(venta.fechaCompleta || venta.fecha);
    
    switch (periodo) {
      case 'dia':
        clave = fecha.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        clave = inicioSemana.toISOString().split('T')[0];
        break;
      case 'mes':
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        clave = fecha.toISOString().split('T')[0];
    }
    
    if (!grupos[clave]) {
      grupos[clave] = {
        periodo: clave,
        fecha: fecha,
        ventas: 0,
        beneficio: 0,
        costes: 0,
        cantidad: 0,
        transacciones: new Set(),
        articulos: new Set(),
        registros: []
      };
    }
    
    grupos[clave].ventas += venta.importeTotal;
    grupos[clave].beneficio += venta.beneficioCalculado;
    grupos[clave].costes += venta.costeTotal;
    grupos[clave].cantidad += venta.cantidad;
    grupos[clave].transacciones.add(venta.facturaId);
    grupos[clave].articulos.add(venta.articuloId);
    grupos[clave].registros.push(venta);
  });
  
  // Convertir sets a números
  return Object.values(grupos).map(grupo => ({
    ...grupo,
    transacciones: grupo.transacciones.size,
    articulos: grupo.articulos.size,
    ticketMedio: grupo.transacciones > 0 ? grupo.ventas / grupo.transacciones : 0,
    margenPromedio: grupo.ventas > 0 ? (grupo.beneficio / grupo.ventas) * 100 : 0
  })).sort((a, b) => a.fecha - b.fecha);
};

/**
 * Obtiene los productos más vendidos
 * @param {Array} ventasData - Array de ventas
 * @param {number} limit - Número de productos a devolver
 * @returns {Array} - Top productos
 */
export const getTopProducts = (ventasData, limit = 10) => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  const productos = {};
  
  ventasData.forEach(venta => {
    if (!productos[venta.articuloId]) {
      productos[venta.articuloId] = {
        articuloId: venta.articuloId,
        nombre: venta.nombreArticulo,
        referencia: venta.referenciaArticulo,
        familia: venta.familia,
        ventas: 0,
        cantidad: 0,
        beneficio: 0,
        costes: 0,
        numeroVentas: 0,
        precioPromedio: 0
      };
    }
    
    productos[venta.articuloId].ventas += venta.importeTotal;
    productos[venta.articuloId].cantidad += venta.cantidad;
    productos[venta.articuloId].beneficio += venta.beneficioCalculado;
    productos[venta.articuloId].costes += venta.costeTotal;
    productos[venta.articuloId].numeroVentas += 1;
  });
  
  // Calcular promedios
  Object.values(productos).forEach(producto => {
    if (producto.cantidad > 0) {
      producto.precioPromedio = producto.ventas / producto.cantidad;
    }
  });
  
  return Object.values(productos)
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limit);
};

/**
 * Obtiene los vendedores más exitosos
 * @param {Array} ventasData - Array de ventas
 * @param {number} limit - Número de vendedores a devolver
 * @returns {Array} - Top vendedores
 */
export const getTopVendors = (ventasData, limit = 10) => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  const vendedores = {};
  
  ventasData.forEach(venta => {
    if (!vendedores[venta.vendedorId]) {
      vendedores[venta.vendedorId] = {
        vendedorId: venta.vendedorId,
        nombre: venta.vendedor,
        ventas: 0,
        beneficio: 0,
        numeroTransacciones: new Set(),
        numeroArticulos: 0,
        ticketMedio: 0
      };
    }
    
    vendedores[venta.vendedorId].ventas += venta.importeTotal;
    vendedores[venta.vendedorId].beneficio += venta.beneficioCalculado;
    vendedores[venta.vendedorId].numeroTransacciones.add(venta.facturaId);
    vendedores[venta.vendedorId].numeroArticulos += venta.cantidad;
  });
  
  // Calcular ticket medio
  Object.values(vendedores).forEach(vendedor => {
    const numTransacciones = vendedor.numeroTransacciones.size;
    vendedor.numeroTransacciones = numTransacciones;
    vendedor.ticketMedio = numTransacciones > 0 ? vendedor.ventas / numTransacciones : 0;
  });
  
  return Object.values(vendedores)
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limit);
};

/**
 * Calcula estadísticas de familias de productos
 * @param {Array} ventasData - Array de ventas
 * @returns {Array} - Estadísticas por familia
 */
export const getFamilyStats = (ventasData) => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  const familias = {};
  
  ventasData.forEach(venta => {
    if (!familias[venta.familiaId]) {
      familias[venta.familiaId] = {
        familiaId: venta.familiaId,
        nombre: venta.familia,
        ventas: 0,
        beneficio: 0,
        costes: 0,
        cantidad: 0,
        productos: new Set(),
        transacciones: new Set(),
        margenPromedio: 0
      };
    }
    
    familias[venta.familiaId].ventas += venta.importeTotal;
    familias[venta.familiaId].beneficio += venta.beneficioCalculado;
    familias[venta.familiaId].costes += venta.costeTotal;
    familias[venta.familiaId].cantidad += venta.cantidad;
    familias[venta.familiaId].productos.add(venta.articuloId);
    familias[venta.familiaId].transacciones.add(venta.facturaId);
  });
  
  // Calcular estadísticas finales
  return Object.values(familias).map(familia => ({
    ...familia,
    productos: familia.productos.size,
    transacciones: familia.transacciones.size,
    margenPromedio: familia.ventas > 0 ? (familia.beneficio / familia.ventas) * 100 : 0,
    precioMedio: familia.cantidad > 0 ? familia.ventas / familia.cantidad : 0
  })).sort((a, b) => b.ventas - a.ventas);
};

/**
 * Genera un resumen general de las ventas
 * @param {Array} ventasData - Array de ventas completas
 * @returns {Object} - Resumen de ventas
 */
const generateSummary = (ventasData) => {
  if (!ventasData || !Array.isArray(ventasData) || ventasData.length === 0) {
    return {
      totalVentas: 0,
      totalBeneficio: 0,
      totalCostes: 0,
      totalArticulos: 0,
      numeroTransacciones: 0,
      numeroProductos: 0,
      numeroVendedores: 0,
      ticketMedio: 0,
      margenPromedio: 0,
      pesoTotal: 0
    };
  }
  
  const transacciones = new Set();
  const productos = new Set();
  const vendedores = new Set();
  
  let totalVentas = 0;
  let totalBeneficio = 0;
  let totalCostes = 0;
  let totalArticulos = 0;
  let pesoTotal = 0;
  
  ventasData.forEach(venta => {
    totalVentas += venta.importeTotal;
    totalBeneficio += venta.beneficioCalculado;
    totalCostes += venta.costeTotal;
    totalArticulos += venta.cantidad;
    pesoTotal += venta.pesoTotalLinea;
    
    transacciones.add(venta.facturaId);
    productos.add(venta.articuloId);
    vendedores.add(venta.vendedorId);
  });
  
  const numeroTransacciones = transacciones.size;
  const ticketMedio = numeroTransacciones > 0 ? totalVentas / numeroTransacciones : 0;
  const margenPromedio = totalVentas > 0 ? (totalBeneficio / totalVentas) * 100 : 0;
  
  return {
    totalVentas,
    totalBeneficio,
    totalCostes,
    totalArticulos,
    numeroTransacciones,
    numeroProductos: productos.size,
    numeroVendedores: vendedores.size,
    ticketMedio,
    margenPromedio,
    pesoTotal
  };
};

/**
 * Prepara datos para gráficos de Chart.js o Recharts
 * @param {Array} ventasData - Array de ventas
 * @param {string} tipo - Tipo de gráfico ('line', 'bar', 'pie')
 * @param {string} agrupacion - Cómo agrupar los datos
 * @returns {Array} - Datos formateados para gráficos
 */
export const prepareChartData = (ventasData, tipo = 'line', agrupacion = 'dia') => {
  if (!ventasData || !Array.isArray(ventasData)) return [];
  
  switch (tipo) {
    case 'line':
      return groupSalesByPeriod(ventasData, agrupacion).map(grupo => ({
        fecha: formatDate(grupo.fecha),
        ventas: grupo.ventas,
        beneficio: grupo.beneficio,
        transacciones: grupo.transacciones
      }));
      
    case 'bar':
      return getFamilyStats(ventasData).map(familia => ({
        familia: familia.nombre,
        ventas: familia.ventas,
        beneficio: familia.beneficio
      }));
      
    case 'pie':
      return getTopVendors(ventasData, 8).map(vendedor => ({
        vendedor: vendedor.nombre,
        ventas: vendedor.ventas,
        porcentaje: 0 // Se calculará después
      }));
      
    default:
      return [];
  }
};