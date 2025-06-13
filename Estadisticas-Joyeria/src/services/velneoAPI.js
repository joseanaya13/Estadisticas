// src/services/velneoAPI.js
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

// Función para construir URL con API key y filtros
const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, api.defaults.baseURL);
  url.searchParams.append('api_key', import.meta.env.VITE_VELNEO_API_KEY);
  
  // Agregar parámetros adicionales
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
      } else {
        url.searchParams.append(key, value.toString());
      }
    }
  });
  
  return url.pathname + url.search;
};

// Función para construir filtros de índice de Velneo v2
const buildIndexFilters = (filters = {}) => {
  const indexParams = {};
  
  // Filtros básicos por campo
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Para filtros simples, usar el índice directo
      indexParams[`index[${key}]`] = value;
    }
  });
  
  return indexParams;
};

// Función para construir filtros filterQuery
const buildFilterQuery = (filters = {}) => {
  const filterParams = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      filterParams[`filterQuery[${key}]`] = value;
    }
  });
  
  return filterParams;
};

// Función genérica para obtener registros con filtros del servidor
const getRecordsWithServerFilters = async (
  endpoint, 
  recordKey, 
  options = {}
) => {
  const {
    fields = null,
    filters = {},
    filterType = 'index', // 'index' o 'filterQuery'
    limit = 1000,
    offset = 0,
    maxRecords = 50000,
    dateRange = null,
    onlyFinalized = true
  } = options;
  
  console.log(`🔄 Obteniendo registros de ${endpoint} con filtros del servidor...`);
  console.log('Filtros aplicados:', filters);
  
  let todosLosRegistros = [];
  let currentOffset = offset;
  let totalCount = 0;
  let pageCount = 0;
  
  try {
    do {
      pageCount++;
      
      // Construir parámetros base
      const baseParams = {
        limit,
        offset: currentOffset,
        ...(fields && { fields: Array.isArray(fields) ? fields.join(',') : fields })
      };
      
      // Agregar filtros según el tipo
      let filterParams = {};
      if (filterType === 'index') {
        filterParams = buildIndexFilters(filters);
      } else if (filterType === 'filterQuery') {
        filterParams = buildFilterQuery(filters);
      }
      
      // Filtros de fecha específicos para facturas
      if (dateRange && endpoint.includes('fac_t')) {
        if (dateRange.from) {
          filterParams['filterQuery[fch_from]'] = dateRange.from;
        }
        if (dateRange.to) {
          filterParams['filterQuery[fch_to]'] = dateRange.to;
        }
      }
      
      // Solo facturas finalizadas
      if (onlyFinalized && endpoint.includes('fac_t')) {
        filterParams['filterQuery[fin]'] = 'true';
      }
      
      const allParams = { ...baseParams, ...filterParams };
      const url = buildUrl(endpoint, allParams);
      
      console.log(`📄 Página ${pageCount}: ${url}`);
      
      const response = await api.get(url);
      const registros = response.data[recordKey] || [];
      
      // Añadir registros de esta página
      todosLosRegistros = [...todosLosRegistros, ...registros];
      
      // Actualizar contadores
      totalCount = response.data.total_count || registros.length;
      currentOffset += limit;
      
      console.log(`✅ Página ${pageCount}: ${registros.length} registros (acumulado: ${todosLosRegistros.length})`);
      
      // Protección contra bucles infinitos
      if (todosLosRegistros.length >= maxRecords) {
        console.warn(`⚠️ Límite máximo alcanzado: ${maxRecords} registros`);
        break;
      }
      
      // Si obtuvimos menos registros que el límite, hemos terminado
      if (registros.length < limit) {
        break;
      }
      
    } while (currentOffset < totalCount && todosLosRegistros.length < totalCount);
    
    console.log(`✅ ${endpoint} COMPLETO con filtros:`, {
      obtenidos: todosLosRegistros.length,
      total: totalCount,
      paginas: pageCount,
      filtros: Object.keys(filters).length
    });
    
    return {
      [recordKey]: todosLosRegistros,
      count: todosLosRegistros.length,
      total_count: totalCount,
      pages_fetched: pageCount,
      filters_applied: filters
    };
    
  } catch (error) {
    console.error(`❌ Error obteniendo ${endpoint} con filtros:`, error);
    throw error;
  }
};

