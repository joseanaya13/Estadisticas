// services/apiClient.js - Cliente API base
const API_KEY = "XWjaumCm";
const API_BASE_URL =
  "https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1";
const PAGE_SIZE = 1000; // Tamaño máximo de página que permite la API

/**
 * Configuración para peticiones fetch
 */
const defaultOptions = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

/**
 * Cliente API básico
 */
export const apiClient = {
  /**
   * Realiza una petición GET
   * @param {string} endpoint - Endpoint de la API
   * @returns {Promise} Promesa con los datos
   */
  get: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Error ${response.status}: ${response.statusText}`
        );
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
   * @param {string} dataKey - Clave de datos en la respuesta
   * @returns {Promise} Promesa con todos los datos
   */
  getAllPaginated: async (endpoint, dataKey) => {
    try {
      // Primera llamada para obtener el total
      const firstPageUrl = `${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }page[size]=${PAGE_SIZE}&page[number]=1`;
      const firstPageData = await apiClient.get(firstPageUrl);

      const totalCount = firstPageData.total_count || firstPageData.count || 0;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);

      console.log(
        `${dataKey}: Total ${totalCount} registros, ${totalPages} páginas`
      );

      // Si solo hay una página, devolver los datos
      if (totalPages <= 1) {
        return firstPageData;
      }

      // Obtener todas las páginas
      const allData = [...firstPageData[dataKey]];

      // Crear promesas para las páginas restantes
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${endpoint}${
          endpoint.includes("?") ? "&" : "?"
        }page[size]=${PAGE_SIZE}&page[number]=${page}`;
        pagePromises.push(apiClient.get(pageUrl));
      }

      // Ejecutar todas las peticiones en paralelo (con límite para no sobrecargar)
      const batchSize = 5; // Procesar 5 páginas a la vez
      for (let i = 0; i < pagePromises.length; i += batchSize) {
        const batch = pagePromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);

        batchResults.forEach((pageData) => {
          if (pageData[dataKey]) {
            allData.push(...pageData[dataKey]);
          }
        });

        // Mostrar progreso
        const progress = Math.min(i + batchSize, pagePromises.length);
        console.log(
          `${dataKey}: Cargando... ${progress + 1}/${totalPages} páginas`
        );
      }

      // Devolver estructura similar pero con todos los datos
      return {
        ...firstPageData,
        count: allData.length,
        total_count: totalCount,
        [dataKey]: allData,
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
   * @returns {Promise} Promesa con los datos
   */
  post: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Error ${response.status}: ${response.statusText}`
        );
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
   * @returns {Promise} Promesa con los datos
   */
  put: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Error ${response.status}: ${response.statusText}`
        );
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
   * @returns {Promise} Promesa con los datos
   */
  delete: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Construye parámetros de query string
   * @param {Object} params - Parámetros
   * @returns {string} Query string
   */
  buildQueryParams: (params = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    return queryParams.toString() ? `?${queryParams.toString()}` : "";
  },
};

export default apiClient;
