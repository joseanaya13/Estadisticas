// src/services/index.js - VERSIÓN ACTUALIZADA CON NUEVOS SERVICIOS

// Cliente API base
export { apiClient, apiUtils } from './core/apiClient';

// === SERVICIOS CORE (Principales) ===
export { ventasService } from './core/ventasService';
export { comprasService } from './core/comprasService';
export { dashboardService } from './core/dashboardService';

// === SERVICIOS MAESTROS (Datos de Referencia) ===
export { contactosService } from './maestros/contactosService';
export { usuariosService } from './maestros/usuariosService';
export { empresasService } from './maestros/empresasService';
export { formasPagoService } from './maestros/formasPagoService';

// 🆕 NUEVOS SERVICIOS MAESTROS
export { marcasService } from './maestros/marcasService';
export { temporadasService } from './maestros/temporadasService';
export { articulosService } from './maestros/articulosService';
export { proveedoresService } from './maestros/proveedoresService';

// === SERVICIOS TRANSACCIONALES (Datos Detallados) ===
// 🆕 NUEVO SERVICIO PRINCIPAL PARA ANÁLISIS DETALLADO
export { lineasFacturasService } from './transaccionales/lineasFacturasService';

// 🆕 Servicios por implementar (cuando estén los endpoints disponibles)
// export { lineasComprasService } from './transaccionales/lineasComprasService';
// export { movimientosService } from './transaccionales/movimientosService';
// export { stockService } from './transaccionales/stockService';

// === SERVICIOS ANALYTICS (Análisis Avanzado) ===
// 🆕 Servicios por implementar (funcionalidades futuras)
// export { selloutService } from './analytics/selloutService';
// export { inventarioService } from './analytics/inventarioService';
// export { rotacionService } from './analytics/rotacionService';
// export { rentabilidadService } from './analytics/rentabilidadService';

// === EXPORTACIONES AGRUPADAS POR CATEGORÍA ===

// Servicios principales (datos principales de la aplicación)
export const coreServices = {
  ventas: () => import('./core/ventasService').then(m => m.ventasService),
  compras: () => import('./core/comprasService').then(m => m.comprasService),
  dashboard: () => import('./core/dashboardService').then(m => m.dashboardService)
};

// Servicios maestros (datos de referencia/catálogos)
export const maestrosServices = {
  contactos: () => import('./maestros/contactosService').then(m => m.contactosService),
  usuarios: () => import('./maestros/usuariosService').then(m => m.usuariosService),
  empresas: () => import('./maestros/empresasService').then(m => m.empresasService),
  formasPago: () => import('./maestros/formasPagoService').then(m => m.formasPagoService),
  marcas: () => import('./maestros/marcasService').then(m => m.marcasService),
  temporadas: () => import('./maestros/temporadasService').then(m => m.temporadasService),
  articulos: () => import('./maestros/articulosService').then(m => m.articulosService),
  proveedores: () => import('./maestros/proveedoresService').then(m => m.proveedoresService)
};

// Servicios transaccionales (datos detallados/líneas)
export const transaccionalesServices = {
  lineasFacturas: () => import('./transaccionales/lineasFacturasService').then(m => m.lineasFacturasService)
  // lineasCompras: () => import('./transaccionales/lineasComprasService').then(m => m.lineasComprasService),
  // movimientos: () => import('./transaccionales/movimientosService').then(m => m.movimientosService),
  // stock: () => import('./transaccionales/stockService').then(m => m.stockService)
};

// === UTILIDADES DE SERVICIOS ===

/**
 * Función auxiliar para cargar todos los servicios maestros
 * @returns {Promise<Object>} Todos los servicios maestros cargados
 */
export const loadAllMaestros = async () => {
  const services = {};
  
  try {
    const [
      contactos,
      usuarios,
      empresas,
      formasPago,
      marcas,
      temporadas,
      articulos,
      proveedores
    ] = await Promise.all([
      maestrosServices.contactos(),
      maestrosServices.usuarios(),
      maestrosServices.empresas(),
      maestrosServices.formasPago(),
      maestrosServices.marcas(),
      maestrosServices.temporadas(),
      maestrosServices.articulos(),
      maestrosServices.proveedores()
    ]);
    
    return {
      contactos,
      usuarios,
      empresas,
      formasPago,
      marcas,
      temporadas,
      articulos,
      proveedores
    };
  } catch (error) {
    console.error('Error cargando servicios maestros:', error);
    throw error;
  }
};

/**
 * Función auxiliar para limpiar todas las cachés
 */
