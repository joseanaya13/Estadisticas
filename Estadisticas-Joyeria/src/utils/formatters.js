// Formateo de monedas
export const formatCurrency = (amount, currency = 'EUR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0,00';
  }
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Formateo de fechas
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Formateo de fechas específico para Velneo
export const formatVelneoDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    // Velneo devuelve fechas en formato ISO: "2024-10-01T00:00:00.000Z"
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Error formatting Velneo date:', error);
    return dateString;
  }
};

// Formateo de horas específico para Velneo
export const formatVelneoTime = (timeString) => {
  if (!timeString) return '-';
  
  try {
    // Velneo devuelve horas en formato: "Thu Jun 12 13:46:44 2025 GMT+0200"
    const date = new Date(timeString);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error('Error formatting Velneo time:', error);
    // Si falla, intentar extraer solo la hora
    const timeMatch = timeString.match(/(\d{2}):(\d{2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : timeString;
  }
};

// Formateo de números
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Formateo de porcentajes
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${formatNumber(value, decimals)}%`;
};

// Formateo de peso
export const formatWeight = (grams) => {
  if (!grams || isNaN(grams)) return '0g';
  
  if (grams >= 1000) {
    return `${formatNumber(grams / 1000, 2)}kg`;
  }
  
  return `${formatNumber(grams, 1)}g`;
};

// Formateo de referencias de artículos
export const formatReference = (ref) => {
  if (!ref) return '-';
  return ref.toString().toUpperCase();
};

// Obtener clase CSS para familia de producto
export const getFamilyColorClass = (familyName) => {
  if (!familyName) return 'bg-gray-100 text-gray-800';
  
  const family = familyName.toLowerCase();
  
  if (family.includes('oro')) {
    return 'familia-oro';
  } else if (family.includes('plata')) {
    return 'familia-plata';
  } else if (family.includes('pila')) {
    return 'familia-pilas';
  } else if (family.includes('correa')) {
    return 'familia-correas';
  } else {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Obtener clase CSS para beneficio
export const getBenefitColorClass = (benefit) => {
  if (!benefit || isNaN(benefit)) return 'beneficio-neutro';
  
  if (benefit > 0) {
    return 'beneficio-positivo';
  } else if (benefit < 0) {
    return 'beneficio-negativo';
  } else {
    return 'beneficio-neutro';
  }
};

// Formateo de estados de stock
export const formatStockStatus = (currentStock, minStock = 0) => {
  if (currentStock === null || currentStock === undefined) {
    return { text: 'Sin datos', class: 'text-gray-500' };
  }
  
  if (currentStock <= 0) {
    return { text: 'Agotado', class: 'text-red-600 font-semibold' };
  } else if (currentStock <= minStock) {
    return { text: 'Stock bajo', class: 'text-orange-600 font-medium' };
  } else {
    return { text: 'En stock', class: 'text-green-600' };
  }
};

// Formateo de formas de pago
export const formatPaymentMethod = (method) => {
  if (!method) return '-';
  
  const methods = {
    'CONTADO': 'Efectivo',
    'TARJETA': 'Tarjeta',
    'TRANSFERENCIA': 'Transferencia',
    'CHEQUE': 'Cheque',
  };
  
  return methods[method.toUpperCase()] || method;
};

// Truncar texto con puntos suspensivos
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Formateo de tamaño de archivos
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};