// src/services/index.js - VERSIÓN LIMPIA SIN REDUNDANCIAS

// Cliente API base
export { apiClient, apiUtils } from './core/apiClient';

// Servicios por módulos (barrel exports)
export * from './core';
export * from './maestros';

// 🆕 Nuevos módulos (descomentar cuando estén listos)
export * from './transaccionales';
// export * from './analytics';
