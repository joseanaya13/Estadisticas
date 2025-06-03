// src/components/common/ExportButton.jsx
import React, { useState } from 'react';
import { useExport, useNotifications } from '../../hooks';

const ExportButton = ({ 
  data, 
  filename, 
  prepareDataFn = null,
  className = '',
  children = null,
  disabled = false,
  format = null // 'excel', 'csv' o null para mostrar opciones
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const { isExporting, exportData } = useExport();
  const { showNotification } = useNotifications();

  const handleExport = async (selectedFormat) => {
    try {
      if (!data || data.length === 0) {
        showNotification('No hay datos para exportar', 'warning');
        return;
      }

      await exportData(data, filename, {
        format: selectedFormat,
        prepareDataFn,
        includeTimestamp: true
      });

      showNotification(`Datos exportados exitosamente a ${selectedFormat.toUpperCase()}`, 'success');
      setShowOptions(false);
      
    } catch (error) {
      console.error('Error en exportación:', error);
      showNotification(`Error al exportar: ${error.message}`, 'error');
    }
  };

  const isDisabled = disabled || isExporting || !data || data.length === 0;

  // Si se especifica un formato, exportar directamente
  if (format) {
    return (
      <button
        className={`btn btn-secondary ${className}`}
        onClick={() => handleExport(format)}
        disabled={isDisabled}
        title={isDisabled ? 'No hay datos para exportar' : `Exportar a ${format.toUpperCase()}`}
      >
        {isExporting ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Exportando...
          </>
        ) : (
          <>
            <i className={`fas fa-file-${format === 'excel' ? 'excel' : 'csv'}`}></i>
            {children || `Exportar ${format.toUpperCase()}`}
          </>
        )}
      </button>
    );
  }

  // Mostrar dropdown con opciones
  return (
    <div className="export-button-container">
      <button
        className={`btn btn-secondary ${className}`}
        onClick={() => setShowOptions(!showOptions)}
        disabled={isDisabled}
        title={isDisabled ? 'No hay datos para exportar' : 'Opciones de exportación'}
      >
        {isExporting ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Exportando...
          </>
        ) : (
          <>
            <i className="fas fa-download"></i>
            {children || 'Exportar'}
            <i className="fas fa-chevron-down ml-1"></i>
          </>
        )}
      </button>

      {showOptions && !isExporting && (
        <div className="export-options">
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
          >
            <i className="fas fa-file-excel"></i>
            Excel (.xlsx)
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <i className="fas fa-file-csv"></i>
            CSV (.csv)
          </button>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {showOptions && (
        <div 
          className="export-overlay" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;