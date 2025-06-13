// src/pages/SalesServerFilters.jsx
import { useState, useMemo } from 'react';
import { SalesTable } from '../components/tables/SalesTable';
import { useSalesDataServerFilters, useApiDiagnostics, usePerformanceComparison } from '../hooks/useSalesDataServerFilters';
import { formatCurrency, formatDate, formatNumber, formatWeight } from '../utils/formatters';

import { 
  Download, 
  Filter, 
  RefreshCw, 
  Search,
  TrendingUp,
  Package,
  Database,
  BarChart3,
  Zap,
  Server,
  Wifi,
  Activity,
  Clock
} from 'lucide-react';

const SalesServerFilters = () => {
  // Estado para filtros del servidor
  const [serverFilters, setServerFilters] = useState({
    fechaDesde: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    vendedorId: '',
    familiaId: '',
    formaPagoId: '',
    proveedorId: '',
    soloFinalizadas: true
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showPerformanceComparison, setShowPerformanceComparison] = useState(false);

  // Query principal con filtros del servidor
  const { 
    data: salesData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useSalesDataServerFilters(serverFilters);

  // Diagnósticos de API
  const { data: diagnostics } = useApiDiagnostics();

  // Comparación de rendimiento
  const performanceComparison = usePerformanceComparison(serverFilters);

  // Datos procesados para la tabla
  const processedData = useMemo(() => {
    if (!salesData?.ventasCompletas?.length) return null;
    
    return {
      ventasCompletas: salesData.ventasCompletas,
      metadata: salesData.metadata,
      resumen: salesData.resumen
    };
  }, [salesData]);

  // Opciones para filtros (usar datos de catálogo)
  const filterOptions = useMemo(() => {
    if (!salesData) return { vendedores: [], familias: [], formasPago: [], proveedores: [] };
    
    // Usar datos del servidor filtrado para opciones
    const rawData = salesData._rawData || {};
    
    return {
      vendedores: rawData.usuarios?.map(u => ({ id: u.id, name: u.name })) || [],
      familias: rawData.familias?.map(f => ({ id: f.id, name: f.name })) || [],
      formasPago: rawData.formasPago?.map(f => ({ id: f.id, name: f.name })) || [],
      proveedores: rawData.proveedores?.filter(p => p.es_prv === true).map(p => ({ id: p.id, name: p.name })) || []
    };
  }, [salesData]);

  // Métricas de resumen
  const summaryMetrics = useMemo(() => {
    if (!processedData?.ventasCompletas?.length) return null;
    
    const data = processedData.ventasCompletas;
    const totalVentas = data.reduce((sum, row) => sum + row.importeTotal, 0);
    const totalBeneficio = data.reduce((sum, row) => sum + row.beneficioCalculado, 0);
    const totalPeso = data.reduce((sum, row) => sum + (row.pesoTotalLinea || 0), 0);
    const totalArticulos = data.reduce((sum, row) => sum + row.cantidad, 0);
    const transaccionesUnicas = new Set(data.map(row => row.facturaId)).size;
    
    return {
      totalVentas,
      totalBeneficio,
      totalArticulos,
      totalPeso,
      transaccionesUnicas,
      registrosProcesados: data.length,
      margenPromedio: totalVentas > 0 ? (totalBeneficio / totalVentas) * 100 : 0,
      ticketMedio: transaccionesUnicas > 0 ? totalVentas / transaccionesUnicas : 0,
      loadTime: salesData?.metadata?.loadTime || 0,
      optimizacion: salesData?.metadata?.optimizacion || 'standard'
    };
  }, [processedData, salesData]);

  // Manejadores
  const handleFilterChange = (field, value) => {
    setServerFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setServerFilters({
      fechaDesde: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      fechaHasta: new Date().toISOString().split('T')[0],
      vendedorId: '',
      familiaId: '',
      formaPagoId: '',
      proveedorId: '',
      soloFinalizadas: true
    });
  };

  const handleExport = (data) => {
    // Preparar datos para exportar
    const csvData = data.map(row => ({
      'Fecha': formatDate(row.fecha),
      'Hora': row.hora || '',
      'Factura': row.numeroFactura,
      'Vendedor': row.vendedor,
      'Proveedor': row.proveedor,
      'Artículo': row.nombreArticulo,
      'Referencia': row.referenciaArticulo,
      'Familia': row.familia,
      'Cantidad': row.cantidad,
      'Precio Unitario': row.precioUnitario.toFixed(2),
      'Total': row.importeTotal.toFixed(2),
      'Coste': row.coste.toFixed(2),
      'Beneficio': row.beneficioCalculado.toFixed(2),
      'Margen %': row.margen.toFixed(2),
      'Peso (g)': row.pesoTotalLinea || 0,
      'Forma Pago': row.formaPago
    }));
    
    // Convertir a CSV
    const csv = convertToCSV(csvData);
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_filtradas_${serverFilters.fechaDesde}_${serverFilters.fechaHasta}.csv`;
    link.click();
  };

  if (isLoading) {
    return <LoadingSales />;
  }

  if (error) {
    return <ErrorSales error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header con información de optimización */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Ventas</h1>
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              <Server className="h-3 w-3" />
              Filtros del Servidor
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-gray-600">
              {processedData?.ventasCompletas?.length || 0} registros del {formatDate(serverFilters.fechaDesde)} al {formatDate(serverFilters.fechaHasta)}
            </p>
            
            {summaryMetrics && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <Zap className="h-3 w-3" />
                  Cargado en {summaryMetrics.loadTime.toFixed(2)}s
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  <Database className="h-3 w-3" />
                  Optimización: {summaryMetrics.optimizacion}
                </span>
                {salesData?.metadata?.filtrosAplicados && Object.keys(salesData.metadata.filtrosAplicados).length > 0 && (
                  <span className="text-purple-600">
                    {Object.keys(salesData.metadata.filtrosAplicados).length} filtros activos
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      

      {/* Métricas de resumen */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Ventas Totales"
            value={formatCurrency(summaryMetrics.totalVentas)}
            subtitle={`${formatNumber(summaryMetrics.transaccionesUnicas)} facturas`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Beneficio"
            value={formatCurrency(summaryMetrics.totalBeneficio)}
            subtitle={`${summaryMetrics.margenPromedio.toFixed(1)}% margen`}
            icon={<BarChart3 className="h-5 w-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <MetricCard
            title="Ticket Medio"
            value={formatCurrency(summaryMetrics.ticketMedio)}
            subtitle="Por factura"
            icon={<Package className="h-5 w-5" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <MetricCard
            title="Artículos"
            value={formatNumber(summaryMetrics.totalArticulos)}
            subtitle="Unidades vendidas"
            icon={<Package className="h-5 w-5" />}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <MetricCard
            title="Peso Total"
            value={formatWeight(summaryMetrics.totalPeso)}
            subtitle="Oro y plata"
            icon={<Package className="h-5 w-5" />}
            color="text-gold-600"
            bgColor="bg-gold-50"
          />
          <MetricCard
            title="Tiempo Carga"
            value={`${summaryMetrics.loadTime.toFixed(2)}s`}
            subtitle="Optimizado servidor"
            icon={<Clock className="h-5 w-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
        </div>
      )}

      {/* Panel de filtros del servidor */}
      <Card className={`transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Filtros del Servidor (Optimizados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={serverFilters.fechaDesde}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={serverFilters.fechaHasta}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
            
            {/* Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendedor
              </label>
              <select
                value={serverFilters.vendedorId}
                onChange={(e) => handleFilterChange('vendedorId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Todos ({filterOptions.vendedores.length})</option>
                {filterOptions.vendedores.map(vendedor => (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Familia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Familia
              </label>
              <select
                value={serverFilters.familiaId}
                onChange={(e) => handleFilterChange('familiaId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Todas ({filterOptions.familias.length})</option>
                {filterOptions.familias.map(familia => (
                  <option key={familia.id} value={familia.id}>
                    {familia.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={serverFilters.proveedorId}
                onChange={(e) => handleFilterChange('proveedorId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Todos ({filterOptions.proveedores.length})</option>
                {filterOptions.proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Forma de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pago
              </label>
              <select
                value={serverFilters.formaPagoId}
                onChange={(e) => handleFilterChange('formaPagoId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Todas ({filterOptions.formasPago.length})</option>
                {filterOptions.formasPago.map(forma => (
                  <option key={forma.id} value={forma.id}>
                    {forma.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Solo finalizadas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Facturas
              </label>
              <select
                value={serverFilters.soloFinalizadas ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('soloFinalizadas', e.target.value === 'true')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="true">Solo Finalizadas</option>
                <option value="false">Todas</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Los filtros se aplican directamente en el servidor para mayor velocidad</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
              <Button size="sm" onClick={() => setShowFilters(false)}>
                Aplicar y Ocultar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      {processedData?.ventasCompletas && (
        <SalesTable 
          data={processedData.ventasCompletas}
          loading={isLoading}
          onExport={handleExport}
          filterOptions={filterOptions}
        />
      )}
      
      {/* Información adicional sobre la optimización */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Optimización con Filtros del Servidor</h4>
              <p className="text-sm text-green-800 mb-2">
                Esta página utiliza filtros aplicados directamente en el servidor Velneo, lo que resulta en:
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>Menor tiempo de carga:</strong> Solo se transfieren los datos necesarios</li>
                <li>• <strong>Menos uso de memoria:</strong> No se cargan datos innecesarios en el navegador</li>
                <li>• <strong>Mejor rendimiento:</strong> Los filtros se procesan en la base de datos</li>
                <li>• <strong>Respuesta más rápida:</strong> Ideal para consultas con rangos de fechas específicos</li>
              </ul>
              {summaryMetrics && (
                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                  <strong>Estadísticas de esta consulta:</strong> 
                  {summaryMetrics.registrosProcesados} registros cargados en {summaryMetrics.loadTime.toFixed(2)}s 
                  ({Math.round(summaryMetrics.registrosProcesados / summaryMetrics.loadTime)} registros/segundo)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de métrica
const MetricCard = ({ title, value, subtitle, icon, color, bgColor }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-lg font-bold ${color} mb-1`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  </Card>
);

// Estados de carga y error
const LoadingSales = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
      ))}
    </div>
    <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
);

const ErrorSales = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="max-w-md w-full">
      <CardContent className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar ventas</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <div className="space-y-2">
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar Carga
          </Button>
          <p className="text-xs text-gray-500">
            Verifica tu conexión y configuración de API
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Utilidad para convertir a CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escapar comillas y envolver en comillas si contiene comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

export default SalesServerFilters;