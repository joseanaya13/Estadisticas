import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ConnectionTest from '../components/ConnectionTest';
import { velneoAPI } from '../services/velneoAPI';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart, Settings } from 'lucide-react';

const Dashboard = () => {
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Query para obtener datos del dashboard
  const { data: ventasData, isLoading, error } = useQuery({
    queryKey: ['ventas-dashboard', dateRange],
    queryFn: () => velneoAPI.getVentasCompletas({
      fch_desde: dateRange.from,
      fch_hasta: dateRange.to
    }),
    enabled: true,
  });

  // Calcular métricas del dashboard
  const metrics = ventasData ? calculateMetrics(ventasData) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error de Conexión</h3>
              <p className="text-gray-600 mb-4">No se pudieron cargar los datos. Verifica la configuración de la API.</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Joyería Rosi</h1>
            <p className="text-gray-600">Análisis de ventas del {formatDate(dateRange.from)} al {formatDate(dateRange.to)}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowConnectionTest(!showConnectionTest)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showConnectionTest ? 'Ocultar' : 'Probar'} Conexión
          </Button>
        </div>

        {/* Prueba de conexión */}
        {showConnectionTest && (
          <div className="mb-8">
            <ConnectionTest />
          </div>
        )}

        {/* Filtros de fecha */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <Button onClick={() => window.location.reload()}>
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <MetricCard
              title="Ventas Totales"
              value={formatCurrency(metrics.ventasTotales)}
              icon={<DollarSign className="h-6 w-6" />}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <MetricCard
              title="Beneficio"
              value={formatCurrency(metrics.beneficioTotal)}
              icon={<TrendingUp className="h-6 w-6" />}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <MetricCard
              title="Transacciones"
              value={metrics.numeroTransacciones.toLocaleString()}
              icon={<ShoppingCart className="h-6 w-6" />}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <MetricCard
              title="Ticket Medio"
              value={formatCurrency(metrics.ticketMedio)}
              icon={<Package className="h-6 w-6" />}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
            <MetricCard
              title="Margen %"
              value={`${metrics.margenPorcentaje.toFixed(1)}%`}
              icon={<Users className="h-6 w-6" />}
              color="text-indigo-600"
              bgColor="bg-indigo-50"
            />
          </div>
        )}

        {/* Información de estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">API de Velneo</span>
                <span className="text-green-600 text-sm">Conectado</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">Datos cargados</span>
                <span className="text-blue-600 text-sm">
                  {metrics ? 
                    `${metrics.numeroTransacciones} facturas (${metrics.totalRegistros} total)` : 
                    'Cargando...'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gold-50 rounded-lg">
                <span className="text-gold-800 font-medium">Última actualización</span>
                <span className="text-gold-600 text-sm">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Componente para las tarjetas de métricas
const MetricCard = ({ title, value, icon, color, bgColor }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${bgColor} ${color}`}>
        {icon}
      </div>
    </div>
  </Card>
);

// Función para calcular métricas
const calculateMetrics = (data) => {
  const { facturas, lineas } = data;
  
  if (!facturas || !lineas || facturas.length === 0) {
    return {
      ventasTotales: 0,
      beneficioTotal: 0,
      numeroTransacciones: 0,
      ticketMedio: 0,
      margenPorcentaje: 0,
      totalRegistros: data?.metadata?.total_count || 0
    };
  }

  const ventasTotales = facturas.reduce((sum, factura) => sum + (factura.tot || 0), 0);
  const beneficioTotal = lineas.reduce((sum, linea) => sum + (linea.ben || 0), 0);
  const numeroTransacciones = facturas.length;
  const ticketMedio = numeroTransacciones > 0 ? ventasTotales / numeroTransacciones : 0;
  const margenPorcentaje = ventasTotales > 0 ? (beneficioTotal / ventasTotales) * 100 : 0;

  return {
    ventasTotales,
    beneficioTotal,
    numeroTransacciones,
    ticketMedio,
    margenPorcentaje,
    totalRegistros: data?.metadata?.total_count || numeroTransacciones
  };
};

export default Dashboard;