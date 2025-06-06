// services/maestros/proveedoresService.js - Servicio específico para gestión de proveedores
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de proveedores - Gestiona operaciones relacionadas con proveedores (subset de entidades)
 * Los proveedores están en la tabla ent_m con es_prv = true
 */
export class ProveedoresService {
  constructor() {
    this.endpoint = '/ent_m';
    this.dataKey = 'ent_m';
    this._cache = new Map();
    this._cacheExpiry = 20 * 60 * 1000; // 20 minutos - datos maestros
  }
  
  /**
   * Obtiene todos los proveedores (filtra entidades con es_prv = true)
   * @param {Object} params - Parámetros de filtrado adicionales
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos de proveedores
   */
  async getProveedores(params = {}, useCache = true) {
    try {
      const cacheKey = `proveedores_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando proveedores desde caché');
          return cached.data;
        }
      }
      
      // Obtener todas las entidades y filtrar proveedores
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo proveedores desde la API');
      const entidadesData = await apiClient.getAllPaginated(endpoint, this.dataKey);
      
      // Filtrar solo proveedores
      const proveedores = (entidadesData[this.dataKey] || []).filter(entidad => 
        entidad.es_prv === true || entidad.es_prv === 1
      );
      
      const proveedoresData = {
        ...entidadesData,
        [this.dataKey]: proveedores,
        count: proveedores.length,
        total_count: proveedores.length
      };
      
      console.log(`Filtrados ${proveedores.length} proveedores de ${entidadesData[this.dataKey].length} entidades`);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data: proveedoresData,
          timestamp: Date.now()
        });
      }
      
      return proveedoresData;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getProveedores');
    }
  }
  
  /**
   * Obtiene un proveedor por ID
   * @param {string|number} id - ID del proveedor
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos del proveedor
   */
  async getProveedor(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `proveedor_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando proveedor ${id} desde caché`);
          return cached.data;
        }
      }
      
      const data = await apiClient.get(`${this.endpoint}/${id}`);
      
      // Verificar que sea un proveedor
      if (data && (data.es_prv !== true && data.es_prv !== 1)) {
        throw new Error(`La entidad ${id} no es un proveedor`);
      }
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getProveedor');
    }
  }
  
  /**
   * Obtiene proveedores con filtros específicos de la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con los datos filtrados
   */
  async getProveedoresFiltered(filters = {}) {
    try {
      const apiFilters = apiClient.buildApiFilters(filters);
      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`Obteniendo proveedores con filtros:`, filters);
      console.log(`Endpoint: ${endpoint}`);
      
      const entidadesData = await apiClient.getAllPaginated(endpoint, this.dataKey);
      
      // Filtrar solo proveedores
      const proveedores = (entidadesData[this.dataKey] || []).filter(entidad => 
        entidad.es_prv === true || entidad.es_prv === 1
      );
      
      return {
        ...entidadesData,
        [this.dataKey]: proveedores,
        count: proveedores.length,
        total_count: proveedores.length
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getProveedoresFiltered');
    }
  }
  
  /**
   * Crea un nuevo proveedor
   * @param {Object} proveedorData - Datos del proveedor
   * @returns {Promise} Promesa con los datos creados
   */
  async createProveedor(proveedorData) {
    try {
      apiUtils.validateRequiredParams(proveedorData, ['name']);
      
      // Asegurar que se marca como proveedor
      const datosConProveedor = {
        ...proveedorData,
        es_prv: true
      };
      
      const result = await apiClient.post(this.endpoint, datosConProveedor);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.createProveedor');
    }
  }
  
  /**
   * Actualiza un proveedor existente
   * @param {string|number} id - ID del proveedor
   * @param {Object} proveedorData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateProveedor(id, proveedorData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      // Verificar que existe y es proveedor
      await this.getProveedor(id);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, proveedorData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.updateProveedor');
    }
  }
  
  /**
   * Elimina un proveedor (marca es_prv como false)
   * @param {string|number} id - ID del proveedor
   * @returns {Promise} Promesa con el resultado
   */
  async deleteProveedor(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      // En lugar de eliminar, desmarcar como proveedor
      const result = await apiClient.put(`${this.endpoint}/${id}`, { es_prv: false });
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.deleteProveedor');
    }
  }
  
  /**
   * Obtiene el nombre de un proveedor por su ID
   * @param {string|number} id - ID del proveedor
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<string>} Nombre del proveedor
   */
  async getNombreProveedor(id, proveedoresList = null) {
    try {
      if (!id) return 'Sin proveedor';
      
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      const proveedor = proveedoresList.find(p => p.id == id);
      return proveedor ? proveedor.name : `Proveedor ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de proveedor:', error);
      return `Proveedor ${id}`;
    }
  }
  
