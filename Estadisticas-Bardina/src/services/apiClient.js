// services/apiClient.js - Cliente base para todas las llamadas a la API
const API_KEY = 'XWjaumCm';
const API_BASE_URL = 'https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1';
const PAGE_SIZE = 1000; // Tamaño máximo de página que permite la API

/**
 * Configuración para peticiones fetch
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Cliente API básico - Centraliza todas las llamadas HTTP
 */
export const apiClient = {
  /**
   * Realiza una petición GET
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa con los datos
   */
  get: async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición GET con paginación completa
   * @param {string} endpoint - Endpoint de la API
   * @param {string} dataKey - Clave donde están los datos en la respuesta
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa con todos los datos
   */
  getAllPaginated: async (endpoint, dataKey, options = {}) => {
    try {
      // Primera llamada para obtener el total
      const firstPageUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page[size]=${PAGE_SIZE}&page[number]=1`;
      const firstPageData = await apiClient.get(firstPageUrl, options);
      
      const totalCount = firstPageData.total_count || firstPageData.count || 0;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);
      
      console.log(`${endpoint} - Total registros: ${totalCount}, Total páginas: ${totalPages}`);
      
      // Si solo hay una página, devolver los datos
      if (totalPages <= 1) {
        return firstPageData;
      }
      
      // Obtener todas las páginas
      const allData = [...(firstPageData[dataKey] || [])];
      
      // Crear promesas para las páginas restantes
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page[size]=${PAGE_SIZE}&page[number]=${page}`;
        pagePromises.push(apiClient.get(pageUrl, options));
      }
      
      // Ejecutar todas las peticiones en paralelo (con límite para no sobrecargar)
      const batchSize = 5; // Procesar 5 páginas a la vez
      for (let i = 0; i < pagePromises.length; i += batchSize) {
        const batch = pagePromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        
        batchResults.forEach(pageData => {
          if (pageData[dataKey]) {
            allData.push(...pageData[dataKey]);
          }
        });
        
        // Mostrar progreso
        const progress = Math.min(i + batchSize, pagePromises.length);
        console.log(`${endpoint} - Cargando... ${progress + 1}/${totalPages} páginas`);
      }
      
      // Devolver estructura similar pero con todos los datos
      return {
        ...firstPageData,
        count: allData.length,
        total_count: totalCount,
        [dataKey]: allData
      };
    } catch (error) {
      console.error(`Error en getAllPaginated ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición POST
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa con los datos
   */
  post: async (endpoint, data, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición PUT
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa con los datos
   */
  put: async (endpoint, data, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición DELETE
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa con los datos
   */
  delete: async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Construye parámetros de query string
   * @param {Object} params - Parámetros a convertir
   * @returns {string} Query string
   */
  buildQueryParams: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    return queryParams.toString();
  },
  
  /**
   * Construye filtros para la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Object} Parámetros formateados para la API
   */
  buildApiFilters: (filters = {}) => {
    const params = {};
    
    // Filtro por ejercicio/año
    if (filters.eje || filters.año) {
      params['filter[eje]'] = filters.eje || filters.año;
    }
    
    // Filtro por mes
    if (filters.mes) {
      params['filter[mes]'] = filters.mes;
    }
    
    // Filtro por empresa
    if (filters.emp || filters.empresa) {
      params['filter[emp]'] = filters.emp || filters.empresa;
    }
    
    // Filtro por cliente
    if (filters.clt || filters.cliente) {
      params['filter[clt]'] = filters.clt || filters.cliente;
    }
    
    // Filtro por proveedor
    if (filters.prv || filters.proveedor) {
      params['filter[prv]'] = filters.prv || filters.proveedor;
    }
    
    // Filtro por rango de fechas
    if (filters.fechaDesde && filters.fechaHasta) {
      params['filter[fch]'] = `${filters.fechaDesde},${filters.fechaHasta}`;
    } else if (filters.fechaDesde) {
      params['filter[fch]'] = `${filters.fechaDesde},`;
    } else if (filters.fechaHasta) {
      params['filter[fch]'] = `,${filters.fechaHasta}`;
    }
    
    // Filtro por fecha específica
    if (filters.fch && !filters.fechaDesde && !filters.fechaHasta) {
      params['filter[fch]'] = filters.fch;
    }
    
    return params;
  }
};

/**
 * Utilidades comunes para todos los servicios
 */
export const apiUtils = {
  /**
   * Maneja errores de manera consistente
   * @param {Error} error - Error a manejar
   * @param {string} context - Contexto donde ocurrió el error
   * @returns {Error} Error formateado
   */
  handleError: (error, context = 'API') => {
    console.error(`${context} Error:`, error);
    
    if (error.message) {
      return new Error(`${context}: ${error.message}`);
    }
    
    return new Error(`${context}: Error desconocido`);
  },
  
  /**
   * Valida parámetros requeridos
   * @param {Object} params - Parámetros a validar
   * @param {Array} required - Campos requeridos
   * @throws {Error} Si falta algún parámetro requerido
   */
  validateRequiredParams: (params, required = []) => {
    const missing = required.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );
    
    if (missing.length > 0) {
      throw new Error(`Faltan parámetros requeridos: ${missing.join(', ')}`);
    }
  },
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} items - Array de objetos
   * @param {string} keyField - Campo a usar como clave (por defecto 'id')
   * @returns {Object} Mapa de búsqueda
   */
  createLookupMap: (items = [], keyField = 'id') => {
    const map = {};
    items.forEach(item => {
      if (item[keyField] !== undefined) {
        map[item[keyField]] = item;
      }
    });
    return map;
  },
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} items - Array de objetos
   * @param {string} keyField - Campo a usar como clave (por defecto 'id')
   * @param {string} nameField - Campo a usar como nombre (por defecto 'name')
   * @returns {Object} Mapa de nombres
   */
  createNameMap: (items = [], keyField = 'id', nameField = 'name') => {
    const map = {};
    items.forEach(item => {
      if (item[keyField] !== undefined && item[nameField]) {
        map[item[keyField]] = item[nameField];
      }
    });
    return map;
  },
  
  /**
   * Filtra y ordena datos localmente
   * @param {Array} data - Datos a filtrar
   * @param {Object} filters - Filtros a aplicar
   * @param {string} sortBy - Campo por el que ordenar
   * @param {string} sortOrder - Orden (asc/desc)
   * @returns {Array} Datos filtrados y ordenados
   */
  filterAndSort: (data = [], filters = {}, sortBy = null, sortOrder = 'asc') => {
    let filtered = [...data];
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          
          // Comparación flexible
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toString().toLowerCase());
          }
          
          return itemValue == value; // Comparación flexible
        });
      }
    });
    
    // Aplicar ordenamiento
    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }
};

export default apiClient;
