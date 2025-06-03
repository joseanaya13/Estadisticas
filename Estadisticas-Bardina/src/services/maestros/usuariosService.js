// services/usuariosService.js - Servicio específico para gestión de usuarios/vendedores
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de usuarios - Gestiona todas las operaciones relacionadas con usuarios/vendedores
 */
export class UsuariosService {
  constructor() {
    this.endpoint = '/usr_m';
    this.dataKey = 'usr_m';
    this._cache = new Map();
    this._cacheExpiry = 15 * 60 * 1000; // 15 minutos
  }
  
  /**
   * Obtiene todos los usuarios (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getUsuarios(params = {}, useCache = true) {
    try {
      const cacheKey = `usuarios_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando usuarios desde caché');
          return cached.data;
        }
      }
      
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo usuarios desde la API');
      const data = await apiClient.getAllPaginated(endpoint, this.dataKey);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getUsuarios');
    }
  }
  
  /**
   * Obtiene un usuario por ID
   * @param {number|string} id - ID del usuario
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getUsuario(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `usuario_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando usuario ${id} desde caché`);
          return cached.data;
        }
      }
      
      const data = await apiClient.get(`${this.endpoint}/${id}`);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getUsuario');
    }
  }
  
  /**
   * Crea un nuevo usuario
   * @param {Object} usuarioData - Datos del usuario
   * @returns {Promise} Promesa con los datos creados
   */
  async createUsuario(usuarioData) {
    try {
      apiUtils.validateRequiredParams(usuarioData, ['name', 'email']);
      
      const result = await apiClient.post(this.endpoint, usuarioData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.createUsuario');
    }
  }
  
  /**
   * Actualiza un usuario existente
   * @param {number|string} id - ID del usuario
   * @param {Object} usuarioData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateUsuario(id, usuarioData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, usuarioData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.updateUsuario');
    }
  }
  
  /**
   * Elimina un usuario
   * @param {number|string} id - ID del usuario
   * @returns {Promise} Promesa con el resultado
   */
  async deleteUsuario(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.deleteUsuario');
    }
  }
  
