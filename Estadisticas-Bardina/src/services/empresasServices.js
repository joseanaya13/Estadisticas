// Actualización para services/api.js - Agregar al final del archivo existente

// Actualizar la exportación de empresasService para que esté disponible
export { empresasService } from './api.js';

// O si no funciona, agregar esta implementación completa:

// Servicio para empresas (actualizado)
export const empresasService = {
  /**
   * Obtiene todas las empresas
   * @returns {Promise} Promesa con los datos
   */
  getEmpresas: async () => {
    try {
      const response = await apiClient.get('/emp_m');
      console.log('Empresas obtenidas:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene una empresa por ID
   * @param {string} id - ID de la empresa
   * @returns {Promise} Promesa con los datos
   */
  getEmpresa: (id) => {
    return apiClient.get(`/emp_m/${id}`);
  },
  
  /**
   * Obtiene el nombre de una empresa por su ID
   * @param {string} id - ID de la empresa
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {string} Nombre de la empresa
   */
  getNombreEmpresa: (id, empresasList = []) => {
    const empresa = empresasList.find(e => e.id === id);
    return empresa ? empresa.name : `Empresa ${id}`;
  },
  
  /**
   * Obtiene solo las tiendas/divisiones (es_emp = false)
   * @returns {Promise} Promesa con los datos
   */
  getTiendas: async () => {
    try {
      const response = await empresasService.getEmpresas();
      const tiendas = response.emp_m?.filter(emp => !emp.es_emp || emp.es_emp === false) || [];
      return { ...response, emp_m: tiendas };
    } catch (error) {
      console.error('Error al obtener tiendas:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene solo las empresas principales (es_emp = true)
   * @returns {Promise} Promesa con los datos
   */
  getEmpresasPrincipales: async () => {
    try {
      const response = await empresasService.getEmpresas();
      const empresas = response.emp_m?.filter(emp => emp.es_emp === true) || [];
      return { ...response, emp_m: empresas };
    } catch (error) {
      console.error('Error al obtener empresas principales:', error);
      throw error;
    }
  }
};