// components/DataTable.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

const DataTable = ({ data, columns, title = '', itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const currentData = data.slice(startIndex, endIndex);
  
  const formatCellValue = (value, format) => {
    if (value === undefined || value === null) return '-';
    
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value);
      case 'number':
        return value.toLocaleString('es-ES');
      default:
        return value;
    }
  };
  
  return (
    <div className="data-table-container">
      {title && <h3>{title}</h3>}
      
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={column.style}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((column) => (
                  <td key={`${item.id || index}-${column.key}`} style={column.style}>
                    {formatCellValue(item[column.key], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button 
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="fas fa-angle-left"></i>
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button 
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}
      
      <div className="table-info">
        Mostrando {startIndex + 1}-{endIndex} de {data.length} registros
      </div>
    </div>
  );
};

export default DataTable;
