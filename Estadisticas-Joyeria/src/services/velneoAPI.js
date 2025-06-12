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

// Función para construir parámetros de Velneo correctamente
const buildVelneoParams = (filters = {}) => {
  const params = new URLSearchParams();
  
  // API Key obligatorio
  params.append('api_key', import.meta.env.VITE_VELNEO_API_KEY);
  
  // Campos específicos si se especifican
  if (filters.fields) {
    params.append('fields', Array.isArray(filters.fields) ? filters.fields.join(',') : filters.fields);
  }
  
  // Filtros por índice (para búsquedas exactas)
  if (filters.index) {
    Object.entries(filters.index).forEach(([key, value]) => {
      params.append(`index[${key}]`, value);
    });
  }
  
  // Filtros de consulta (para filtrado adicional)
  if (filters.filterQuery) {
    Object.entries(filters.filterQuery).forEach(([key, value]) => {
      params.append(`filterQuery[${key}]`, value);
    });
  }
  
  return params;
};

export const velneoAPI = {
  // === FACTURAS ===
  getFacturas: async (filters = {}) => {
    const params = buildVelneoParams(filters);
    const response = await api.get(`/fac_t?${params.toString()}`);
    return response.data;
  },
  
  getLineasFactura: async (filters = {}) => {
    const params = buildVelneoParams(filters);
    const response = await api.get(`/fac_lin_t?${params.toString()}`);
    return response.data;
  },
  
  // === MAESTROS ===
  getArticulos: async (filters = {}) => {
    const params = buildVelneoParams(filters);
    const response = await api.get(`/art_m?${params.toString()}`);
    return response.data;
  },
  
  getFormasPago: async () => {
    const params = buildVelneoParams();
    const response = await api.get(`/fpg_m?${params.toString()}`);
    return response.data;
  },
  
  getUsuarios: async () => {
    const params = buildVelneoParams();
    const response = await api.get(`/usr_m?${params.toString()}`);
    return response.data;
  },
  
  getFamilias: async () => {
    const params = buildVelneoParams();
    const response = await api.get(`/fam_m?${params.toString()}`);
    return response.data;
  },
  
  getProveedores: async () => {
    const params = buildVelneoParams({
      filterQuery: { es_prv: true }
    });
    const response = await api.get(`/ent_m?${params.toString()}`);
    return response.data;
  },
  
  // === CONSULTAS COMBINADAS ===
  getVentasCompletas: async (filtros = {}) => {
    try {
      // Construir filtros para facturas (solo finalizadas + filtros de fecha)
      const filtrosFacturas = {
        filterQuery: {
          fin: true, // Solo facturas finalizadas
          ...(filtros.fch_desde && { fch: `>=${filtros.fch_desde}` }),
          ...(filtros.fch_hasta && { fch: `<=${filtros.fch_hasta}` }),
          ...(filtros.emp_div && { emp_div: filtros.emp_div }),
          ...(filtros.alt_usr && { alt_usr: filtros.alt_usr })
        }
      };
      
      // Obtener todas las tablas en paralelo
      const [facturas, lineas, articulos, formasPago, usuarios, familias] = 
        await Promise.all([
          velneoAPI.getFacturas(filtrosFacturas),
          velneoAPI.getLineasFactura(), // Sin filtros, lo filtraremos después
          velneoAPI.getArticulos(),
          velneoAPI.getFormasPago(),
          velneoAPI.getUsuarios(),
          velneoAPI.getFamilias()
        ]);
      
      return {
        facturas: facturas.fac_t || [],
        lineas: lineas.fac_lin_t || [],
        articulos: articulos.art_m || [],
        formasPago: formasPago.fpg_m || [],
        usuarios: usuarios.usr_m || [],
        familias: familias.fam_m || []
      };
    } catch (error) {
      console.error('Error obteniendo datos completos:', error);
      throw error;
    }
  },

  // === CONSULTAS ESPECÍFICAS CON FILTROS CORRECTOS ===
  getVentasPorFecha: async (fechaInicio, fechaFin) => {
    const filters = {
      filterQuery: {
        fin: true,
        fch: `>=${fechaInicio}`,  // Velneo puede soportar rangos así
      }
    };
    
    if (fechaFin) {
      filters.filterQuery.fch = `${fechaInicio}..${fechaFin}`; // Rango de fechas
    }
    
    return velneoAPI.getFacturas(filters);
  },

  getVentasPorVendedor: async (vendedorId) => {
    const filters = {
      filterQuery: {
        alt_usr: vendedorId,
        fin: true
      }
    };
    return velneoAPI.getFacturas(filters);
  },

  getArticulosPorFamilia: async (familiaId) => {
    const filters = {
      filterQuery: {
        fam: familiaId
      }
    };
    return velneoAPI.getArticulos(filters);
  },

  // === MÉTODO DE PRUEBA PARA VERIFICAR CONEXIÓN ===
  testConnection: async () => {
    try {
      const params = buildVelneoParams({
        fields: 'id,name',
        index: { id: '1' } // Buscar solo el primer registro
      });
      
      const response = await api.get(`/usr_m?${params.toString()}`);
      return {
        success: true,
        data: response.data,
        message: 'Conexión exitosa con Velneo API'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error de conexión con Velneo API'
      };
    }
  }
};

export default velneoAPI;