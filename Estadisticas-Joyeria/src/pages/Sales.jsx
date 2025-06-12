// src/pages/Sales.jsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SalesTable } from '../components/tables/SalesTable';
import { velneoAPI, filterVentasData } from '../services/velneoAPI';
import { transformSalesData, filterSalesData } from '../utils/dataTransform';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Download, 
  Filter, 
  RefreshCw, 
  Calendar,
  Search,
  TrendingUp,
  Package,
  Users
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
    montoMinimo: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Query principal para obtener datos de ventas
  const { 
    data: rawData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['sales-data', dateRange],
    queryFn: async () => {
      console.log('🔄 Cargando datos de ventas...');
      
      // Obtener todos los datos
      const data = await velneoAPI.getVentasCompletas();
      
      // Aplicar filtros de fecha en backend simulation
      const filteredData = filterVentasData(data, {
        fechaDesde: dateRange.from,
        fechaHasta: dateRange.to,
        soloFinalizadas: true
      });
      
      return filteredData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  // Transformar datos para la tabla
  const tableData = useMemo(() => {
    if (!rawData?.facturas || !rawData?.lineas) return [];
    
    // Transformar a formato de ventas completas
    const transformed = transformSalesData(rawData);
    
    // Aplicar filtros adicionales
    return filterSalesData(transformed.ventasCompletas, {
      ...filters,
      montoMinimo: filters.montoMinimo ? parseFloat(filters.montoMinimo) : undefined
    });
  }, [rawData, filters]);

  // Datos para filtros
  const filterOptions = useMemo(() => {
    if (!rawData) return { vendedores: [], familias: [], formasPago: [] };
    
    return {
      vendedores: rawData.usuarios?.map(u => ({ id: u.id, name: u.name })) || [],
      familias: rawData.familias?.map(f => ({ id: f.id, name: f.name })) || [],
      formasPago: rawData.formasPago?.map(f => ({ id: f.id, name: f.name })) || []
    };
  }, [rawData]);

  // Métricas de la tabla actual
  const summaryMetrics = useMemo(() => {
    if (!tableData.length) return null;
    
    const totalVentas = tableData.reduce((sum, row) => sum + row.importeTotal, 0);
    const totalBeneficio = tableData.reduce((sum, row) => sum + row.beneficioCalculado, 0);
    const totalArticulos = tableData.reduce((sum, row) => sum + row.cantidad, 0);
    const transaccionesUnicas = new Set(tableData.map(row => row.facturaId)).size;
    
    return {
      totalVentas,
      totalBeneficio,
      totalArticulos,
      transaccionesUnicas,
      margenPromedio: totalVentas > 0 ? (totalBeneficio / totalVentas) * 100 : 0,
      ticketMedio: transaccionesUnicas > 0 ? totalVentas / transaccionesUnicas : 0
    };
  }, [tableData]);

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
      montoMinimo: ''
    });
  };

  const handleExport = (data) => {
    // Preparar datos para exportar
    const csvData = data.map(row => ({
      'Fecha': formatDate(row.fecha),
      'Hora': row.hora,
      'Factura': row.numeroFactura,
      'Vendedor': row.vendedor,
      'Artículo': row.nombreArticulo,
      'Referencia': row.referenciaArticulo,
      'Familia': row.familia,
      'Cantidad': row.cantidad,
      'Precio': row.precioVenta,
      'Total': row.importeTotal,
      'Coste': row.coste,
      'Beneficio': row.beneficioCalculado,
      'Margen %': row.margen.toFixed(2),
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-1">
            {tableData.length} registros del {formatDate(dateRange.from)} al {formatDate(dateRange.to)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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

      {/* Métricas resumen */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <SummaryCard
            title="Total Ventas"
            value={formatCurrency(summaryMetrics.totalVentas)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <SummaryCard
            title="Total Beneficio"
            value={formatCurrency(summaryMetrics.totalBeneficio)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <SummaryCard
            title="Transacciones"
            value={summaryMetrics.transaccionesUnicas.toString()}
            icon={<Package className="h-5 w-5" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <SummaryCard
            title="Artículos"
            value={summaryMetrics.totalArticulos.toString()}
            icon={<Package className="h-5 w-5" />}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <SummaryCard
            title="Ticket Medio"
            value={formatCurrency(summaryMetrics.ticketMedio)}
            icon={<Users className="h-5 w-5" />}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <SummaryCard
            title="Margen Medio"
            value={`${summaryMetrics.margenPromedio.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="text-pink-600"
            bgColor="bg-pink-50"
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
                <option value="">Todos</option>
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
                <option value="">Todas</option>
                {filterOptions.familias.map(familia => (
                  <option key={familia.id} value={familia.id}>
                    {familia.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Forma de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pago
              </label>
              <select
                value={filters.formaPagoId}
                onChange={(e) => handleFilterChange('formaPagoId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Todas</option>
                {filterOptions.formasPago.map(forma => (
                  <option key={forma.id} value={forma.id}>
                    {forma.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Monto mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Mínimo €
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.montoMinimo}
                onChange={(e) => handleFilterChange('montoMinimo', e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
            <Button size="sm" onClick={() => setShowFilters(false)}>
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      <SalesTable 
        data={tableData}
        loading={isLoading}
        onExport={handleExport}
      />
    </div>
  );
};

// Componente de tarjeta de resumen
const SummaryCard = ({ title, value, icon, color, bgColor }) => (
  <Card className="p-3">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  </Card>
);

// Estados de carga y error
const LoadingSales = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
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
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
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