// services/usuariosService.js - Servicio para usuarios con manejo de duplicados
import { apiClient } from './apiClient.js';

export const usuariosService = {
  /**
   * Obtiene todos los usuarios (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getUsuarios: (params = {}) => {
    const query = apiClient.buildQueryParams(params);
    return apiClient.getAllPaginated(`/usr_m${query}`, 'usr_m');
  },
  
  /**
   * Obtiene un usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise} Promesa con los datos
   */
  getUsuario: (id) => {
    return apiClient.get(`/usr_m/${id}`);
  },
  
  /**
   * Obtiene el nombre de un usuario por su ID
   * @param {string|number} id - ID del usuario
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {string} Nombre del usuario
   */
  getNombreUsuario: (id, usuariosList = []) => {
    if (id === null || id === undefined) return 'Sin vendedor';
    
    const usuario = usuariosList.find(u => u.id === id || u.id === id.toString());
    return usuario ? usuario.name : `Vendedor ${id}`;
  },
  
  /**
   * Busca usuarios por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Array} Array de usuarios que coinciden
   */
  buscarPorNombre: (nombre, usuariosList = []) => {
    if (!nombre) return [];
    
    const nombreLower = nombre.toLowerCase();
    return usuariosList.filter(usuario => 
      usuario.name && usuario.name.toLowerCase().includes(nombreLower)
    );
  },
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Object} Mapa de ID a nombre
   */
  crearMapaNombres: (usuariosList = []) => {
    const mapa = {};
    usuariosList.forEach(usuario => {
      if (usuario.id !== undefined && usuario.name) {
        mapa[usuario.id] = usuario.name;
      }
    });
    return mapa;
  },

  /**
   * Elimina usuarios duplicados manteniendo el ID más bajo para cada nombre
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Array} Lista de usuarios sin duplicados
   */
  eliminarDuplicados: (usuariosList = []) => {
    const usuariosUnicos = {};
    
    usuariosList.forEach(usuario => {
      if (usuario.name && usuario.id !== undefined) {
        const nombre = usuario.name.trim();
        
        // Si no existe el nombre o el ID actual es menor, lo guardamos
        if (!usuariosUnicos[nombre] || usuario.id < usuariosUnicos[nombre].id) {
          usuariosUnicos[nombre] = usuario;
        }
      }
    });
    
    return Object.values(usuariosUnicos).sort((a, b) => a.id - b.id);
  },

  /**
   * Crea un mapa que relaciona todos los IDs duplicados con el ID representativo
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Object} Mapa de ID original -> ID representativo
   */
  crearMapaIdRepresentativo: (usuariosList = []) => {
    const gruposPorNombre = {};
    const mapaIdRepresentativo = {};
    
    // Agrupar por nombre
    usuariosList.forEach(usuario => {
      if (usuario.name && usuario.id !== undefined) {
        const nombre = usuario.name.trim();
        
        if (!gruposPorNombre[nombre]) {
          gruposPorNombre[nombre] = [];
        }
        gruposPorNombre[nombre].push(usuario);
      }
    });
    
    // Para cada grupo, mapear todos los IDs al ID más bajo
    Object.values(gruposPorNombre).forEach(grupo => {
      const idRepresentativo = Math.min(...grupo.map(u => u.id));
      
      grupo.forEach(usuario => {
        mapaIdRepresentativo[usuario.id] = idRepresentativo;
      });
    });
    
    return mapaIdRepresentativo;
  },
  
  /**
   * Analiza usuarios duplicados y genera estadísticas
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Object} Análisis de duplicados
   */
  analizarDuplicados: (usuariosList = []) => {
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
  },
  
  /**
   * Genera un reporte detallado de usuarios duplicados
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {string} Reporte en texto
   */
  generarReporteDuplicados: (usuariosList = []) => {
    const analisis = usuariosService.analizarDuplicados(usuariosList);
    
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
  },
  
  /**
   * Obtiene estadísticas de ventas por vendedor (con manejo de duplicados)
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} usuariosList - Lista de usuarios
   * @returns {Array} Estadísticas por vendedor
   */
  getEstadisticasVendedores: (ventasData = [], usuariosList = []) => {
    const mapaIdRepresentativo = usuariosService.crearMapaIdRepresentativo(usuariosList);
    const usuariosUnicos = usuariosService.eliminarDuplicados(usuariosList);
    const ventasPorVendedor = {};
    
    ventasData.forEach(venta => {
      const vendedorIdOriginal = venta.alt_usr;
      if (vendedorIdOriginal !== undefined && vendedorIdOriginal !== null) {
        // Usar el ID representativo en lugar del original
        const vendedorId = mapaIdRepresentativo[vendedorIdOriginal] || vendedorIdOriginal;
        
        if (!ventasPorVendedor[vendedorId]) {
          const usuario = usuariosUnicos.find(u => u.id === vendedorId);
          ventasPorVendedor[vendedorId] = {
            vendedorId,
            nombreVendedor: usuario ? usuario.name : `Vendedor ${vendedorId}`,
            totalVentas: 0,
            cantidadFacturas: 0,
            promedioFactura: 0,
            idsOriginales: new Set([vendedorIdOriginal]) // Para debugging
          };
        } else {
          ventasPorVendedor[vendedorId].idsOriginales.add(vendedorIdOriginal);
        }
        
        ventasPorVendedor[vendedorId].totalVentas += (venta.tot || 0);
        ventasPorVendedor[vendedorId].cantidadFacturas += 1;
      }
    });
    
    // Calcular promedios y ordenar
    return Object.values(ventasPorVendedor)
      .map(vendedor => ({
        ...vendedor,
        promedioFactura: vendedor.cantidadFacturas > 0 ? 
          vendedor.totalVentas / vendedor.cantidadFacturas : 0,
        idsOriginales: Array.from(vendedor.idsOriginales) // Convertir Set a Array
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
  },
  
  /**
   * Valida la consolidación de usuarios duplicados
   * @param {Array} ventasData - Datos de ventas
   * @param {Object} mapaIdRepresentativo - Mapa de ID original -> ID representativo
   * @returns {Object} Resultado de la validación
   */
  validarConsolidacion: (ventasData = [], mapaIdRepresentativo = {}) => {
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
    
    // Verificar que los totales coincidan
    const totalOriginal = Object.values(ventasOriginales)
      .reduce((sum, venta) => sum + venta.total, 0);
    
    const totalConsolidado = Object.values(ventasConsolidadas)
      .reduce((sum, venta) => sum + venta.total, 0);
    
    const cantidadVentasOriginal = Object.values(ventasOriginales)
      .reduce((sum, venta) => sum + venta.cantidad, 0);
    
    const cantidadVentasConsolidado = Object.values(ventasConsolidadas)
      .reduce((sum, venta) => sum + venta.cantidad, 0);
    
    return {
      esValida: Math.abs(totalOriginal - totalConsolidado) < 0.01 && 
                cantidadVentasOriginal === cantidadVentasConsolidado,
      vendedoresOriginales: Object.keys(ventasOriginales).length,
      vendedoresConsolidados: Object.keys(ventasConsolidadas).length,
      ahorroVendedores: Object.keys(ventasOriginales).length - Object.keys(ventasConsolidadas).length,
      totalOriginal,
      totalConsolidado,
      diferencia: totalConsolidado - totalOriginal,
      cantidadVentasOriginal,
      cantidadVentasConsolidado,
      diferenciaCantidad: cantidadVentasConsolidado - cantidadVentasOriginal
    };
  }
};

export default usuariosService;