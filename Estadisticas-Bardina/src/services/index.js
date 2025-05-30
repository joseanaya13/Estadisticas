// services/index.js - Archivo índice para todos los servicios de la API

// Cliente base y utilidades
export { apiClient, apiUtils } from './apiClient.js';

// Servicios principales
export { ventasService, VentasService } from './ventasService.js';
export { comprasService, ComprasService } from './comprasService.js';
export { formasPagoService, FormasPagoService } from './formasPagoService.js';
export { contactosService, ContactosService } from './contactosService.js';
export { usuariosService, UsuariosService } from './usuariosService.js';
export { empresasService, EmpresasService } from './empresasService.js';
export { dashboardService, DashboardService } from './dashboardService.js';

// Instancias por defecto (singleton) para compatibilidad
export default {
  ventas: ventasService,
  compras: comprasService,
  formasPago: formasPagoService,
  contactos: contactosService,
  usuarios: usuariosService,
  empresas: empresasService,
  dashboard: dashboardService,
  
  // Aliases para compatibilidad con código existente
  ventasService,
  comprasService,
  formasPagoService,
  contactosService,
  usuariosService,
  empresasService,
  dashboardService,
  
  // Métodos de utilidad global
  clearAllCaches: () => {
    formasPagoService.clearCache();
    contactosService.clearCache();
    usuariosService.clearCache();
    empresasService.clearCache();
    dashboardService.clearCache();
    console.log('Todas las cachés han sido limpiadas');
  },
  
  getCacheStats: () => {
    return {
      formasPago: formasPagoService.getCacheStats(),
      contactos: contactosService.getCacheStats(),
      usuarios: usuariosService.getCacheStats(),
      empresas: empresasService.getCacheStats(),
      dashboard: dashboardService.getCacheStats()
    };
  },
  
  // Método para cargar todos los datos básicos
  loadBasicData: async () => {
    console.log('Cargando datos básicos...');
    
    try {
      const [empresas, contactos, usuarios, formasPago] = await Promise.all([
        empresasService.getEmpresas(),
        contactosService.getContactos(),
        usuariosService.getUsuarios(),
        formasPagoService.getFormasPago()
      ]);
      
      console.log('Datos básicos cargados:', {
        empresas: empresas.emp_m?.length || 0,
        contactos: contactos.ent_m?.length || 0,
        usuarios: usuarios.usr_m?.length || 0,
        formasPago: formasPago.fpg_m?.length || 0
      });
      
      return {
        empresas,
        contactos,
        usuarios,
        formasPago
      };
    } catch (error) {
      console.error('Error al cargar datos básicos:', error);
      throw error;
    }
  },
  
  // Método para cargar todos los datos operacionales
  loadOperationalData: async (filters = {}) => {
    console.log('Cargando datos operacionales...');
    
    try {
      const [ventas, compras] = await Promise.all([
        ventasService.getFacturasFiltered(filters),
        comprasService.getAlbaranesFiltered(filters)
      ]);
      
      console.log('Datos operacionales cargados:', {
        ventas: ventas.fac_t?.length || 0,
        compras: compras.com_alb_g?.length || 0
      });
      
      return {
        ventas,
        compras
      };
    } catch (error) {
      console.error('Error al cargar datos operacionales:', error);
      throw error;
    }
  },
  
  // Método para cargar todos los datos completos
  loadAllData: async (filters = {}) => {
    console.log('Cargando todos los datos...');
    
    try {
      const [basicData, operationalData] = await Promise.all([
        this.loadBasicData(),
        this.loadOperationalData(filters)
      ]);
      
      return {
        ...basicData,
        ...operationalData
      };
    } catch (error) {
      console.error('Error al cargar todos los datos:', error);
      throw error;
    }
  }
};