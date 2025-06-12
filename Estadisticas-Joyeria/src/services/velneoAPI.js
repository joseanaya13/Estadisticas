import axios from 'axios';

// Configuración base de la API
const api = axios.create({
  baseURL: import.meta.env.VITE_VELNEO_API_URL,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_VELNEO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error);
    if (error.response?.status === 401) {
      console.error('Error de autenticación. Verifica tu API key.');
    }
    return Promise.reject(error);
  }
);

export const velneoAPI = {
  // === FACTURAS ===
  getFacturas: (params = {}) => api.get('/fac_t', { params }),
  getLineasFactura: (params = {}) => api.get('/fac_lin_t', { params }),
  
  // === MAESTROS ===
  getArticulos: (params = {}) => api.get('/art_m', { params }),
  getFormasPago: () => api.get('/fpg_m'),
  getUsuarios: () => api.get('/usr_m'),
  getFamilias: () => api.get('/fam_m'),
  getProveedores: () => api.get('/ent_m?es_prv=true'),
  
  // === CONSULTAS COMBINADAS ===
  getVentasCompletas: async (filtros = {}) => {
    try {
      const [facturas, lineas, articulos, formasPago, usuarios, familias] = 
        await Promise.all([
          api.get('/fac_t', { params: { fin: true, ...filtros } }),
          api.get('/fac_lin_t'),
          api.get('/art_m'),
          api.get('/fpg_m'),
          api.get('/usr_m'),
          api.get('/fam_m')
        ]);
      
      return {
        facturas: facturas.data.fac_t || [],
        lineas: lineas.data.fac_lin_t || [],
        articulos: articulos.data.art_m || [],
        formasPago: formasPago.data.fpg_m || [],
        usuarios: usuarios.data.usr_m || [],
        familias: familias.data.fam_m || []
      };
    } catch (error) {
      console.error('Error obteniendo datos completos:', error);
      throw error;
    }
  },

  // === CONSULTAS ESPECÍFICAS ===
  getVentasPorFecha: async (fechaInicio, fechaFin) => {
    return api.get('/fac_t', {
      params: {
        fch_desde: fechaInicio,
        fch_hasta: fechaFin,
        fin: true
      }
    });
  },

  getVentasPorVendedor: async (vendedorId) => {
    return api.get('/fac_t', {
      params: {
        alt_usr: vendedorId,
        fin: true
      }
    });
  },

  getArticulosPorFamilia: async (familiaId) => {
    return api.get('/art_m', {
      params: {
        fam: familiaId
      }
    });
  }
};

export default velneoAPI;