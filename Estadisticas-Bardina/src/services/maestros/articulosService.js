// services/maestros/articulosService.js - Servicio específico para gestión de artículos
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de artículos - Gestiona todas las operaciones relacionadas con productos/artículos
 */
export class ArticulosService {
  constructor() {
    this.endpoint = '/art_m';
    this.dataKey = 'art_m';
    this._cache = new Map();
    this._cacheExpiry = 15 * 60 * 1000; // 15 minutos - datos semi-transaccionales
  }
  
  /**
   * Obtiene todos los artículos (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getArticulos(params = {}, useCache = true) {
    try {
      const cacheKey = `articulos_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando artículos desde caché');
          return cached.data;
        }
      }
      
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo artículos desde la API');
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
      throw apiUtils.handleError(error, 'ArticulosService.getArticulos');
    }
  }
  
  /**
   * Obtiene un artículo por ID
   * @param {string|number} id - ID del artículo
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getArticulo(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `articulo_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando artículo ${id} desde caché`);
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
      throw apiUtils.handleError(error, 'ArticulosService.getArticulo');
    }
  }
  
  /**
   * Obtiene artículos con filtros específicos de la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con los datos filtrados
   */
  async getArticulosFiltered(filters = {}) {
    try {
      const apiFilters = apiClient.buildApiFilters(filters);
      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`Obteniendo artículos con filtros:`, filters);
      console.log(`Endpoint: ${endpoint}`);
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getArticulosFiltered');
    }
  }
  
  /**
   * Crea un nuevo artículo
   * @param {Object} articuloData - Datos del artículo
   * @returns {Promise} Promesa con los datos creados
   */
  async createArticulo(articuloData) {
    try {
      apiUtils.validateRequiredParams(articuloData, ['name']);
      
      const result = await apiClient.post(this.endpoint, articuloData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.createArticulo');
    }
  }
  
  /**
   * Actualiza un artículo existente
   * @param {string|number} id - ID del artículo
   * @param {Object} articuloData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateArticulo(id, articuloData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, articuloData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.updateArticulo');
    }
  }
  
  /**
   * Elimina un artículo
   * @param {string|number} id - ID del artículo
   * @returns {Promise} Promesa con el resultado
   */
  async deleteArticulo(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.deleteArticulo');
    }
  }
  
  /**
   * Obtiene el nombre de un artículo por su ID
   * @param {string|number} id - ID del artículo
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<string>} Nombre del artículo
   */
  async getNombreArticulo(id, articulosList = null) {
    try {
      if (!id) return 'Sin artículo';
      
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      const articulo = articulosList.find(a => a.id == id);
      return articulo ? articulo.name : `Artículo ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de artículo:', error);
      return `Artículo ${id}`;
    }
  }
  
  /**
   * Busca artículos por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Array>} Array de artículos que coinciden
   */
  async buscarPorNombre(nombre, articulosList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return articulosList.filter(articulo => 
        articulo.name && articulo.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.buscarPorNombre');
    }
  }
  
  /**
   * Busca artículos por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Array>} Array de artículos que coinciden
   */
  async buscarPorCriterios(criterios = {}, articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      return articulosList.filter(articulo => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!articulo.name || !articulo.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por referencia
        if (criterios.referencia) {
          const refLower = criterios.referencia.toLowerCase();
          if (!articulo.ref || !articulo.ref.toLowerCase().includes(refLower)) {
            return false;
          }
        }
        
        // Búsqueda por familia
        if (criterios.familia) {
          if (articulo.fam !== criterios.familia) {
            return false;
          }
        }
        
        // Búsqueda por proveedor
        if (criterios.proveedor) {
          if (articulo.prv !== criterios.proveedor) {
            return false;
          }
        }
        
        // Búsqueda por marca
        if (criterios.marca) {
          if (articulo.mar !== criterios.marca) {
            return false;
          }
        }
        
        // Búsqueda por temporada
        if (criterios.temporada) {
          if (articulo.temp !== criterios.temporada) {
            return false;
          }
        }
        
        // Búsqueda por rango de precio
        if (criterios.precioMinimo !== undefined) {
          if ((articulo.pvp || 0) < criterios.precioMinimo) {
            return false;
          }
        }
        
        if (criterios.precioMaximo !== undefined) {
          if ((articulo.pvp || 0) > criterios.precioMaximo) {
            return false;
          }
        }
        
        // Búsqueda por existencias
        if (criterios.conStock !== undefined) {
          const tieneStock = (articulo.exs || 0) > 0;
          if (criterios.conStock !== tieneStock) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Object>} Mapa de artículos
   */
  async crearMapaCompleto(articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(articulosList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(articulosList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de artículos
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Object>} Estadísticas de artículos
   */
  async getEstadisticas(articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: articulosList.length,
        conStock: 0,
        sinStock: 0,
        stockTotal: 0,
        valorTotalPVP: 0,
        valorTotalCosto: 0,
        promedioStock: 0,
        promedioPVP: 0,
        promedioCosto: 0,
        margenPromedio: 0,
        porFamilia: {},
        porProveedor: {},
        porMarca: {},
        porTemporada: {}
      };
      
      articulosList.forEach(articulo => {
        const stock = articulo.exs || 0;
        const pvp = articulo.pvp || 0;
        const costo = articulo.cos || 0;
        
        // Stock
        if (stock > 0) {
          stats.conStock++;
        } else {
          stats.sinStock++;
        }
        stats.stockTotal += stock;
        
        // Valores
        stats.valorTotalPVP += pvp * stock;
        stats.valorTotalCosto += costo * stock;
        
        // Distribuciones
        if (articulo.fam) {
          stats.porFamilia[articulo.fam] = (stats.porFamilia[articulo.fam] || 0) + 1;
        }
        
        if (articulo.prv) {
          stats.porProveedor[articulo.prv] = (stats.porProveedor[articulo.prv] || 0) + 1;
        }
        
        if (articulo.mar) {
          stats.porMarca[articulo.mar] = (stats.porMarca[articulo.mar] || 0) + 1;
        }
        
        if (articulo.temp) {
          stats.porTemporada[articulo.temp] = (stats.porTemporada[articulo.temp] || 0) + 1;
        }
      });
      
      // Calcular promedios
      stats.promedioStock = stats.total > 0 ? stats.stockTotal / stats.total : 0;
      stats.promedioPVP = stats.total > 0 ? 
        articulosList.reduce((sum, art) => sum + (art.pvp || 0), 0) / stats.total : 0;
      stats.promedioCosto = stats.total > 0 ? 
        articulosList.reduce((sum, art) => sum + (art.cos || 0), 0) / stats.total : 0;
      stats.margenPromedio = stats.promedioPVP > 0 ? 
        ((stats.promedioPVP - stats.promedioCosto) / stats.promedioPVP) * 100 : 0;
      
      // Top distribuciones
      const topFamilias = Object.entries(stats.porFamilia)
        .map(([familia, cantidad]) => ({ familia, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      const topProveedores = Object.entries(stats.porProveedor)
        .map(([proveedor, cantidad]) => ({ proveedor, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      return {
        ...stats,
        topFamilias,
        topProveedores,
        porcentajes: {
          conStock: stats.total > 0 ? (stats.conStock / stats.total) * 100 : 0,
          margenPositivo: stats.margenPromedio > 0 ? 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene artículos con stock bajo
   * @param {number} umbralStock - Umbral por debajo del cual se considera stock bajo
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Array>} Artículos con stock bajo
   */
  async getArticulosStockBajo(umbralStock = 5, articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      return articulosList
        .filter(articulo => {
          const stock = articulo.exs || 0;
          return stock > 0 && stock <= umbralStock;
        })
        .sort((a, b) => (a.exs || 0) - (b.exs || 0))
        .map(articulo => ({
          id: articulo.id,
          nombre: articulo.name,
          referencia: articulo.ref,
          stock: articulo.exs || 0,
          pvp: articulo.pvp || 0,
          costo: articulo.cos || 0,
          familia: articulo.fam,
          proveedor: articulo.prv,
          marca: articulo.mar,
          diferencia: umbralStock - (articulo.exs || 0)
        }));
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getArticulosStockBajo');
    }
  }
  
  /**
   * Obtiene artículos sin movimiento (sin ventas en período)
   * @param {Array} ventasData - Datos de líneas de factura para verificar movimientos
   * @param {number} diasSinMovimiento - Días sin movimiento para considerar (por defecto 90)
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Array>} Artículos sin movimiento
   */
  async getArticulosSinMovimiento(ventasData = [], diasSinMovimiento = 90, articulosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      // Crear set de artículos con movimiento en el período
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasSinMovimiento);
      
      const articulosConMovimiento = new Set();
      ventasData.forEach(linea => {
        if (linea.art && linea.fch) {
          const fechaVenta = new Date(linea.fch);
          if (fechaVenta >= fechaLimite) {
            articulosConMovimiento.add(linea.art);
          }
        }
      });
      
      // Filtrar artículos sin movimiento que tengan stock
      return articulosList
        .filter(articulo => {
          const tieneStock = (articulo.exs || 0) > 0;
          const sinMovimiento = !articulosConMovimiento.has(articulo.id);
          return tieneStock && sinMovimiento;
        })
        .sort((a, b) => (b.exs || 0) - (a.exs || 0))
        .map(articulo => ({
          id: articulo.id,
          nombre: articulo.name,
          referencia: articulo.ref,
          stock: articulo.exs || 0,
          valorStock: (articulo.exs || 0) * (articulo.pvp || 0),
          pvp: articulo.pvp || 0,
          costo: articulo.cos || 0,
          familia: articulo.fam,
          proveedor: articulo.prv,
          marca: articulo.mar,
          diasSinMovimiento
        }));
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getArticulosSinMovimiento');
    }
  }
  
  /**
   * Análisis de rentabilidad por artículo
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {number} limit - Límite de resultados (por defecto 20)
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @returns {Promise<Array>} Análisis de rentabilidad por artículo
   */
  async getAnalisisRentabilidad(ventasData = [], limit = 20, articulosList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(articulosList);
      
      const rentabilidadArticulos = {};
      
      ventasData.forEach(linea => {
        const articuloId = linea.art;
        const ventas = linea.imp_pvp || 0;
        const beneficio = linea.ben || 0;
        const cantidad = linea.can || 0;
        const costo = (linea.cos || 0) * cantidad;
        
        if (articuloId && ventas > 0) {
          if (!rentabilidadArticulos[articuloId]) {
            rentabilidadArticulos[articuloId] = {
              articuloId,
              nombre: mapaNombres[articuloId] || `Artículo ${articuloId}`,
              totalVentas: 0,
              totalBeneficio: 0,
              totalCosto: 0,
              cantidadVendida: 0,
              numeroLineas: 0,
              margenBruto: 0,
              margenNeto: 0,
              roi: 0,
              rotacion: 0
            };
          }
          
          const articulo = rentabilidadArticulos[articuloId];
          articulo.totalVentas += ventas;
          articulo.totalBeneficio += beneficio;
          articulo.totalCosto += costo;
          articulo.cantidadVendida += cantidad;
          articulo.numeroLineas += 1;
        }
      });
      
      const articulosConRentabilidad = Object.values(rentabilidadArticulos)
        .map(articulo => ({
          ...articulo,
          margenBruto: articulo.totalVentas > 0 ? 
            ((articulo.totalVentas - articulo.totalCosto) / articulo.totalVentas) * 100 : 0,
          margenNeto: articulo.totalVentas > 0 ? 
            (articulo.totalBeneficio / articulo.totalVentas) * 100 : 0,
          roi: articulo.totalCosto > 0 ? 
            (articulo.totalBeneficio / articulo.totalCosto) * 100 : 0,
          precioPromedio: articulo.cantidadVendida > 0 ? 
            articulo.totalVentas / articulo.cantidadVendida : 0
        }))
        .sort((a, b) => b.totalBeneficio - a.totalBeneficio)
        .slice(0, limit);
      
      return articulosConRentabilidad;
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getAnalisisRentabilidad');
    }
  }
  
  /**
   * Obtiene opciones formateadas para selectores
   * @param {Array} articulosList - Lista de artículos (opcional)
   * @param {boolean} soloConStock - Si incluir solo artículos con stock (por defecto false)
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getOpcionesSelect(articulosList = null, soloConStock = false) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!articulosList) {
        const response = await this.getArticulos();
        articulosList = response[this.dataKey] || [];
      }
      
      const opciones = [{ value: 'todos', label: 'Todos los artículos' }];
      
      let articulosFiltrados = articulosList;
      
      // Filtrar solo con stock si se solicita
      if (soloConStock) {
        articulosFiltrados = articulosList.filter(articulo => (articulo.exs || 0) > 0);
      }
      
      articulosFiltrados
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(articulo => {
          opciones.push({
            value: articulo.id.toString(),
            label: `${articulo.name} (${articulo.ref || 'Sin ref'})`,
            referencia: articulo.ref || '',
            stock: articulo.exs || 0,
            pvp: articulo.pvp || 0
          });
        });
      
      return opciones;
    } catch (error) {
      throw apiUtils.handleError(error, 'ArticulosService.getOpcionesSelect');
    }
  }
  
  /**
   * Valida si un artículo existe
   * @param {string|number} id - ID del artículo
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeArticulo(id) {
    try {
      await this.getArticulo(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Filtra artículos localmente (útil para filtros que no soporta la API)
   * @param {Array} articulos - Array de artículos
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Artículos filtrados
   */
  filtrarArticulosLocalmente(articulos = [], filters = {}) {
    return apiUtils.filterAndSort(articulos, filters);
  }
  
  /**
   * Limpia la caché de artículos
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
    console.log('Caché de artículos limpiada');
  }
}

// Crear instancia singleton
export const articulosService = new ArticulosService();

// Exportación por defecto
export default articulosService;