export const clearAllCaches = async () => {
  try {
    const allServices = await loadAllMaestros();
    const coreServicesLoaded = await Promise.all([
      coreServices.ventas(),
      coreServices.compras(),
      coreServices.dashboard()
    ]);
    
    const transaccionalesLoaded = await Promise.all([
      transaccionalesServices.lineasFacturas()
    ]);
    
    // Limpiar cachés de servicios core
    coreServicesLoaded.forEach(service => {
      if (service.clearCache) service.clearCache();
    });
    
    // Limpiar cachés de servicios maestros
    Object.values(allServices).forEach(service => {
      if (service.clearCache) service.clearCache();
    });
    
    // Limpiar cachés de servicios transaccionales
    transaccionalesLoaded.forEach(service => {
      if (service.clearCache) service.clearCache();
    });
    
    console.log('🧹 Todas las cachés han sido limpiadas');
  } catch (error) {
    console.error('Error limpiando cachés:', error);
    throw error;
  }
};

/**
 * Función auxiliar para obtener estadísticas de todas las cachés
 */
export const getAllCacheStats = async () => {
  try {
    const stats = {
      core: {},
      maestros: {},
      transaccionales: {},
      totalSize: 0
    };
    
    // Stats de servicios core
    const coreServicesLoaded = await Promise.all([
      coreServices.ventas(),
      coreServices.compras(),
      coreServices.dashboard()
    ]);
    
    ['ventas', 'compras', 'dashboard'].forEach((name, index) => {
      const service = coreServicesLoaded[index];
      if (service.getCacheStats) {
        stats.core[name] = service.getCacheStats();
        stats.totalSize += stats.core[name].size;
      }
    });
    
    // Stats de servicios maestros
    const maestrosLoaded = await loadAllMaestros();
    Object.entries(maestrosLoaded).forEach(([name, service]) => {
      if (service.getCacheStats) {
        stats.maestros[name] = service.getCacheStats();
        stats.totalSize += stats.maestros[name].size;
      }
    });
    
    // Stats de servicios transaccionales
    const transaccionalesLoaded = await Promise.all([
      transaccionalesServices.lineasFacturas()
    ]);
    
    ['lineasFacturas'].forEach((name, index) => {
      const service = transaccionalesLoaded[index];
      if (service.getCacheStats) {
        stats.transaccionales[name] = service.getCacheStats();
        stats.totalSize += stats.transaccionales[name].size;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de caché:', error);
    return { error: error.message };
  }
};

// === CONFIGURACIÓN DE ENDPOINTS ===
export const ENDPOINTS = {
  // Datos principales
  facturas: '/fac_t',
  albaranes: '/com_alb_g',
  
  // Maestros existentes
  contactos: '/ent_m',
  usuarios: '/usr_m',
  empresas: '/emp_m',
  formasPago: '/fpg_m',
  
  // 🆕 Nuevos maestros
  marcas: '/mar_m',
  temporadas: '/temp_m',
  articulos: '/art_m',
  proveedores: '/ent_m', // Mismo endpoint pero filtrado por es_prv: true
  
  // 🆕 Datos transaccionales
  lineasFacturas: '/fac_lin_t',
  
  // Futuros endpoints
  lineasAlbaranes: '/com_alb_l',
  movimientos: '/mov_alm',
  stock: '/exs_g'
};

// === MAPEO DE SERVICIOS PARA USO DINÁMICO ===
export const SERVICE_MAP = {
  // Core
  'ventas': 'ventasService',
  'compras': 'comprasService',
  'dashboard': 'dashboardService',
  
  // Maestros
  'contactos': 'contactosService',
  'usuarios': 'usuariosService',
  'empresas': 'empresasService',
  'formasPago': 'formasPagoService',
  'marcas': 'marcasService',
  'temporadas': 'temporadasService',
  'articulos': 'articulosService',
  'proveedores': 'proveedoresService',
  
  // Transaccionales
  'lineasFacturas': 'lineasFacturasService'
};

/**
 * Función auxiliar para obtener un servicio por nombre
 * @param {string} serviceName - Nombre del servicio
 * @returns {Promise<Object>} Instancia del servicio
 */
export const getService = async (serviceName) => {
  const serviceVar = SERVICE_MAP[serviceName];
  if (!serviceVar) {
    throw new Error(`Servicio '${serviceName}' no encontrado`);
  }
  
  // Importación dinámica basada en categoría
  if (['ventas', 'compras', 'dashboard'].includes(serviceName)) {
    const module = await import(`./core/${serviceName}Service`);
    return module[serviceVar];
  }
  
  if (['contactos', 'usuarios', 'empresas', 'formasPago', 'marcas', 'temporadas', 'articulos', 'proveedores'].includes(serviceName)) {
    const module = await import(`./maestros/${serviceName}Service`);
    return module[serviceVar];
  }
  
  if (['lineasFacturas'].includes(serviceName)) {
    const module = await import(`./transaccionales/${serviceName}Service`);
    return module[serviceVar];
  }
  
  throw new Error(`Categoría del servicio '${serviceName}' no reconocida`);
};

// Exportación por defecto con funciones de utilidad
export default {
  // Servicios individuales
  coreServices,
  maestrosServices,
  transaccionalesServices,
  
  // Utilidades
  loadAllMaestros,
  clearAllCaches,
  getAllCacheStats,
  getService,
  
  // Configuración
  ENDPOINTS,
  SERVICE_MAP
};
