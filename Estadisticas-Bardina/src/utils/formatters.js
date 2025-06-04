// utils/formatters.js - Versión mejorada para manejar datos inconsistentes
/**
 * Formatea un valor numérico como moneda (EUR) - VERSIÓN ROBUSTA
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 2)
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value, decimals = 2) => {
  // Validación robusta
  if (value === undefined || value === null || value === '' || isNaN(value)) return '€0,00';
  
  // Convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '€0,00';
  
  // Redondear para evitar problemas de precisión
  const rounded = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  return `€${rounded.toLocaleString('es-ES', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Parsea una fecha de manera robusta desde diferentes formatos
 * @param {string|Date|number} fechaInput - La fecha a parsear
 * @returns {Date|null} Fecha parseada o null si es inválida
 */
export const parseFechaRobusta = (fechaInput) => {
  if (!fechaInput) return null;
  
  let fecha;
  
  // Si ya es un objeto Date
  if (fechaInput instanceof Date) {
    return isNaN(fechaInput.getTime()) ? null : fechaInput;
  }
  
  // Convertir a string si es necesario
  const fechaStr = String(fechaInput).trim();
  
  try {
    // Formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
    if (fechaStr.includes('-') && fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      fecha = new Date(fechaStr);
    }
    // Formato DD/MM/YYYY
    else if (fechaStr.includes('/')) {
      const partes = fechaStr.split('/');
      if (partes.length === 3) {
        // Detectar formato DD/MM/YYYY vs MM/DD/YYYY vs YYYY/MM/DD
        if (partes[2].length === 4) {
          // DD/MM/YYYY o MM/DD/YYYY
          const [p1, p2, año] = partes;
          // Asumir DD/MM/YYYY para España
          fecha = new Date(parseInt(año), parseInt(p2) - 1, parseInt(p1));
        } else if (partes[0].length === 4) {
          // YYYY/MM/DD
          const [año, mes, dia] = partes;
          fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        }
      }
    }
    // Formato YYYYMMDD (sin separadores)
    else if (fechaStr.length === 8 && /^\d{8}$/.test(fechaStr)) {
      const año = parseInt(fechaStr.substring(0, 4));
      const mes = parseInt(fechaStr.substring(4, 6));
      const dia = parseInt(fechaStr.substring(6, 8));
      fecha = new Date(año, mes - 1, dia);
    }
    // Formato DDMMYYYY (sin separadores)
    else if (fechaStr.length === 8 && /^\d{8}$/.test(fechaStr)) {
      // Intentar ambos formatos
      const opcion1 = parseInt(fechaStr.substring(0, 4)); // Año
      const opcion2 = parseInt(fechaStr.substring(4, 8)); // Año
      
      if (opcion1 > 1900 && opcion1 < 2100) {
        // YYYYMMDD
        const año = opcion1;
        const mes = parseInt(fechaStr.substring(4, 6));
        const dia = parseInt(fechaStr.substring(6, 8));
        fecha = new Date(año, mes - 1, dia);
      } else if (opcion2 > 1900 && opcion2 < 2100) {
        // DDMMYYYY
        const dia = parseInt(fechaStr.substring(0, 2));
        const mes = parseInt(fechaStr.substring(2, 4));
        const año = opcion2;
        fecha = new Date(año, mes - 1, dia);
      }
    }
    // Timestamp (número grande)
    else if (/^\d+$/.test(fechaStr) && fechaStr.length > 8) {
      const timestamp = parseInt(fechaStr);
      // Si es en segundos, convertir a milisegundos
      fecha = new Date(timestamp > 1e10 ? timestamp : timestamp * 1000);
    }
    // Otros formatos, intentar parseo directo
    else {
      fecha = new Date(fechaStr);
    }
    
    // Validar que la fecha es válida y razonable
    if (fecha && !isNaN(fecha.getTime())) {
      const año = fecha.getFullYear();
      if (año >= 1900 && año <= 2100) {
        return fecha;
      }
    }
    
  } catch (error) {
    console.warn('Error parseando fecha:', fechaInput, error);
  }
  
  return null;
};

/**
 * Formatea una fecha en formato español
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = parseFechaRobusta(date);
  if (!dateObj) return 'Fecha inválida';
  
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha y hora en formato español
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = parseFechaRobusta(date);
  if (!dateObj) return 'Fecha inválida';
  
  return dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtiene el nombre del mes a partir de su número - CON VALIDACIÓN
 * @param {number} numeroMes - Número del mes (1-12)
 * @returns {string} Nombre del mes
 */