  /**
   * Busca proveedores por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Array>} Array de proveedores que coinciden
   */
  async buscarPorNombre(nombre, proveedoresList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return proveedoresList.filter(proveedor => 
        proveedor.name && proveedor.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.buscarPorNombre');
    }
  }
  
  /**
   * Busca proveedores por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Array>} Array de proveedores que coinciden
   */
  async buscarPorCriterios(criterios = {}, proveedoresList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      return proveedoresList.filter(proveedor => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!proveedor.name || !proveedor.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por email
        if (criterios.email) {
          const emailLower = criterios.email.toLowerCase();
          if (!proveedor.email || !proveedor.email.toLowerCase().includes(emailLower)) {
            return false;
          }
        }
        
        // Búsqueda por teléfono
        if (criterios.telefono) {
          if (!proveedor.phone || !proveedor.phone.includes(criterios.telefono)) {
            return false;
          }
        }
        
        // Búsqueda por ciudad
        if (criterios.ciudad) {
          const ciudadLower = criterios.ciudad.toLowerCase();
          if (!proveedor.city || !proveedor.city.toLowerCase().includes(ciudadLower)) {
            return false;
          }
        }
        
        // Búsqueda por país
        if (criterios.pais) {
          const paisLower = criterios.pais.toLowerCase();
          if (!proveedor.country || !proveedor.country.toLowerCase().includes(paisLower)) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Object>} Mapa de proveedores
   */
  async crearMapaCompleto(proveedoresList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(proveedoresList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(proveedoresList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(proveedoresList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de proveedores
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Object>} Estadísticas de proveedores
   */
  async getEstadisticas(proveedoresList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: proveedoresList.length,
        conEmail: 0,
        conTelefono: 0,
        conDireccion: 0,
        conWeb: 0,
        porPais: {},
        porCiudad: {}
      };
      
      proveedoresList.forEach(proveedor => {
        // Información de contacto
        if (proveedor.email) stats.conEmail++;
        if (proveedor.phone) stats.conTelefono++;
        if (proveedor.address) stats.conDireccion++;
        if (proveedor.website) stats.conWeb++;
        
        // Distribución geográfica
        if (proveedor.country) {
          stats.porPais[proveedor.country] = (stats.porPais[proveedor.country] || 0) + 1;
        }
        
        if (proveedor.city) {
          stats.porCiudad[proveedor.city] = (stats.porCiudad[proveedor.city] || 0) + 1;
        }
      });
      
      // Top países y ciudades
      const topPaises = Object.entries(stats.porPais)
        .map(([pais, cantidad]) => ({ pais, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      const topCiudades = Object.entries(stats.porCiudad)
        .map(([ciudad, cantidad]) => ({ ciudad, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      return {
        ...stats,
        topPaises,
        topCiudades,
        porcentajes: {
          conEmail: stats.total > 0 ? (stats.conEmail / stats.total) * 100 : 0,
          conTelefono: stats.total > 0 ? (stats.conTelefono / stats.total) * 100 : 0,
          conDireccion: stats.total > 0 ? (stats.conDireccion / stats.total) * 100 : 0,
          conWeb: stats.total > 0 ? (stats.conWeb / stats.total) * 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene proveedores más activos basado en datos de compras
   * @param {Array} comprasData - Datos de albaranes o líneas de factura
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Array>} Top proveedores activos
   */
  async getProveedoresActivos(comprasData = [], limit = 10, proveedoresList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(proveedoresList);
      
      const actividadProveedores = {};
      
      comprasData.forEach(compra => {
        const proveedorId = compra.prv;
        const total = compra.tot_alb || compra.imp_pvp || 0;
        const cantidad = compra.can || 1;
        
        if (proveedorId && total > 0) {
          if (!actividadProveedores[proveedorId]) {
            actividadProveedores[proveedorId] = {
              proveedorId,
              nombre: mapaNombres[proveedorId] || `Proveedor ${proveedorId}`,
              totalCompras: 0,
              cantidadTransacciones: 0,
              cantidadProductos: 0,
              ultimaCompra: null,
              primeraCompra: null,
              promedioCompra: 0
            };
          }
          
          const actividad = actividadProveedores[proveedorId];
          actividad.totalCompras += total;
          actividad.cantidadTransacciones += 1;
          actividad.cantidadProductos += cantidad;
          
          // Fechas de compra
          if (compra.fch) {
            const fechaCompra = new Date(compra.fch);
            if (!actividad.ultimaCompra || fechaCompra > new Date(actividad.ultimaCompra)) {
              actividad.ultimaCompra = compra.fch;
            }
            if (!actividad.primeraCompra || fechaCompra < new Date(actividad.primeraCompra)) {
              actividad.primeraCompra = compra.fch;
            }
          }
        }
      });
      
      return Object.values(actividadProveedores)
        .map(proveedor => ({
          ...proveedor,
          promedioCompra: proveedor.cantidadTransacciones > 0 ? 
            proveedor.totalCompras / proveedor.cantidadTransacciones : 0,
          diasSinComprar: proveedor.ultimaCompra ? 
            Math.floor((Date.now() - new Date(proveedor.ultimaCompra)) / (1000 * 60 * 60 * 24)) : null
        }))
        .sort((a, b) => b.totalCompras - a.totalCompras)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getProveedoresActivos');
    }
  }
  
  /**
   * Análisis de rentabilidad por proveedor (basado en márgenes de productos)
   * @param {Array} ventasData - Datos de líneas de factura con información de proveedor
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Object>} Análisis de rentabilidad por proveedor
   */
  async getAnalisisRentabilidad(ventasData = [], proveedoresList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(proveedoresList);
      
      const rentabilidadProveedores = {};
      
      ventasData.forEach(linea => {
        const proveedorId = linea.prv;
        const ventas = linea.imp_pvp || 0;
        const beneficio = linea.ben || 0;
        const cantidad = linea.can || 0;
        const costo = (linea.cos || 0) * cantidad;
        
        if (proveedorId && ventas > 0) {
          if (!rentabilidadProveedores[proveedorId]) {
            rentabilidadProveedores[proveedorId] = {
              proveedorId,
              nombre: mapaNombres[proveedorId] || `Proveedor ${proveedorId}`,
              totalVentas: 0,
              totalBeneficio: 0,
              totalCosto: 0,
              cantidadVendida: 0,
              numeroLineas: 0,
              productosUnicos: new Set(),
              margenBruto: 0,
              margenNeto: 0,
              roi: 0
            };
          }
          
          const proveedor = rentabilidadProveedores[proveedorId];
          proveedor.totalVentas += ventas;
          proveedor.totalBeneficio += beneficio;
          proveedor.totalCosto += costo;
          proveedor.cantidadVendida += cantidad;
          proveedor.numeroLineas += 1;
          
          if (linea.art) {
            proveedor.productosUnicos.add(linea.art);
          }
        }
      });
      
      const proveedoresConRentabilidad = Object.values(rentabilidadProveedores)
        .map(proveedor => ({
          ...proveedor,
          productosUnicos: proveedor.productosUnicos.size,
          margenBruto: proveedor.totalVentas > 0 ? 
            ((proveedor.totalVentas - proveedor.totalCosto) / proveedor.totalVentas) * 100 : 0,
          margenNeto: proveedor.totalVentas > 0 ? 
            (proveedor.totalBeneficio / proveedor.totalVentas) * 100 : 0,
          roi: proveedor.totalCosto > 0 ? 
            (proveedor.totalBeneficio / proveedor.totalCosto) * 100 : 0
        }))
        .sort((a, b) => b.margenNeto - a.margenNeto);
      
      // Categorizar proveedores por rentabilidad
      const altaRentabilidad = proveedoresConRentabilidad.filter(p => p.margenNeto > 25);
      const mediaRentabilidad = proveedoresConRentabilidad.filter(p => p.margenNeto >= 15 && p.margenNeto <= 25);
      const bajaRentabilidad = proveedoresConRentabilidad.filter(p => p.margenNeto < 15);
      
      return {
        proveedores: proveedoresConRentabilidad,
        categorias: {
          altaRentabilidad,
          mediaRentabilidad,
          bajaRentabilidad
        },
        resumen: {
          totalProveedores: proveedoresConRentabilidad.length,
          margenPromedioGeneral: proveedoresConRentabilidad.length > 0 ? 
            proveedoresConRentabilidad.reduce((sum, p) => sum + p.margenNeto, 0) / proveedoresConRentabilidad.length : 0,
          proveedorMasRentable: proveedoresConRentabilidad.length > 0 ? proveedoresConRentabilidad[0] : null,
          distribuciones: {
            altaRentabilidad: altaRentabilidad.length,
            mediaRentabilidad: mediaRentabilidad.length,
            bajaRentabilidad: bajaRentabilidad.length
          }
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getAnalisisRentabilidad');
    }
  }
  
  /**
   * Obtiene proveedores inactivos (sin compras en período)
   * @param {Array} comprasData - Datos de compras
   * @param {number} diasInactividad - Días sin compras para considerar inactivo (por defecto 180)
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise<Array>} Lista de proveedores inactivos
   */
  async getProveedoresInactivos(comprasData = [], diasInactividad = 180, proveedoresList = null) {
    try {
      const proveedoresActivos = await this.getProveedoresActivos(comprasData, 999999, proveedoresList);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);
      
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      const idsActivosRecientes = new Set(
        proveedoresActivos
          .filter(proveedor => proveedor.ultimaCompra && new Date(proveedor.ultimaCompra) >= fechaLimite)
          .map(proveedor => proveedor.proveedorId)
      );
      
      return proveedoresList
        .filter(proveedor => !idsActivosRecientes.has(proveedor.id))
        .map(proveedor => ({
          id: proveedor.id,
          nombre: proveedor.name,
          email: proveedor.email,
          telefono: proveedor.phone,
          ciudad: proveedor.city,
          pais: proveedor.country,
          diasInactividad
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getProveedoresInactivos');
    }
  }
  
  /**
   * Obtiene opciones formateadas para selectores
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @param {boolean} soloActivos - Si incluir solo proveedores con actividad reciente (por defecto false)
   * @param {Array} comprasData - Datos de compras para filtrar activos (opcional)
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getOpcionesSelect(proveedoresList = null, soloActivos = false, comprasData = []) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!proveedoresList) {
        const response = await this.getProveedores();
        proveedoresList = response[this.dataKey] || [];
      }
      
      const opciones = [{ value: 'todos', label: 'Todos los proveedores' }];
      
      let proveedoresFiltrados = proveedoresList;
      
      // Filtrar solo activos si se solicita
      if (soloActivos && comprasData.length > 0) {
        const proveedoresActivos = await this.getProveedoresActivos(comprasData, 999999, proveedoresList);
        const idsActivos = new Set(proveedoresActivos.map(p => p.proveedorId));
        proveedoresFiltrados = proveedoresList.filter(proveedor => idsActivos.has(proveedor.id));
      }
      
      proveedoresFiltrados
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(proveedor => {
          opciones.push({
            value: proveedor.id.toString(),
            label: proveedor.name,
            email: proveedor.email || '',
            telefono: proveedor.phone || '',
            ciudad: proveedor.city || '',
            pais: proveedor.country || ''
          });
        });
      
      return opciones;
    } catch (error) {
      throw apiUtils.handleError(error, 'ProveedoresService.getOpcionesSelect');
    }
  }
  
  /**
   * Valida si un proveedor existe
   * @param {string|number} id - ID del proveedor
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeProveedor(id) {
    try {
      await this.getProveedor(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Filtra proveedores localmente (útil para filtros que no soporta la API)
   * @param {Array} proveedores - Array de proveedores
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Proveedores filtrados
   */
  filtrarProveedoresLocalmente(proveedores = [], filters = {}) {
    return apiUtils.filterAndSort(proveedores, filters);
  }
  
  /**
   * Limpia la caché de proveedores
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
    console.log('Caché de proveedores limpiada');
  }
}

// Crear instancia singleton
export const proveedoresService = new ProveedoresService();

// Exportación por defecto
export default proveedoresService;