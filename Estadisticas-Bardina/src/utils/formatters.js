// utils/formatters.js
/**
 * Formatea un valor numérico como moneda (EUR)
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 2)
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === undefined || value === null) return '€0,00';
  return `€${value.toLocaleString('es-ES', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Formatea una fecha en formato español
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
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
  const dateObj = new Date(date);
  return dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtiene el nombre del mes a partir de su número
 * @param {number} numeroMes - Número del mes (1-12)
 * @returns {string} Nombre del mes
 */
export const obtenerNombreMes = (numeroMes) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[numeroMes - 1] || `Mes ${numeroMes}`;
};

/**
 * Obtiene el nombre corto del mes (3 letras)
 * @param {number} numeroMes - Número del mes (1-12)
 * @returns {string} Nombre corto del mes
 */
export const obtenerNombreMesCorto = (numeroMes) => {
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return meses[numeroMes - 1] || `M${numeroMes}`;
};

/**
 * Formatea un porcentaje
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 1)
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatea un número grande con abreviación (K, M, B)
 * @param {number} value - El valor a formatear
 * @returns {string} Número formateado
 */
export const formatLargeNumber = (value) => {
  if (value === undefined || value === null) return '0';
  
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
 * Suma una propiedad de un array de objetos
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a sumar
 * @returns {number} Suma total
 */
export const sumBy = (array, key) => {
  return array.reduce((sum, item) => sum + (item[key] || 0), 0);
};

/**
 * Calcula el promedio de una propiedad de un array de objetos
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a promediar
 * @returns {number} Promedio
 */
export const avgBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  return sumBy(array, key) / array.length;
};

/**
 * Obtiene el valor mínimo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor mínimo
 */
export const minBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  return Math.min(...array.map(item => item[key] || 0));
};

/**
 * Obtiene el valor máximo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor máximo
 */
export const maxBy = (array, key) => {
  if (!array || array.length === 0) return 0;
  return Math.max(...array.map(item => item[key] || 0));
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
 * @returns {number} Diferencia en días
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
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
  if (mes >= 1 && mes <= 3) return 'Q1';
  if (mes >= 4 && mes <= 6) return 'Q2';
  if (mes >= 7 && mes <= 9) return 'Q3';
  if (mes >= 10 && mes <= 12) return 'Q4';
  return 'Q?';
};











