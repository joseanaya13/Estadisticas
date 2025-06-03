// src/services/index.js - BARREL EXPORT PRINCIPAL
// Cliente API base
export { apiClient, apiUtils } from './apiClient';

// Servicios principales
export * from './core';
export * from './maestros';

// 🆕 Nuevos servicios (descomentar cuando estén listos)
// export * from './transaccionales';
// export * from './analytics';

// Mantener compatibilidad con imports actuales
export { ventasService, comprasService, dashboardService } from './core';
export { 
  contactosService, 
  usuariosService, 
  empresasService, 
  formasPagoService 
} from './maestros';