export const obtenerNombreMes = (numeroMes) => {
  // Validación robusta
  const num = typeof numeroMes === 'string' ? parseInt(numeroMes) : numeroMes;
  if (isNaN(num) || num < 1 || num > 12) {
    return `Mes ${numeroMes}`;
  }
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[num - 1];
};

/**
 * Obtiene el nombre corto del mes (3 letras) - CON VALIDACIÓN
 * @param {number} numeroMes - Número del mes (1-12)
 * @returns {string} Nombre corto del mes
 */
export const obtenerNombreMesCorto = (numeroMes) => {
  // Validación robusta
  const num = typeof numeroMes === 'string' ? parseInt(numeroMes) : numeroMes;
  if (isNaN(num) || num < 1 || num > 12) {
    return `M${numeroMes}`;
  }
  
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return meses[num - 1];
};

/**
 * Formatea un porcentaje
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 1)
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${rounded.toFixed(decimals)}%`;
};

/**
 * Formatea un número grande con abreviación (K, M, B)
 * @param {number} value - El valor a formatear
 * @returns {string} Número formateado
 */
export const formatLargeNumber = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString('es-ES');
};

/**
 * Valida si una fecha está en un rango válido
 * @param {string|Date} fecha - La fecha a validar
 * @param {Date} fechaMinima - Fecha mínima permitida (opcional)
 * @param {Date} fechaMaxima - Fecha máxima permitida (opcional)
 * @returns {boolean} True si la fecha es válida
 */
export const validarFecha = (fecha, fechaMinima = null, fechaMaxima = null) => {
  const fechaParseada = parseFechaRobusta(fecha);
  if (!fechaParseada) return false;
  
  if (fechaMinima && fechaParseada < fechaMinima) return false;
  if (fechaMaxima && fechaParseada > fechaMaxima) return false;
  
  return true;
};

/**
 * Compara dos fechas de manera robusta
 * @param {string|Date} fecha1 - Primera fecha
 * @param {string|Date} fecha2 - Segunda fecha
 * @returns {number} -1 si fecha1 < fecha2, 0 si iguales, 1 si fecha1 > fecha2, null si error
 */
export const compararFechas = (fecha1, fecha2) => {
  const f1 = parseFechaRobusta(fecha1);
  const f2 = parseFechaRobusta(fecha2);
  
  if (!f1 || !f2) return null;
  
  if (f1 < f2) return -1;
  if (f1 > f2) return 1;
  return 0;
};

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad por la que agrupar
 * @returns {Object} Objeto agrupado
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const keyValue = item[key];
    result[keyValue] = result[keyValue] || [];
    result[keyValue].push(item);
    return result;
  }, {});
};

/**
 * Suma una propiedad de un array de objetos CON PRECISIÓN MEJORADA
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a sumar
 * @returns {number} Suma total redondeada
 */
export const sumBy = (array, key) => {
  const sum = array.reduce((sum, item) => {
    const value = parseFloat(item[key]) || 0;
    return sum + value;
  }, 0);
  return Math.round(sum * 100) / 100; // Redondear a 2 decimales
};

/**
 * Calcula el promedio de una propiedad de un array de objetos
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a promediar
 * @returns {number} Promedio redondeado
 */
export const avgBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  const avg = sumBy(array, key) / array.length;
  return Math.round(avg * 100) / 100; // Redondear a 2 decimales
};

/**
 * Obtiene el valor mínimo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor mínimo
 */
export const minBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  return Math.min(...array.map(item => parseFloat(item[key]) || 0));
};

/**
 * Obtiene el valor máximo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor máximo
 */
export const maxBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  return Math.max(...array.map(item => parseFloat(item[key]) || 0));
};

/**
 * Formatea un rango de fechas
 * @param {string|Date} startDate - Fecha inicio
 * @param {string|Date} endDate - Fecha fin
 * @returns {string} Rango formateado
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return 'Todas las fechas';
  if (!startDate) return `Hasta ${formatDate(endDate)}`;
  if (!endDate) return `Desde ${formatDate(startDate)}`;
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string|Date} date1 - Primera fecha
 * @param {string|Date} date2 - Segunda fecha
 * @returns {number|null} Diferencia en días o null si error
 */
