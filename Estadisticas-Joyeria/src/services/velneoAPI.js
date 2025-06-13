import axios from 'axios';

// Configuración base de la API
const api = axios.create({
  baseURL: import.meta.env.VITE_VELNEO_API_URL,
  timeout: 60000, // 60 segundos para consultas grandes
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

// Función para construir URL con API key
const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, api.defaults.baseURL);
  url.searchParams.append('api_key', import.meta.env.VITE_VELNEO_API_KEY);
  
  // Agregar parámetros adicionales
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.pathname + url.search;
};

// Función genérica para obtener TODOS los registros con paginación automática
const getAllRecords = async (endpoint, recordKey, fields = null, maxRecords = 50000) => {
  console.log(`🔄 Obteniendo TODOS los registros de ${endpoint}...`);
  
  let todosLosRegistros = [];
  let offset = 0;
  const limit = 1000; // Tamaño de página óptimo
  let totalCount = 0;
  let pageCount = 0;
  
  try {
    do {
      pageCount++;
      const params = {
        limit,
        offset,
        ...(fields && { fields: Array.isArray(fields) ? fields.join(',') : fields })
      };
      
      const url = buildUrl(endpoint, params);
      console.log(`📄 Página ${pageCount}: ${url}`);
      
      const response = await api.get(url);
      const registros = response.data[recordKey] || [];
      
      // Añadir registros de esta página
      todosLosRegistros = [...todosLosRegistros, ...registros];
      
      // Actualizar contadores
      totalCount = response.data.total_count || 0;
      offset += limit;
      
      console.log(`✅ Página ${pageCount}: ${registros.length} registros (acumulado: ${todosLosRegistros.length}/${totalCount})`);
      
      // Protección contra bucles infinitos
      if (todosLosRegistros.length >= maxRecords) {
        console.warn(`⚠️ Límite máximo alcanzado: ${maxRecords} registros`);
        break;
      }
      
      // Continuar mientras tengamos más registros por obtener
    } while (offset < totalCount && todosLosRegistros.length < totalCount);
    
    console.log(`✅ ${endpoint} COMPLETO:`, {
      obtenidos: todosLosRegistros.length,
      total: totalCount,
      paginas: pageCount,
      completo: todosLosRegistros.length === totalCount
    });
    
    return {
      [recordKey]: todosLosRegistros,
      count: todosLosRegistros.length,
      total_count: totalCount,
      pages_fetched: pageCount,
      complete: todosLosRegistros.length === totalCount
    };
    
  } catch (error) {
    console.error(`❌ Error obteniendo ${endpoint}:`, error);
    throw error;
  }
};

