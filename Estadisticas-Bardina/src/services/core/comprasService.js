// services/comprasService.js - Servicio específico para gestión de compras
import { apiClient, apiUtils } from './apiClient.js';

/**
 * Servicio de compras - Gestiona todas las operaciones relacionadas con albaranes
 */
export class ComprasService {
  constructor() {
    this.endpoint = '/com_alb_g';
    this.dataKey = 'com_alb_g';
  }
  
  /**
   * Obtiene todos los albaranes (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  async getAlbaranes(params = {}) {
    try {
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getAlbaranes');
    }
  }
  
  /**
   * Obtiene albaranes con filtros específicos de la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con los datos filtrados
   */
  async getAlbaranesFiltered(filters = {}) {
    try {
      const apiFilters = apiClient.buildApiFilters(filters);
      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`Obteniendo albaranes con filtros:`, filters);
      console.log(`Endpoint: ${endpoint}`);
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getAlbaranesFiltered');
    }
  }
  
  /**
   * Obtiene un albarán por ID
   * @param {number} id - ID del albarán
   * @returns {Promise} Promesa con los datos
   */
  async getAlbaran(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.get(`${this.endpoint}/${id}`);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getAlbaran');
    }
  }
  
  /**
   * Crea un nuevo albarán
   * @param {Object} albaranData - Datos del albarán
   * @returns {Promise} Promesa con los datos creados
   */
  async createAlbaran(albaranData) {
    try {
      apiUtils.validateRequiredParams(albaranData, ['prv', 'tot_alb']);
      return await apiClient.post(this.endpoint, albaranData);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.createAlbaran');
    }
  }
  
  /**
   * Actualiza un albarán existente
   * @param {number} id - ID del albarán
   * @param {Object} albaranData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateAlbaran(id, albaranData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.put(`${this.endpoint}/${id}`, albaranData);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.updateAlbaran');
    }
  }
  
  /**
   * Elimina un albarán
   * @param {number} id - ID del albarán
   * @returns {Promise} Promesa con el resultado
   */
  async deleteAlbaran(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.deleteAlbaran');
    }
  }
  
  /**
   * Obtiene estadísticas de compras
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con las estadísticas
   */
  async getEstadisticas(filters = {}) {
    try {
      const albaranes = await this.getAlbaranesFiltered(filters);
      
      // Calcular estadísticas básicas
      const total = albaranes[this.dataKey].reduce((sum, item) => sum + (item.tot_alb || 0), 0);
      const cantidad = albaranes[this.dataKey].length;
      const promedio = cantidad > 0 ? total / cantidad : 0;
      
      // Compras por mes
      const comprasPorMes = this._agruparPorCampo(albaranes[this.dataKey], 'mes', 'tot_alb');
      
      // Compras por proveedor
      const comprasPorProveedor = this._agruparPorCampo(albaranes[this.dataKey], 'prv', 'tot_alb');
      
      // Compras por serie
      const comprasPorSerie = this._agruparPorCampo(albaranes[this.dataKey], 'ser', 'tot_alb');
      
      // Compras por empresa
      const comprasPorEmpresa = this._agruparPorCampo(albaranes[this.dataKey], 'emp', 'tot_alb');
      
      // Compras por almacén
      const comprasPorAlmacen = this._agruparPorCampo(albaranes[this.dataKey], 'alm', 'tot_alb');
      
      return {
        resumen: {
          total,
          cantidad,
          promedio,
          fechaInicio: this._obtenerFechaMinima(albaranes[this.dataKey]),
          fechaFin: this._obtenerFechaMaxima(albaranes[this.dataKey])
        },
        distribuciones: {
          comprasPorMes: this._formatearAgrupacion(comprasPorMes, 'mes'),
          comprasPorProveedor: this._formatearAgrupacion(comprasPorProveedor, 'proveedor'),
          comprasPorSerie: this._formatearAgrupacion(comprasPorSerie, 'serie'),
          comprasPorEmpresa: this._formatearAgrupacion(comprasPorEmpresa, 'empresa'),
          comprasPorAlmacen: this._formatearAgrupacion(comprasPorAlmacen, 'almacen')
        },
        datosOriginales: albaranes
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene el top de proveedores por compras
   * @param {Object} filters - Filtros a aplicar
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @returns {Promise} Top proveedores
   */
  async getTopProveedores(filters = {}, limit = 10) {
    try {
      const estadisticas = await this.getEstadisticas(filters);
      
      return estadisticas.distribuciones.comprasPorProveedor
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getTopProveedores');
    }
  }
  
  /**
   * Obtiene análisis de categorías de compras (por serie)
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Análisis de categorías
   */
  async getAnalisisCategorias(filters = {}) {
    try {
      const estadisticas = await this.getEstadisticas(filters);
      
      const analisis = estadisticas.distribuciones.comprasPorSerie
        .map(categoria => {
          const porcentaje = estadisticas.resumen.total > 0 ? 
            (categoria.total / estadisticas.resumen.total) * 100 : 0;
          
          return {
            ...categoria,
            porcentaje,
            categoria: `Serie ${categoria.serie}`
          };
        })
        .sort((a, b) => b.total - a.total);
      
      return {
        categorias: analisis,
        totalCategorias: analisis.length,
        categoriasPrincipales: analisis.slice(0, 5),
        concentracion: this._calcularConcentracion(analisis)
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getAnalisisCategorias');
    }
  }
  
  /**
   * Obtiene tendencias de compras por período
   * @param {Object} filters - Filtros a aplicar
   * @param {string} periodo - Período de agrupación ('mes', 'trimestre', 'año')
   * @returns {Promise} Tendencias de compras
   */
  async getTendencias(filters = {}, periodo = 'mes') {
    try {
      const albaranes = await this.getAlbaranesFiltered(filters);
      
      const agrupacion = {};
      
      albaranes[this.dataKey].forEach(albaran => {
        let clave;
        
        switch (periodo) {
          case 'año':
            clave = albaran.eje;
            break;
          case 'trimestre':
            clave = `${albaran.eje}-Q${Math.ceil(albaran.mes / 3)}`;
            break;
          case 'mes':
          default:
            clave = `${albaran.eje}-${String(albaran.mes).padStart(2, '0')}`;
            break;
        }
        
        if (clave) {
          if (!agrupacion[clave]) {
            agrupacion[clave] = {
              periodo: clave,
              total: 0,
              cantidad: 0,
              promedio: 0,
              proveedoresUnicos: new Set()
            };
          }
          
          agrupacion[clave].total += (albaran.tot_alb || 0);
          agrupacion[clave].cantidad += 1;
          
          if (albaran.prv) {
            agrupacion[clave].proveedoresUnicos.add(albaran.prv);
          }
        }
      });
      
      // Calcular promedios y convertir Sets
      const tendencias = Object.values(agrupacion)
        .map(item => ({
          ...item,
          promedio: item.cantidad > 0 ? item.total / item.cantidad : 0,
          proveedoresUnicos: item.proveedoresUnicos.size
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
      
      // Calcular variaciones
      for (let i = 1; i < tendencias.length; i++) {
        const actual = tendencias[i];
        const anterior = tendencias[i - 1];
        
        actual.variacionTotal = anterior.total !== 0 ? 
          ((actual.total - anterior.total) / anterior.total) * 100 : 0;
        actual.variacionCantidad = anterior.cantidad !== 0 ? 
          ((actual.cantidad - anterior.cantidad) / anterior.cantidad) * 100 : 0;
      }
      
      return tendencias;
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getTendencias');
    }
  }
  
  /**
   * Analiza la rotación de proveedores
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Análisis de rotación
   */
  async getAnalisisRotacionProveedores(filters = {}) {
    try {
      const albaranes = await this.getAlbaranesFiltered(filters);
      
      const proveedoresPorMes = {};
      const estadisticasProveedores = {};
      
      albaranes[this.dataKey].forEach(albaran => {
        const claveMes = `${albaran.eje}-${String(albaran.mes).padStart(2, '0')}`;
        const proveedor = albaran.prv;
        
        if (proveedor && claveMes) {
          // Proveedores por mes
          if (!proveedoresPorMes[claveMes]) {
            proveedoresPorMes[claveMes] = new Set();
          }
          proveedoresPorMes[claveMes].add(proveedor);
          
          // Estadísticas por proveedor
          if (!estadisticasProveedores[proveedor]) {
            estadisticasProveedores[proveedor] = {
              proveedor,
              totalCompras: 0,
              cantidadAlbaranes: 0,
              mesesActivo: new Set(),
              ultimaCompra: null,
              primeraCompra: null
            };
          }
          
          const stats = estadisticasProveedores[proveedor];
          stats.totalCompras += (albaran.tot_alb || 0);
          stats.cantidadAlbaranes += 1;
          stats.mesesActivo.add(claveMes);
          
          const fechaAlbaran = new Date(albaran.fch);
          if (!stats.ultimaCompra || fechaAlbaran > new Date(stats.ultimaCompra)) {
            stats.ultimaCompra = albaran.fch;
          }
          if (!stats.primeraCompra || fechaAlbaran < new Date(stats.primeraCompra)) {
            stats.primeraCompra = albaran.fch;
          }
        }
      });
      
      // Procesar estadísticas finales
      const proveedoresFinales = Object.values(estadisticasProveedores)
        .map(proveedor => ({
          ...proveedor,
          mesesActivo: proveedor.mesesActivo.size,
          promedioCompra: proveedor.cantidadAlbaranes > 0 ? 
            proveedor.totalCompras / proveedor.cantidadAlbaranes : 0,
          frecuenciaCompra: proveedor.mesesActivo.size > 0 ? 
            proveedor.cantidadAlbaranes / proveedor.mesesActivo.size : 0
        }))
        .sort((a, b) => b.totalCompras - a.totalCompras);
      
      const rotacionPorMes = Object.entries(proveedoresPorMes)
        .map(([mes, proveedores]) => ({
          mes,
          cantidadProveedores: proveedores.size,
          proveedores: Array.from(proveedores)
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
      
      return {
        proveedores: proveedoresFinales,
        rotacionMensual: rotacionPorMes,
        resumen: {
          totalProveedores: proveedoresFinales.length,
          proveedoresActivos: proveedoresFinales.filter(p => p.mesesActivo > 0).length,
          promedioProveedoresPorMes: rotacionPorMes.length > 0 ? 
            rotacionPorMes.reduce((sum, item) => sum + item.cantidadProveedores, 0) / rotacionPorMes.length : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ComprasService.getAnalisisRotacionProveedores');
    }
  }
  
  /**
   * Filtra albaranes localmente (útil para filtros que no soporta la API)
   * @param {Array} albaranes - Array de albaranes
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Albaranes filtrados
   */
  filtrarAlbaranesLocalmente(albaranes = [], filters = {}) {
    return apiUtils.filterAndSort(albaranes, filters);
  }
  
  /**
   * Agrupa albaranes por un campo específico
   * @private
   * @param {Array} albaranes - Array de albaranes
   * @param {string} campo - Campo por el que agrupar
   * @param {string} valorCampo - Campo del valor a sumar
   * @returns {Object} Agrupación
   */
  _agruparPorCampo(albaranes, campo, valorCampo) {
    const agrupacion = {};
    
    albaranes.forEach(albaran => {
      const clave = albaran[campo];
      if (clave !== undefined && clave !== null) {
        agrupacion[clave] = (agrupacion[clave] || 0) + (albaran[valorCampo] || 0);
      }
    });
    
    return agrupacion;
  }
  
  /**
   * Formatea una agrupación para uso en componentes
   * @private
   * @param {Object} agrupacion - Agrupación a formatear
   * @param {string} nombreClave - Nombre para la clave
   * @returns {Array} Array formateado
   */
  _formatearAgrupacion(agrupacion, nombreClave) {
    return Object.entries(agrupacion).map(([clave, total]) => ({
      [nombreClave]: clave,
      [`${nombreClave}Id`]: clave,
      total
    }));
  }
  
  /**
   * Calcula la concentración de las compras (índice de Herfindahl)
   * @private
   * @param {Array} categorias - Array de categorías con porcentajes
   * @returns {number} Índice de concentración
   */
  _calcularConcentracion(categorias) {
    return categorias.reduce((sum, categoria) => {
      const porcentajeNormalizado = categoria.porcentaje / 100;
      return sum + (porcentajeNormalizado * porcentajeNormalizado);
    }, 0);
  }
  
  /**
   * Obtiene la fecha mínima de un array de albaranes
   * @private
   * @param {Array} albaranes - Array de albaranes
   * @returns {string|null} Fecha mínima
   */
  _obtenerFechaMinima(albaranes) {
    const fechas = albaranes
      .map(a => a.fch)
      .filter(f => f)
      .sort();
    
    return fechas.length > 0 ? fechas[0] : null;
  }
  
  /**
   * Obtiene la fecha máxima de un array de albaranes
   * @private
   * @param {Array} albaranes - Array de albaranes
   * @returns {string|null} Fecha máxima
   */
  _obtenerFechaMaxima(albaranes) {
    const fechas = albaranes
      .map(a => a.fch)
      .filter(f => f)
      .sort();
    
    return fechas.length > 0 ? fechas[fechas.length - 1] : null;
  }
}

// Crear instancia singleton
export const comprasService = new ComprasService();

// Exportación por defecto
export default comprasService;
