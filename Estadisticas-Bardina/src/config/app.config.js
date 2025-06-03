// src/config/app.config.js
/**
 * Configuración principal de la aplicación Bardina
 */

export const APP_CONFIG = {
  // Información de la aplicación
  name: 'Estadísticas Bardina',
  version: __APP_VERSION__ || '1.0.0',
  description: 'Sistema de análisis comercial',
  author: 'Consultoría Principado',

  // Configuración de API
  api: {
    baseUrl: 'https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  },

  // Configuración de paginación
  pagination: {
    defaultPageSize: 1000,
    maxPageSize: 5000
  },

  // Configuración de caché
  cache: {
    defaultExpiry: 15 * 60 * 1000, // 15 minutos
    masterDataExpiry: 30 * 60 * 1000, // 30 minutos para datos maestros
    transactionalExpiry: 5 * 60 * 1000 // 5 minutos para datos transaccionales
  },

  // Configuración de exportación
  export: {
    maxRows: 100000,
    defaultFormat: 'excel',
    filename: {
      prefix: 'bardina',
      includeTimestamp: true,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss'
    }
  },

  // Configuración de UI
  ui: {
    theme: {
      default: 'light',
      available: ['light', 'dark', 'auto']
    },
    animations: {
      enabled: true,
      duration: 300
    },
    charts: {
      colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'],
      defaultHeight: 300,
      responsive: true
    }
  },

  // Configuración de rutas
  routes: {
    default: '/dashboard',
    public: ['/dashboard'],
    private: [] // Para futuro sistema de autenticación
  },

  // Configuración de features (para habilitar/deshabilitar funcionalidades)
  features: {
    export: true,
    darkMode: true,
    notifications: true,
    analytics: true,
    debugging: process.env.NODE_ENV === 'development'
  },

  // Configuración de logging
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    console: process.env.NODE_ENV === 'development',
    remote: false // Para futuro logging remoto
  },

  // Configuración de formato de datos
  formats: {
    currency: {
      locale: 'es-ES',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    date: {
      locale: 'es-ES',
      format: 'DD/MM/YYYY',
      timeFormat: 'HH:mm'
    },
    number: {
      locale: 'es-ES',
      maximumFractionDigits: 2
    }
  }
};

export const ENDPOINTS = {
  // Datos principales
  facturas: '/fac_t',
  albaranes: '/com_alb_g',
  
  // Datos maestros
  contactos: '/ent_m',
  usuarios: '/usr_m',
  empresas: '/emp_m',
  formasPago: '/fpg_m',
  articulos: '/art_m',
  proveedores: '/prv_m',
  marcas: '/mar_m',
  temporadas: '/tmp_m',
  
  // Datos transaccionales (nuevos)
  lineasFacturas: '/fac_l',
  lineasAlbaranes: '/com_alb_l',
  movimientos: '/mov_alm',
  stock: '/exs_g'
};

export const NAVIGATION = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'tachometer-alt',
    order: 1,
    enabled: true
  },
  {
    id: 'ventas',
    path: '/ventas',
    label: 'Ventas',
    icon: 'shopping-cart',
    order: 2,
    enabled: true
  },
  {
    id: 'ventas-detalladas',
    path: '/ventas-detalladas',
    label: 'Ventas Detalladas',
    icon: 'chart-line',
    order: 3,
    enabled: true,
  },
  {
    id: 'compras',
    path: '/compras',
    label: 'Compras',
    icon: 'truck',
    order: 4,
    enabled: true
  },
  {
    id: 'sellout',
    path: '/sellout',
    label: 'Sell Out',
    icon: 'chart-area',
    order: 5,
    enabled: false, // Deshabilitar hasta implementar
    badge: 'NUEVO'
  },
  {
    id: 'inventario',
    path: '/inventario',
    label: 'Inventario',
    icon: 'boxes',
    order: 6,
    enabled: false, // Deshabilitar hasta implementar
    badge: 'NUEVO'
  }
];

// Constantes de uso común
export const CONSTANTS = {
  // Estados de carga
  LOADING_STATES: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
  },

  // Tipos de exportación
  EXPORT_TYPES: {
    EXCEL: 'excel',
    CSV: 'csv',
    PDF: 'pdf'
  },

  // Períodos de análisis
  PERIODS: {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year'
  },

  // Métricas de sell-out
  SELLOUT_METRICS: {
    RATIO: 'ratio',
    ROTATION: 'rotation',
    VELOCITY: 'velocity',
    STOCK_DAYS: 'stock_days'
  },

  // Tipos de alerta
  ALERT_TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  }
};

export default APP_CONFIG;