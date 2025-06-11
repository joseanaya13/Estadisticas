// config/app.config.js - ACTUALIZADO CON ANÁLISIS TYC
export const APP_CONFIG = {
  name: 'Bardina Analytics',
  version: '2.1.0',
  description: 'Sistema de análisis empresarial con análisis TyC',
  author: 'Equipo Desarrollo',
  
  // Configuración de API
  api: {
    timeout: 30000,
    retries: 3,
    baseURL: process.env.REACT_APP_API_URL || '/api'
  },

  // Configuración de logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    console: process.env.NODE_ENV === 'development',
    remote: false
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
  
  // Datos transaccionales
  lineasFacturas: '/fac_l',
  lineasAlbaranes: '/com_alb_l',
  movimientos: '/mov_alm',
  stock: '/exs_g',
  
  // ✅ NUEVOS ENDPOINTS PARA TYC
  articulosTyc: '/art_tyc',
  movimientosTyc: '/mov_tyc_g',
  tallas: '/tll_m', // Futuro endpoint
  colores: '/col_m'  // Futuro endpoint
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
  // ✅ NUEVO: ANÁLISIS TYC
  {
    id: 'tyc',
    path: '/tyc',
    label: 'Análisis TyC',
    icon: 'th-large',
    order: 4,
    enabled: true,
    badge: 'NUEVO',
    description: 'Análisis de existencias y ventas por tallas y colores',
    requiredData: ['art_tyc', 'mov_tyc_g', 'art_m']
  },
  // Funcionalidades futuras
  {
    id: 'sellout',
    path: '/sellout',
    label: 'Sell Out',
    icon: 'chart-area',
    order: 5,
    enabled: false,
    badge: 'PRÓXIMO',
    description: 'Análisis de rotación y rendimiento de inventario'
  },
  {
    id: 'inventario',
    path: '/inventario',
    label: 'Inventario',
    icon: 'boxes',
    order: 6,
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
    enabled: true,
    requiredData: ['fac_l', 'prv_m']
  },
  MARCAS: {
    id: 'marcas',
    label: 'Por Marcas',
    icon: 'tags',
    description: 'Análisis de ventas segmentado por marca',
    enabled: false,
    requiredData: ['fac_l', 'art_m', 'mar_m'],
    badge: 'PRÓXIMO'
  }
};

// ✅ NUEVA CONFIGURACIÓN PARA TYC
export const TYC_CONFIG = {
  // Configuración de matriz
  maxTallas: 20,
  maxColores: 50,
  
  // Configuración de caché
  cacheExpiry: 10 * 60 * 1000, // 10 minutos
  
  // Configuración de paginación
  filasPorPagina: 20,
  
  // Configuración de exportación
  exportFormatos: ['csv', 'xlsx'],
  
  // Maestros por defecto (mientras no hay endpoints)
  maestroTallas: {
    1: { id: 1, abr: 'XS', name: 'Extra Small', ord: 1 },
    2: { id: 2, abr: 'S', name: 'Small', ord: 2 },
    3: { id: 3, abr: 'M', name: 'Medium', ord: 3 },
    4: { id: 4, abr: 'L', name: 'Large', ord: 4 },
    5: { id: 5, abr: 'XL', name: 'Extra Large', ord: 5 },
    6: { id: 6, abr: 'XXL', name: 'Extra Extra Large', ord: 6 },
    7: { id: 7, abr: '34', name: 'Talla 34', ord: 7 },
    8: { id: 8, abr: '36', name: 'Talla 36', ord: 8 },
    9: { id: 9, abr: '38', name: 'Talla 38', ord: 9 },
    10: { id: 10, abr: '40', name: 'Talla 40', ord: 10 },
    11: { id: 11, abr: '42', name: 'Talla 42', ord: 11 },
    12: { id: 12, abr: '44', name: 'Talla 44', ord: 12 },
    13: { id: 13, abr: '46', name: 'Talla 46', ord: 13 },
    14: { id: 14, abr: '48', name: 'Talla 48', ord: 14 },
    15: { id: 15, abr: '50', name: 'Talla 50', ord: 15 },
    16: { id: 16, abr: 'U', name: 'Única', ord: 16 }
  },
  
  maestroColores: {
    1: { id: 1, name: 'Blanco', abr: 'BLA', ref: 'WHITE', hex: '#FFFFFF' },
    2: { id: 2, name: 'Negro', abr: 'NEG', ref: 'BLACK', hex: '#000000' },
    3: { id: 3, name: 'Rojo', abr: 'ROJ', ref: 'RED', hex: '#FF0000' },
    4: { id: 4, name: 'Azul', abr: 'AZU', ref: 'BLUE', hex: '#0000FF' },
    5: { id: 5, name: 'Verde', abr: 'VER', ref: 'GREEN', hex: '#00FF00' },
    6: { id: 6, name: 'Amarillo', abr: 'AMA', ref: 'YELLOW', hex: '#FFFF00' },
    7: { id: 7, name: 'Rosa', abr: 'ROS', ref: 'PINK', hex: '#FFC0CB' },
    8: { id: 8, name: 'Gris', abr: 'GRI', ref: 'GRAY', hex: '#808080' },
    9: { id: 9, name: 'Marrón', abr: 'MAR', ref: 'BROWN', hex: '#8B4513' },
    10: { id: 10, name: 'Naranja', abr: 'NAR', ref: 'ORANGE', hex: '#FFA500' },
    11: { id: 11, name: 'Morado', abr: 'MOR', ref: 'PURPLE', hex: '#800080' },
    12: { id: 12, name: 'Beige', abr: 'BEI', ref: 'BEIGE', hex: '#F5F5DC' },
    13: { id: 13, name: 'Plateado', abr: 'PLA', ref: 'SILVER', hex: '#C0C0C0' },
    14: { id: 14, name: 'Dorado', abr: 'DOR', ref: 'GOLD', hex: '#FFD700' },
    15: { id: 15, name: 'Multicolor', abr: 'MUL', ref: 'MULTI', hex: '#FF6B6B' }
  }
};

