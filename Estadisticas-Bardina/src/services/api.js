// services/api.js - Archivo principal para mantener compatibilidad con código existente
// Importa todos los servicios modulares

export {
  ventasService,
  comprasService,
  usuariosService,
  contactosService,
  empresasService,
  dashboardService,
  formasPagoService,
} from "./index.js";

// Exportación por defecto para compatibilidad
import servicios from "./index.js";
export default servicios;
