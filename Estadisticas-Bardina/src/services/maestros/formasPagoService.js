// services/formasPagoService.js - Servicio específico para gestión de formas de pago
import { apiClient, apiUtils } from './apiClient.js';

/**
 * Servicio de formas de pago - Gestiona todas las operaciones relacionadas con métodos de pago
 */
export class FormasPagoService {
  constructor() {
    this.endpoint = '/fpg_m';
    this.dataKey = 'fpg_m';
    this._cache = new Map();
    this._cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }
  
  /**
   * Obtiene todas las formas de pago
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getFormasPago(useCache = true) {
    try {
      const cacheKey = 'formas_pago_all';
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando formas de pago desde caché');
          return cached.data;
        }
      }
      
      console.log('Obteniendo formas de pago desde la API');
      const data = await apiClient.get(this.endpoint);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getFormasPago');
    }
  }
  
  /**
   * Obtiene una forma de pago por ID
   * @param {number|string} id - ID de la forma de pago
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getFormaPago(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `forma_pago_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando forma de pago ${id} desde caché`);
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
      throw apiUtils.handleError(error, 'FormasPagoService.getFormaPago');
    }
  }
  
  /**
   * Crea una nueva forma de pago
   * @param {Object} formaPagoData - Datos de la forma de pago
   * @returns {Promise} Promesa con los datos creados
   */
  async createFormaPago(formaPagoData) {
    try {
      apiUtils.validateRequiredParams(formaPagoData, ['name']);
      
      const result = await apiClient.post(this.endpoint, formaPagoData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.createFormaPago');
    }
  }
  
  /**
   * Actualiza una forma de pago existente
   * @param {number|string} id - ID de la forma de pago
   * @param {Object} formaPagoData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateFormaPago(id, formaPagoData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, formaPagoData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.updateFormaPago');
    }
  }
  
  /**
   * Elimina una forma de pago
   * @param {number|string} id - ID de la forma de pago
   * @returns {Promise} Promesa con el resultado
   */
  async deleteFormaPago(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.deleteFormaPago');
    }
  }
  
