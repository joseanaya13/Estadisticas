// services/index.js - Exportador principal de todos los servicios
export { apiClient, default as apiClientDefault } from './apiClient.js';
export { ventasService, default as ventasServiceDefault } from './ventasService.js';
export { comprasService, default as comprasServiceDefault } from './comprasService.js';
export { usuariosService, default as usuariosServiceDefault } from './usuariosService.js';
export { contactosService, default as contactosServiceDefault } from './contactosService.js';
export { empresasService, default as empresasServiceDefault } from './empresasService.js';
export { dashboardService, default as dashboardServiceDefault } from './dashboardService.js';

// Para mantener compatibilidad con el código existente
export const formasPagoService = {
  /**
   * Obtiene todas las formas de pago
   * @returns {Promise} Promesa con los datos
   */
  getFormasPago: async () => {
    try {
      const { apiClient } = await import('./apiClient.js');
      const response = await apiClient.get('/fpg_m');
      return response;
    } catch (error) {
      console.error('Error al obtener formas de pago:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene una forma de pago por ID
   * @param {number} id - ID de la forma de pago
   * @returns {Promise} Promesa con los datos
   */
  getFormaPago: async (id) => {
    const { apiClient } = await import('./apiClient.js');
    return apiClient.get(`/fpg_m/${id}`);
  },
  
  /**
   * Obtiene el nombre de una forma de pago por su ID
   * @param {string|number} id - ID de la forma de pago
   * @param {Array} formasPagoList - Lista de formas de pago (opcional)
   * @returns {string} Nombre de la forma de pago
   */
  getNombreFormaPago: (id, formasPagoList = []) => {
    if (!id) return 'Sin forma de pago';
    
    const formaPago = formasPagoList.find(fp => fp.id === id || fp.id === parseInt(id));
    return formaPago ? formaPago.name : `Forma de pago ${id}`;
  },
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} formasPagoList - Lista de formas de pago
   * @returns {Object} Mapa de ID a nombre
   */
  crearMapaNombres: (formasPagoList = []) => {
    const mapa = {};
    formasPagoList.forEach(formaPago => {
      if (formaPago.id !== undefined && formaPago.name) {
        mapa[formaPago.id] = formaPago.name;
      }
    });
    return mapa;
  }
};

// Exportación por defecto con todos los servicios agrupados
export default {
  api: apiClientDefault,
  ventas: ventasServiceDefault,
  compras: comprasServiceDefault,
  usuarios: usuariosServiceDefault,
  contactos: contactosServiceDefault,
  empresas: empresasServiceDefault,
  dashboard: dashboardServiceDefault,
  formasPago: formasPagoService
};