// services/maestros/marcasService.js - Servicio específico para gestión de marcas
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de marcas - Gestiona todas las operaciones relacionadas con marcas de productos
 */
export class MarcasService {
  constructor() {
    this.endpoint = '/mar_m';
    this.dataKey = 'mar_m';
    this._cache = new Map();
    this._cacheExpiry = 30 * 60 * 1000; // 30 minutos - datos maestros
  }
  
  /**
   * Obtiene todas las marcas
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getMarcas(useCache = true) {
    try {
      const cacheKey = 'marcas_all';
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando marcas desde caché');
          return cached.data;
        }
      }
      
      console.log('Obteniendo marcas desde la API');
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
      throw apiUtils.handleError(error, 'MarcasService.getMarcas');
    }
  }
  
  /**
   * Obtiene una marca por ID
   * @param {string|number} id - ID de la marca
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getMarca(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `marca_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando marca ${id} desde caché`);
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
      throw apiUtils.handleError(error, 'MarcasService.getMarca');
    }
  }
  
  /**
   * Crea una nueva marca
   * @param {Object} marcaData - Datos de la marca
   * @returns {Promise} Promesa con los datos creados
   */
  async createMarca(marcaData) {
    try {
      apiUtils.validateRequiredParams(marcaData, ['name']);
      
      const result = await apiClient.post(this.endpoint, marcaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.createMarca');
    }
  }
  
  /**
   * Actualiza una marca existente
   * @param {string|number} id - ID de la marca
   * @param {Object} marcaData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateMarca(id, marcaData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, marcaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.updateMarca');
    }
  }
  
  /**
   * Elimina una marca
   * @param {string|number} id - ID de la marca
   * @returns {Promise} Promesa con el resultado
   */
  async deleteMarca(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.deleteMarca');
    }
  }
  
