// src/pages/Dashboard.jsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChartContainer, SalesLineChart, FamilyBarChart, VendorPieChart } from '../components/charts/SalesChart';
import { velneoAPI, filterVentasData } from '../services/velneoAPI';
import { formatCurrency, formatDate, formatWeight, formatNumber } from '../utils/formatters';
import { verificarBeneficios, formatearResumenInconsistencias } from '../utils/calculations';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Scale,
  Award,
  Activity,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Query para obtener datos completos
  const { 
    data: ventasData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['ventas-dashboard', dateRange],
    queryFn: async () => {
      console.log('🔄 Cargando datos del dashboard...');
      
      // Obtener TODOS los datos sin filtros
      const rawData = await velneoAPI.getVentasCompletas();
      
      // Aplicar filtros en frontend
      const filteredData = filterVentasData(rawData, {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true
      });
      
      console.log('✅ Datos filtrados:', {
        facturas: filteredData.facturas?.length,
        lineas: filteredData.lineas?.length,
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to
      });
      
      return filteredData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: true
  });

  // Calcular métricas principales
  const metrics = useMemo(() => {
    if (!ventasData?.facturas || !ventasData?.lineas) return null;
    
    return calculateDashboardMetrics(ventasData);
  }, [ventasData]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (!ventasData?.facturas || !ventasData?.lineas) return null;
    
    return {
      salesByDay: prepareSalesByDay(ventasData),
      salesByFamily: prepareSalesByFamily(ventasData),
      salesByVendor: prepareSalesByVendor(ventasData),
      topProducts: prepareTopProducts(ventasData)
    };
  }, [ventasData]);

  // Verificación de beneficios
  const verificacionBeneficios = useMemo(() => {
    if (!ventasData?.lineas) return null;
    return verificarBeneficios(ventasData.lineas);
  }, [ventasData]);

  // Manejadores
  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <LoadingDashboard />;
  }

  if (error) {
    return <ErrorDashboard error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Joyería</h1>
          <p className="text-gray-600 mt-1">
            Análisis de ventas del {formatDate(dateRange.from)} al {formatDate(dateRange.to)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            loading={isRefetching}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setDateRange({
                  from: new Date().toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0]
                })}
              >
                Hoy
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setDateRange({
                  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0]
                })}
              >
                Este Mes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificación de beneficios */}
      {verificacionBeneficios && verificacionBeneficios.incorrectos > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Verificación de Beneficios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-700">
              <p className="mb-2">{formatearResumenInconsistencias(verificacionBeneficios)}</p>
              <p className="text-sm">
                ✅ <strong>Solución aplicada:</strong> Los beneficios se calculan automáticamente como (Precio - Coste) 
                en lugar de usar los valores de la base de datos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Ventas Totales"
            value={formatCurrency(metrics.ventasTotales)}
            subtitle={`${formatNumber(metrics.numeroTransacciones)} transacciones`}
            icon={<DollarSign className="h-6 w-6" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Beneficio Total"
            value={formatCurrency(metrics.beneficioTotal)}
            subtitle={`${metrics.margenPorcentaje.toFixed(1)}% margen`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <MetricCard
            title="Ticket Medio"
            value={formatCurrency(metrics.ticketMedio)}
            subtitle={`${formatNumber(metrics.articulosVendidos)} artículos`}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <MetricCard
            title="Peso Vendido"
            value={formatWeight(metrics.pesoTotalVendido)}
            subtitle="Oro y plata"
            icon={<Scale className="h-6 w-6" />}
            color="text-gold-600"
            bgColor="bg-gold-50"
          />
          <MetricCard
            title="Productos Únicos"
            value={formatNumber(metrics.productosUnicos)}
            subtitle="Referencias vendidas"
            icon={<Package className="h-6 w-6" />}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <MetricCard
            title="Vendedores Activos"
            value={formatNumber(metrics.vendedoresActivos)}
            subtitle="Con ventas"
            icon={<Users className="h-6 w-6" />}
            color="text-pink-600"
            bgColor="bg-pink-50"
          />
        </div>
      )}

      {/* Gráficos */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer 
            title="Evolución de Ventas"
            loading={isLoading}
            error={error}
          >
            <SalesLineChart data={chartData.salesByDay} height={300} />
          </ChartContainer>

          <ChartContainer 
            title="Ventas por Familia"
            loading={isLoading}
            error={error}
          >
            <FamilyBarChart data={chartData.salesByFamily} height={300} />
          </ChartContainer>

          <ChartContainer 
            title="Distribución por Vendedor"
            loading={isLoading}
            error={error}
          >
            <VendorPieChart data={chartData.salesByVendor} height={300} />
          </ChartContainer>

          <ChartContainer 
            title="Productos Más Vendidos"
            loading={isLoading}
            error={error}
          >
            <TopProductsList products={chartData.topProducts} />
          </ChartContainer>
        </div>
      )}

      {/* Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <span className="text-green-800 font-medium">API Velneo</span>
                <div className="text-xs text-green-600">Conectado</div>
              </div>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <span className="text-blue-800 font-medium">Datos Cargados</span>
                <div className="text-xs text-blue-600">
                  {ventasData?.facturas?.length || 0} facturas, {ventasData?.lineas?.length || 0} líneas
                </div>
              </div>
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gold-50 rounded-lg">
              <div>
                <span className="text-gold-800 font-medium">Última Actualización</span>
                <div className="text-xs text-gold-600">
                  {new Date().toLocaleTimeString('es-ES')}
                </div>
              </div>
              <div className="h-2 w-2 bg-gold-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de métrica mejorado
const MetricCard = ({ title, value, subtitle, icon, color, bgColor }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-xl font-bold ${color} mb-1`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  </Card>
);

// Lista de productos top
const TopProductsList = ({ products }) => (
  <div className="space-y-3">
    {products.slice(0, 5).map((product, index) => (
      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="font-medium text-gray-900 truncate" title={product.nombre}>
            {product.nombre}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{formatNumber(product.cantidad)} uds</span>
            <span>{formatCurrency(product.beneficio)} beneficio</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">{formatCurrency(product.ventas)}</p>
          <div className="flex items-center justify-end">
            <Award className="h-3 w-3 text-gold-500 mr-1" />
            <span className="text-xs text-gold-600">#{index + 1}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Estados de carga y error
const LoadingDashboard = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
      ))}
    </div>
  </div>
);

const ErrorDashboard = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="max-w-md w-full">
      <CardContent className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar datos</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Funciones de procesamiento de datos
const calculateDashboardMetrics = (data) => {
  const { facturas, lineas, articulos, usuarios } = data;
  
  if (!facturas?.length || !lineas?.length) {
    return {
      ventasTotales: 0,
      beneficioTotal: 0,
      numeroTransacciones: 0,
      ticketMedio: 0,
      margenPorcentaje: 0,
      pesoTotalVendido: 0,
      articulosVendidos: 0,
      productosUnicos: 0,
      vendedoresActivos: 0
    };
  }

  const ventasTotales = facturas.reduce((sum, f) => sum + (f.tot || 0), 0);
  
  // Beneficio calculado correctamente
  const beneficioTotal = lineas.reduce((sum, l) => {
    return sum + ((l.imp_pvp || 0) - (l.cos || 0));
  }, 0);
  
  const numeroTransacciones = facturas.length;
  const ticketMedio = numeroTransacciones > 0 ? ventasTotales / numeroTransacciones : 0;
  const margenPorcentaje = ventasTotales > 0 ? (beneficioTotal / ventasTotales) * 100 : 0;
  const articulosVendidos = lineas.reduce((sum, l) => sum + (l.can || 0), 0);
  
  // Peso total vendido
  const pesoTotalVendido = lineas.reduce((sum, linea) => {
    const articulo = articulos?.find(a => a.id === linea.art);
    const pesoArticulo = articulo?.peso || 0;
    return sum + (pesoArticulo * (linea.can || 0));
  }, 0);

  // Productos únicos
  const productosUnicos = new Set(lineas.map(l => l.art)).size;
  
  // Vendedores activos
  const vendedoresActivos = new Set(facturas.map(f => f.alt_usr)).size;

  return {
    ventasTotales,
    beneficioTotal,
    numeroTransacciones,
    ticketMedio,
    margenPorcentaje,
    pesoTotalVendido,
    articulosVendidos,
    productosUnicos,
    vendedoresActivos
  };
};

const prepareSalesByDay = (data) => {
  const { facturas, lineas } = data;
  const salesByDay = {};
  
  facturas.forEach(factura => {
    const fecha = factura.fch.split('T')[0]; // YYYY-MM-DD
    
    if (!salesByDay[fecha]) {
      salesByDay[fecha] = {
        fecha,
        ventas: 0,
        beneficio: 0,
        transacciones: 0
      };
    }
    
    salesByDay[fecha].ventas += factura.tot || 0;
    salesByDay[fecha].transacciones += 1;
  });
  
  // Agregar beneficios
  lineas.forEach(linea => {
    const factura = facturas.find(f => f.id === linea.fac);
    if (factura) {
      const fecha = factura.fch.split('T')[0];
      if (salesByDay[fecha]) {
        salesByDay[fecha].beneficio += (linea.imp_pvp || 0) - (linea.cos || 0);
      }
    }
  });
  
  return Object.values(salesByDay).sort((a, b) => a.fecha.localeCompare(b.fecha));
};

const prepareSalesByFamily = (data) => {
  const { lineas, familias } = data;
  const familiasMap = new Map(familias?.map(f => [f.id, f.name]) || []);
  const salesByFamily = {};
  
  lineas.forEach(linea => {
    const familiaId = linea.fam;
    const familiaName = familiasMap.get(familiaId) || `Familia ${familiaId}`;
    
    if (!salesByFamily[familiaId]) {
      salesByFamily[familiaId] = {
        familia: familiaName,
        ventas: 0
      };
    }
    
    salesByFamily[familiaId].ventas += linea.imp_pvp || 0;
  });
  
  return Object.values(salesByFamily).sort((a, b) => b.ventas - a.ventas);
};

const prepareSalesByVendor = (data) => {
  const { facturas, usuarios } = data;
  const usuariosMap = new Map(usuarios?.map(u => [u.id, u.name]) || []);
  const salesByVendor = {};
  
  facturas.forEach(factura => {
    const vendedorId = factura.alt_usr;
    const vendedorName = usuariosMap.get(vendedorId) || `Vendedor ${vendedorId}`;
    
    if (!salesByVendor[vendedorId]) {
      salesByVendor[vendedorId] = {
        vendedor: vendedorName,
        ventas: 0
      };
    }
    
    salesByVendor[vendedorId].ventas += factura.tot || 0;
  });
  
  return Object.values(salesByVendor).sort((a, b) => b.ventas - a.ventas);
};

const prepareTopProducts = (data) => {
  const { lineas, articulos } = data;
  const articulosMap = new Map(articulos?.map(a => [a.id, a]) || []);
  const productSales = {};
  
  lineas.forEach(linea => {
    const articuloId = linea.art;
    const articulo = articulosMap.get(articuloId);
    
    if (!productSales[articuloId]) {
      productSales[articuloId] = {
        nombre: articulo?.name || linea.name || 'Sin nombre',
        ventas: 0,
        cantidad: 0,
        beneficio: 0
      };
    }
    
    productSales[articuloId].ventas += linea.imp_pvp || 0;
    productSales[articuloId].cantidad += linea.can || 0;
    productSales[articuloId].beneficio += (linea.imp_pvp || 0) - (linea.cos || 0);
  });
  
  return Object.values(productSales).sort((a, b) => b.ventas - a.ventas);
};

export default Dashboard;