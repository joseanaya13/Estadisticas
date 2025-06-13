import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SalesTable } from '../components/tables/SalesTable';
import { velneoAPI, filterVentasData } from '../services/velneoAPI';
import { transformSalesData, filterSalesData } from '../utils/dataTransform';
import { formatCurrency, formatDate, formatNumber, formatWeight } from '../utils/formatters';

import { 
  Download, 
  Filter, 
  RefreshCw, 
  Calendar,
  Search,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Database,
  BarChart3,
  Bug
} from 'lucide-react';

const Sales = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [filters, setFilters] = useState({
    vendedorId: '',
    familiaId: '',
    formaPagoId: '',
    proveedorId: '',
    montoMinimo: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  // Query principal para obtener TODOS los datos
  const { 
    data: rawData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['sales-complete-data'],
    queryFn: async () => {
      console.log('🚀 Cargando datos completos de ventas...');
      
      // Obtener TODOS los datos con paginación completa
      const completeData = await velneoAPI.getVentasCompletas();
      
      console.log('✅ Datos completos cargados:', {
        facturas: completeData.facturas?.length,
        lineas: completeData.lineas?.length,
        articulos: completeData.articulos?.length,
        loadTime: completeData.metadata?.loadTime,
        complete: completeData.metadata?.complete
      });
      
      return completeData;
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutos - datos más estables
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Aplicar filtros de fecha y transformar datos
  const processedData = useMemo(() => {
    if (!rawData?.facturas || !rawData?.lineas) return null;
    
    console.log('🔄 Procesando datos con filtros...');
    
    // Aplicar filtros de fecha primero
    const filteredByDate = filterVentasData(rawData, {
      fechaDesde: dateRange.from,
      fechaHasta: dateRange.to,
      soloFinalizadas: true
    });
    
    // Transformar a formato de tabla
    const transformed = transformSalesData(filteredByDate);
    
    // Aplicar filtros adicionales
    const finalFiltered = filterSalesData(transformed.ventasCompletas, {
      ...filters,
      montoMinimo: filters.montoMinimo ? parseFloat(filters.montoMinimo) : undefined
    });
    
    console.log('✅ Datos procesados:', {
      original: rawData.lineas?.length,
      filtradoFecha: filteredByDate.lineas?.length,
      transformado: transformed.ventasCompletas?.length,
      final: finalFiltered?.length
    });
    
    return {
      ventasCompletas: finalFiltered,
      resumen: transformed.resumen,
      metadata: {
        originalCount: rawData.lineas?.length || 0,
        dateFilteredCount: filteredByDate.lineas?.length || 0,
        finalCount: finalFiltered?.length || 0,
        loadComplete: rawData.metadata?.complete || false
      }
    };
  }, [rawData, dateRange, filters]);

  // Datos para filtros (todos los datos disponibles)
  const filterOptions = useMemo(() => {
    if (!rawData) return { vendedores: [], familias: [], formasPago: [], proveedores: [] };
    
    return {
      vendedores: rawData.usuarios?.map(u => ({ id: u.id, name: u.name })) || [],
      familias: rawData.familias?.map(f => ({ id: f.id, name: f.name })) || [],
      formasPago: rawData.formasPago?.map(f => ({ id: f.id, name: f.name })) || [],
      proveedores: rawData.proveedores?.filter(p => p.es_prv === true).map(p => ({ id: p.id, name: p.name })) || []
    };
  }, [rawData]);

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
      ticketMedio: transaccionesUnicas > 0 ? totalVentas / transaccionesUnicas : 0
    };
  }, [processedData]);

  // Manejadores
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      vendedorId: '',
      familiaId: '',
      formaPagoId: '',
      proveedorId: '',
      montoMinimo: ''
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
    link.download = `ventas_${dateRange.from}_${dateRange.to}.csv`;
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
      {/* Header con información de carga */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ventas</h1>
          <div className="mt-2 space-y-1">
            <p className="text-gray-600">
              {processedData?.ventasCompletas?.length || 0} registros del {formatDate(dateRange.from)} al {formatDate(dateRange.to)}
            </p>
            {processedData?.metadata && (
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-1 ${processedData.metadata.loadComplete ? 'text-green-600' : 'text-orange-600'}`}>
                  {processedData.metadata.loadComplete ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {processedData.metadata.loadComplete ? 'Carga completa' : 'Carga parcial'}
                </span>
                <span className="text-gray-500">
                  {formatNumber(processedData.metadata.originalCount)} registros totales
                </span>
                {rawData?.metadata?.loadTime && (
                  <span className="text-gray-500">
                    Cargado en {rawData.metadata.loadTime.toFixed(1)}s
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            size="sm"
          >
            <Database className="h-4 w-4 mr-2" />
            {showDiagnostics ? 'Ocultar' : 'Mostrar'} Diagnósticos
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            onClick={refetch} 
            loading={isRefetching}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Debug de peso */}

      {/* Debug de estructura de datos - siempre visible mientras desarrollamos */}

      {/* Alerta si no hay datos */}
      {processedData && processedData.metadata.originalCount === 0 && (
        <div className="space-y-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                No se encontraron datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-orange-700">
                  La API de Velneo está respondiendo pero no devuelve ningún registro. 
                  Esto puede deberse a:
                </p>
                <ul className="list-disc list-inside text-orange-700 space-y-1 text-sm">
                  <li>No hay datos en las tablas de la base de datos</li>
                  <li>Los permisos de la API key no incluyen acceso a los datos</li>
                  <li>Hay filtros aplicados que excluyen todos los resultados</li>
                  <li>Problema con la configuración de la API</li>
                </ul>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTroubleshooter(!showTroubleshooter)}
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    {showTroubleshooter ? 'Ocultar' : 'Mostrar'} Solucionador
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test rápido de conexión */}
          
        </div>
      )}

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
            title="Registros"
            value={formatNumber(summaryMetrics.registrosProcesados)}
            subtitle="Líneas procesadas"
            icon={<Database className="h-5 w-5" />}
            color="text-gray-600"
            bgColor="bg-gray-50"
          />
        </div>
      )}

      {/* Panel de filtros */}
      <Card className={`transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros Avanzados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
            
            {/* Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendedor
              </label>
              <select
                value={filters.vendedorId}
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
                value={filters.familiaId}
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
                value={filters.proveedorId}
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
            
            {/* Monto mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Mínimo
              </label>
              <input
                type="number"
                placeholder="€0.00"
                value={filters.montoMinimo}
                onChange={(e) => handleFilterChange('montoMinimo', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
            <Button size="sm" onClick={() => setShowFilters(false)}>
              Aplicar y Ocultar
            </Button>
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

export default Sales;