// services/api.js
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
 * Cliente API básico
 */
const apiClient = {
  /**
   * Realiza una petición GET
   * @param {string} endpoint - Endpoint de la API
   * @returns {Promise} Promesa con los datos
   */
  get: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
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
   * @returns {Promise} Promesa con todos los datos
   */
  getAllPaginated: async (endpoint, dataKey) => {
    try {
      // Primera llamada para obtener el total
      const firstPageUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page[size]=${PAGE_SIZE}&page[number]=1`;
      const firstPageData = await apiClient.get(firstPageUrl);
      
      const totalCount = firstPageData.total_count || firstPageData.count || 0;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);
      
      console.log(`Total de registros: ${totalCount}, Total de páginas: ${totalPages}`);
      
      // Si solo hay una página, devolver los datos
      if (totalPages <= 1) {
        return firstPageData;
      }
      
      // Obtener todas las páginas
      const allData = [...firstPageData[dataKey]];
      
      // Crear promesas para las páginas restantes
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page[size]=${PAGE_SIZE}&page[number]=${page}`;
        pagePromises.push(apiClient.get(pageUrl));
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
        console.log(`Cargando datos... ${progress + 1}/${totalPages} páginas`);
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
   * @returns {Promise} Promesa con los datos
   */
  post: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
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
   * @returns {Promise} Promesa con los datos
   */
  put: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
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
   * @returns {Promise} Promesa con los datos
   */
  delete: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
      const response = await fetch(url, {
        ...defaultOptions,
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
};

// Servicios específicos para cada entidad
export const ventasService = {
  /**
   * Obtiene todas las facturas (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getFacturas: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir parámetros de filtrado si existen
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.getAllPaginated(`/fac_t${query}`, 'fac_t');
  },
  
  /**
   * Obtiene una factura por ID
   * @param {number} id - ID de la factura
   * @returns {Promise} Promesa con los datos
   */
  getFactura: (id) => {
    return apiClient.get(`/fac_t/${id}`);
  },
  
  /**
   * Obtiene estadísticas de ventas
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getEstadisticas: async (params = {}) => {
    try {
      const facturas = await ventasService.getFacturas(params);
      
      // Calcular estadísticas
      const total = facturas.fac_t.reduce((sum, item) => sum + (item.tot || 0), 0);
      const cantidad = facturas.fac_t.length;
      const promedio = cantidad > 0 ? total / cantidad : 0;
      
      // Ventas por mes
      const ventasPorMes = {};
      facturas.fac_t.forEach(item => {
        const mes = item.mes;
        if (mes) {
          ventasPorMes[mes] = (ventasPorMes[mes] || 0) + (item.tot || 0);
        }
      });
      
      // Ventas por cliente
      const ventasPorCliente = {};
      facturas.fac_t.forEach(item => {
        const cliente = item.clt;
        if (cliente) {
          ventasPorCliente[cliente] = (ventasPorCliente[cliente] || 0) + (item.tot || 0);
        }
      });
      
      return {
        total,
        cantidad,
        promedio,
        ventasPorMes: Object.entries(ventasPorMes).map(([mes, total]) => ({
          mes: parseInt(mes),
          total
        })),
        ventasPorCliente: Object.entries(ventasPorCliente).map(([cliente, total]) => ({
          cliente: parseInt(cliente),
          total
        }))
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de ventas:', error);
      throw error;
    }
  }
};

export const comprasService = {
  /**
   * Obtiene todos los albaranes (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getAlbaranes: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir parámetros de filtrado si existen
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.getAllPaginated(`/com_alb_g${query}`, 'com_alb_g');
  },
  
  /**
   * Obtiene un albarán por ID
   * @param {number} id - ID del albarán
   * @returns {Promise} Promesa con los datos
   */
  getAlbaran: (id) => {
    return apiClient.get(`/com_alb_g/${id}`);
  },
  
  /**
   * Obtiene estadísticas de compras
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getEstadisticas: async (params = {}) => {
    try {
      const albaranes = await comprasService.getAlbaranes(params);
      
      // Calcular estadísticas
      const total = albaranes.com_alb_g.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
      const cantidad = albaranes.com_alb_g.length;
      const promedio = cantidad > 0 ? total / cantidad : 0;
      
      // Compras por mes
      const comprasPorMes = {};
      albaranes.com_alb_g.forEach(item => {
        const mes = item.mes;
        if (mes) {
          comprasPorMes[mes] = (comprasPorMes[mes] || 0) + (item.tot_alb || 0);
        }
      });
      
      // Compras por proveedor
      const comprasPorProveedor = {};
      albaranes.com_alb_g.forEach(item => {
        const proveedor = item.prv;
        if (proveedor) {
          comprasPorProveedor[proveedor] = (comprasPorProveedor[proveedor] || 0) + (item.tot_alb || 0);
        }
      });
      
      return {
        total,
        cantidad,
        promedio,
        comprasPorMes: Object.entries(comprasPorMes).map(([mes, total]) => ({
          mes: parseInt(mes),
          total
        })),
        comprasPorProveedor: Object.entries(comprasPorProveedor).map(([proveedor, total]) => ({
          proveedor: parseInt(proveedor),
          total
        }))
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de compras:', error);
      throw error;
    }
  }
};

export const dashboardService = {
  /**
   * Obtiene datos para el dashboard
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} Promesa con los datos
   */
  getDashboardData: async (filters = {}) => {
    try {
      console.log('Obteniendo datos del dashboard con paginación completa...');
      
      // Construir parámetros de filtro para la API
      const params = {};
      
      // Filtro por ejercicio/año
      if (filters.eje) {
        params['filter[eje]'] = filters.eje;
      }
      
      // Filtro por mes
      if (filters.mes) {
        params['filter[mes]'] = filters.mes;
      }
      
      // Filtro por empresa
      if (filters.emp) {
        params['filter[emp]'] = filters.emp;
      }
      
      // Filtro por rango de fechas
      if (filters.fechaDesde && filters.fechaHasta) {
        params['filter[fch]'] = `${filters.fechaDesde},${filters.fechaHasta}`;
      }
      
      // Obtener datos de ventas y compras en paralelo
      const [ventasData, comprasData] = await Promise.all([
        ventasService.getFacturas(params),
        comprasService.getAlbaranes(params)
      ]);
      
      console.log(`Total facturas obtenidas: ${ventasData.fac_t.length}`);
      console.log(`Total albaranes obtenidos: ${comprasData.com_alb_g.length}`);
      
      // Calcular totales
      const ventasTotales = ventasData.fac_t.reduce((sum, item) => sum + (item.tot || 0), 0);
      const comprasTotales = comprasData.com_alb_g.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
      const balance = ventasTotales - comprasTotales;
      
      // Procesar datos por mes
      const mesesVentas = {};
      ventasData.fac_t.forEach(item => {
        const mes = item.mes;
        if (mes) {
          mesesVentas[mes] = (mesesVentas[mes] || 0) + (item.tot || 0);
        }
      });
      
      const mesesCompras = {};
      comprasData.com_alb_g.forEach(item => {
        const mes = item.mes;
        if (mes) {
          mesesCompras[mes] = (mesesCompras[mes] || 0) + (item.tot_alb || 0);
        }
      });
      
      // Combinar datos de ventas y compras por mes
      const mesesUnicos = new Set([
        ...Object.keys(mesesVentas).map(m => parseInt(m)),
        ...Object.keys(mesesCompras).map(m => parseInt(m))
      ]);
      
      const datosPorMes = Array.from(mesesUnicos).map(mes => {
        const ventasMes = mesesVentas[mes] || 0;
        const comprasMes = mesesCompras[mes] || 0;
        return {
          mes,
          ventas: ventasMes,
          compras: comprasMes,
          balance: ventasMes - comprasMes
        };
      }).sort((a, b) => a.mes - b.mes);
      
      return {
        ventasTotales,
        comprasTotales,
        balance,
        datosPorMes,
        ventasData,
        comprasData
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene datos filtrados para el dashboard sin hacer nuevas llamadas a la API
   * @param {Object} ventasData - Datos de ventas ya cargados
   * @param {Object} comprasData - Datos de compras ya cargados
   * @param {Object} filters - Filtros a aplicar
   * @returns {Object} Datos procesados para el dashboard
   */
  processDashboardData: (ventasData, comprasData, filters = {}) => {
    // Esta función procesa los datos ya cargados sin hacer nuevas llamadas a la API
    // Útil cuando ya tienes los datos y solo quieres aplicar filtros localmente
    
    let ventasFiltradas = [...ventasData.fac_t];
    let comprasFiltradas = [...comprasData.com_alb_g];
    
    // Aplicar filtros localmente...
    // (el código de filtrado se implementaría aquí similar al componente Dashboard)
    
    // Calcular y devolver estadísticas
    const ventasTotales = ventasFiltradas.reduce((sum, item) => sum + (item.tot || 0), 0);
    const comprasTotales = comprasFiltradas.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
    const balance = ventasTotales - comprasTotales;
    
    return {
      ventasTotales,
      comprasTotales,
      balance,
      ventasData: { ...ventasData, fac_t: ventasFiltradas },
      comprasData: { ...comprasData, com_alb_g: comprasFiltradas }
    };
  }
};

// Servicio para empresas
export const empresasService = {
  /**
   * Obtiene todas las empresas
   * @returns {Promise} Promesa con los datos
   */
  getEmpresas: async () => {
    try {
      const response = await apiClient.get('/emp_m');
      return response;
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene una empresa por ID
   * @param {string} id - ID de la empresa
   * @returns {Promise} Promesa con los datos
   */
  getEmpresa: (id) => {
    return apiClient.get(`/emp_m/${id}`);
  }
};

// Exportación por defecto de todos los servicios
export default {
  ventas: ventasService,
  compras: comprasService,
  dashboard: dashboardService,
  empresas: empresasService
};