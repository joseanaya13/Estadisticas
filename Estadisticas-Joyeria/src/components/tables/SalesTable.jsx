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
  formatDateTime, 
  getFamilyColorClass,
  getBenefitColorClass 
} from '../../utils/formatters';
import { Button } from '../ui/Button';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

export const SalesTable = ({ data, loading = false, onExport }) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  });

  // Definir columnas de la tabla
  const columns = useMemo(
    () => [
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ getValue, row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {formatDate(getValue())}
            </div>
            <div className="text-gray-500">
              {row.original.hora}
            </div>
          </div>
        ),
        size: 120
      },
      {
        accessorKey: 'numeroFactura',
        header: 'Factura',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue()}</span>
        ),
        size: 100
      },
      {
        accessorKey: 'vendedor',
        header: 'Vendedor',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue()}</span>
        ),
        size: 120
      },
      {
        accessorKey: 'nombreArticulo',
        header: 'Artículo',
        cell: ({ getValue, row }) => (
          <div className="text-sm">
            <div className="font-medium truncate max-w-xs" title={getValue()}>
              {getValue()}
            </div>
            <div className="text-gray-500 font-mono text-xs">
              {row.original.referenciaArticulo}
            </div>
          </div>
        ),
        size: 200
      },
      {
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
        accessorKey: 'cantidad',
        header: 'Cant.',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-center block">
            {getValue()}
          </span>
        ),
        size: 60
      },
      {
        accessorKey: 'precioVenta',
        header: 'Precio',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">
            {formatCurrency(getValue())}
          </span>
        ),
        size: 90
      },
      {
        accessorKey: 'importeTotal',
        header: 'Total',
        cell: ({ getValue }) => (
          <span className="text-sm font-bold">
            {formatCurrency(getValue())}
          </span>
        ),
        size: 90
      },
      {
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
        accessorKey: 'margen',
        header: 'Margen %',
        cell: ({ getValue }) => {
          const value = getValue();
          const colorClass = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
          return (
            <span className={`text-sm font-medium ${colorClass}`}>
              {value.toFixed(1)}%
            </span>
          );
        },
        size: 80
      },
      {
        accessorKey: 'formaPago',
        header: 'Pago',
        cell: ({ getValue }) => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {getValue()}
          </span>
        ),
        size: 80
      }
    ],
    []
  );

  const table = useReactTable({
    data: data || [],
    columns,
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
            Tabla de Ventas
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
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
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
    </div>
  );
};