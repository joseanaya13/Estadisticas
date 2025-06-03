// services/ventasService.js - Servicio específico para gestión de ventas
import { apiClient, apiUtils } from './apiClient.js';

/**
 * Servicio de ventas - Gestiona todas las operaciones relacionadas con facturas
 */
export class VentasService {
  constructor() {
    this.endpoint = '/fac_t';
    this.dataKey = 'fac_t';
  }
  
  /**
   * Obtiene todas las facturas (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  async getFacturas(params = {}) {
    try {
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getFacturas');
    }
  }
  
  /**
   * Obtiene facturas con filtros específicos de la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con los datos filtrados
   */
  async getFacturasFiltered(filters = {}) {
    try {
      const apiFilters = apiClient.buildApiFilters(filters);
      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`Obteniendo facturas con filtros:`, filters);
      console.log(`Endpoint: ${endpoint}`);
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getFacturasFiltered');
    }
  }
  
  /**
   * Obtiene una factura por ID
   * @param {number} id - ID de la factura
   * @returns {Promise} Promesa con los datos
   */
  async getFactura(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.get(`${this.endpoint}/${id}`);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getFactura');
    }
  }
  
  /**
   * Crea una nueva factura
   * @param {Object} facturaData - Datos de la factura
   * @returns {Promise} Promesa con los datos creados
   */
  async createFactura(facturaData) {
    try {
      apiUtils.validateRequiredParams(facturaData, ['clt', 'tot']);
      return await apiClient.post(this.endpoint, facturaData);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.createFactura');
    }
  }
  
  /**
   * Actualiza una factura existente
   * @param {number} id - ID de la factura
   * @param {Object} facturaData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateFactura(id, facturaData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.put(`${this.endpoint}/${id}`, facturaData);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.updateFactura');
    }
  }
  
  /**
   * Elimina una factura
   * @param {number} id - ID de la factura
   * @returns {Promise} Promesa con el resultado
   */
  async deleteFactura(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      return await apiClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.deleteFactura');
    }
  }
  
  /**
   * Obtiene estadísticas de ventas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con las estadísticas
   */
  async getEstadisticas(filters = {}) {
    try {
      const facturas = await this.getFacturasFiltered(filters);
      
      // Calcular estadísticas básicas
      const total = facturas[this.dataKey].reduce((sum, item) => sum + (item.tot || 0), 0);
      const cantidad = facturas[this.dataKey].length;
      const promedio = cantidad > 0 ? total / cantidad : 0;
      
      // Ventas por mes
      const ventasPorMes = this._agruparPorCampo(facturas[this.dataKey], 'mes', 'tot');
      
      // Ventas por cliente
      const ventasPorCliente = this._agruparPorCampo(facturas[this.dataKey], 'clt', 'tot');
      
      // Ventas por vendedor
      const ventasPorVendedor = this._agruparPorCampo(facturas[this.dataKey], 'alt_usr', 'tot');
      
      // Ventas por forma de pago
      const ventasPorFormaPago = this._agruparPorCampo(facturas[this.dataKey], 'fpg', 'tot');
      
      // Ventas por empresa/tienda
      const ventasPorEmpresa = this._agruparPorCampo(facturas[this.dataKey], 'emp', 'tot');
      const ventasPorDivision = this._agruparPorCampo(facturas[this.dataKey], 'emp_div', 'tot');
      
      return {
        resumen: {
          total,
          cantidad,
          promedio,
          fechaInicio: this._obtenerFechaMinima(facturas[this.dataKey]),
          fechaFin: this._obtenerFechaMaxima(facturas[this.dataKey])
        },
        distribuciones: {
          ventasPorMes: this._formatearAgrupacion(ventasPorMes, 'mes'),
          ventasPorCliente: this._formatearAgrupacion(ventasPorCliente, 'cliente'),
          ventasPorVendedor: this._formatearAgrupacion(ventasPorVendedor, 'vendedor'),
          ventasPorFormaPago: this._formatearAgrupacion(ventasPorFormaPago, 'formaPago'),
          ventasPorEmpresa: this._formatearAgrupacion(ventasPorEmpresa, 'empresa'),
          ventasPorDivision: this._formatearAgrupacion(ventasPorDivision, 'division')
        },
        datosOriginales: facturas
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene el top de clientes por ventas
   * @param {Object} filters - Filtros a aplicar
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @returns {Promise} Top clientes
   */
  async getTopClientes(filters = {}, limit = 10) {
    try {
      const estadisticas = await this.getEstadisticas(filters);
      
      return estadisticas.distribuciones.ventasPorCliente
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getTopClientes');
    }
  }
  
  /**
   * Obtiene el top de vendedores por ventas
   * @param {Object} filters - Filtros a aplicar
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @returns {Promise} Top vendedores
   */
  async getTopVendedores(filters = {}, limit = 10) {
    try {
      const estadisticas = await this.getEstadisticas(filters);
      
      return estadisticas.distribuciones.ventasPorVendedor
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'VentasService.getTopVendedores');
    }
  }
  
  /**
   * Obtiene tendencias de ventas por período
   * @param {Object} filters - Filtros a aplicar
   * @param {string} periodo - Período de agrupación ('mes', 'trimestre', 'año')
   * @returns {Promise} Tendencias de ventas
   */
  async getTendencias(filters = {}, periodo = 'mes') {
    try {
      const facturas = await this.getFacturasFiltered(filters);
      
      const agrupacion = {};
      
      facturas[this.dataKey].forEach(factura => {
        let clave;
        
        switch (periodo) {
          case 'año':
            clave = factura.eje;
            break;
          case 'trimestre':
            clave = `${factura.eje}-Q${Math.ceil(factura.mes / 3)}`;
            break;
          case 'mes':
          default:
            clave = `${factura.eje}-${String(factura.mes).padStart(2, '0')}`;
            break;
        }
        
        if (clave) {
          if (!agrupacion[clave]) {
            agrupacion[clave] = {
              periodo: clave,
              total: 0,
              cantidad: 0,
              promedio: 0
            };
          }
          
          agrupacion[clave].total += (factura.tot || 0);
          agrupacion[clave].cantidad += 1;
        }
      });
      
      // Calcular promedios y ordenar
      const tendencias = Object.values(agrupacion)
        .map(item => ({
          ...item,
          promedio: item.cantidad > 0 ? item.total / item.cantidad : 0
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
      throw apiUtils.handleError(error, 'VentasService.getTendencias');
    }
  }
  
  /**
   * Filtra facturas localmente (útil para filtros que no soporta la API)
   * @param {Array} facturas - Array de facturas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Facturas filtradas
   */
  filtrarFacturasLocalmente(facturas = [], filters = {}) {
    return apiUtils.filterAndSort(facturas, filters);
  }
  
  /**
   * Agrupa facturas por un campo específico
   * @private
   * @param {Array} facturas - Array de facturas
   * @param {string} campo - Campo por el que agrupar
   * @param {string} valorCampo - Campo del valor a sumar
   * @returns {Object} Agrupación
   */
  _agruparPorCampo(facturas, campo, valorCampo) {
    const agrupacion = {};
    
    facturas.forEach(factura => {
      const clave = factura[campo];
      if (clave !== undefined && clave !== null) {
        agrupacion[clave] = (agrupacion[clave] || 0) + (factura[valorCampo] || 0);
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
   * Obtiene la fecha mínima de un array de facturas
   * @private
   * @param {Array} facturas - Array de facturas
   * @returns {string|null} Fecha mínima
   */
  _obtenerFechaMinima(facturas) {
    const fechas = facturas
      .map(f => f.fch)
      .filter(f => f)
      .sort();
    
    return fechas.length > 0 ? fechas[0] : null;
  }
  
  /**
   * Obtiene la fecha máxima de un array de facturas
   * @private
   * @param {Array} facturas - Array de facturas
   * @returns {string|null} Fecha máxima
   */
  _obtenerFechaMaxima(facturas) {
    const fechas = facturas
      .map(f => f.fch)
      .filter(f => f)
      .sort();
    
    return fechas.length > 0 ? fechas[fechas.length - 1] : null;
  }
}

// Crear instancia singleton
export const ventasService = new VentasService();

// Exportación por defecto
export default ventasService;