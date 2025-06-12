import axios from 'axios';

// Configuración base de la API
const api = axios.create({
  baseURL: import.meta.env.VITE_VELNEO_API_URL,
  timeout: 30000, // 30 segundos para Velneo
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Función para añadir la API key a los parámetros
const addApiKey = (params = {}) => ({
  ...params,
  api_key: import.meta.env.VITE_VELNEO_API_KEY
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API de Velneo:', error);
    if (error.response?.status === 401) {
      console.error('Error de autenticación. Verifica tu API key.');
    } else if (error.response?.status === 404) {
      console.error('Endpoint no encontrado:', error.config?.url);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Timeout de conexión con Velneo');
    }
    return Promise.reject(error);
  }
);

export const velneoAPI = {
  // === MÉTODOS DE PRUEBA ===
  // Probar conectividad
  testConnection: async () => {
    try {
      const response = await api.get('/', { 
        params: addApiKey() 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // === FACTURAS ===
  getFacturas: async (params = {}) => {
    const response = await api.get('/fac_t', { 
      params: addApiKey(params) 
    });
    return response.data;
  },

  getLineasFactura: async (params = {}) => {
    const response = await api.get('/fac_lin_t', { 
      params: addApiKey(params) 
    });
    return response.data;
  },
  
  // === MAESTROS ===
  getArticulos: async (params = {}) => {
    const response = await api.get('/art_m', { 
      params: addApiKey(params) 
    });
    return response.data;
  },

  getFormasPago: async () => {
    const response = await api.get('/fpg_m', { 
      params: addApiKey() 
    });
    return response.data;
  },

  getUsuarios: async () => {
    const response = await api.get('/usr_m', { 
      params: addApiKey() 
    });
    return response.data;
  },

  getFamilias: async () => {
    const response = await api.get('/fam_m', { 
      params: addApiKey() 
    });
    return response.data;
  },

  getProveedores: async () => {
    const response = await api.get('/ent_m', { 
      params: addApiKey({ es_prv: true }) 
    });
    return response.data;
  },
  
  // === CONSULTAS COMBINADAS ===
  getVentasCompletas: async (filtros = {}) => {
    try {
      console.log('🔄 Obteniendo datos de Velneo...');
      
      // Preparar filtros con API key
      const filtrosConApi = addApiKey(filtros);
      
      const [facturas, lineas, articulos, formasPago, usuarios, familias] = 
        await Promise.allSettled([
          api.get('/fac_t', { params: addApiKey({ fin: true, ...filtros }) }),
          api.get('/fac_lin_t', { params: filtrosConApi }),
          api.get('/art_m', { params: addApiKey() }),
          api.get('/fpg_m', { params: addApiKey() }),
          api.get('/usr_m', { params: addApiKey() }),
          api.get('/fam_m', { params: addApiKey() })
        ]);
      
      // Procesar respuestas según el formato de Velneo
      const resultado = {
        facturas: facturas.status === 'fulfilled' ? (facturas.value.data.fac_t || []) : [],
        lineas: lineas.status === 'fulfilled' ? (lineas.value.data.fac_lin_t || []) : [],
        articulos: articulos.status === 'fulfilled' ? (articulos.value.data.art_m || []) : [],
        formasPago: formasPago.status === 'fulfilled' ? (formasPago.value.data.fpg_m || []) : [],
        usuarios: usuarios.status === 'fulfilled' ? (usuarios.value.data.usr_m || []) : [],
        familias: familias.status === 'fulfilled' ? (familias.value.data.fam_m || []) : [],
        metadata: {
          count: facturas.status === 'fulfilled' ? facturas.value.data.count : 0,
          total_count: facturas.status === 'fulfilled' ? facturas.value.data.total_count : 0
        }
      };

      // Log de resultados para debugging
      console.log('✅ Datos obtenidos:', {
        facturas: resultado.facturas?.length || 0,
        lineas: resultado.lineas?.length || 0,
        articulos: resultado.articulos?.length || 0,
        formasPago: resultado.formasPago?.length || 0,
        usuarios: resultado.usuarios?.length || 0,
        familias: resultado.familias?.length || 0,
        total_registros: resultado.metadata.total_count
      });

      // Log de errores si los hay
      [facturas, lineas, articulos, formasPago, usuarios, familias].forEach((result, index) => {
        const tables = ['facturas', 'lineas', 'articulos', 'formasPago', 'usuarios', 'familias'];
        if (result.status === 'rejected') {
          console.warn(`⚠️ Error obteniendo ${tables[index]}:`, result.reason.message);
        }
      });

      return resultado;
    } catch (error) {
      console.error('❌ Error obteniendo datos completos:', error);
      throw error;
    }
  },

  // === CONSULTAS ESPECÍFICAS ===
  getVentasPorFecha: async (fechaInicio, fechaFin) => {
    const response = await api.get('/fac_t', {
      params: addApiKey({
        fch_desde: fechaInicio,
        fch_hasta: fechaFin,
        fin: true
      })
    });
    return response.data;
  },

  getVentasPorVendedor: async (vendedorId) => {
    const response = await api.get('/fac_t', {
      params: addApiKey({
        alt_usr: vendedorId,
        fin: true
      })
    });
    return response.data;
  },

  getArticulosPorFamilia: async (familiaId) => {
    const response = await api.get('/art_m', {
      params: addApiKey({
        fam: familiaId
      })
    });
    return response.data;
  },

  // === UTILIDADES DE DEBUG ===
  // Obtener información de la API
  getApiInfo: async () => {
    try {
      const response = await api.get('/info', { 
        params: addApiKey() 
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo info de API:', error);
      return null;
    }
  },

  // Listar todas las tablas disponibles
  getAvailableTables: async () => {
    try {
      const response = await api.get('/tables', { 
        params: addApiKey() 
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tablas disponibles:', error);
      return [];
    }
  }
};

export default velneoAPI;