import { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { 
  formatCurrency, 
  formatDate, 
  getFamilyColorClass,
  getBenefitColorClass,
  formatWeight
} from '../../utils/formatters';
import { Button } from '../ui/Button';
import { ChevronUp, ChevronDown, Search, Download, Eye, Filter } from 'lucide-react';

export const SalesTable = ({ data, loading = false, onExport, filterOptions = {} }) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  
  // Filtros específicos por campo
  const [tableFilters, setTableFilters] = useState({
    fecha: '',
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
    pageSize: 50
  });

  // Definir todas las columnas
  const columns = useMemo(
    () => [
      {
        id: 'fecha',
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatDate(getValue())}</span>
        ),
        size: 100
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
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-blue-600">{getValue() || 'Sin proveedor'}</span>
        ),
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
        cell: ({ getValue }) => (
          <span className={`text-sm font-medium px-2 py-1 rounded ${getBenefitColorClass(getValue())}`}>
            {formatCurrency(getValue())}
          </span>
        ),
        size: 90
      },
      {
        id: 'formaPago',
        accessorKey: 'formaPago',
        header: 'Forma Pago',
        cell: ({ getValue }) => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">{getValue()}</span>
        ),
        size: 100
      },
      {
        id: 'familia',
        accessorKey: 'familia',
        header: 'Familia',
        cell: ({ getValue }) => (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFamilyColorClass(getValue())}`}>
            {getValue()}
          </span>
        ),
        size: 100
      },
      {
        id: 'peso',
        accessorKey: 'pesoTotalLinea',
        header: 'Peso',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-gold-600">{formatWeight(getValue())}</span>
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
      // Filtro por fecha
      if (tableFilters.fecha && !row.fecha?.includes(tableFilters.fecha)) {
        return false;
      }
      
      // Filtro por proveedor
      if (tableFilters.proveedor && !row.proveedor?.toLowerCase().includes(tableFilters.proveedor.toLowerCase())) {
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
    
    return {
      totalVentas: filteredData.reduce((sum, row) => sum + (row.importeTotal || 0), 0),
      totalCostes: filteredData.reduce((sum, row) => sum + ((row.coste * row.cantidad) || 0), 0),
      totalBeneficios: filteredData.reduce((sum, row) => sum + (row.beneficioCalculado || 0), 0),
      totalPeso: filteredData.reduce((sum, row) => sum + (row.pesoTotalLinea || 0), 0),
      totalCantidad: filteredData.reduce((sum, row) => sum + (row.cantidad || 0), 0),
      totalRegistros: filteredData.length
    };
  }, [filteredData]);

  // Filtrar columnas visibles
  const visibleColumns = useMemo(
    () => columns.filter(col => columnVisibility[col.id] !== false),
    [columns, columnVisibility]
  );

  const table = useReactTable({
    data: filteredData || [],
    columns: visibleColumns,
    state: {
      sorting,
      globalFilter: filtering,
      pagination
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    pageCount: -1
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

  const clearFilters = () => {
    setTableFilters({
      fecha: '',
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
      {/* Totales Generales */}
      {totalesGlobales && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-lg p-6 border border-gold-200">
          <h3 className="text-lg font-semibold text-gold-800 mb-4">Totales Generales</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalesGlobales.totalVentas)}</p>
              <p className="text-sm text-gray-600">Total Ventas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalesGlobales.totalCostes)}</p>
              <p className="text-sm text-gray-600">Total Costes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalesGlobales.totalBeneficios)}</p>
              <p className="text-sm text-gray-600">Total Beneficios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-600">{formatWeight(totalesGlobales.totalPeso)}</p>
              <p className="text-sm text-gray-600">Peso Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{totalesGlobales.totalCantidad}</p>
              <p className="text-sm text-gray-600">Unidades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{totalesGlobales.totalRegistros}</p>
              <p className="text-sm text-gray-600">Registros</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header con filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tabla de Ventas Completa
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredData.length} registros)
              </span>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              
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
                {/* Filtro por fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={tableFilters.fecha}
                    onChange={(e) => handleFilterChange('fecha', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                {/* Filtro por proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar proveedor..."
                    value={tableFilters.proveedor}
                    onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
                  />
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
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="text-gray-400">
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
              {dataGroupedByDay.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron datos
                  </td>
                </tr>
              ) : (
                dataGroupedByDay.map(group => (
                  <React.Fragment key={group.fecha}>
                    {/* Separador por día con totales */}
                    <tr className="bg-gold-50 border-t-2 border-gold-200">
                      <td colSpan={visibleColumns.length} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gold-800">
                            📅 {group.fecha} ({group.rows.length} registros)
                          </h4>
                          <div className="flex gap-6 text-sm">
                            <span className="text-green-600 font-medium">
                              Ventas: {formatCurrency(group.totales.ventas)}
                            </span>
                            <span className="text-red-600 font-medium">
                              Costes: {formatCurrency(group.totales.costes)}
                            </span>
                            <span className="text-blue-600 font-medium">
                              Beneficio: {formatCurrency(group.totales.beneficios)}
                            </span>
                            <span className="text-gold-600 font-medium">
                              Peso: {formatWeight(group.totales.peso)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Filas del día */}
                    {group.rows.map((row, index) => (
                      <tr key={`${group.fecha}-${index}`} className="hover:bg-gray-50 transition-colors">
                        {visibleColumns.map(column => {
                          const cell = table.getRowModel().rows
                            .find(r => r.original === row)
                            ?.getVisibleCells()
                            .find(c => c.column.id === column.id);
                          
                          return (
                            <td key={column.id} className="px-4 py-3 whitespace-nowrap">
                              {cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[25, 50, 100, 200].map(pageSize => (
                <option key={pageSize} value={pageSize}>{pageSize}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {'<<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {'<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {'>'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                {'>>'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cerrar dropdowns al hacer clic fuera */}
        {(showColumnSelector || showFilters) && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowColumnSelector(false);
              setShowFilters(false);
            }}
          />
        )}
      </div>
    </div>
  );
};