  /**
   * Obtiene el nombre de un usuario por su ID
   * @param {string|number} id - ID del usuario
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<string>} Nombre del usuario
   */
  async getNombreUsuario(id, usuariosList = null) {
    try {
      if (id === undefined || id === null) return 'Sin vendedor';
      
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      const usuario = usuariosList.find(u => u.id == id);
      return usuario ? usuario.name : `Vendedor ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de usuario:', error);
      return `Vendedor ${id}`;
    }
  }
  
  /**
   * Busca usuarios por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Array de usuarios que coinciden
   */
  async buscarPorNombre(nombre, usuariosList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return usuariosList.filter(usuario => 
        usuario.name && usuario.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.buscarPorNombre');
    }
  }
  
  /**
   * Busca usuarios por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Array de usuarios que coinciden
   */
  async buscarPorCriterios(criterios = {}, usuariosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      return usuariosList.filter(usuario => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!usuario.name || !usuario.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por email
        if (criterios.email) {
          const emailLower = criterios.email.toLowerCase();
          if (!usuario.email || !usuario.email.toLowerCase().includes(emailLower)) {
            return false;
          }
        }
        
        // Búsqueda por rol
        if (criterios.rol) {
          if (usuario.role !== criterios.rol) {
            return false;
          }
        }
        
        // Búsqueda por estado (activo/inactivo)
        if (criterios.activo !== undefined) {
          if (usuario.is_active !== criterios.activo) {
            return false;
          }
        }
        
        // Búsqueda por departamento
        if (criterios.departamento) {
          if (usuario.department !== criterios.departamento) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Object>} Mapa de usuarios
   */
  async crearMapaCompleto(usuariosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(usuariosList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(usuariosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(usuariosList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de ventas por vendedor
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Estadísticas por vendedor
   */
  async getEstadisticasVendedores(ventasData = [], usuariosList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(usuariosList);
      
      const ventasPorVendedor = {};
      
      ventasData.forEach(venta => {
        const vendedorId = venta.alt_usr;
        if (vendedorId !== undefined && vendedorId !== null) {
          if (!ventasPorVendedor[vendedorId]) {
            ventasPorVendedor[vendedorId] = {
              vendedorId,
              nombreVendedor: mapaNombres[vendedorId] || `Vendedor ${vendedorId}`,
              totalVentas: 0,
              cantidadFacturas: 0,
              promedioFactura: 0,
              ventaMasAlta: 0,
              ventaMasBaja: Infinity,
              ultimaVenta: null,
              primeraVenta: null,
              clientesUnicos: new Set(),
              ventasPorMes: {}
            };
          }
          
          const stats = ventasPorVendedor[vendedorId];
          const totalVenta = venta.tot || 0;
          
          stats.totalVentas += totalVenta;
          stats.cantidadFacturas += 1;
          stats.ventaMasAlta = Math.max(stats.ventaMasAlta, totalVenta);
          stats.ventaMasBaja = Math.min(stats.ventaMasBaja, totalVenta);
          
          // Cliente único
          if (venta.clt) {
            stats.clientesUnicos.add(venta.clt);
          }
          
          // Ventas por mes
          const mesClave = `${venta.eje}-${String(venta.mes).padStart(2, '0')}`;
          stats.ventasPorMes[mesClave] = (stats.ventasPorMes[mesClave] || 0) + totalVenta;
          
          // Fechas
          const fechaVenta = new Date(venta.fch);
          if (!stats.ultimaVenta || fechaVenta > new Date(stats.ultimaVenta)) {
            stats.ultimaVenta = venta.fch;
          }
          if (!stats.primeraVenta || fechaVenta < new Date(stats.primeraVenta)) {
            stats.primeraVenta = venta.fch;
          }
        }
      });
      
      return Object.values(ventasPorVendedor)
        .map(vendedor => ({
          ...vendedor,
          promedioFactura: vendedor.cantidadFacturas > 0 ? 
            vendedor.totalVentas / vendedor.cantidadFacturas : 0,
          ventaMasBaja: vendedor.ventaMasBaja === Infinity ? 0 : vendedor.ventaMasBaja,
          clientesUnicos: vendedor.clientesUnicos.size,
          mesesActivo: Object.keys(vendedor.ventasPorMes).length,
          ventasPorMesArray: Object.entries(vendedor.ventasPorMes)
            .map(([mes, total]) => ({ mes, total }))
            .sort((a, b) => a.mes.localeCompare(b.mes)),
          diasSinVender: vendedor.ultimaVenta ? 
            Math.floor((Date.now() - new Date(vendedor.ultimaVenta)) / (1000 * 60 * 60 * 24)) : null
        }))
        .sort((a, b) => b.totalVentas - a.totalVentas);
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getEstadisticasVendedores');
    }
  }
  
  /**
   * Obtiene el ranking de vendedores por diferentes métricas
   * @param {Array} ventasData - Datos de ventas
   * @param {string} metrica - Métrica a usar ('total', 'cantidad', 'promedio', 'clientes')
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Ranking de vendedores
   */
  async getRankingVendedores(ventasData = [], metrica = 'total', limit = 10, usuariosList = null) {
    try {
      const estadisticas = await this.getEstadisticasVendedores(ventasData, usuariosList);
      
      let sortFunction;
      switch (metrica) {
        case 'cantidad':
          sortFunction = (a, b) => b.cantidadFacturas - a.cantidadFacturas;
          break;
        case 'promedio':
          sortFunction = (a, b) => b.promedioFactura - a.promedioFactura;
          break;
        case 'clientes':
          sortFunction = (a, b) => b.clientesUnicos - a.clientesUnicos;
          break;
        case 'total':
        default:
          sortFunction = (a, b) => b.totalVentas - a.totalVentas;
          break;
      }
      
      return estadisticas
        .sort(sortFunction)
        .slice(0, limit)
        .map((vendedor, index) => ({
          ...vendedor,
          posicion: index + 1,
          metricaOrdenamiento: metrica
        }));
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getRankingVendedores');
    }
  }
  
  /**
   * Analiza el rendimiento de vendedores por período
   * @param {Array} ventasData - Datos de ventas
   * @param {string} periodo - Período de análisis ('mes', 'trimestre', 'año')
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Object>} Análisis de rendimiento
   */
  async getAnalisisRendimiento(ventasData = [], periodo = 'mes', usuariosList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(usuariosList);
      
      const rendimientoPorPeriodo = {};
      
      ventasData.forEach(venta => {
        let clavePeriodo;
        
        switch (periodo) {
          case 'año':
            clavePeriodo = venta.eje;
            break;
          case 'trimestre':
            clavePeriodo = `${venta.eje}-Q${Math.ceil(venta.mes / 3)}`;
            break;
          case 'mes':
          default:
            clavePeriodo = `${venta.eje}-${String(venta.mes).padStart(2, '0')}`;
            break;
        }
        
        const vendedorId = venta.alt_usr;
        const total = venta.tot || 0;
        
        if (clavePeriodo && vendedorId !== undefined && vendedorId !== null) {
          if (!rendimientoPorPeriodo[clavePeriodo]) {
            rendimientoPorPeriodo[clavePeriodo] = {};
          }
          
          if (!rendimientoPorPeriodo[clavePeriodo][vendedorId]) {
            rendimientoPorPeriodo[clavePeriodo][vendedorId] = {
              vendedorId,
              nombre: mapaNombres[vendedorId] || `Vendedor ${vendedorId}`,
              total: 0,
              cantidad: 0,
              clientesUnicos: new Set()
            };
          }
          
          const stats = rendimientoPorPeriodo[clavePeriodo][vendedorId];
          stats.total += total;
          stats.cantidad += 1;
          
          if (venta.clt) {
            stats.clientesUnicos.add(venta.clt);
          }
        }
      });
      
      // Procesar y formatear resultados
      const resultados = Object.entries(rendimientoPorPeriodo)
        .map(([periodo, vendedores]) => {
          const vendedoresArray = Object.values(vendedores).map(v => ({
            ...v,
            clientesUnicos: v.clientesUnicos.size,
            promedio: v.cantidad > 0 ? v.total / v.cantidad : 0
          }));
          
          const totalPeriodo = vendedoresArray.reduce((sum, v) => sum + v.total, 0);
          
          return {
            periodo,
            vendedores: vendedoresArray.sort((a, b) => b.total - a.total),
            resumen: {
              totalVentas: totalPeriodo,
              totalTransacciones: vendedoresArray.reduce((sum, v) => sum + v.cantidad, 0),
              vendedoresActivos: vendedoresArray.length,
              mejorVendedor: vendedoresArray.length > 0 ? vendedoresArray[0] : null
            }
          };
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
      
      return {
        periodos: resultados,
        resumen: {
          totalPeriodos: resultados.length,
          tendencia: this._calcularTendenciaRendimiento(resultados)
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getAnalisisRendimiento');
    }
  }
  
  /**
   * Identifica vendedores con bajo rendimiento
   * @param {Array} ventasData - Datos de ventas
   * @param {number} umbralVentas - Umbral mínimo de ventas
   * @param {number} diasAnalisis - Días a analizar hacia atrás (por defecto 90)
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Vendedores con bajo rendimiento
   */
  async getVendedoresBajoRendimiento(ventasData = [], umbralVentas = 1000, diasAnalisis = 90, usuariosList = null) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAnalisis);
      
      const ventasRecientes = ventasData.filter(venta => 
        new Date(venta.fch) >= fechaLimite
      );
      
      const estadisticas = await this.getEstadisticasVendedores(ventasRecientes, usuariosList);
      
      return estadisticas
        .filter(vendedor => vendedor.totalVentas < umbralVentas)
        .map(vendedor => ({
          ...vendedor,
          diasAnalisis,
          umbralVentas,
          diferencia: umbralVentas - vendedor.totalVentas,
          porcentajeUmbral: umbralVentas > 0 ? (vendedor.totalVentas / umbralVentas) * 100 : 0
        }))
        .sort((a, b) => a.totalVentas - b.totalVentas);
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getVendedoresBajoRendimiento');
    }
  }
  
  /**
   * Obtiene estadísticas generales de usuarios
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Object>} Estadísticas generales
   */
  async getEstadisticasGenerales(usuariosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: usuariosList.length,
        activos: 0,
        inactivos: 0,
        conEmail: 0,
        conTelefono: 0,
        porRol: {},
        porDepartamento: {}
      };
      
      usuariosList.forEach(usuario => {
        // Estado activo/inactivo
        if (usuario.is_active) {
          stats.activos++;
        } else {
          stats.inactivos++;
        }
        
        // Información de contacto
        if (usuario.email) stats.conEmail++;
        if (usuario.phone) stats.conTelefono++;
        
        // Distribución por rol
        if (usuario.role) {
          stats.porRol[usuario.role] = (stats.porRol[usuario.role] || 0) + 1;
        }
        
        // Distribución por departamento
        if (usuario.department) {
          stats.porDepartamento[usuario.department] = (stats.porDepartamento[usuario.department] || 0) + 1;
        }
      });
      
      return {
        ...stats,
        porcentajes: {
          activos: stats.total > 0 ? (stats.activos / stats.total) * 100 : 0,
          conEmail: stats.total > 0 ? (stats.conEmail / stats.total) * 100 : 0,
          conTelefono: stats.total > 0 ? (stats.conTelefono / stats.total) * 100 : 0
        },
        distribuciones: {
          roles: Object.entries(stats.porRol).map(([rol, cantidad]) => ({ rol, cantidad })),
          departamentos: Object.entries(stats.porDepartamento).map(([depto, cantidad]) => ({ departamento: depto, cantidad }))
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getEstadisticasGenerales');
    }
  }
  
  /**
   * Valida si un usuario existe
   * @param {number|string} id - ID del usuario
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeUsuario(id) {
    try {
      await this.getUsuario(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtiene usuarios vendedores únicamente
   * @param {Array} usuariosList - Lista de usuarios (opcional)
   * @returns {Promise<Array>} Lista de vendedores
   */
  async getVendedores(usuariosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!usuariosList) {
        const response = await this.getUsuarios();
        usuariosList = response[this.dataKey] || [];
      }
      
      // Filtrar solo usuarios que pueden ser vendedores
      return usuariosList.filter(usuario => 
        usuario.role === 'vendedor' || 
        usuario.role === 'sales' || 
        usuario.can_sell === true ||
        usuario.is_active === true // Asumir que usuarios activos pueden vender
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'UsuariosService.getVendedores');
    }
  }
  
  /**
   * Limpia la caché de usuarios
   */
  clearCache() {
    this._clearCache();
  }
  
  /**
   * Obtiene estadísticas de la caché
   * @returns {Object} Estadísticas de caché
   */
  getCacheStats() {
    return {
      size: this._cache.size,
      keys: Array.from(this._cache.keys()),
      expiryTime: this._cacheExpiry / 1000 + ' segundos'
    };
  }
  
  /**
   * Calcula la tendencia de rendimiento
   * @private
   * @param {Array} resultados - Resultados de análisis por período
   * @returns {Object} Información de tendencia
   */
  _calcularTendenciaRendimiento(resultados) {
    if (resultados.length < 2) {
      return { porcentaje: 0, tendencia: 'insuficientes_datos' };
    }
    
    const primero = resultados[0];
    const ultimo = resultados[resultados.length - 1];
    
    const crecimiento = primero.resumen.totalVentas > 0 ? 
      ((ultimo.resumen.totalVentas - primero.resumen.totalVentas) / primero.resumen.totalVentas) * 100 : 0;
    
    return {
      porcentaje: crecimiento,
      tendencia: crecimiento > 5 ? 'creciente' : crecimiento < -5 ? 'decreciente' : 'estable',
      periodoInicial: primero.periodo,
      periodoFinal: ultimo.periodo,
      ventasIniciales: primero.resumen.totalVentas,
      ventasFinales: ultimo.resumen.totalVentas,
      vendedoresIniciales: primero.resumen.vendedoresActivos,
      vendedoresFinales: ultimo.resumen.vendedoresActivos
    };
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de usuarios limpiada');
  }
}

// Crear instancia singleton
export const usuariosService = new UsuariosService();

// Exportación por defecto
export default usuariosService;