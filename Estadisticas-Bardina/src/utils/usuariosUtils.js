// utils/usuariosUtils.js
// Utilidades para manejar usuarios duplicados

/**
 * Detecta y reporta usuarios duplicados
 * @param {Array} usuariosList - Lista de usuarios
 * @returns {Object} Reporte de duplicados
 */
export const analizarDuplicados = (usuariosList = []) => {
  const gruposPorNombre = {};
  const duplicados = [];
  
  usuariosList.forEach(usuario => {
    if (usuario.name && usuario.id !== undefined) {
      const nombre = usuario.name.trim();
      
      if (!gruposPorNombre[nombre]) {
        gruposPorNombre[nombre] = [];
      }
      gruposPorNombre[nombre].push(usuario);
    }
  });
  
  // Identificar duplicados
  Object.entries(gruposPorNombre).forEach(([nombre, usuarios]) => {
    if (usuarios.length > 1) {
      duplicados.push({
        nombre,
        usuarios: usuarios.sort((a, b) => a.id - b.id),
        cantidad: usuarios.length,
        idRepresentativo: Math.min(...usuarios.map(u => u.id))
      });
    }
  });
  
  return {
    totalUsuarios: usuariosList.length,
    usuariosUnicos: Object.keys(gruposPorNombre).length,
    cantidadDuplicados: duplicados.length,
    usuariosEliminados: usuariosList.length - Object.keys(gruposPorNombre).length,
    duplicados: duplicados.sort((a, b) => a.nombre.localeCompare(b.nombre))
  };
};

/**
 * Genera un reporte detallado de usuarios duplicados
 * @param {Array} usuariosList - Lista de usuarios
 * @returns {string} Reporte en texto
 */
export const generarReporteDuplicados = (usuariosList = []) => {
  const analisis = analizarDuplicados(usuariosList);
  
  let reporte = `📊 REPORTE DE USUARIOS DUPLICADOS\n`;
  reporte += `=================================\n\n`;
  reporte += `📈 Resumen:\n`;
  reporte += `  • Total usuarios: ${analisis.totalUsuarios}\n`;
  reporte += `  • Usuarios únicos: ${analisis.usuariosUnicos}\n`;
  reporte += `  • Nombres duplicados: ${analisis.cantidadDuplicados}\n`;
  reporte += `  • Usuarios eliminados: ${analisis.usuariosEliminados}\n\n`;
  
  if (analisis.duplicados.length > 0) {
    reporte += `🔍 Detalles de duplicados:\n\n`;
    
    analisis.duplicados.forEach((duplicado, index) => {
      reporte += `${index + 1}. "${duplicado.nombre}" (${duplicado.cantidad} usuarios):\n`;
      reporte += `   ID Representativo: ${duplicado.idRepresentativo}\n`;
      reporte += `   IDs encontrados: ${duplicado.usuarios.map(u => u.id).join(', ')}\n\n`;
    });
  }
  
  return reporte;
};

/**
 * Simula la consolidación de ventas para usuarios duplicados
 * @param {Array} ventasData - Datos de ventas
 * @param {Object} mapaIdRepresentativo - Mapa de ID original -> ID representativo
 * @returns {Object} Estadísticas de consolidación
 */
export const simularConsolidacionVentas = (ventasData = [], mapaIdRepresentativo = {}) => {
  const ventasOriginales = {};
  const ventasConsolidadas = {};
  
  ventasData.forEach(venta => {
    const vendedorOriginal = venta.alt_usr;
    const vendedorConsolidado = mapaIdRepresentativo[vendedorOriginal] || vendedorOriginal;
    
    if (vendedorOriginal !== undefined && vendedorOriginal !== null) {
      // Contar ventas originales
      if (!ventasOriginales[vendedorOriginal]) {
        ventasOriginales[vendedorOriginal] = { cantidad: 0, total: 0 };
      }
      ventasOriginales[vendedorOriginal].cantidad += 1;
      ventasOriginales[vendedorOriginal].total += (venta.tot || 0);
      
      // Contar ventas consolidadas
      if (!ventasConsolidadas[vendedorConsolidado]) {
        ventasConsolidadas[vendedorConsolidado] = { cantidad: 0, total: 0 };
      }
      ventasConsolidadas[vendedorConsolidado].cantidad += 1;
      ventasConsolidadas[vendedorConsolidado].total += (venta.tot || 0);
    }
  });
  
  return {
    vendedoresOriginales: Object.keys(ventasOriginales).length,
    vendedoresConsolidados: Object.keys(ventasConsolidadas).length,
    ventasOriginales,
    ventasConsolidadas,
    ahorroVendedores: Object.keys(ventasOriginales).length - Object.keys(ventasConsolidadas).length
  };
};

/**
 * Valida la integridad de la consolidación
 * @param {Array} ventasData - Datos de ventas
 * @param {Object} mapaIdRepresentativo - Mapa de ID original -> ID representativo
 * @returns {Object} Resultado de la validación
 */
export const validarConsolidacion = (ventasData = [], mapaIdRepresentativo = {}) => {
  const consolidacion = simularConsolidacionVentas(ventasData, mapaIdRepresentativo);
  
  // Verificar que los totales coincidan
  const totalOriginal = Object.values(consolidacion.ventasOriginales)
    .reduce((sum, venta) => sum + venta.total, 0);
  
  const totalConsolidado = Object.values(consolidacion.ventasConsolidadas)
    .reduce((sum, venta) => sum + venta.total, 0);
  
  const cantidadVentasOriginal = Object.values(consolidacion.ventasOriginales)
    .reduce((sum, venta) => sum + venta.cantidad, 0);
  
  const cantidadVentasConsolidado = Object.values(consolidacion.ventasConsolidadas)
    .reduce((sum, venta) => sum + venta.cantidad, 0);
  
  return {
    esValida: Math.abs(totalOriginal - totalConsolidado) < 0.01 && 
              cantidadVentasOriginal === cantidadVentasConsolidado,
    totalOriginal,
    totalConsolidado,
    diferencia: totalConsolidado - totalOriginal,
    cantidadVentasOriginal,
    cantidadVentasConsolidado,
    diferenciaCantidad: cantidadVentasConsolidado - cantidadVentasOriginal,
    ...consolidacion
  };
};

export default {
  analizarDuplicados,
  generarReporteDuplicados,
  simularConsolidacionVentas,
  validarConsolidacion
};