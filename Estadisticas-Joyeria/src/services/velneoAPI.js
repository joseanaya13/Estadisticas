import axios from 'axios';

// Configuración base de la API
const api = axios.create({
  baseURL: import.meta.env.VITE_VELNEO_API_URL,
  timeout: 30000, // 30 segundos para consultas grandes
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

// Función para construir URL con API key y parámetros de paginación
const buildUrl = (endpoint, fields = null, limit = null) => {
  const url = new URL(endpoint, api.defaults.baseURL);
  url.searchParams.append('api_key', import.meta.env.VITE_VELNEO_API_KEY);
  
  if (fields) {
    url.searchParams.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
  }
  
  // Intentar obtener más registros
  if (limit) {
    url.searchParams.append('limit', limit.toString());
  } else {
    // Por defecto, intentar obtener muchos registros
    url.searchParams.append('limit', '5000'); // Aumentar límite
  }
  
  return url.pathname + url.search;
};

export const velneoAPI = {
  // === OBTENER TODOS LOS DATOS SIN FILTROS ===
  getFacturas: async (fields = null, limit = null) => {
    const url = buildUrl('/fac_t', fields, limit);
    const response = await api.get(url);
    
    console.log('📄 Facturas response:', {
      count: response.data.count,
      total_count: response.data.total_count,
      records: response.data.fac_t?.length || 0,
      url: url
    });
    
    return response.data;
  },
  
  getLineasFactura: async (fields = null, limit = null) => {
    const url = buildUrl('/fac_lin_t', fields, limit);
    const response = await api.get(url);
    
    console.log('📄 Líneas response:', {
      count: response.data.count,
      total_count: response.data.total_count,
      records: response.data.fac_lin_t?.length || 0,
      url: url
    });
    
    return response.data;
  },
  
  getArticulos: async (fields = null) => {
    console.log('🔄 Obteniendo TODOS los artículos con paginación...');
    
    let todosLosArticulos = [];
    let offset = 0;
    const limit = 1000; // Tamaño de página que la API puede manejar
    let totalCount = 0;
    
    do {
      const url = buildUrl('/art_m', fields, limit);
      const urlWithOffset = url + `&offset=${offset}`;
      
      const response = await api.get(urlWithOffset);
      const articulos = response.data.art_m || [];
      
      // Añadir artículos de esta página
      todosLosArticulos = [...todosLosArticulos, ...articulos];
      
      // Actualizar contadores
      totalCount = response.data.total_count || 0;
      offset += limit;
      
      console.log(`📦 Página artículos: ${articulos.length} (total acumulado: ${todosLosArticulos.length}/${totalCount})`);
      
      // Continuar mientras tengamos más registros por obtener
    } while (offset < totalCount && todosLosArticulos.length < totalCount);
    
    // Contar artículos con peso para debug
    const articulosConPeso = todosLosArticulos.filter(a => a.peso && a.peso > 0).length;
    
    console.log('✅ Artículos COMPLETOS:', {
      obtenidos: todosLosArticulos.length,
      total: totalCount,
      articulosConPeso: articulosConPeso,
      ejemplosPeso: todosLosArticulos.filter(a => a.peso && a.peso > 0).slice(0, 3).map(a => ({ id: a.id, name: a.name, peso: a.peso }))
    });
    
    // Devolver estructura compatible
    return {
      art_m: todosLosArticulos,
      count: todosLosArticulos.length,
      total_count: totalCount
    };
  },
  
  getFormasPago: async (fields = null) => {
    const url = buildUrl('/fpg_m', fields);
    const response = await api.get(url);
    return response.data;
  },
  
  getUsuarios: async (fields = null) => {
    const url = buildUrl('/usr_m', fields);
    const response = await api.get(url);
    return response.data;
  },
  
  getFamilias: async (fields = null) => {
    const url = buildUrl('/fam_m', fields);
    const response = await api.get(url);
    return response.data;
  },
  
  getProveedores: async (fields = null) => {
    const url = buildUrl('/ent_m', fields);
    const response = await api.get(url);
    return response.data;
  },
  
  // === OBTENER TODOS LOS DATOS COMBINADOS ===
  getVentasCompletas: async () => {
    try {
      console.log('🔄 Obteniendo datos completos de Velneo...');
      
      // Obtener todas las tablas en paralelo (SIN FILTROS)
      const [facturas, lineas, articulos, formasPago, usuarios, familias, proveedores] = 
        await Promise.all([
          velneoAPI.getFacturas(),
          velneoAPI.getLineasFactura(),
          velneoAPI.getArticulos(),
          velneoAPI.getFormasPago(),
          velneoAPI.getUsuarios(),
          velneoAPI.getFamilias(),
          velneoAPI.getProveedores()
        ]);
      
      // Estadísticas de paginación
      const stats = {
        facturas: {
          obtenidas: facturas?.fac_t?.length || 0,
          total: facturas?.total_count || 0,
          paginadas: facturas?.count || 0
        },
        lineas: {
          obtenidas: lineas?.fac_lin_t?.length || 0,
          total: lineas?.total_count || 0,
          paginadas: lineas?.count || 0
        },
        articulos: {
          obtenidas: articulos?.art_m?.length || 0,
          total: articulos?.total_count || 0,
          paginadas: articulos?.count || 0
        }
      };
      
      console.log('✅ Datos obtenidos:', stats);
      
      // Verificar si hay datos paginados
      if (stats.facturas.total > stats.facturas.obtenidas) {
        console.warn('⚠️ Facturas paginadas:', `${stats.facturas.obtenidas}/${stats.facturas.total}`);
      }
      if (stats.lineas.total > stats.lineas.obtenidas) {
        console.warn('⚠️ Líneas paginadas:', `${stats.lineas.obtenidas}/${stats.lineas.total}`);
      }
      
      return {
        facturas: facturas?.fac_t || [],
        lineas: lineas?.fac_lin_t || [],
        articulos: articulos?.art_m || [],
        formasPago: formasPago?.fpg_m || [],
        usuarios: usuarios?.usr_m || [],
        familias: familias?.fam_m || [],
        proveedores: proveedores?.ent_m || [],
        
        // Metadatos de paginación
        pagination: stats
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos completos:', error);
      throw error;
    }
  },

  // === MÉTODO DE PRUEBA SIMPLE ===
  testConnection: async () => {
    try {
      console.log('🔄 Probando conexión con Velneo...');
      console.log('URL:', import.meta.env.VITE_VELNEO_API_URL);
      console.log('API Key:', import.meta.env.VITE_VELNEO_API_KEY ? '***configurada***' : 'NO configurada');
      
      const url = buildUrl('/usr_m');
      const response = await api.get(url);
      
      console.log('✅ Conexión exitosa:', {
        count: response.data.count,
        total_count: response.data.total_count,
        records: response.data.usr_m?.length || 0
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Conexión exitosa con Velneo API',
        recordCount: response.data?.usr_m?.length || 0,
        totalRecords: response.data?.total_count || 0
      };
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'Error de conexión con Velneo API',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url
        }
      };
    }
  }
};

// === FUNCIONES DE FILTRADO EN FRONTEND ===
export const filterVentasData = (data, filtros = {}) => {
  if (!data || !data.facturas || !data.lineas) return data;
  
  let facturasFiltradas = [...data.facturas];
  let lineasFiltradas = [...data.lineas];
  
  // Filtrar facturas por fecha
  if (filtros.fechaDesde) {
    const fechaDesde = new Date(filtros.fechaDesde);
    facturasFiltradas = facturasFiltradas.filter(f => {
      const fechaFactura = new Date(f.fch);
      return fechaFactura >= fechaDesde;
    });
  }
  
  if (filtros.fechaHasta) {
    const fechaHasta = new Date(filtros.fechaHasta);
    facturasFiltradas = facturasFiltradas.filter(f => {
      const fechaFactura = new Date(f.fch);
      return fechaFactura <= fechaHasta;
    });
  }
  
  // Filtrar por vendedor
  if (filtros.vendedorId) {
    facturasFiltradas = facturasFiltradas.filter(f => f.alt_usr === filtros.vendedorId);
  }
  
  // Filtrar por división
  if (filtros.division) {
    facturasFiltradas = facturasFiltradas.filter(f => f.emp_div === filtros.division);
  }
  
  // Solo facturas finalizadas
  if (filtros.soloFinalizadas !== false) {
    facturasFiltradas = facturasFiltradas.filter(f => f.fin === true);
  }
  
  // Filtrar líneas que pertenecen a las facturas filtradas
  const idsFacturasFiltradas = new Set(facturasFiltradas.map(f => f.id));
  lineasFiltradas = lineasFiltradas.filter(l => idsFacturasFiltradas.has(l.fac));
  
  // Filtrar líneas por familia
  if (filtros.familiaId) {
    lineasFiltradas = lineasFiltradas.filter(l => l.fam === filtros.familiaId);
  }
  
  return {
    ...data,
    facturas: facturasFiltradas,
    lineas: lineasFiltradas
  };
};

export default velneoAPI;