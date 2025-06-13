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
import { ChevronUp, ChevronDown, Search, Download, Eye, EyeOff } from 'lucide-react';

export const SalesTable = ({ data, loading = false, onExport }) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({
    division: true,
    fecha: true,
    cliente: false,
    vendedor: true,
    mes: false,
    trimestre: false,
    hora: true,
    numeroFactura: true,
    proveedor: false,
    articulo: true,
    referencia: true,
    codigoPS: false,
    talla: false,
    color: false,
    cantidad: true,
    precioUnitario: true,
    descuento: false,
    importe: true,
    marca: false,
    nombre: false,
    coste: true,
    formaPago: true,
    beneficio: true,
    familiaN1: false,
    familiaN2: false,
    familia: true,
    peso: true
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  });

  // Definir todas las columnas según el Excel
  const columns = useMemo(
    () => [
      {
        id: 'division',
        accessorKey: 'division',
        header: 'División',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue() || '-'}</span>
        ),
        size: 120
      },
      {
        id: 'fecha',
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="text-sm">{formatDate(getValue())}</span>
        ),
        size: 100
      },
      {
        id: 'cliente',
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: ({ getValue }) => (
          <span className="text-sm truncate max-w-xs" title={getValue()}>
            {getValue() || '-'}
          </span>
        ),
        size: 150
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
        id: 'mes',
        accessorKey: 'mes',
        header: 'Mes',
        cell: ({ getValue }) => (
          <span className="text-sm">{formatDate(getValue(), { month: 'short', year: 'numeric' })}</span>
        ),
        size: 80
      },
      {
        id: 'trimestre',
        accessorKey: 'trimestre',
        header: 'Trim',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 60
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
        id: 'proveedor',
        accessorKey: 'proveedor',
        header: 'Proveedor',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 120
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
        id: 'codigoPS',
        accessorKey: 'codigoPS',
        header: 'Código PS',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() || '-'}</span>
        ),
        size: 90
      },
      {
        id: 'talla',
        accessorKey: 'talla',
        header: 'Tll',
        cell: ({ getValue }) => (
          <span className="text-sm text-center block">{getValue() || '-'}</span>
        ),
        size: 50
      },
      {
        id: 'color',
        accessorKey: 'color',
        header: 'Col',
        cell: ({ getValue }) => (
          <span className="text-sm text-center block">{getValue() || '-'}</span>
        ),
        size: 50
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
        header: '$Unit',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatCurrency(getValue())}</span>
        ),
        size: 90
      },
      {
        id: 'descuento',
        accessorKey: 'descuento',
        header: 'Dto.',
        cell: ({ getValue }) => {
          const value = getValue() || 0;
          return (
            <span className="text-sm">
              {value > 0 ? `${value}%` : '-'}
            </span>
          );
        },
        size: 60
      },
      {
        id: 'importe',
        accessorKey: 'importeTotal',
        header: 'Importe',
        cell: ({ getValue }) => (
          <span className="text-sm font-bold">{formatCurrency(getValue())}</span>
        ),
        size: 100
      },
      {
        id: 'marca',
        accessorKey: 'marca',
        header: 'Marca',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 100
      },
      {
        id: 'nombre',
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 120
      },
      {
        id: 'coste',
        accessorKey: 'coste',
        header: 'Coste',
        cell: ({ getValue }) => (
          <span className="text-sm">{formatCurrency(getValue())}</span>
        ),
        size: 90
      },
      {
        id: 'formaPago',
        accessorKey: 'formaPago',
        header: 'ForPag',
        cell: ({ getValue }) => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{getValue()}</span>
        ),
        size: 80
      },
      {
        id: 'beneficio',
        accessorKey: 'beneficioCalculado',
        header: 'Benef',
        cell: ({ getValue }) => (
          <span className={`text-sm font-medium px-2 py-1 rounded ${getBenefitColorClass(getValue())}`}>
            {formatCurrency(getValue())}
          </span>
        ),
        size: 90
      },
      {
        id: 'familiaN1',
        accessorKey: 'familiaN1',
        header: 'Familia N1',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
        ),
        size: 100
      },
      {
        id: 'familiaN2',
        accessorKey: 'familiaN2',
        header: 'Familia N2',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || '-'}</span>
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
          <span className="text-sm">{formatWeight(getValue())}</span>
        ),
        size: 80
      }
    ],
    []
  );

  // Filtrar columnas visibles
  const visibleColumns = useMemo(
    () => columns.filter(col => columnVisibility[col.id] !== false),
    [columns, columnVisibility]
  );

  const table = useReactTable({
    data: data || [],
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header con filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tabla de Ventas Completa
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({table.getFilteredRowModel().rows.length} registros)
            </span>
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Buscador */}
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
                onClick={() => onExport(table.getFilteredRowModel().rows.map(row => row.original))}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            )}
          </div>
        </div>
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron datos
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
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
      
      {/* Cerrar selector de columnas al hacer clic fuera */}
      {showColumnSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowColumnSelector(false)}
        />
      )}
    </div>
  );
};