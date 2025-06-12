import { useQuery } from '@tanstack/react-query';
import { velneoAPI } from '../services/velneoAPI';
import { transformSalesData } from '../utils/dataTransform';

// Hook principal para datos de ventas
export const useSalesData = (filters = {}) => {
  return useQuery({
    queryKey: ['sales-data', filters],
    queryFn: async () => {
      const data = await velneoAPI.getVentasCompletas(filters);
      return transformSalesData(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    enabled: true,
  });
};

// Hook para métricas del dashboard
export const useDashboardMetrics = (dateRange) => {
  return useQuery({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: async () => {
      const data = await velneoAPI.getVentasCompletas({
        fch_desde: dateRange.from,
        fch_hasta: dateRange.to
      });
      return calculateDashboardMetrics(data);
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para ventas por familia
export const useSalesByFamily = (dateRange) => {
  return useQuery({
    queryKey: ['sales-by-family', dateRange],
    queryFn: async () => {
      const data = await velneoAPI.getVentasCompletas({
        fch_desde: dateRange.from,
        fch_hasta: dateRange.to
      });
      return groupSalesByFamily(data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para ventas por vendedor
export const useSalesByVendor = (dateRange) => {
  return useQuery({
    queryKey: ['sales-by-vendor', dateRange],
    queryFn: async () => {
      const data = await velneoAPI.getVentasCompletas({
        fch_desde: dateRange.from,
        fch_hasta: dateRange.to
      });
      return groupSalesByVendor(data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Hook para productos más vendidos
export const useTopProducts = (dateRange, limit = 10) => {
  return useQuery({
    queryKey: ['top-products', dateRange, limit],
    queryFn: async () => {
      const data = await velneoAPI.getVentasCompletas({
        fch_desde: dateRange.from,
        fch_hasta: dateRange.to
      });
      return getTopProducts(data, limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!(dateRange.from && dateRange.to),
  });
};

// Funciones auxiliares
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
  const beneficioTotal = lineas.reduce((sum, l) => {
    // Calcular beneficio correctamente: imp_pvp - cos
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
    acc[familiaId].beneficioTotal += ((linea.imp_pvp || 0) - (linea.cos || 0)); // Beneficio calculado
    acc[familiaId].cantidadVendida += linea.can || 0;
    acc[familiaId].numeroLineas += 1;
    
    return acc;
  }, {});
  
  return Object.values(groupedData).sort((a, b) => b.ventasTotales - a.ventasTotales);
};

const groupSalesByVendor = (data) => {
  const { facturas, usuarios } = data;
  
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
        ticketMedio: 0
      };
    }
    
    acc[vendedorId].ventasTotales += factura.tot || 0;
    acc[vendedorId].numeroFacturas += 1;
    
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
    acc[articuloId].beneficioTotal += ((linea.imp_pvp || 0) - (linea.cos || 0)); // Beneficio calculado
    acc[articuloId].numeroVentas += 1;
    
    return acc;
  }, {});
  
  return Object.values(productSales)
    .sort((a, b) => b.ventasTotales - a.ventasTotales)
    .slice(0, limit);
};