export const velneoAPI = {
  // === MÉTODOS CON FILTROS DIRECTOS AL SERVIDOR ===
  
  // Obtener facturas con filtros del servidor
  getFacturasFiltered: async (filters = {}) => {
    const fields = ['id', 'emp', 'emp_div', 'fch', 'hor', 'eje', 'num_fac', 'clt', 'fpg', 'trm_tpv', 'bas_tot', 'iva_tot', 'tot', 'fin', 'alt_usr'];
    
    // Mapear filtros a campos de Velneo
    const mappedFilters = {};
    
    if (filters.fechaDesde || filters.fechaHasta) {
      // Para fechas, usar filterQuery es más efectivo
      return await getRecordsWithServerFilters('/fac_t', 'fac_t', {
        fields,
        filterType: 'filterQuery',
        dateRange: {
          from: filters.fechaDesde,
          to: filters.fechaHasta
        },
        onlyFinalized: filters.soloFinalizadas !== false
      });
    }
    
    if (filters.vendedorId) {
      mappedFilters.alt_usr = filters.vendedorId;
    }
    
    if (filters.divisionId) {
      mappedFilters.emp_div = filters.divisionId;
    }
    
    if (filters.formaPagoId) {
      mappedFilters.fpg = filters.formaPagoId;
    }
    
    // Filtro de facturas finalizadas
    if (filters.soloFinalizadas !== false) {
      mappedFilters.fin = 'true';
    }
    
    return await getRecordsWithServerFilters('/fac_t', 'fac_t', {
      fields,
      filters: mappedFilters,
      filterType: 'filterQuery'
    });
  },
  
  // Obtener líneas de factura con filtros del servidor
  getLineasFacturaFiltered: async (filters = {}) => {
    const fields = ['id', 'fac', 'fam', 'art', 'name', 'can', 'pre_pvp', 'cos', 'imp_pvp', 'ben', 'prv', 'tll_bak', 'col_bak'];
    
    const mappedFilters = {};
    
    if (filters.familiaId) {
      mappedFilters.fam = filters.familiaId;
    }
    
    if (filters.articuloId) {
      mappedFilters.art = filters.articuloId;
    }
    
    if (filters.proveedorId) {
      mappedFilters.prv = filters.proveedorId;
    }
    
    // Si tenemos IDs de facturas específicas, filtrar por ellas
    if (filters.facturasIds && filters.facturasIds.length > 0) {
      mappedFilters.fac = filters.facturasIds;
    }
    
    return await getRecordsWithServerFilters('/fac_lin_t', 'fac_lin_t', {
      fields,
      filters: mappedFilters,
      filterType: 'index'
    });
  },
  
  // Obtener artículos con filtros del servidor
  getArticulosFiltered: async (filters = {}) => {
    const fields = ['id', 'name', 'fam', 'prv', 'ref', 'exs', 'pvp', 'cos', 'peso'];
    
    const mappedFilters = {};
    
    if (filters.familiaId) {
      mappedFilters.fam = filters.familiaId;
    }
    
    if (filters.proveedorId) {
      mappedFilters.prv = filters.proveedorId;
    }
    
    if (filters.busquedaTexto) {
      // Usar búsqueda por palabras
      mappedFilters.words = filters.busquedaTexto;
    }
    
    if (filters.referencia) {
      mappedFilters.ref = filters.referencia;
    }
    
    return await getRecordsWithServerFilters('/art_m', 'art_m', {
      fields,
      filters: mappedFilters,
      filterType: 'index'  // Los artículos funcionan mejor con índices
    });
  },
  
  // === MÉTODO PRINCIPAL CON FILTROS DEL SERVIDOR ===
  getVentasCompletasConFiltros: async (filtros = {}) => {
    try {
      console.log('🚀 Iniciando carga FILTRADA de datos de ventas...');
      console.log('Filtros aplicados:', filtros);
      const startTime = Date.now();
      
      // 1. Primero obtener facturas con filtros del servidor
      console.log('📊 Cargando facturas filtradas...');
      const facturas = await velneoAPI.getFacturasFiltered({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        vendedorId: filtros.vendedorId,
        formaPagoId: filtros.formaPagoId,
        soloFinalizadas: filtros.soloFinalizadas
      });
      
      // 2. Obtener los IDs de las facturas filtradas
      const facturasIds = facturas.fac_t?.map(f => f.id) || [];
      
      if (facturasIds.length === 0) {
        console.log('⚠️ No se encontraron facturas con los filtros aplicados');
        return {
          facturas: [],
          lineas: [],
          articulos: [],
          formasPago: [],
          usuarios: [],
          familias: [],
          proveedores: [],
          metadata: {
            loadTime: (Date.now() - startTime) / 1000,
            filtrosAplicados: filtros,
            complete: true
          }
        };
      }
      
      console.log(`📊 ${facturasIds.length} facturas filtradas encontradas`);
      
      // 3. Obtener líneas solo de las facturas filtradas
      console.log('📊 Cargando líneas de facturas filtradas...');
      const lineas = await velneoAPI.getLineasFacturaFiltered({
        facturasIds: facturasIds,
        familiaId: filtros.familiaId,
        proveedorId: filtros.proveedorId
      });
      
      // 4. Obtener artículos (con filtros si se especifican)
      console.log('📊 Cargando artículos...');
      let articulos;
      if (filtros.familiaId || filtros.proveedorId || filtros.busquedaTexto) {
        articulos = await velneoAPI.getArticulosFiltered({
          familiaId: filtros.familiaId,
          proveedorId: filtros.proveedorId,
          busquedaTexto: filtros.busquedaTexto
        });
      } else {
        // Si no hay filtros específicos de artículos, obtener todos
        articulos = await velneoAPI.getArticulos();
      }
      
      // 5. Cargar tablas de referencia (sin filtros, son catálogos)
      console.log('📊 Cargando tablas de referencia...');
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
        facturas: facturas.fac_t?.length || 0,
        lineas: lineas.fac_lin_t?.length || 0,
        articulos: articulos.art_m?.length || 0,
        loadTime: loadTime,
        filtrosAplicados: filtros
      };
      
      console.log('🎉 CARGA FILTRADA FINALIZADA:', stats);
      
      return {
        facturas: facturas.fac_t || [],
        lineas: lineas.fac_lin_t || [],
        articulos: articulos.art_m || [],
        formasPago: formasPago.fpg_m || [],
        usuarios: usuarios.usr_m || [],
        familias: familias.fam_m || [],
        proveedores: proveedores.ent_m || [],
        
        // Metadatos de carga
        metadata: {
          loadTime,
          stats,
          timestamp: new Date().toISOString(),
          complete: true,
          filtrosAplicados: filtros,
          optimizacion: 'server-side-filtering'
        }
      };
      
    } catch (error) {
      console.error('❌ Error en carga filtrada:', error);
      throw new Error(`Error cargando datos filtrados: ${error.message}`);
    }
  },
  
  // === MÉTODOS ORIGINALES (SIN FILTROS) ===
  
  getFacturas: async (fields = null) => {
    return await getRecordsWithServerFilters('/fac_t', 'fac_t', { fields });
  },
  
  getLineasFactura: async (fields = null) => {
    return await getRecordsWithServerFilters('/fac_lin_t', 'fac_lin_t', { fields });
  },
  
  getArticulos: async (fields = null) => {
    return await getRecordsWithServerFilters('/art_m', 'art_m', { fields });
  },
  
  getFormasPago: async (fields = null) => {
    return await getRecordsWithServerFilters('/fpg_m', 'fpg_m', { fields });
  },
  
  getUsuarios: async (fields = null) => {
    return await getRecordsWithServerFilters('/usr_m', 'usr_m', { fields });
  },
  
  getFamilias: async (fields = null) => {
    return await getRecordsWithServerFilters('/fam_m', 'fam_m', { fields });
  },
  
  getProveedores: async (fields = null) => {
    return await getRecordsWithServerFilters('/ent_m', 'ent_m', { fields });
  },
  
  // === MÉTODO LEGACY (MANTENER COMPATIBILIDAD) ===
  getVentasCompletas: async () => {
    // Llamar al método filtrado sin filtros para mantener compatibilidad
    return await velneoAPI.getVentasCompletasConFiltros({});
  },
  
  // === BÚSQUEDAS Y FILTROS AVANZADOS ===
  
  // Búsqueda de artículos por texto
  buscarArticulos: async (texto, filtros = {}) => {
    const searchFilters = {
      busquedaTexto: texto,
      ...filtros
    };
    
    return await velneoAPI.getArticulosFiltered(searchFilters);
  },
  
  // Obtener ventas por rango de fechas optimizado
  getVentasPorFechas: async (fechaDesde, fechaHasta, filtrosAdicionales = {}) => {
    return await velneoAPI.getVentasCompletasConFiltros({
      fechaDesde,
      fechaHasta,
      soloFinalizadas: true,
      ...filtrosAdicionales
    });
  },
  
  // Obtener ventas por vendedor
  getVentasPorVendedor: async (vendedorId, fechaDesde = null, fechaHasta = null) => {
    return await velneoAPI.getVentasCompletasConFiltros({
      vendedorId,
      fechaDesde,
      fechaHasta,
      soloFinalizadas: true
    });
  },
  
  // Obtener ventas por familia de productos
  getVentasPorFamilia: async (familiaId, fechaDesde = null, fechaHasta = null) => {
    return await velneoAPI.getVentasCompletasConFiltros({
      familiaId,
      fechaDesde,
      fechaHasta,
      soloFinalizadas: true
    });
  },
  
  // === UTILIDADES Y DIAGNÓSTICO ===
  
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
  
  // Diagnóstico de filtros disponibles
  diagnosticarFiltros: async () => {
    try {
      console.log('🔍 Diagnosticando filtros disponibles...');
      
      // Probar diferentes tipos de filtros
      const pruebasFiltros = [
        {
          nombre: 'Filtro por fecha (filterQuery)',
          test: () => api.get(buildUrl('/fac_t', { 
            'filterQuery[fch_from]': '2024-01-01',
            limit: 5 
          }))
        },
        {
          nombre: 'Filtro por índice (index)',
          test: () => api.get(buildUrl('/art_m', { 
            'index[fam]': '1',
            limit: 5 
          }))
        },
        {
          nombre: 'Búsqueda por palabras',
          test: () => api.get(buildUrl('/art_m', { 
            'index[words]': 'oro',
            limit: 5 
          }))
        }
      ];
      
      const resultados = [];
      
      for (const prueba of pruebasFiltros) {
        try {
          const resultado = await prueba.test();
          resultados.push({
            nombre: prueba.nombre,
            exitoso: true,
            registros: resultado.data?.length || 0
          });
        } catch (error) {
          resultados.push({
            nombre: prueba.nombre,
            exitoso: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        pruebas: resultados,
        message: 'Diagnóstico de filtros completado'
      };
      
    } catch (error) {
      console.error('❌ Error en diagnóstico de filtros:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// === FUNCIÓN DE MIGRACIÓN ===
export const migrarAFiltrosServidor = (filtrosLocal) => {
  console.log('🔄 Migrando filtros locales a filtros de servidor...');
  
  const filtrosServidor = {};
  
  // Mapear filtros comunes
  if (filtrosLocal.fechaDesde) filtrosServidor.fechaDesde = filtrosLocal.fechaDesde;
  if (filtrosLocal.fechaHasta) filtrosServidor.fechaHasta = filtrosLocal.fechaHasta;
  if (filtrosLocal.vendedorId) filtrosServidor.vendedorId = filtrosLocal.vendedorId;
  if (filtrosLocal.familiaId) filtrosServidor.familiaId = filtrosLocal.familiaId;
  if (filtrosLocal.proveedorId) filtrosServidor.proveedorId = filtrosLocal.proveedorId;
  if (filtrosLocal.formaPagoId) filtrosServidor.formaPagoId = filtrosLocal.formaPagoId;
  if (filtrosLocal.soloFinalizadas !== undefined) filtrosServidor.soloFinalizadas = filtrosLocal.soloFinalizadas;
  
  console.log('✅ Filtros migrados:', filtrosServidor);
  return filtrosServidor;
};

export default velneoAPI;