export const daysBetween = (date1, date2) => {
  const d1 = parseFechaRobusta(date1);
  const d2 = parseFechaRobusta(date2);
  
  if (!d1 || !d2) return null;
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Obtiene el trimestre de una fecha
 * @param {number} mes - Número del mes (1-12)
 * @returns {string} Trimestre (Q1, Q2, Q3, Q4)
 */
export const getQuarter = (mes) => {
  const num = typeof mes === 'string' ? parseInt(mes) : mes;
  if (isNaN(num) || num < 1 || num > 12) return 'Q?';
  
  if (num >= 1 && num <= 3) return 'Q1';
  if (num >= 4 && num <= 6) return 'Q2';
  if (num >= 7 && num <= 9) return 'Q3';
  if (num >= 10 && num <= 12) return 'Q4';
  return 'Q?';
};

/**
 * Convierte una fecha a formato ISO para inputs de tipo date
 * @param {string|Date} fecha - La fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toDateInputValue = (fecha) => {
  const fechaParseada = parseFechaRobusta(fecha);
  if (!fechaParseada) return '';
  
  return fechaParseada.toISOString().split('T')[0];
};

/**
 * Debug: Muestra información detallada sobre el parseo de una fecha
 * @param {any} fechaInput - La fecha a analizar
 * @returns {Object} Información de debug
 */
export const debugFecha = (fechaInput) => {
  const info = {
    input: fechaInput,
    tipo: typeof fechaInput,
    parseada: parseFechaRobusta(fechaInput),
    formateada: null,
    esValida: false
  };
  
  if (info.parseada) {
    info.formateada = formatDate(info.parseada);
    info.esValida = true;
  }
  
  return info;
};

/**
 * Función auxiliar para redondear números con precisión
 * @param {number} value - Valor a redondear
 * @param {number} decimals - Número de decimales (por defecto 2)
 * @returns {number} Número redondeado
 */
export const roundToPrecision = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 0;
  return Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Valida y normaliza un valor numérico
 * @param {any} value - Valor a validar
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number} Valor normalizado
 */
export const normalizeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return defaultValue;
  
  return numValue;
};

/**
 * Valida y normaliza un año
 * @param {any} year - Año a validar
 * @param {number} defaultYear - Año por defecto
 * @returns {number} Año normalizado
 */
export const normalizeYear = (year, defaultYear = new Date().getFullYear()) => {
  const numYear = normalizeNumber(year, defaultYear);
  
  // Validar que esté en un rango razonable
  if (numYear < 1900 || numYear > 2100) {
    return defaultYear;
  }
  
  return numYear;
};

/**
 * Valida y normaliza un mes
 * @param {any} month - Mes a validar
 * @param {number} defaultMonth - Mes por defecto
 * @returns {number} Mes normalizado (1-12)
 */
export const normalizeMonth = (month, defaultMonth = 1) => {
  const numMonth = normalizeNumber(month, defaultMonth);
  
  // Validar que esté en el rango 1-12
  if (numMonth < 1 || numMonth > 12) {
    return defaultMonth;
  }
  
  return numMonth;
};

/**
 * Extrae año y mes de una fecha con fallback
 * @param {Object} item - Objeto con propiedades eje, mes, fch
 * @returns {Object} {año, mes} normalizados
 */
export const extractYearMonth = (item) => {
  let año = item.eje;
  let mes = item.mes;

  // Si año o mes no son válidos, extraer de la fecha
  if (!año || año <= 0 || !mes || mes <= 0 || mes > 12) {
    const fecha = parseFechaRobusta(item.fch);
    if (fecha) {
      if (!año || año <= 0) {
        año = fecha.getFullYear();
      }
      if (!mes || mes <= 0 || mes > 12) {
        mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      }
    }
  }

  return {
    año: normalizeYear(año),
    mes: normalizeMonth(mes)
  };
};

// Exportar todo por defecto también para compatibilidad
export default {
  formatCurrency,
  parseFechaRobusta,
  formatDate,
  formatDateTime,
  obtenerNombreMes,
  obtenerNombreMesCorto,
  formatPercentage,
  formatLargeNumber,
  validarFecha,
  compararFechas,
  groupBy,
  sumBy,
  avgBy,
  minBy,
  maxBy,
  formatDateRange,
  daysBetween,
  getQuarter,
  toDateInputValue,
  debugFecha,
  roundToPrecision,
  normalizeNumber,
  normalizeYear,
  normalizeMonth,
  extractYearMonth
};









