// services/contactosService.js - Servicio específico para gestión de contactos/clientes
import { apiClient, apiUtils } from './apiClient.js';

/**
 * Servicio de contactos - Gestiona todas las operaciones relacionadas con entidades/clientes
 */
export class ContactosService {
  constructor() {
    this.endpoint = '/ent_m';
    this.dataKey = 'ent_m';
    this._cache = new Map();
    this._cacheExpiry = 10 * 60 * 1000; // 10 minutos
  }
  
  /**
   * Obtiene todos los contactos (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getContactos(params = {}, useCache = true) {
    try {
      const cacheKey = `contactos_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando contactos desde caché');
          return cached.data;
        }
      }
      
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo contactos desde la API');
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
      throw apiUtils.handleError(error, 'ContactosService.getContactos');
    }
  }
  
  /**
   * Obtiene un contacto por ID
   * @param {number|string} id - ID del contacto
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getContacto(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `contacto_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando contacto ${id} desde caché`);
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
      throw apiUtils.handleError(error, 'ContactosService.getContacto');
    }
  }
  
  /**
   * Crea un nuevo contacto
   * @param {Object} contactoData - Datos del contacto
   * @returns {Promise} Promesa con los datos creados
   */
  async createContacto(contactoData) {
    try {
      apiUtils.validateRequiredParams(contactoData, ['name']);
      
      const result = await apiClient.post(this.endpoint, contactoData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.createContacto');
    }
  }
  
  /**
   * Actualiza un contacto existente
   * @param {number|string} id - ID del contacto
   * @param {Object} contactoData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateContacto(id, contactoData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, contactoData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.updateContacto');
    }
  }
  
  /**
   * Elimina un contacto
   * @param {number|string} id - ID del contacto
   * @returns {Promise} Promesa con el resultado
   */
  async deleteContacto(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.deleteContacto');
    }
  }
  