// Configuración de filtros adaptativos
export const FILTER_CONTEXTS = {
  ventas: {
    name: 'Análisis de Ventas',
    availableFilters: ['año', 'mes', 'cliente', 'tienda', 'vendedor', 'fechaDesde', 'fechaHasta', 'formaPago'],
    requiredData: ['fac_t']
  },
  compras: {
    name: 'Análisis de Compras', 
    availableFilters: ['año', 'mes', 'proveedor', 'tienda', 'fechaDesde', 'fechaHasta'],
    requiredData: ['com_alb_g']
  },
  productos: {
    name: 'Análisis de Productos',
    availableFilters: ['marca', 'categoria', 'proveedor', 'temporada', 'año'],
    requiredData: ['art_m']
  },
  // ✅ NUEVO CONTEXTO PARA TYC
  tyc: {
    name: 'Análisis Tallas y Colores',
    availableFilters: ['proveedor', 'marca', 'familia', 'temporada', 'almacen', 'empresa', 'fechaInicio', 'fechaFin'],
    requiredData: ['art_tyc', 'mov_tyc_g', 'art_m']
  }
};

// Configuración de temas
export const THEMES = {
  light: {
    name: 'Claro',
    icon: 'sun'
  },
  dark: {
    name: 'Oscuro', 
    icon: 'moon'
  },
  auto: {
    name: 'Automático',
    icon: 'adjust'
  }
};

// Configuración de performance
export const PERFORMANCE = {
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    showSizeOptions: [10, 25, 50, 100]
  },
  caching: {
    defaultExpiry: 5 * 60 * 1000, // 5 minutos
    maxCacheSize: 50, // máximo 50 entradas en caché
    enablePersistence: false // no persistir caché en localStorage
  },
  virtualScrolling: {
    enabled: false, // deshabilitar por ahora
    threshold: 1000 // activar con más de 1000 elementos
  }
};

// Configuración de exportación
export const EXPORT_CONFIG = {
  formats: {
    csv: {
      name: 'CSV',
      extension: 'csv',
      mimeType: 'text/csv',
      separator: ','
    },
    excel: {
      name: 'Excel',
      extension: 'xlsx', 
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    pdf: {
      name: 'PDF',
      extension: 'pdf',
      mimeType: 'application/pdf',
      enabled: false // por implementar
    }
  },
  maxRows: 10000, // máximo 10k filas por exportación
  includeHeaders: true,
  includeMetadata: true
};

export default APP_CONFIG;