export const velneoAPI = {
  // === OBTENER TODOS LOS REGISTROS CON PAGINACIÓN COMPLETA ===
  
  getFacturas: async (fields = null) => {
    return await getAllRecords('/fac_t', 'fac_t', fields);
  },
  
  getLineasFactura: async (fields = null) => {
    return await getAllRecords('/fac_lin_t', 'fac_lin_t', fields);
  },
  
  getArticulos: async (fields = null) => {
    return await getAllRecords('/art_m', 'art_m', fields);
  },
  
  getFormasPago: async (fields = null) => {
    return await getAllRecords('/fpg_m', 'fpg_m', fields);
  },
  
  getUsuarios: async (fields = null) => {
    return await getAllRecords('/usr_m', 'usr_m', fields);
  },
  
  getFamilias: async (fields = null) => {
    return await getAllRecords('/fam_m', 'fam_m', fields);
  },
  
  getProveedores: async (fields = null) => {
    return await getAllRecords('/ent_m', 'ent_m', fields);
  },
  
  // === OBTENER DATOS ESPECÍFICOS PARA VENTAS CON PAGINACIÓN COMPLETA ===
  getVentasCompletas: async () => {
    try {
      console.log('🚀 Iniciando carga COMPLETA de datos de ventas...');
      const startTime = Date.now();
      
      // Campos específicos basados en la respuesta real de la API
      const facturasFields = ['id', 'emp', 'emp_div', 'fch', 'hor', 'eje', 'num_fac', 'clt', 'fpg', 'trm_tpv', 'bas_tot', 'iva_tot', 'tot', 'fin', 'alt_usr'];
      const lineasFields = ['id', 'fac', 'fam', 'art', 'name', 'can', 'pre_pvp', 'cos', 'imp_pvp', 'ben', 'prv', 'tll_bak', 'col_bak'];
      const articulosFields = ['id', 'name', 'fam', 'prv', 'ref', 'exs', 'pvp', 'cos', 'peso'];
      
      // Obtener todas las tablas en paralelo CON PAGINACIÓN COMPLETA
      console.log('📊 Cargando tablas principales con paginación completa...');
      const [facturas, lineas, articulos] = await Promise.all([
        velneoAPI.getFacturas(facturasFields),
        velneoAPI.getLineasFactura(lineasFields),
        velneoAPI.getArticulos(articulosFields)
      ]);
      
      console.log('📊 Cargando tablas de referencia con paginación completa...');
      const [formasPago, usuarios, familias, proveedores] = await Promise.all([
        velneoAPI.getFormasPago(['id', 'name']),
        velneoAPI.getUsuarios(['id', 'name']),
        velneoAPI.getFamilias(['id', 'name']),
        velneoAPI.getProveedores(['id', 'name', 'es_prv'])
      ]);
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      
      // Estadísticas finales
      const stats = {
        facturas: {
          obtenidas: facturas?.fac_t?.length || 0,
          total: facturas?.total_count || 0,
          completas: facturas?.complete || false
        },
        lineas: {
          obtenidas: lineas?.fac_lin_t?.length || 0,
          total: lineas?.total_count || 0,
          completas: lineas?.complete || false
        },
        articulos: {
          obtenidas: articulos?.art_m?.length || 0,
          total: articulos?.total_count || 0,
          completas: articulos?.complete || false
        },
        loadTime: loadTime
      };
      
      console.log('🎉 CARGA COMPLETA FINALIZADA:', stats);
      
      // Verificar integridad de datos
      const facturasConLineas = lineas?.fac_lin_t?.filter(l => 
        facturas?.fac_t?.some(f => f.id === l.fac)
      ).length || 0;
      
      const lineasConArticulos = lineas?.fac_lin_t?.filter(l => 
        articulos?.art_m?.some(a => a.id === l.art)
      ).length || 0;
      
      console.log('🔗 Integridad relacional:', {
        lineasConFactura: `${facturasConLineas}/${lineas?.fac_lin_t?.length || 0}`,
        lineasConArticulo: `${lineasConArticulos}/${lineas?.fac_lin_t?.length || 0}`
      });
      
      // Verificar artículos con peso
      const articulosConPeso = articulos?.art_m?.filter(a => a.peso && a.peso > 0).length || 0;
      console.log('⚖️ Artículos con peso:', `${articulosConPeso}/${articulos?.art_m?.length || 0}`);
      
      return {
        facturas: facturas?.fac_t || [],
        lineas: lineas?.fac_lin_t || [],
        articulos: articulos?.art_m || [],
        formasPago: formasPago?.fpg_m || [],
        usuarios: usuarios?.usr_m || [],
        familias: familias?.fam_m || [],
        proveedores: proveedores?.ent_m || [],
        
        // Metadatos de carga
        metadata: {
          loadTime,
          stats,
          timestamp: new Date().toISOString(),
          complete: stats.facturas.completas && stats.lineas.completas && stats.articulos.completas
        }
      };
      
    } catch (error) {
      console.error('❌ Error en carga completa:', error);
      throw new Error(`Error cargando datos: ${error.message}`);
    }
  },
  
  // === MÉTODO DE PRUEBA Y DIAGNÓSTICO ===
  testConnection: async () => {
    try {
      console.log('🔍 Probando conexión...');
      console.log('URL:', import.meta.env.VITE_VELNEO_API_URL);
      console.log('API Key:', import.meta.env.VITE_VELNEO_API_KEY ? '✓ Configurada' : '❌ No configurada');
      
      const url = buildUrl('/usr_m', { limit: 5 });
      const response = await api.get(url);
      
      return {
        success: true,
        data: response.data,
        message: 'Conexión exitosa',
        recordCount: response.data?.usr_m?.length || 0,
        totalRecords: response.data?.total_count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error de conexión',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText
        }
      };
    }
  },
  
  // === DIAGNÓSTICO DE DATOS ===
  diagnosticarDatos: async () => {
    try {
      console.log('🔍 Ejecutando diagnóstico de datos...');
      
      // Obtener muestras pequeñas para diagnóstico
      const samples = await Promise.all([
        api.get(buildUrl('/fac_t', { limit: 10 })),
        api.get(buildUrl('/fac_lin_t', { limit: 10 })),
        api.get(buildUrl('/art_m', { limit: 10 }))
      ]);
      
      const diagnostico = {
        facturas: {
          total: samples[0].data.total_count || 0,
          muestra: samples[0].data.fac_t?.length || 0,
          campos: samples[0].data.fac_t?.[0] ? Object.keys(samples[0].data.fac_t[0]) : [],
          ejemplo: samples[0].data.fac_t?.[0] || null
        },
        lineas: {
          total: samples[1].data.total_count || 0,
          muestra: samples[1].data.fac_lin_t?.length || 0,
          campos: samples[1].data.fac_lin_t?.[0] ? Object.keys(samples[1].data.fac_lin_t[0]) : [],
          ejemplo: samples[1].data.fac_lin_t?.[0] || null
        },
        articulos: {
          total: samples[2].data.total_count || 0,
          muestra: samples[2].data.art_m?.length || 0,
          campos: samples[2].data.art_m?.[0] ? Object.keys(samples[2].data.art_m[0]) : [],
          ejemplo: samples[2].data.art_m?.[0] || null
        }
      };
      
      console.log('📊 Diagnóstico completo:', diagnostico);
      return diagnostico;
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      throw error;
    }
  }
};