  /**
   * Obtiene el nombre de un contacto por su ID
   * @param {string|number} id - ID del contacto
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<string>} Nombre del contacto
   */
  async getNombreContacto(id, contactosList = null) {
    try {
      if (!id) return 'Sin cliente';
      
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      const contacto = contactosList.find(c => c.id == id);
      return contacto ? contacto.name : `Cliente ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de contacto:', error);
      return `Cliente ${id}`;
    }
  }
  
  /**
   * Busca contactos por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Array>} Array de contactos que coinciden
   */
  async buscarPorNombre(nombre, contactosList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return contactosList.filter(contacto => 
        contacto.name && contacto.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.buscarPorNombre');
    }
  }
  
  /**
   * Busca contactos por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Array>} Array de contactos que coinciden
   */
  async buscarPorCriterios(criterios = {}, contactosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      return contactosList.filter(contacto => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!contacto.name || !contacto.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por email
        if (criterios.email) {
          const emailLower = criterios.email.toLowerCase();
          if (!contacto.email || !contacto.email.toLowerCase().includes(emailLower)) {
            return false;
          }
        }
        
        // Búsqueda por teléfono
        if (criterios.telefono) {
          if (!contacto.phone || !contacto.phone.includes(criterios.telefono)) {
            return false;
          }
        }
        
        // Búsqueda por ciudad
        if (criterios.ciudad) {
          const ciudadLower = criterios.ciudad.toLowerCase();
          if (!contacto.city || !contacto.city.toLowerCase().includes(ciudadLower)) {
            return false;
          }
        }
        
        // Búsqueda por tipo de cliente
        if (criterios.tipoCliente !== undefined) {
          if (contacto.is_customer !== criterios.tipoCliente) {
            return false;
          }
        }
        
        // Búsqueda por tipo de proveedor
        if (criterios.tipoProveedor !== undefined) {
          if (contacto.is_supplier !== criterios.tipoProveedor) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Object>} Mapa de contactos
   */
  async crearMapaCompleto(contactosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(contactosList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(contactosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(contactosList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de contactos
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Object>} Estadísticas de contactos
   */
  async getEstadisticas(contactosList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!contactosList) {
        const response = await this.getContactos();
        contactosList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: contactosList.length,
        clientes: 0,
        proveedores: 0,
        ambos: 0,
        conEmail: 0,
        conTelefono: 0,
        conDireccion: 0,
        porCiudad: {}
      };
      
      contactosList.forEach(contacto => {
        // Tipo de contacto
        const esCliente = contacto.is_customer;
        const esProveedor = contacto.is_supplier;
        
        if (esCliente && esProveedor) {
          stats.ambos++;
        } else if (esCliente) {
          stats.clientes++;
        } else if (esProveedor) {
          stats.proveedores++;
        }
        
        // Información de contacto
        if (contacto.email) stats.conEmail++;
        if (contacto.phone) stats.conTelefono++;
        if (contacto.address) stats.conDireccion++;
        
        // Distribución por ciudad
        if (contacto.city) {
          stats.porCiudad[contacto.city] = (stats.porCiudad[contacto.city] || 0) + 1;
        }
      });
      
      // Top ciudades
      const topCiudades = Object.entries(stats.porCiudad)
        .map(([ciudad, cantidad]) => ({ ciudad, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      return {
        ...stats,
        topCiudades,
        porcentajes: {
          clientes: stats.total > 0 ? (stats.clientes / stats.total) * 100 : 0,
          proveedores: stats.total > 0 ? (stats.proveedores / stats.total) * 100 : 0,
          conEmail: stats.total > 0 ? (stats.conEmail / stats.total) * 100 : 0,
          conTelefono: stats.total > 0 ? (stats.conTelefono / stats.total) * 100 : 0,
          conDireccion: stats.total > 0 ? (stats.conDireccion / stats.total) * 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene contactos más activos basado en ventas
   * @param {Array} ventasData - Datos de ventas
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Array>} Top contactos activos
   */
  async getContactosActivos(ventasData = [], limit = 10, contactosList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(contactosList);
      
      const actividadContactos = {};
      
      ventasData.forEach(venta => {
        const clienteId = venta.clt;
        const total = venta.tot || 0;
        
        if (clienteId) {
          if (!actividadContactos[clienteId]) {
            actividadContactos[clienteId] = {
              clienteId,
              nombre: mapaNombres[clienteId] || `Cliente ${clienteId}`,
              totalVentas: 0,
              cantidadFacturas: 0,
              ultimaCompra: null,
              primeraCompra: null
            };
          }
          
          const actividad = actividadContactos[clienteId];
          actividad.totalVentas += total;
          actividad.cantidadFacturas += 1;
          
          const fechaVenta = new Date(venta.fch);
          if (!actividad.ultimaCompra || fechaVenta > new Date(actividad.ultimaCompra)) {
            actividad.ultimaCompra = venta.fch;
          }
          if (!actividad.primeraCompra || fechaVenta < new Date(actividad.primeraCompra)) {
            actividad.primeraCompra = venta.fch;
          }
        }
      });
      
      return Object.values(actividadContactos)
        .map(actividad => ({
          ...actividad,
          promedioCompra: actividad.cantidadFacturas > 0 ? 
            actividad.totalVentas / actividad.cantidadFacturas : 0,
          diasSinComprar: actividad.ultimaCompra ? 
            Math.floor((Date.now() - new Date(actividad.ultimaCompra)) / (1000 * 60 * 60 * 24)) : null
        }))
        .sort((a, b) => b.totalVentas - a.totalVentas)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.getContactosActivos');
    }
  }
  
  /**
   * Identifica contactos inactivos
   * @param {Array} ventasData - Datos de ventas  
   * @param {number} diasInactividad - Días sin comprar para considerar inactivo (por defecto 90)
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Array>} Lista de contactos inactivos
   */
  async getContactosInactivos(ventasData = [], diasInactividad = 90, contactosList = null) {
    try {
      const contactosActivos = await this.getContactosActivos(ventasData, 999999, contactosList);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);
      
      return contactosActivos.filter(contacto => {
        if (!contacto.ultimaCompra) return true;
        return new Date(contacto.ultimaCompra) < fechaLimite;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.getContactosInactivos');
    }
  }
  
  /**
   * Segmenta contactos por volumen de compras
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {Promise<Object>} Segmentación de contactos
   */
  async segmentarContactos(ventasData = [], contactosList = null) {
    try {
      const contactosActivos = await this.getContactosActivos(ventasData, 999999, contactosList);
      
      if (contactosActivos.length === 0) {
        return {
          premium: [],
          frecuentes: [],
          ocasionales: [],
          nuevos: []
        };
      }
      
      // Calcular percentiles
      const ventasOrdenadas = contactosActivos
        .map(c => c.totalVentas)
        .sort((a, b) => b - a);
      
      const percentil80 = ventasOrdenadas[Math.floor(ventasOrdenadas.length * 0.2)];
      const percentil50 = ventasOrdenadas[Math.floor(ventasOrdenadas.length * 0.5)];
      const percentil20 = ventasOrdenadas[Math.floor(ventasOrdenadas.length * 0.8)];
      
      const segmentos = {
        premium: [],
        frecuentes: [],
        ocasionales: [],
        nuevos: []
      };
      
      contactosActivos.forEach(contacto => {
        const fechaPrimera = new Date(contacto.primeraCompra);
        const esNuevo = (Date.now() - fechaPrimera) < (30 * 24 * 60 * 60 * 1000); // 30 días
        
        if (esNuevo) {
          segmentos.nuevos.push(contacto);
        } else if (contacto.totalVentas >= percentil80) {
          segmentos.premium.push(contacto);
        } else if (contacto.totalVentas >= percentil50) {
          segmentos.frecuentes.push(contacto);
        } else {
          segmentos.ocasionales.push(contacto);
        }
      });
      
      return {
        ...segmentos,
        resumen: {
          totalContactos: contactosActivos.length,
          premium: segmentos.premium.length,
          frecuentes: segmentos.frecuentes.length,
          ocasionales: segmentos.ocasionales.length,
          nuevos: segmentos.nuevos.length,
          criterios: {
            premium: `>= €${percentil80.toFixed(2)}`,
            frecuentes: `€${percentil50.toFixed(2)} - €${percentil80.toFixed(2)}`,
            ocasionales: `< €${percentil50.toFixed(2)}`,
            nuevos: 'Clientes de los últimos 30 días'
          }
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'ContactosService.segmentarContactos');
    }
  }
  
  /**
   * Valida si un contacto existe
   * @param {number|string} id - ID del contacto
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeContacto(id) {
    try {
      await this.getContacto(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Limpia la caché de contactos
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
    console.log('Caché de contactos limpiada');
  }
}

// Crear instancia singleton
export const contactosService = new ContactosService();

// Exportación por defecto
export default contactosService;
