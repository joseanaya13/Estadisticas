// src/hooks/useSalesDataServerFilters.js
import { useQuery } from '@tanstack/react-query';
import { velneoAPI, migrarAFiltrosServidor } from '../services/velneoAPI';
import { transformSalesData } from '../utils/dataTransform';

// Hook principal para datos de ventas con filtros del servidor
export const useSalesDataServerFilters = (filters = {}) => {
  return useQuery({
    queryKey: ['sales-data-server-filtered', filters],
    queryFn: async () => {
      console.log('🚀 Cargando datos con filtros del servidor...');
      console.log('Filtros aplicados:', filters);
      
      // Migrar filtros al formato del servidor
      const serverFilters = migrarAFiltrosServidor(filters);
      
      // Obtener datos con filtros del servidor
      const rawData = await velneoAPI.getVentasCompletasConFiltros(serverFilters);
      
      // Transformar datos (sin filtrado adicional, ya filtrados por servidor)
      const transformedData = transformSalesData(rawData);
      
      console.log('✅ Datos cargados y transformados:', {
        facturas: rawData.facturas?.length,
        lineas: rawData.lineas?.length,
        ventasCompletas: transformedData.ventasCompletas?.length,
        loadTime: rawData.metadata?.loadTime,
        filtrosAplicados: rawData.metadata?.filtrosAplicados
      });
      
      return {
        ...transformedData,
        metadata: rawData.metadata
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (menos tiempo porque datos más específicos)
    retry: 2,
    enabled: true,
  });
};

// Hook para métricas del dashboard con filtros del servidor
export const useDashboardMetricsServerFilters = (dateRange, additionalFilters = {}) => {
  return useQuery({
    queryKey: ['dashboard-metrics-server-filtered', dateRange, additionalFilters],
    queryFn: async () => {
      const filters = {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true,
        ...additionalFilters
      };
      
      // Obtener datos filtrados desde servidor
      const rawData = await velneoAPI.getVentasCompletasConFiltros(filters);
      
      return calculateDashboardMetrics(rawData);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para ventas por familia con filtros del servidor
export const useSalesByFamilyServerFilters = (dateRange, familiaId = null) => {
  return useQuery({
    queryKey: ['sales-by-family-server-filtered', dateRange, familiaId],
    queryFn: async () => {
      const filters = {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true,
        ...(familiaId && { familiaId })
      };
      
      const rawData = await velneoAPI.getVentasCompletasConFiltros(filters);
      return groupSalesByFamily(rawData);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para ventas por vendedor con filtros del servidor
export const useSalesByVendorServerFilters = (dateRange, vendedorId = null) => {
  return useQuery({
    queryKey: ['sales-by-vendor-server-filtered', dateRange, vendedorId],
    queryFn: async () => {
      const filters = {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true,
        ...(vendedorId && { vendedorId })
      };
      
      const rawData = await velneoAPI.getVentasCompletasConFiltros(filters);
      return groupSalesByVendor(rawData);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para productos más vendidos con filtros del servidor
export const useTopProductsServerFilters = (dateRange, limit = 10) => {
  return useQuery({
    queryKey: ['top-products-server-filtered', dateRange, limit],
    queryFn: async () => {
      const filters = {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true
      };
      
      const rawData = await velneoAPI.getVentasCompletasConFiltros(filters);
      return getTopProducts(rawData, limit);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para búsqueda de artículos con filtros del servidor
export const useArticulosSearch = (searchTerm, filters = {}) => {
  return useQuery({
    queryKey: ['articulos-search', searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return { art_m: [] };
      }
      
      return await velneoAPI.buscarArticulos(searchTerm, filters);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(searchTerm && searchTerm.length >= 2),
  });
};

// Hook para diagnóstico de rendimiento y filtros
export const useApiDiagnostics = () => {
  return useQuery({
    queryKey: ['api-diagnostics'],
    queryFn: async () => {
      const [connection, filters] = await Promise.all([
        velneoAPI.testConnection(),
        velneoAPI.diagnosticarFiltros()
      ]);
      
      return {
        connection,
        filters,
        timestamp: new Date().toISOString()
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    retry: 1,
  });
};

// Hook para comparar rendimiento entre filtros locales y del servidor
export const usePerformanceComparison = (filters = {}) => {
  const serverFiltersQuery = useSalesDataServerFilters(filters);
  
  // Solo para pruebas - obtener todos los datos y filtrar localmente
  const localFiltersQuery = useQuery({
    queryKey: ['performance-comparison-local', filters],
    queryFn: async () => {
      const startTime = Date.now();
      
      // Obtener TODOS los datos
      const rawData = await velneoAPI.getVentasCompletas();
      const loadTime = Date.now() - startTime;
      
      // Aplicar filtros localmente (simulando el método anterior)
      const filteredData = filterVentasDataLocal(rawData, filters);
      const filterTime = Date.now() - startTime - loadTime;
      
      return {
        data: transformSalesData(filteredData),
        timing: {
          loadTime,
          filterTime,
          totalTime: Date.now() - startTime
        }
      };
    },
    enabled: false, // Solo ejecutar manualmente para comparaciones
    staleTime: Infinity
  });
  
  return {
    serverFilters: serverFiltersQuery,
    localFilters: localFiltersQuery,
    runComparison: () => {
      localFiltersQuery.refetch();
    },
    getPerformanceReport: () => {
      if (!serverFiltersQuery.data || !localFiltersQuery.data) return null;
      
      const serverTime = serverFiltersQuery.data.metadata?.loadTime || 0;
      const localTime = localFiltersQuery.data.timing?.totalTime || 0;
      
      return {
        serverTime: serverTime * 1000, // convertir a ms
        localTime,
        improvement: localTime > 0 ? ((localTime - serverTime * 1000) / localTime * 100).toFixed(1) : 0,
        recommendation: serverTime * 1000 < localTime ? 'server' : 'local'
      };
    }
  };
};

// Funciones auxiliares (mantener compatibilidad)
const calculateDashboardMetrics = (data) => {
  const { facturas, lineas } = data;
  
  if (!facturas?.length || !lineas?.length) {
    return {
      ventasTotales: 0,
      beneficioTotal: 0,
      numeroTransacciones: 0,
      ticketMedio: 0,
      margenPorcentaje: 0,
      pesoTotalVendido: 0,
      articulosVendidos: 0
    };
  }

  const ventasTotales = facturas.reduce((sum, f) => sum + (f.tot || 0), 0);
  
  // BENEFICIO CALCULADO CORRECTAMENTE: imp_pvp - cos
  const beneficioTotal = lineas.reduce((sum, l) => {
    const beneficioReal = (l.imp_pvp || 0) - (l.cos || 0);
    return sum + beneficioReal;
  }, 0);
  
  const numeroTransacciones = facturas.length;
  const ticketMedio = numeroTransacciones > 0 ? ventasTotales / numeroTransacciones : 0;
  const margenPorcentaje = ventasTotales > 0 ? (beneficioTotal / ventasTotales) * 100 : 0;
  const articulosVendidos = lineas.reduce((sum, l) => sum + (l.can || 0), 0);
  
  // Calcular peso total (necesita datos de artículos)
  const pesoTotalVendido = lineas.reduce((sum, linea) => {
    const pesoArticulo = data.articulos?.find(a => a.id === linea.art)?.peso || 0;
    return sum + (pesoArticulo * (linea.can || 0));
  }, 0);

  return {
    ventasTotales,
    beneficioTotal,
    numeroTransacciones,
    ticketMedio,
    margenPorcentaje,
    pesoTotalVendido,
    articulosVendidos
  };
};

const groupSalesByFamily = (data) => {
  const { lineas, familias } = data;
  
  if (!lineas?.length) return [];
  
  const groupedData = lineas.reduce((acc, linea) => {
    const familiaId = linea.fam;
    const familia = familias?.find(f => f.id === familiaId);
    const familiaName = familia?.name || `Familia ${familiaId}`;
    
    if (!acc[familiaId]) {
      acc[familiaId] = {
        familiaId,
        familiaName,
        ventasTotales: 0,
        beneficioTotal: 0,
        cantidadVendida: 0,
        numeroLineas: 0
      };
    }
    
    acc[familiaId].ventasTotales += linea.imp_pvp || 0;
    acc[familiaId].beneficioTotal += ((linea.imp_pvp || 0) - (linea.cos || 0));
    acc[familiaId].cantidadVendida += linea.can || 0;
    acc[familiaId].numeroLineas += 1;
    
    return acc;
  }, {});
  
  return Object.values(groupedData).sort((a, b) => b.ventasTotales - a.ventasTotales);
};

const groupSalesByVendor = (data) => {
  const { facturas, usuarios, lineas } = data;
  
  if (!facturas?.length) return [];
  
  const groupedData = facturas.reduce((acc, factura) => {
    const vendedorId = factura.alt_usr;
    const vendedor = usuarios?.find(u => u.id === vendedorId);
    const vendedorName = vendedor?.name || `Vendedor ${vendedorId}`;
    
    if (!acc[vendedorId]) {
      acc[vendedorId] = {
        vendedorId,
        vendedorName,
        ventasTotales: 0,
        numeroFacturas: 0,
        ticketMedio: 0,
        beneficioTotal: 0
      };
    }
    
    acc[vendedorId].ventasTotales += factura.tot || 0;
    acc[vendedorId].numeroFacturas += 1;
    
    // Calcular beneficio de las líneas de esta factura
    const lineasFactura = lineas?.filter(l => l.fac === factura.id) || [];
    const beneficioFactura = lineasFactura.reduce((sum, linea) => {
      return sum + ((linea.imp_pvp || 0) - (linea.cos || 0));
    }, 0);
    acc[vendedorId].beneficioTotal += beneficioFactura;
    
    return acc;
  }, {});
  
  // Calcular ticket medio
  Object.values(groupedData).forEach(vendedor => {
    vendedor.ticketMedio = vendedor.numeroFacturas > 0 
      ? vendedor.ventasTotales / vendedor.numeroFacturas 
      : 0;
  });
  
  return Object.values(groupedData).sort((a, b) => b.ventasTotales - a.ventasTotales);
};

const getTopProducts = (data, limit) => {
  const { lineas, articulos } = data;
  
  if (!lineas?.length) return [];
  
  const productSales = lineas.reduce((acc, linea) => {
    const articuloId = linea.art;
    const articulo = articulos?.find(a => a.id === articuloId);
    
    if (!acc[articuloId]) {
      acc[articuloId] = {
        articuloId,
        nombre: articulo?.name || linea.name || `Artículo ${articuloId}`,
        referencia: articulo?.ref || '',
        ventasTotales: 0,
        cantidadVendida: 0,
        beneficioTotal: 0,
        numeroVentas: 0
      };
    }
    
    acc[articuloId].ventasTotales += linea.imp_pvp || 0;
    acc[articuloId].cantidadVendida += linea.can || 0;
    acc[articuloId].beneficioTotal += ((linea.imp_pvp || 0) - (linea.cos || 0));
    acc[articuloId].numeroVentas += 1;
    
    return acc;
  }, {});
  
  return Object.values(productSales)
    .sort((a, b) => b.ventasTotales - a.ventasTotales)
    .slice(0, limit);
};

// Función auxiliar para filtros locales (solo para comparación)
const filterVentasDataLocal = (data, filtros = {}) => {
  if (!data || !data.facturas || !data.lineas) {
    return data;
  }
  
  let facturasFiltradas = [...data.facturas];
  let lineasFiltradas = [...data.lineas];
  
  // Aplicar filtros básicos de fecha
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
  
  // Filtrar líneas correspondientes
  const idsFacturasFiltradas = new Set(facturasFiltradas.map(f => f.id));
  lineasFiltradas = lineasFiltradas.filter(l => idsFacturasFiltradas.has(l.fac));
  
  return {
    ...data,
    facturas: facturasFiltradas,
    lineas: lineasFiltradas
  };
};