  /**
   * Obtiene el nombre de una marca por su ID
   * @param {string|number} id - ID de la marca
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<string>} Nombre de la marca
   */
  async getNombreMarca(id, marcasList = null) {
    try {
      if (!id) return 'Sin marca';
      
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      const marca = marcasList.find(m => m.id == id);
      return marca ? marca.name : `Marca ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de marca:', error);
      return `Marca ${id}`;
    }
  }
  
  /**
   * Busca marcas por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Array>} Array de marcas que coinciden
   */
  async buscarPorNombre(nombre, marcasList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return marcasList.filter(marca => 
        marca.name && marca.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.buscarPorNombre');
    }
  }
  
  /**
   * Busca marcas por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Array>} Array de marcas que coinciden
   */
  async buscarPorCriterios(criterios = {}, marcasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      return marcasList.filter(marca => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!marca.name || !marca.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por estado activo (act_por_gan_mar)
        if (criterios.activa !== undefined) {
          if (marca.act_por_gan_mar !== criterios.activa) {
            return false;
          }
        }
        
        // Búsqueda por rango de stock
        if (criterios.stockMinimo !== undefined) {
          if ((marca.stk_can || 0) < criterios.stockMinimo) {
            return false;
          }
        }
        
        if (criterios.stockMaximo !== undefined) {
          if ((marca.stk_can || 0) > criterios.stockMaximo) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Object>} Mapa de marcas
   */
  async crearMapaCompleto(marcasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(marcasList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(marcasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(marcasList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de marcas
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Object>} Estadísticas de marcas
   */
  async getEstadisticas(marcasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: marcasList.length,
        activas: 0,
        inactivas: 0,
        conStock: 0,
        sinStock: 0,
        stockTotal: 0,
        valorStockCompra: 0,
        valorStockVenta: 0,
        promedioStockPorMarca: 0
      };
      
      marcasList.forEach(marca => {
        // Estado activo/inactivo
        if (marca.act_por_gan_mar) {
          stats.activas++;
        } else {
          stats.inactivas++;
        }
        
        // Stock
        const stockCantidad = marca.stk_can || 0;
        const stockCompra = marca.stk_pre_com || 0;
        const stockVenta = marca.stk_pre_ven || 0;
        
        if (stockCantidad > 0) {
          stats.conStock++;
        } else {
          stats.sinStock++;
        }
        
        stats.stockTotal += stockCantidad;
        stats.valorStockCompra += stockCompra;
        stats.valorStockVenta += stockVenta;
      });
      
      stats.promedioStockPorMarca = stats.total > 0 ? stats.stockTotal / stats.total : 0;
      
      // Top marcas por stock
      const topMarcasPorStock = marcasList
        .filter(m => (m.stk_can || 0) > 0)
        .sort((a, b) => (b.stk_can || 0) - (a.stk_can || 0))
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          nombre: m.name,
          stock: m.stk_can || 0,
          valorCompra: m.stk_pre_com || 0,
          valorVenta: m.stk_pre_ven || 0
        }));
      
      return {
        ...stats,
        topMarcasPorStock,
        porcentajes: {
          activas: stats.total > 0 ? (stats.activas / stats.total) * 100 : 0,
          conStock: stats.total > 0 ? (stats.conStock / stats.total) * 100 : 0,
          margenStockPromedio: stats.valorStockCompra > 0 ? 
            ((stats.valorStockVenta - stats.valorStockCompra) / stats.valorStockCompra) * 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene marcas más vendidas basado en datos de ventas
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Array>} Top marcas más vendidas
   */
  async getMarcasMasVendidas(ventasData = [], limit = 10, marcasList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(marcasList);
      
      const actividadMarcas = {};
      
      ventasData.forEach(linea => {
        const marcaId = linea.mar_m;
        const ventas = linea.imp_pvp || 0;
        const cantidad = linea.can || 0;
        const beneficio = linea.ben || 0;
        
        if (marcaId && ventas > 0) {
          if (!actividadMarcas[marcaId]) {
            actividadMarcas[marcaId] = {
              marcaId,
              nombre: mapaNombres[marcaId] || `Marca ${marcaId}`,
              totalVentas: 0,
              totalBeneficio: 0,
              cantidadVendida: 0,
              numeroLineas: 0,
              promedioVenta: 0,
              margenPorcentual: 0,
              participacionMercado: 0
            };
          }
          
          const actividad = actividadMarcas[marcaId];
          actividad.totalVentas += ventas;
          actividad.totalBeneficio += beneficio;
          actividad.cantidadVendida += cantidad;
          actividad.numeroLineas += 1;
        }
      });
      
      const totalVentasMercado = Object.values(actividadMarcas)
        .reduce((sum, marca) => sum + marca.totalVentas, 0);
      
      return Object.values(actividadMarcas)
        .map(marca => ({
          ...marca,
          promedioVenta: marca.numeroLineas > 0 ? 
            marca.totalVentas / marca.numeroLineas : 0,
          margenPorcentual: marca.totalVentas > 0 ? 
            (marca.totalBeneficio / marca.totalVentas) * 100 : 0,
          participacionMercado: totalVentasMercado > 0 ? 
            (marca.totalVentas / totalVentasMercado) * 100 : 0
        }))
        .sort((a, b) => b.totalVentas - a.totalVentas)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.getMarcasMasVendidas');
    }
  }
  
  /**
   * Analiza la rentabilidad de marcas
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Object>} Análisis de rentabilidad por marca
   */
  async getAnalisisRentabilidad(ventasData = [], marcasList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(marcasList);
      
      const rentabilidadMarcas = {};
      
      ventasData.forEach(linea => {
        const marcaId = linea.mar_m;
        const ventas = linea.imp_pvp || 0;
        const beneficio = linea.ben || 0;
        const cantidad = linea.can || 0;
        const costo = (linea.cos || 0) * cantidad;
        
        if (marcaId && ventas > 0) {
          if (!rentabilidadMarcas[marcaId]) {
            rentabilidadMarcas[marcaId] = {
              marcaId,
              nombre: mapaNombres[marcaId] || `Marca ${marcaId}`,
              totalVentas: 0,
              totalBeneficio: 0,
              totalCosto: 0,
              cantidadVendida: 0,
              numeroLineas: 0,
              margenBruto: 0,
              margenNeto: 0,
              roi: 0
            };
          }
          
          const marca = rentabilidadMarcas[marcaId];
          marca.totalVentas += ventas;
          marca.totalBeneficio += beneficio;
          marca.totalCosto += costo;
          marca.cantidadVendida += cantidad;
          marca.numeroLineas += 1;
        }
      });
      
      const marcasConRentabilidad = Object.values(rentabilidadMarcas)
        .map(marca => ({
          ...marca,
          margenBruto: marca.totalVentas > 0 ? 
            ((marca.totalVentas - marca.totalCosto) / marca.totalVentas) * 100 : 0,
          margenNeto: marca.totalVentas > 0 ? 
            (marca.totalBeneficio / marca.totalVentas) * 100 : 0,
          roi: marca.totalCosto > 0 ? 
            (marca.totalBeneficio / marca.totalCosto) * 100 : 0
        }))
        .sort((a, b) => b.margenNeto - a.margenNeto);
      
      // Categorizar marcas por rentabilidad
      const altaRentabilidad = marcasConRentabilidad.filter(m => m.margenNeto > 20);
      const mediaRentabilidad = marcasConRentabilidad.filter(m => m.margenNeto >= 10 && m.margenNeto <= 20);
      const bajaRentabilidad = marcasConRentabilidad.filter(m => m.margenNeto < 10);
      
      return {
        marcas: marcasConRentabilidad,
        categorias: {
          altaRentabilidad,
          mediaRentabilidad,
          bajaRentabilidad
        },
        resumen: {
          totalMarcas: marcasConRentabilidad.length,
          margenPromedioGeneral: marcasConRentabilidad.length > 0 ? 
            marcasConRentabilidad.reduce((sum, m) => sum + m.margenNeto, 0) / marcasConRentabilidad.length : 0,
          marcaMasRentable: marcasConRentabilidad.length > 0 ? marcasConRentabilidad[0] : null,
          distribuciones: {
            altaRentabilidad: altaRentabilidad.length,
            mediaRentabilidad: mediaRentabilidad.length,
            bajaRentabilidad: bajaRentabilidad.length
          }
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.getAnalisisRentabilidad');
    }
  }
  
  /**
   * Obtiene opciones formateadas para selectores
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @param {boolean} soloActivas - Si incluir solo marcas activas (por defecto false)
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getOpcionesSelect(marcasList = null, soloActivas = false) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      const opciones = [{ value: 'todas', label: 'Todas las marcas' }];
      
      let marcasFiltradas = marcasList;
      
      // Filtrar solo activas si se solicita
      if (soloActivas) {
        marcasFiltradas = marcasList.filter(marca => marca.act_por_gan_mar);
      }
      
      marcasFiltradas
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(marca => {
          opciones.push({
            value: marca.id.toString(),
            label: marca.name,
            activa: marca.act_por_gan_mar,
            stock: marca.stk_can || 0
          });
        });
      
      return opciones;
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.getOpcionesSelect');
    }
  }
  
  /**
   * Valida si una marca existe
   * @param {string|number} id - ID de la marca
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeMarca(id) {
    try {
      await this.getMarca(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtiene marcas con stock bajo
   * @param {number} umbralStock - Umbral por debajo del cual se considera stock bajo
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise<Array>} Marcas con stock bajo
   */
  async getMarcasStockBajo(umbralStock = 10, marcasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!marcasList) {
        const response = await this.getMarcas();
        marcasList = response[this.dataKey] || [];
      }
      
      return marcasList
        .filter(marca => 
          marca.act_por_gan_mar && 
          (marca.stk_can || 0) > 0 && 
          (marca.stk_can || 0) <= umbralStock
        )
        .sort((a, b) => (a.stk_can || 0) - (b.stk_can || 0))
        .map(marca => ({
          id: marca.id,
          nombre: marca.name,
          stock: marca.stk_can || 0,
          valorStock: marca.stk_pre_ven || 0,
          diferencia: umbralStock - (marca.stk_can || 0)
        }));
    } catch (error) {
      throw apiUtils.handleError(error, 'MarcasService.getMarcasStockBajo');
    }
  }
  
  /**
   * Limpia la caché de marcas
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
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de marcas limpiada');
  }
}

// Crear instancia singleton
export const marcasService = new MarcasService();

// Exportación por defecto
export default marcasService;