// === FUNCIONES DE FILTRADO OPTIMIZADAS ===
export const filterVentasData = (data, filtros = {}) => {
  if (!data || !data.facturas || !data.lineas) {
    console.warn('⚠️ Datos incompletos para filtrar');
    return data;
  }
  
  console.log('🔍 Aplicando filtros:', filtros);
  
  let facturasFiltradas = [...data.facturas];
  let lineasFiltradas = [...data.lineas];
  
  const startCount = {
    facturas: facturasFiltradas.length,
    lineas: lineasFiltradas.length
  };
  
  // Filtrar facturas por fecha
  if (filtros.fechaDesde) {
    const fechaDesde = new Date(filtros.fechaDesde + 'T00:00:00');
    facturasFiltradas = facturasFiltradas.filter(f => {
      const fechaFactura = new Date(f.fch);
      return fechaFactura >= fechaDesde;
    });
  }
  
  if (filtros.fechaHasta) {
    const fechaHasta = new Date(filtros.fechaHasta + 'T23:59:59');
    facturasFiltradas = facturasFiltradas.filter(f => {
      const fechaFactura = new Date(f.fch);
      return fechaFactura <= fechaHasta;
    });
  }
  
  // Filtrar por vendedor
  if (filtros.vendedorId) {
    facturasFiltradas = facturasFiltradas.filter(f => 
      f.alt_usr === parseInt(filtros.vendedorId)
    );
  }
  
  // Solo facturas finalizadas por defecto
  if (filtros.soloFinalizadas !== false) {
    facturasFiltradas = facturasFiltradas.filter(f => f.fin === true);
  }
  
  // Filtrar líneas que pertenecen a facturas filtradas
  const idsFacturasFiltradas = new Set(facturasFiltradas.map(f => f.id));
  lineasFiltradas = lineasFiltradas.filter(l => idsFacturasFiltradas.has(l.fac));
  
  // Filtrar líneas por familia
  if (filtros.familiaId) {
    lineasFiltradas = lineasFiltradas.filter(l => 
      l.fam === parseInt(filtros.familiaId)
    );
  }
  
  const endCount = {
    facturas: facturasFiltradas.length,
    lineas: lineasFiltradas.length
  };
  
  console.log('✅ Filtrado completado:', {
    antes: startCount,
    despues: endCount,
    reduccion: {
      facturas: `${((1 - endCount.facturas / startCount.facturas) * 100).toFixed(1)}%`,
      lineas: `${((1 - endCount.lineas / startCount.lineas) * 100).toFixed(1)}%`
    }
  });
  
  return {
    ...data,
    facturas: facturasFiltradas,
    lineas: lineasFiltradas
  };
};

// === UTILIDADES DE MONITOREO ===
export const monitorearCarga = (callback) => {
  const interval = setInterval(() => {
    callback({
      timestamp: new Date().toISOString(),
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null
    });
  }, 1000);
  
  return () => clearInterval(interval);
};

export default velneoAPI;