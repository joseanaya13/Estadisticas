// src/hooks/useExport.js
import { useState, useCallback } from 'react';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import useAppStore from '../stores/useAppStore';

/**
 * Hook para manejar exportación de datos
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { ui } = useAppStore();

  const exportData = useCallback(async (data, filename, options = {}) => {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const {
      format = ui.exportFormat || 'excel',
      prepareDataFn = null,
      includeTimestamp = true
    } = options;

    try {
      setIsExporting(true);

      // Preparar datos si hay función específica
      const exportData = prepareDataFn ? prepareDataFn(data) : data;

      // Generar nombre de archivo
      const timestamp = includeTimestamp ? 
        `_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}` : '';
      const fullFilename = `${filename}${timestamp}`;

      // Exportar según formato
      if (format === 'excel') {
        await exportToExcel(exportData, fullFilename);
      } else if (format === 'csv') {
        await exportToCSV(exportData, fullFilename);
      } else {
        throw new Error(`Formato no soportado: ${format}`);
      }

      console.log(`✅ Datos exportados exitosamente a ${format.toUpperCase()}`);
      return true;

    } catch (error) {
      console.error('Error en exportación:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [ui.exportFormat]);

  return {
    isExporting,
    exportData
  };
};