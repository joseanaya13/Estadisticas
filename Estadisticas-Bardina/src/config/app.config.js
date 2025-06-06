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
    enabled: true,
    description: 'Vista general del negocio'
  },
  {
    id: 'ventas',
    path: '/ventas',
    label: 'Análisis de Ventas',
    icon: 'chart-line',
    order: 2,
    enabled: true,
    description: 'Dashboard completo de ventas con métricas, gráficos y ranking de vendedores'
  },
  {
    id: 'compras',
    path: '/compras',
    label: 'Compras',
    icon: 'truck',
    order: 3,
    enabled: true,
    description: 'Análisis de compras por proveedor y período'
  },
  // Funcionalidades futuras - DESHABILITADAS
  {
    id: 'sellout',
    path: '/sellout',
    label: 'Sell Out',
    icon: 'chart-area',
    order: 4,
    enabled: false,
    badge: 'PRÓXIMO',
    description: 'Análisis de rotación y rendimiento de inventario'
  },
  {
    id: 'inventario',
    path: '/inventario',
    label: 'Inventario',
    icon: 'boxes',
    order: 5,
    enabled: false,
    badge: 'PRÓXIMO',
    description: 'Control y análisis de stock por ubicación y marca'
  }
];

// Configuración de vistas dentro de la página de ventas
export const VENTAS_VIEWS = {
  DASHBOARD: {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'tachometer-alt',
    description: 'Resumen ejecutivo con KPIs principales',
    enabled: true
  },
  GRAFICOS: {
    id: 'graficos',
    label: 'Análisis Temporal',
    icon: 'chart-line',
    description: 'Gráficos detallados de tendencias y evolución',
    enabled: true
  },
  VENDEDORES: {
    id: 'vendedores',
    label: 'Ranking Vendedores',
    icon: 'users',
    description: 'Tabla detallada con performance por vendedor',
    enabled: true
  },
  PROVEEDORES: {
    id: 'proveedores',
    label: 'Por Proveedores',
    icon: 'industry',
    description: 'Análisis de ventas segmentado por proveedor',
    enabled: false,
    requiredData: ['fac_l', 'prv_m'],
    badge: 'PRÓXIMO'
  },
  MARCAS: {
    id: 'marcas',
    label: 'Por Marcas',
    icon: 'tags',
    description: 'Análisis de ventas segmentado por marca',
    enabled: false,
    requiredData: ['fac_l', 'art_m', 'mar_m'],
    badge: 'PRÓXIMO'
  },
  TEMPORADAS: {
    id: 'temporadas',
    label: 'Por Temporadas',
    icon: 'calendar-alt',
    description: 'Análisis de ventas por temporadas y períodos',
    enabled: false,
    requiredData: ['fac_l', 'tmp_m', 'art_m'],
    badge: 'PRÓXIMO'
  }
};

// Configuración de filtros por página
export const FILTROS_CONFIG = {
  DASHBOARD: [
    'año',
    'mes',
    'fechaDesde',
    'fechaHasta'
  ],
  VENTAS: [
    'año',
    'mes', 
    'vendedor',
    'fechaDesde',
    'fechaHasta'
  ],
  COMPRAS: [
    'año',
    'mes',
    'proveedor'
  ]
};

// Configuración de gráficos por vista
export const GRAFICOS_CONFIG = {
  DASHBOARD_VENTAS: [
    'ventasPorMes',
    'topVendedores'
  ],
  FULL_VENTAS: [
    'ventasPorMes',
    'topVendedores',
    'ticketPromedio',
    'ventasPorDias',
    'topClientes',
    'formasPago'
  ]
};

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