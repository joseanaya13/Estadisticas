// src/utils/exportUtils.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency, formatDate } from './formatters';

/**
 * Utilidades para exportación de datos a Excel y CSV
 */

/**
 * Exporta datos a Excel
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {string} sheetName - Nombre de la hoja
 * @param {Object} options - Opciones de formateo
 */
export const exportToExcel = (data, filename, sheetName = 'Datos', options = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Configurar anchos de columna automáticamente
    const columnWidths = [];
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key, index) => {
        const maxLength = Math.max(
          key.length, // Longitud del header
          ...data.map(row => 
            String(row[key] || '').length
          ).slice(0, 100) // Solo los primeros 100 para performance
        );
        columnWidths[index] = { wch: Math.min(maxLength + 2, 50) };
      });
    }
    worksheet['!cols'] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    });
    
    const dataBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    saveAs(dataBlob, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};

/**
 * Exporta datos a CSV
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {string} separator - Separador CSV (por defecto ;)
 */
export const exportToCSV = (data, filename, separator = ';') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    // Crear CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(separator), // Headers
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comillas y punto y coma
          const escaped = String(value || '').replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(separator)
      )
    ].join('\n');

    // Crear Blob con BOM para Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    saveAs(blob, `${filename}.csv`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a CSV:', error);
    throw error;
  }
};

/**
 * Prepara datos de ventas para exportación
 * @param {Array} ventasData - Datos de ventas
 * @param {Object} mapaContactos - Mapa de contactos
 * @param {Object} mapaUsuarios - Mapa de usuarios
 * @param {Object} mapaFormasPago - Mapa de formas de pago
 * @returns {Array} Datos preparados para exportar
 */
export const prepareVentasForExport = (
  ventasData, 
  mapaContactos = {}, 
  mapaUsuarios = {}, 
  mapaFormasPago = {}
) => {
  return ventasData.map(venta => ({
    'Fecha': formatDate(venta.fch),
    'Año': venta.eje,
    'Mes': venta.mes,
    'Número Factura': venta.num,
    'Cliente ID': venta.clt,
    'Cliente': mapaContactos[venta.clt] || `Cliente ${venta.clt}`,
    'Vendedor ID': venta.alt_usr,
    'Vendedor': mapaUsuarios[venta.alt_usr] || `Vendedor ${venta.alt_usr}`,
    'Forma de Pago ID': venta.fpg,
    'Forma de Pago': mapaFormasPago[venta.fpg] || `Forma ${venta.fpg}`,
    'Total': formatCurrency(venta.tot),
    'Base': formatCurrency(venta.bas_tot),
    'IVA': formatCurrency(venta.iva_tot)
  }));
};

/**
 * Prepara datos de vendedores para exportación
 * @param {Array} vendedoresData - Datos de vendedores procesados
 * @returns {Array} Datos preparados para exportar
 */
export const prepareVendedoresForExport = (vendedoresData) => {
  return vendedoresData.map((vendedor, index) => ({
    'Posición': index + 1,
    'Vendedor': vendedor.nombre || vendedor.nombreVendedor,
    'Total Ventas': formatCurrency(vendedor.totalGeneral || vendedor.total),
    'Porcentaje': `${(vendedor.porcentajeTotal || vendedor.porcentaje || 0).toFixed(2)}%`,
    'Cantidad Facturas': vendedor.cantidadFacturas || vendedor.cantidad,
    'Promedio Factura': formatCurrency(vendedor.promedioFactura || vendedor.promedio),
    'IDs Consolidados': vendedor.esConsolidado ? 
      `${vendedor.cantidadIds} IDs` : 'ID único'
  }));
};

/**
 * Prepara datos de compras para exportación
 * @param {Array} comprasData - Datos de compras
 * @returns {Array} Datos preparados para exportar
 */
export const prepareComprasForExport = (comprasData) => {
  return comprasData.map(compra => ({
    'Fecha': formatDate(compra.fch),
    'Año': compra.eje,
    'Mes': compra.mes,
    'Número Albarán': compra.num,
    'Proveedor ID': compra.prv,
    'Proveedor': `Proveedor ${compra.prv}`,
    'Serie': compra.ser,
    'Total Albarán': formatCurrency(compra.tot_alb),
    'Empresa': compra.emp,
    'Almacén': compra.alm
  }));
};

