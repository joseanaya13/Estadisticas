// services/api.js - Archivo principal que exporta todos los servicios

// Re-exportar todo desde apiClient
export { apiClient, apiUtils } from './apiClient.js';

// Re-exportar servicios principales (estos archivos exportan instancias singleton)
export { ventasService } from './ventasService.js';
export { comprasService } from './comprasService.js';
export { dashboardService } from './dashboardService.js';

// Re-exportar servicios de datos maestros (estos archivos exportan instancias singleton)
export { empresasService } from './empresasService.js';
export { contactosService } from './contactosService.js';
export { usuariosService } from './usuariosService.js';
export { formasPagoService } from './formasPagoService.js';

// Exportar también como default para mayor compatibilidad
import { apiClient, apiUtils } from './apiClient.js';
import { ventasService } from './ventasService.js';
import { comprasService } from './comprasService.js';
import { dashboardService } from './dashboardService.js';
import { empresasService } from './empresasService.js';
import { contactosService } from './contactosService.js';
import { usuariosService } from './usuariosService.js';
import { formasPagoService } from './formasPagoService.js';

export default {
  apiClient,
  apiUtils,
  ventasService,
  comprasService,
  dashboardService,
  empresasService,
  contactosService,
  usuariosService,
  formasPagoService
};