  /**
   * Obtiene el nombre de una forma de pago por su ID
   * @param {string|number} id - ID de la forma de pago
   * @param {Array} formasPagoList - Lista de formas de pago (opcional, si no se proporciona se obtendrá)
   * @returns {Promise<string>} Nombre de la forma de pago
   */
  async getNombreFormaPago(id, formasPagoList = null) {
    try {
      if (!id) return 'Sin forma de pago';
      
      // Si no se proporciona la lista, obtenerla
      if (!formasPagoList) {
        const response = await this.getFormasPago();
        formasPagoList = response[this.dataKey] || [];
      }
      
      const formaPago = formasPagoList.find(fp => fp.id == id);
      return formaPago ? formaPago.name : `Forma de pago ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de forma de pago:', error);
      return `Forma de pago ${id}`;
    }
  }
  
  /**
   * Busca formas de pago por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Array>} Array de formas de pago que coinciden
   */
  async buscarPorNombre(nombre, formasPagoList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!formasPagoList) {
        const response = await this.getFormasPago();
        formasPagoList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return formasPagoList.filter(formaPago => 
        formaPago.name && formaPago.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.buscarPorNombre');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Mapa de formas de pago
   */
  async crearMapaCompleto(formasPagoList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!formasPagoList) {
        const response = await this.getFormasPago();
        formasPagoList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(formasPagoList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(formasPagoList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!formasPagoList) {
        const response = await this.getFormasPago();
        formasPagoList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(formasPagoList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de uso de formas de pago
   * @param {Array} ventasData - Datos de ventas para analizar
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Estadísticas de formas de pago
   */
  async getEstadisticasUso(ventasData = [], formasPagoList = null) {
    try {
      // Obtener mapa de nombres si no se proporciona la lista
      const mapaNombres = await this.crearMapaNombres(formasPagoList);
      
      const estadisticas = {};
      let totalVentas = 0;
      
      // Analizar datos de ventas
      ventasData.forEach(venta => {
        const formaPagoId = venta.fpg;
        const total = venta.tot || 0;
        
        if (formaPagoId !== undefined && formaPagoId !== null) {
          if (!estadisticas[formaPagoId]) {
            estadisticas[formaPagoId] = {
              formaPagoId,
              nombre: mapaNombres[formaPagoId] || `Forma de pago ${formaPagoId}`,
              totalVentas: 0,
              cantidadTransacciones: 0,
              promedioTransaccion: 0,
              porcentajeUso: 0
            };
          }
          
          estadisticas[formaPagoId].totalVentas += total;
          estadisticas[formaPagoId].cantidadTransacciones += 1;
          totalVentas += total;
        }
      });
      
      // Calcular promedios y porcentajes
      const estadisticasArray = Object.values(estadisticas)
        .map(stat => ({
          ...stat,
          promedioTransaccion: stat.cantidadTransacciones > 0 ? 
            stat.totalVentas / stat.cantidadTransacciones : 0,
          porcentajeUso: totalVentas > 0 ? 
            (stat.totalVentas / totalVentas) * 100 : 0
        }))
        .sort((a, b) => b.totalVentas - a.totalVentas);
      
      return {
        formasPago: estadisticasArray,
        resumen: {
          totalFormasUsadas: estadisticasArray.length,
          totalVentas,
          totalTransacciones: ventasData.length,
          formaPrincipal: estadisticasArray.length > 0 ? estadisticasArray[0] : null,
          distribucionEquitativa: this._calcularEquidadDistribucion(estadisticasArray)
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getEstadisticasUso');
    }
  }
  
  /**
   * Obtiene tendencias de uso de formas de pago por período
   * @param {Array} ventasData - Datos de ventas
   * @param {string} periodo - Período de agrupación ('mes', 'trimestre', 'año')
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Tendencias de formas de pago
   */
  async getTendenciasUso(ventasData = [], periodo = 'mes', formasPagoList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(formasPagoList);
      const tendencias = {};
      
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
        
        const formaPagoId = venta.fpg;
        const total = venta.tot || 0;
        
        if (clavePeriodo && formaPagoId !== undefined && formaPagoId !== null) {
          if (!tendencias[clavePeriodo]) {
            tendencias[clavePeriodo] = {};
          }
          
          if (!tendencias[clavePeriodo][formaPagoId]) {
            tendencias[clavePeriodo][formaPagoId] = {
              formaPagoId,
              nombre: mapaNombres[formaPagoId] || `Forma de pago ${formaPagoId}`,
              total: 0,
              cantidad: 0
            };
          }
          
          tendencias[clavePeriodo][formaPagoId].total += total;
          tendencias[clavePeriodo][formaPagoId].cantidad += 1;
        }
      });
      
      // Formatear resultados
      const resultados = Object.entries(tendencias)
        .map(([periodo, formasPago]) => {
          const formasArray = Object.values(formasPago);
          const totalPeriodo = formasArray.reduce((sum, fp) => sum + fp.total, 0);
          
          return {
            periodo,
            formasPago: formasArray.map(fp => ({
              ...fp,
              porcentaje: totalPeriodo > 0 ? (fp.total / totalPeriodo) * 100 : 0,
              promedio: fp.cantidad > 0 ? fp.total / fp.cantidad : 0
            })).sort((a, b) => b.total - a.total),
            totalPeriodo,
            cantidadTransacciones: formasArray.reduce((sum, fp) => sum + fp.cantidad, 0)
          };
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
      
      return {
        tendencias: resultados,
        resumen: {
          totalPeriodos: resultados.length,
          formasUsadas: new Set(
            resultados.flatMap(r => r.formasPago.map(fp => fp.formaPagoId))
          ).size,
          crecimiento: this._calcularCrecimiento(resultados)
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getTendenciasUso');
    }
  }
  
  /**
   * Obtiene comparativa de formas de pago entre períodos
   * @param {Array} ventasData - Datos de ventas
   * @param {string} periodoInicial - Período inicial (formato: YYYY-MM)
   * @param {string} periodoFinal - Período final (formato: YYYY-MM)
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Comparativa entre períodos
   */
  async getComparativaPeriodos(ventasData = [], periodoInicial, periodoFinal, formasPagoList = null) {
    try {
      apiUtils.validateRequiredParams(
        { periodoInicial, periodoFinal }, 
        ['periodoInicial', 'periodoFinal']
      );
      
      const mapaNombres = await this.crearMapaNombres(formasPagoList);
      
      const datosInicial = {};
      const datosFinal = {};
      
      ventasData.forEach(venta => {
        const periodoVenta = `${venta.eje}-${String(venta.mes).padStart(2, '0')}`;
        const formaPagoId = venta.fpg;
        const total = venta.tot || 0;
        
        if (formaPagoId !== undefined && formaPagoId !== null) {
          if (periodoVenta === periodoInicial) {
            datosInicial[formaPagoId] = (datosInicial[formaPagoId] || 0) + total;
          } else if (periodoVenta === periodoFinal) {
            datosFinal[formaPagoId] = (datosFinal[formaPagoId] || 0) + total;
          }
        }
      });
      
      // Crear comparativa
      const todasFormasPago = new Set([
        ...Object.keys(datosInicial),
        ...Object.keys(datosFinal)
      ]);
      
      const comparativa = Array.from(todasFormasPago).map(formaPagoId => {
        const totalInicial = datosInicial[formaPagoId] || 0;
        const totalFinal = datosFinal[formaPagoId] || 0;
        const variacion = totalInicial > 0 ? ((totalFinal - totalInicial) / totalInicial) * 100 : 0;
        
        return {
          formaPagoId,
          nombre: mapaNombres[formaPagoId] || `Forma de pago ${formaPagoId}`,
          totalInicial,
          totalFinal,
          diferencia: totalFinal - totalInicial,
          variacion,
          tendencia: variacion > 5 ? 'creciendo' : variacion < -5 ? 'decreciendo' : 'estable'
        };
      }).sort((a, b) => Math.abs(b.variacion) - Math.abs(a.variacion));
      
      return {
        periodoInicial,
        periodoFinal,
        comparativa,
        resumen: {
          totalInicial: Object.values(datosInicial).reduce((sum, val) => sum + val, 0),
          totalFinal: Object.values(datosFinal).reduce((sum, val) => sum + val, 0),
          formasEnCrecimiento: comparativa.filter(fp => fp.tendencia === 'creciendo').length,
          formasEnDecrecimiento: comparativa.filter(fp => fp.tendencia === 'decreciendo').length,
          formasEstables: comparativa.filter(fp => fp.tendencia === 'estable').length
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getComparativaPeriodos');
    }
  }
  
  /**
   * Obtiene análisis de rentabilidad por forma de pago
   * @param {Array} ventasData - Datos de ventas con información de costos
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Object>} Análisis de rentabilidad
   */
  async getAnalisisRentabilidad(ventasData = [], formasPagoList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(formasPagoList);
      const analisis = {};
      
      ventasData.forEach(venta => {
        const formaPagoId = venta.fpg;
        const total = venta.tot || 0;
        const base = venta.bas_tot || 0;
        const margen = total - base;
        
        if (formaPagoId !== undefined && formaPagoId !== null) {
          if (!analisis[formaPagoId]) {
            analisis[formaPagoId] = {
              formaPagoId,
              nombre: mapaNombres[formaPagoId] || `Forma de pago ${formaPagoId}`,
              totalVentas: 0,
              totalBase: 0,
              totalMargen: 0,
              cantidadTransacciones: 0,
              transaccionMinima: Infinity,
              transaccionMaxima: 0
            };
          }
          
          const stats = analisis[formaPagoId];
          stats.totalVentas += total;
          stats.totalBase += base;
          stats.totalMargen += margen;
          stats.cantidadTransacciones += 1;
          stats.transaccionMinima = Math.min(stats.transaccionMinima, total);
          stats.transaccionMaxima = Math.max(stats.transaccionMaxima, total);
        }
      });
      
      // Calcular métricas finales
      const resultados = Object.values(analisis)
        .map(stats => ({
          ...stats,
          transaccionMinima: stats.transaccionMinima === Infinity ? 0 : stats.transaccionMinima,
          promedioVenta: stats.cantidadTransacciones > 0 ? 
            stats.totalVentas / stats.cantidadTransacciones : 0,
          margenPromedio: stats.cantidadTransacciones > 0 ? 
            stats.totalMargen / stats.cantidadTransacciones : 0,
          porcentajeMargen: stats.totalVentas > 0 ? 
            (stats.totalMargen / stats.totalVentas) * 100 : 0
        }))
        .sort((a, b) => b.totalMargen - a.totalMargen);
      
      return {
        rentabilidad: resultados,
        resumen: {
          totalVentas: resultados.reduce((sum, r) => sum + r.totalVentas, 0),
          totalMargen: resultados.reduce((sum, r) => sum + r.totalMargen, 0),
          formaMasRentable: resultados.length > 0 ? resultados[0] : null,
          margenPromedioGeneral: resultados.length > 0 ? 
            resultados.reduce((sum, r) => sum + r.porcentajeMargen, 0) / resultados.length : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getAnalisisRentabilidad');
    }
  }
  
  /**
   * Obtiene formas de pago más utilizadas
   * @param {number} limit - Límite de resultados (por defecto 5)
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {Promise<Array>} Top formas de pago
   */
  async getTopFormasPago(limit = 5, formasPagoList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!formasPagoList) {
        const response = await this.getFormasPago();
        formasPagoList = response[this.dataKey] || [];
      }
      
      // Ordenar por algún criterio (por ejemplo, por orden de ID o nombre)
      return formasPagoList
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'FormasPagoService.getTopFormasPago');
    }
  }
  
  /**
   * Valida si una forma de pago existe
   * @param {number|string} id - ID de la forma de pago
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeFormaPago(id) {
    try {
      await this.getFormaPago(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Limpia la caché de formas de pago
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
   * Calcula la equidad en la distribución de formas de pago
   * @private
   * @param {Array} estadisticas - Array de estadísticas
   * @returns {number} Índice de equidad (0-1, donde 1 es perfectamente equitativo)
   */
  _calcularEquidadDistribucion(estadisticas) {
    if (estadisticas.length <= 1) return 1;
    
    const totalVentas = estadisticas.reduce((sum, stat) => sum + stat.totalVentas, 0);
    const ventasIdeal = totalVentas / estadisticas.length;
    
    const desviacion = estadisticas.reduce((sum, stat) => {
      return sum + Math.pow(stat.totalVentas - ventasIdeal, 2);
    }, 0);
    
    const desviacionEstandar = Math.sqrt(desviacion / estadisticas.length);
    const coeficienteVariacion = ventasIdeal > 0 ? desviacionEstandar / ventasIdeal : 0;
    
    // Convertir a índice de equidad (1 - CV, limitado entre 0 y 1)
    return Math.max(0, Math.min(1, 1 - coeficienteVariacion));
  }
  
  /**
   * Calcula el crecimiento en las tendencias
   * @private
   * @param {Array} resultados - Array de resultados de tendencias
   * @returns {Object} Información de crecimiento
   */
  _calcularCrecimiento(resultados) {
    if (resultados.length < 2) {
      return { porcentaje: 0, tendencia: 'insuficientes_datos' };
    }
    
    const primero = resultados[0];
    const ultimo = resultados[resultados.length - 1];
    
    const crecimiento = primero.totalPeriodo > 0 ? 
      ((ultimo.totalPeriodo - primero.totalPeriodo) / primero.totalPeriodo) * 100 : 0;
    
    return {
      porcentaje: crecimiento,
      tendencia: crecimiento > 5 ? 'creciente' : crecimiento < -5 ? 'decreciente' : 'estable',
      periodoInicial: primero.periodo,
      periodoFinal: ultimo.periodo,
      valorInicial: primero.totalPeriodo,
      valorFinal: ultimo.totalPeriodo
    };
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de formas de pago limpiada');
  }
}

// Crear instancia singleton
export const formasPagoService = new FormasPagoService();

// Exportación por defecto
export default formasPagoService;