/**
 * Prepara datos genéricos para exportación
 * @param {Array} data - Datos a preparar
 * @param {Object} columnMappings - Mapeo de columnas
 * @param {Object} formatters - Funciones de formateo por columna
 * @returns {Array} Datos preparados
 */
export const prepareGenericDataForExport = (data, columnMappings = {}, formatters = {}) => {
  return data.map(row => {
    const exportRow = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // Usar el mapeo de columna si existe, sino usar el key original
      const exportKey = columnMappings[key] || key;
      
      // Aplicar formatter si existe para esta columna
      if (formatters[key]) {
        exportRow[exportKey] = formatters[key](value);
      } else if (typeof value === 'number' && key.toLowerCase().includes('total')) {
        // Auto-formatear campos que parezcan monetarios
        exportRow[exportKey] = formatCurrency(value);
      } else if (key.toLowerCase().includes('fecha') || key.toLowerCase().includes('fch')) {
        // Auto-formatear fechas
        exportRow[exportKey] = formatDate(value);
      } else {
        exportRow[exportKey] = value;
      }
    });
    
    return exportRow;
  });
};

/**
 * Crea múltiples hojas en un archivo Excel
 * @param {Object} sheets - Objeto con nombre de hoja -> datos
 * @param {string} filename - Nombre del archivo
 * @param {Object} options - Opciones adicionales
 */
export const exportMultipleSheets = (sheets, filename, options = {}) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(sheets).forEach(([sheetName, data]) => {
      if (!data || data.length === 0) {
        console.warn(`Hoja ${sheetName} está vacía, se omitirá`);
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Configurar anchos de columna
      const columnWidths = [];
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key, index) => {
          const maxLength = Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length).slice(0, 50)
          );
          columnWidths[index] = { wch: Math.min(maxLength + 2, 50) };
        });
      }
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    if (workbook.SheetNames.length === 0) {
      throw new Error('No hay hojas con datos para exportar');
    }
    
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array'
    });
    
    const dataBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    saveAs(dataBlob, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar múltiples hojas:', error);
    throw error;
  }
};

/**
 * Valida datos antes de exportar
 * @param {Array} data - Datos a validar
 * @param {Object} validationRules - Reglas de validación
 * @returns {Object} Resultado de la validación
 */
export const validateExportData = (data, validationRules = {}) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalRows: data.length,
      validRows: 0,
      invalidRows: 0
    }
  };
  
  if (!data || data.length === 0) {
    result.isValid = false;
    result.errors.push('No hay datos para validar');
    return result;
  }
  
  data.forEach((row, index) => {
    let rowValid = true;
    
    // Validaciones básicas
    if (!row || typeof row !== 'object') {
      result.errors.push(`Fila ${index + 1}: Datos inválidos`);
      rowValid = false;
    }
    
    // Validaciones personalizadas
    Object.entries(validationRules).forEach(([field, rule]) => {
      if (rule.required && (row[field] === undefined || row[field] === null || row[field] === '')) {
        result.errors.push(`Fila ${index + 1}: Campo requerido '${field}' está vacío`);
        rowValid = false;
      }
      
      if (rule.type && row[field] !== undefined) {
        if (rule.type === 'number' && isNaN(Number(row[field]))) {
          result.warnings.push(`Fila ${index + 1}: Campo '${field}' no es un número válido`);
        }
        
        if (rule.type === 'date' && isNaN(new Date(row[field]).getTime())) {
          result.warnings.push(`Fila ${index + 1}: Campo '${field}' no es una fecha válida`);
        }
      }
    });
    
    if (rowValid) {
      result.stats.validRows++;
    } else {
      result.stats.invalidRows++;
    }
  });
  
  if (result.errors.length > 0) {
    result.isValid = false;
  }
  
  return result;
};

export default {
  exportToExcel,
  exportToCSV,
  prepareVentasForExport,
  prepareVendedoresForExport,
  prepareComprasForExport,
  prepareGenericDataForExport,
  exportMultipleSheets,
  validateExportData
};