import { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table';
import { 
  formatCurrency, 
  formatDate, 
  formatWeight
} from '../../utils/formatters';
import { Button } from '../ui/Button';
import { ChevronUp, ChevronDown, Search, Download, Eye, Filter } from 'lucide-react';

export const SalesTable = ({ data, loading = false, onExport, filterOptions = {} }) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  
  // Filtros específicos por campo
  const [tableFilters, setTableFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    proveedor: '',
    formaPago: '',
    familia: ''
  });
  
  // Columnas visibles por defecto: fecha, proveedor, coste, forma de pago, familia, peso
  const [columnVisibility, setColumnVisibility] = useState({
    fecha: true,
    proveedor: true,
    coste: true,
    formaPago: true,
    familia: true,
    peso: true,
    // Otros campos ocultos por defecto
    hora: false,
    numeroFactura: false,
    vendedor: false,
    articulo: false,
    referencia: false,
    cantidad: false,
    precioUnitario: false,
    importe: false,
    beneficio: false,
    division: false
  });
  
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5 // Número de días por página
  });

  // Definir todas las columnas
  const columns = useMemo(
    () => [
      {
        id: 'fecha',
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
            {formatDate(getValue())}
          </span>
        ),
        size: 110
      },
      {
        id: 'hora',
        accessorKey: 'hora',
        header: 'Hora',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 70
      },
      {
        id: 'numeroFactura',
        accessorKey: 'numeroFactura',
        header: '#Fact.',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue()}</span>
        ),
        size: 80
      },
      {
        id: 'vendedor',
        accessorKey: 'vendedor',
        header: 'Vendedor',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue()}</span>
        ),
        size: 120
      },
      {
        id: 'proveedor',
        accessorKey: 'proveedor',
        header: 'Proveedor',
        cell: ({ getValue }) => {
          const proveedor = getValue();
          return (
            <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {proveedor || 'Sin proveedor'}
            </span>
          );
        },
        size: 150
      },
      {
        id: 'articulo',
        accessorKey: 'nombreArticulo',
        header: 'Artículo',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium truncate max-w-xs" title={getValue()}>
            {getValue()}
          </span>
        ),
        size: 200
      },
      {
        id: 'referencia',
        accessorKey: 'referenciaArticulo',
        header: 'Ref',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
        size: 100
      },
      {
        id: 'cantidad',
        accessorKey: 'cantidad',
        header: 'Cant',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-center block">{getValue()}</span>
        ),
        size: 60
      },
      {
        id: 'precioUnitario',
        accessorKey: 'precioVenta',
        header: '€ Unit',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatCurrency(getValue())}</span>
        ),
        size: 90
      },
      {
        id: 'importe',
        accessorKey: 'importeTotal',
        header: 'Importe',
        cell: ({ getValue }) => (
          <span className="text-sm font-bold text-green-600">{formatCurrency(getValue())}</span>
        ),
        size: 100
      },
      {
        id: 'coste',
        accessorKey: 'coste',
        header: 'Coste',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-red-600">{formatCurrency(getValue())}</span>
        ),
        size: 90
      },
      {
        id: 'beneficio',
        accessorKey: 'beneficioCalculado',
        header: 'Beneficio',
        cell: ({ getValue }) => {
          const valor = getValue();
          const colorClass = valor > 0 ? 'text-green-600 bg-green-50' : valor < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';
          return (
            <span className={`text-sm font-medium px-2 py-1 rounded ${colorClass}`}>
              {formatCurrency(valor)}
            </span>
          );
        },
        size: 100
      },
      {
        id: 'formaPago',
        accessorKey: 'formaPago',
        header: 'Forma Pago',
        cell: ({ getValue }) => (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{getValue()}</span>
        ),
        size: 120
      },
      {
        id: 'familia',
        accessorKey: 'familia',
        header: 'Familia',
        cell: ({ getValue }) => {
          const familia = getValue();
          // Generar color basado en el hash del nombre de la familia
          const hash = familia?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
          const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-purple-100 text-purple-800',
            'bg-pink-100 text-pink-800',
            'bg-indigo-100 text-indigo-800',
            'bg-yellow-100 text-yellow-800'
          ];
          const colorClass = colors[hash % colors.length];
          
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
              {familia}
            </span>
          );
        },
        size: 120
      },
      {
        id: 'peso',
        accessorKey: 'pesoTotalLinea',
        header: 'Peso',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-amber-600">{formatWeight(getValue())}</span>
        ),
        size: 80
      },
      {
        id: 'division',
        accessorKey: 'division',
        header: 'División',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 80
      }
    ],
    []
  );

  // Aplicar filtros locales a los datos
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(row => {
      // Filtro por fecha desde
      if (tableFilters.fechaDesde && row.fecha < tableFilters.fechaDesde) {
        return false;
      }
      
      // Filtro por fecha hasta
      if (tableFilters.fechaHasta && row.fecha > tableFilters.fechaHasta) {
        return false;
      }
      
      // Filtro por proveedor - comparar por ID
      if (tableFilters.proveedor && row.proveedorId !== parseInt(tableFilters.proveedor)) {
        return false;
      }
      
      // Filtro por forma de pago
      if (tableFilters.formaPago && row.formaPago !== tableFilters.formaPago) {
        return false;
      }
      
      // Filtro por familia
      if (tableFilters.familia && row.familia !== tableFilters.familia) {
        return false;
      }
      
      return true;
    });
  }, [data, tableFilters]);

  // Agrupar datos por día para mostrar totales
  const dataGroupedByDay = useMemo(() => {
    if (!filteredData.length) return [];
    
    const grouped = filteredData.reduce((acc, row) => {
      const fecha = formatDate(row.fecha);
      
      if (!acc[fecha]) {
        acc[fecha] = {
          fecha,
          rows: [],
          totales: {
            ventas: 0,
            costes: 0,
            beneficios: 0,
            peso: 0,
            cantidad: 0
          }
        };
      }
      
      acc[fecha].rows.push(row);
      acc[fecha].totales.ventas += row.importeTotal || 0;
      acc[fecha].totales.costes += (row.coste * row.cantidad) || 0;
      acc[fecha].totales.beneficios += row.beneficioCalculado || 0;
      acc[fecha].totales.peso += row.pesoTotalLinea || 0;
      acc[fecha].totales.cantidad += row.cantidad || 0;
      
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [filteredData]);

  // Totales generales
  const totalesGlobales = useMemo(() => {
    if (!filteredData.length) return null;
    
    const totalVentas = filteredData.reduce((sum, row) => sum + (row.importeTotal || 0), 0);
    const totalCostes = filteredData.reduce((sum, row) => sum + ((row.coste * row.cantidad) || 0), 0);
    const totalBeneficios = filteredData.reduce((sum, row) => sum + (row.beneficioCalculado || 0), 0);
    const margenPromedio = totalVentas > 0 ? (totalBeneficios / totalVentas) * 100 : 0;
    
    return {
      totalVentas,
      totalCostes,
      totalBeneficios,
      totalPeso: filteredData.reduce((sum, row) => sum + (row.pesoTotalLinea || 0), 0),
      totalCantidad: filteredData.reduce((sum, row) => sum + (row.cantidad || 0), 0),
      totalRegistros: filteredData.length,
      margenPromedio
    };
  }, [filteredData]);

  // Paginación por días
  const paginatedDays = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return dataGroupedByDay.slice(startIndex, endIndex);
  }, [dataGroupedByDay, pagination]);

  // Calcular totales para la página actual
  const totalesPagina = useMemo(() => {
    if (!paginatedDays.length) return null;
    
    const allRowsInPage = paginatedDays.flatMap(day => day.rows);
    const totalVentas = allRowsInPage.reduce((sum, row) => sum + (row.importeTotal || 0), 0);
    const totalCostes = allRowsInPage.reduce((sum, row) => sum + ((row.coste * row.cantidad) || 0), 0);
    const totalBeneficios = allRowsInPage.reduce((sum, row) => sum + (row.beneficioCalculado || 0), 0);
    const margenPromedio = totalVentas > 0 ? (totalBeneficios / totalVentas) * 100 : 0;
    
    return {
      totalVentas,
      totalCostes,
      totalBeneficios,
      totalPeso: allRowsInPage.reduce((sum, row) => sum + (row.pesoTotalLinea || 0), 0),
      totalCantidad: allRowsInPage.reduce((sum, row) => sum + (row.cantidad || 0), 0),
      totalRegistros: allRowsInPage.length,
      margenPromedio,
      totalDias: paginatedDays.length
    };
  }, [paginatedDays]);

  // Filtrar columnas visibles
  const visibleColumns = useMemo(
    () => columns.filter(col => columnVisibility[col.id] !== false),
    [columns, columnVisibility]
  );

  // Configurar tabla sin paginación automática de React Table
  const table = useReactTable({
    data: [], // Vacío porque manejamos la paginación manualmente
    columns: visibleColumns,
    state: {
      sorting,
      globalFilter: filtering
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(dataGroupedByDay.length / pagination.pageSize)
  });

  const toggleColumn = (columnId) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const handleFilterChange = (field, value) => {
    setTableFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones de paginación manual
  const goToPage = (pageIndex) => {
    setPagination(prev => ({ ...prev, pageIndex }));
  };

  const nextPage = () => {
    const maxPage = Math.ceil(dataGroupedByDay.length / pagination.pageSize) - 1;
    if (pagination.pageIndex < maxPage) {
      setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
    }
  };

  const previousPage = () => {
    if (pagination.pageIndex > 0) {
      setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  };

  const setPageSize = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }));
  };

  const canNextPage = pagination.pageIndex < Math.ceil(dataGroupedByDay.length / pagination.pageSize) - 1;
  const canPreviousPage = pagination.pageIndex > 0;

  const clearFilters = () => {
    setTableFilters({
      fechaDesde: '',
      fechaHasta: '',
      proveedor: '',
      formaPago: '',
      familia: ''
    });
    setFiltering('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header con filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tabla de Ventas Completa
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Buscador global */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filtering}
                  onChange={(e) => setFiltering(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Botón filtros específicos */}
              
              {/* Selector de columnas */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Columnas
                </Button>
                
                {showColumnSelector && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Mostrar/Ocultar Columnas</h4>
                      {columns.map(column => (
                        <label key={column.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                          <input
                            type="checkbox"
                            checked={columnVisibility[column.id] !== false}
                            onChange={() => toggleColumn(column.id)}
                            className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                          />
                          <span className="text-sm text-gray-700">{column.header}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botón exportar */}
              {onExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExport(filteredData)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              )}
            </div>
          </div>

          {/* Panel de filtros específicos */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por fecha desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={tableFilters.fechaDesde}
                    onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                {/* Filtro por fecha hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={tableFilters.fechaHasta}
                    onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                {/* Filtro por proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={tableFilters.proveedor}
                    onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Todos los proveedores</option>
                    {filterOptions.proveedores?.map(proveedor => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por forma de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={tableFilters.formaPago}
                    onChange={(e) => handleFilterChange('formaPago', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Todas</option>
                    {filterOptions.formasPago?.map(forma => (
                      <option key={forma.id} value={forma.name}>
                        {forma.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por familia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Familia
                  </label>
                  <select
                    value={tableFilters.familia}
                    onChange={(e) => handleFilterChange('familia', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Todas</option>
                    {filterOptions.familias?.map(familia => (
                      <option key={familia.id} value={familia.name}>
                        {familia.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
                <Button size="sm" onClick={() => setShowFilters(false)}>
                  Ocultar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 whitespace-nowrap transition-colors border-r border-gray-200 last:border-r-0"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getIsSorted() && (
                          <span className="text-gray-600">
                            {header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDays.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron datos
                  </td>
                </tr>
              ) : (
                paginatedDays.flatMap(group => [
                  // Separador por día con totales
                  <tr key={`header-${group.fecha}`} className="bg-amber-50 border-t-2 border-amber-200">
                    <td colSpan={visibleColumns.length} className="px-4 py-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-amber-800">
                          📅 {group.fecha} ({group.rows.length} registros)
                        </h4>
                        <div className="flex gap-6 text-sm">
                          <span className="text-green-600 font-medium">
                            Ventas: {formatCurrency(group.totales.ventas)}
                          </span>
                          <span className="text-red-600 font-medium">
                            Costes: {formatCurrency(group.totales.costes)}
                          </span>
                          <span className="text-amber-600 font-medium">
                            Peso: {formatWeight(group.totales.peso)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>,
                  // Filas del día
                  ...group.rows.map((row, index) => (
                    <tr 
                      key={`${group.fecha}-${index}`} 
                      className="hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100"
                    >
                      {visibleColumns.map(column => (
                        <td key={column.id} className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-100 last:border-r-0">
                          {column.cell ? 
                            column.cell({ 
                              getValue: () => row[column.accessorKey],
                              row: { original: row }
                            }) : 
                            row[column.accessorKey] || '-'
                          }
                        </td>
                      ))}
                    </tr>
                  ))
                ])
              )}
              
              {/* Fila de totales de la página actual */}
              {totalesPagina && (
                <tr className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                  <td colSpan={visibleColumns.length} className="px-4 py-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-blue-800 text-lg">
                        📊 TOTALES PÁGINA ({totalesPagina.totalDias} días - {totalesPagina.totalRegistros} registros)
                      </h4>
                      <div className="flex gap-8 text-base">
                        <span className="text-green-700 font-bold">
                          Ventas: {formatCurrency(totalesPagina.totalVentas)}
                        </span>
                        <span className="text-red-700 font-bold">
                          Costes: {formatCurrency(totalesPagina.totalCostes)}
                        </span>
                        <span className="text-amber-700 font-bold">
                          Peso: {formatWeight(totalesPagina.totalPeso)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación por días */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Días por página:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 5].map(pageSize => (
                <option key={pageSize} value={pageSize}>{pageSize} días</option>
              ))}
            </select>
            <span className="ml-4 text-gray-500">
              Mostrando {totalesPagina?.totalDias || 0} días de {dataGroupedByDay.length} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {pagination.pageIndex + 1} de {Math.ceil(dataGroupedByDay.length / pagination.pageSize) || 1}
            </span>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(0)}
                disabled={!canPreviousPage}
              >
                {'<<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!canPreviousPage}
              >
                {'<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={!canNextPage}
              >
                {'>'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(Math.ceil(dataGroupedByDay.length / pagination.pageSize) - 1)}
                disabled={!canNextPage}
              >
                {'>>'}
              </Button>
            </div>
          </div>
        </div>
      
      </div>
    </div>
  );
};