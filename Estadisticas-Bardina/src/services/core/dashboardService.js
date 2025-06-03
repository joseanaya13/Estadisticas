// services/dashboardService.js - Servicio específico para datos del dashboard
import { ventasService } from './ventasService.js';
import { comprasService } from './comprasService.js';
import { apiUtils } from './apiClient.js';

/**
 * Servicio del dashboard - Gestiona la agregación y procesamiento de datos para el dashboard
 */
export class DashboardService {
  constructor() {
    this._cache = new Map();
    this._cacheExpiry = 5 * 60 * 1000; // 5 minutos (datos del dashboard cambian más frecuentemente)
  }
  
  /**
   * Obtiene datos completos para el dashboard
   * @param {Object} filters - Filtros opcionales
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos del dashboard
   */
  async getDashboardData(filters = {}, useCache = true) {
    try {
      const cacheKey = `dashboard_${JSON.stringify(filters)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando datos del dashboard desde caché');
          return cached.data;
        }
      }
      
      console.log('Obteniendo datos del dashboard con filtros:', filters);
      
      // Obtener datos de ventas y compras en paralelo
      const [ventasData, comprasData] = await Promise.all([
        ventasService.getFacturasFiltered(filters),
        comprasService.getAlbaranesFiltered(filters)
      ]);
      
      console.log(`Dashboard - Facturas: ${ventasData.fac_t.length}, Albaranes: ${comprasData.com_alb_g.length}`);
      
      // Procesar datos para el dashboard
      const dashboardData = this._procesarDatosDashboard(ventasData, comprasData, filters);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data: dashboardData,
          timestamp: Date.now()
        });
      }
      
      return dashboardData;
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.getDashboardData');
    }
  }
  
  /**
   * Procesa datos ya cargados sin hacer nuevas llamadas a la API
   * @param {Object} ventasData - Datos de ventas ya cargados
   * @param {Object} comprasData - Datos de compras ya cargados
   * @param {Object} filters - Filtros aplicados localmente
   * @returns {Object} Datos procesados para el dashboard
   */
  procesarDatosExistentes(ventasData, comprasData, filters = {}) {
    try {
      console.log('Procesando datos existentes del dashboard');
      
      // Aplicar filtros localmente si es necesario
      let ventasFiltradas = this._aplicarFiltrosLocales(ventasData.fac_t || [], filters);
      let comprasFiltradas = this._aplicarFiltrosLocales(comprasData.com_alb_g || [], filters);
      
      return this._procesarDatosDashboard(
        { fac_t: ventasFiltradas },
        { com_alb_g: comprasFiltradas },
        filters
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.procesarDatosExistentes');
    }
  }
  
  /**
   * Obtiene métricas principales del dashboard
   * @param {Object} ventasData - Datos de ventas
   * @param {Object} comprasData - Datos de compras
   * @returns {Object} Métricas principales
   */
  getMetricasPrincipales(ventasData, comprasData) {
    try {
      const ventasTotales = this._calcularTotalVentas(ventasData.fac_t || []);
      const comprasTotales = this._calcularTotalCompras(comprasData.com_alb_g || []);
      const balance = ventasTotales - comprasTotales;
      const margenBeneficio = ventasTotales > 0 ? ((balance / ventasTotales) * 100) : 0;
      
      return {
        ventasTotales,
        comprasTotales,
        balance,
        margenBeneficio,
        totalFacturas: ventasData.fac_t?.length || 0,
        totalAlbaranes: comprasData.com_alb_g?.length || 0,
        promedioFactura: ventasData.fac_t?.length > 0 ? ventasTotales / ventasData.fac_t.length : 0,
        promedioAlbaran: comprasData.com_alb_g?.length > 0 ? comprasTotales / comprasData.com_alb_g.length : 0
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.getMetricasPrincipales');
    }
  }
  
  /**
   * Obtiene datos para gráficos temporales
   * @param {Object} ventasData - Datos de ventas
   * @param {Object} comprasData - Datos de compras
   * @param {string} agrupacion - Tipo de agrupación ('mes', 'trimestre', 'año')
   * @returns {Array} Datos agrupados por tiempo
   */
  getDatosTemporales(ventasData, comprasData, agrupacion = 'mes') {
    try {
      const ventasPorPeriodo = this._agruparPorPeriodo(ventasData.fac_t || [], agrupacion, 'tot');
      const comprasPorPeriodo = this._agruparPorPeriodo(comprasData.com_alb_g || [], agrupacion, 'tot_alb');
      
      // Combinar datos de ventas y compras
      const periodosUnicos = new Set([
        ...Object.keys(ventasPorPeriodo),
        ...Object.keys(comprasPorPeriodo)
      ]);
      
      return Array.from(periodosUnicos)
        .map(periodo => {
          const ventas = ventasPorPeriodo[periodo] || 0;
          const compras = comprasPorPeriodo[periodo] || 0;
          
          return {
            periodo,
            ventas,
            compras,
            balance: ventas - compras,
            nombrePeriodo: this._formatearNombrePeriodo(periodo, agrupacion)
          };
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.getDatosTemporales');
    }
  }
  
  /**
   * Obtiene tendencias y variaciones
   * @param {Array} datosTemporales - Datos temporales del dashboard
   * @returns {Object} Análisis de tendencias
   */
  getAnalisisTendencias(datosTemporales) {
    try {
      if (datosTemporales.length < 2) {
        return {
          tendenciaVentas: 0,
          tendenciaCompras: 0,
          tendenciaBalance: 0,
          variacionVentas: 0,
          variacionCompras: 0,
          variacionBalance: 0
        };
      }
      
      const mitad = Math.floor(datosTemporales.length / 2);
      const primeraMitad = datosTemporales.slice(0, mitad);
      const segundaMitad = datosTemporales.slice(mitad);
      
      const promedioVentasInicial = this._calcularPromedio(primeraMitad, 'ventas');
      const promedioVentasFinal = this._calcularPromedio(segundaMitad, 'ventas');
      
      const promedioComprasInicial = this._calcularPromedio(primeraMitad, 'compras');
      const promedioComprasFinal = this._calcularPromedio(segundaMitad, 'compras');
      
      const promedioBalanceInicial = this._calcularPromedio(primeraMitad, 'balance');
      const promedioBalanceFinal = this._calcularPromedio(segundaMitad, 'balance');
      
      // Calcular variaciones del último período
      const penultimo = datosTemporales[datosTemporales.length - 2];
      const ultimo = datosTemporales[datosTemporales.length - 1];
      
      return {
        tendenciaVentas: this._calcularTendencia(promedioVentasInicial, promedioVentasFinal),
        tendenciaCompras: this._calcularTendencia(promedioComprasInicial, promedioComprasFinal),
        tendenciaBalance: this._calcularTendencia(promedioBalanceInicial, promedioBalanceFinal),
        variacionVentas: this._calcularVariacion(penultimo.ventas, ultimo.ventas),
        variacionCompras: this._calcularVariacion(penultimo.compras, ultimo.compras),
        variacionBalance: this._calcularVariacion(penultimo.balance, ultimo.balance),
        periodoComparacion: {
          anterior: penultimo.nombrePeriodo,
          actual: ultimo.nombrePeriodo
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.getAnalisisTendencias');
    }
  }
  
  /**
   * Obtiene alertas y notificaciones para el dashboard
   * @param {Object} metricas - Métricas principales
   * @param {Object} tendencias - Análisis de tendencias
   * @returns {Array} Lista de alertas
   */
  getAlertas(metricas, tendencias) {
    try {
      const alertas = [];
      
      // Alerta de balance negativo
      if (metricas.balance < 0) {
        alertas.push({
          tipo: 'warning',
          titulo: 'Balance Negativo',
          mensaje: `Las compras superan a las ventas en €${Math.abs(metricas.balance).toFixed(2)}`,
          prioridad: 'alta'
        });
      }
      
      // Alerta de margen bajo
      if (metricas.margenBeneficio < 10 && metricas.margenBeneficio > 0) {
        alertas.push({
          tipo: 'warning',
          titulo: 'Margen de Beneficio Bajo',
          mensaje: `El margen de beneficio es solo del ${metricas.margenBeneficio.toFixed(1)}%`,
          prioridad: 'media'
        });
      }
      
      // Alerta de tendencia negativa en ventas
      if (tendencias.tendenciaVentas < -10) {
        alertas.push({
          tipo: 'error',
          titulo: 'Tendencia Negativa en Ventas',
          mensaje: `Las ventas han disminuido un ${Math.abs(tendencias.tendenciaVentas).toFixed(1)}%`,
          prioridad: 'alta'
        });
      }
      
      // Alerta de crecimiento en compras
      if (tendencias.tendenciaCompras > 20) {
        alertas.push({
          tipo: 'info',
          titulo: 'Aumento en Compras',
          mensaje: `Las compras han aumentado un ${tendencias.tendenciaCompras.toFixed(1)}%`,
          prioridad: 'media'
        });
      }
      
      // Alerta de buen rendimiento
      if (metricas.margenBeneficio > 30 && tendencias.tendenciaVentas > 10) {
        alertas.push({
          tipo: 'success',
          titulo: 'Excelente Rendimiento',
          mensaje: `Margen del ${metricas.margenBeneficio.toFixed(1)}% y ventas creciendo ${tendencias.tendenciaVentas.toFixed(1)}%`,
          prioridad: 'baja'
        });
      }
      
      return alertas.sort((a, b) => {
        const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
        return prioridades[b.prioridad] - prioridades[a.prioridad];
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'DashboardService.getAlertas');
    }
  }
  
  /**
   * Limpia la caché del dashboard
   */
  clearCache() {
    this._clearCache();
  }
  
  /**
   * Obtiene estadísticas de la caché
   * @returns {Object} Estadísticas de caché
   */
  getCacheStats() {
    return {
      size: this._cache.size,
      keys: Array.from(this._cache.keys()),
      expiryTime: this._cacheExpiry / 1000 + ' segundos'
    };
  }
  
  /**
   * Procesa datos del dashboard
   * @private
   * @param {Object} ventasData - Datos de ventas
   * @param {Object} comprasData - Datos de compras
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Datos procesados
   */
  _procesarDatosDashboard(ventasData, comprasData, filters) {
    const metricas = this.getMetricasPrincipales(ventasData, comprasData);
    const datosTemporales = this.getDatosTemporales(ventasData, comprasData, filters.agrupacion || 'mes');
    const tendencias = this.getAnalisisTendencias(datosTemporales);
    const alertas = this.getAlertas(metricas, tendencias);
    
    return {
      ...metricas,
      datosTemporales,
      tendencias,
      alertas,
      metadatos: {
        filtros: filters,
        fechaProcesamiento: new Date().toISOString(),
        periodoAnalisis: this._determinarPeriodoAnalisis(datosTemporales)
      }
    };
  }
  
  /**
   * Aplica filtros localmente a los datos
   * @private
   * @param {Array} datos - Datos a filtrar
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Datos filtrados
   */
  _aplicarFiltrosLocales(datos, filters) {
    let filtered = [...datos];
    
    // Aplicar filtros según sea necesario
    // (Esta lógica puede expandirse según los filtros específicos)
    
    return filtered;
  }
  
  /**
   * Calcula el total de ventas
   * @private
   * @param {Array} ventas - Array de facturas
   * @returns {number} Total de ventas
   */
  _calcularTotalVentas(ventas) {
    return ventas.reduce((sum, venta) => sum + (venta.tot || 0), 0);
  }
  
  /**
   * Calcula el total de compras
   * @private
   * @param {Array} compras - Array de albaranes
   * @returns {number} Total de compras
   */
  _calcularTotalCompras(compras) {
    return compras.reduce((sum, compra) => sum + (compra.tot_alb || 0), 0);
  }
  
  /**
   * Agrupa datos por período
   * @private
   * @param {Array} datos - Datos a agrupar
   * @param {string} agrupacion - Tipo de agrupación
   * @param {string} campo - Campo a sumar
   * @returns {Object} Datos agrupados
   */
  _agruparPorPeriodo(datos, agrupacion, campo) {
    const agrupado = {};
    
    datos.forEach(item => {
      let clave;
      
      switch (agrupacion) {
        case 'año':
          clave = item.eje?.toString();
          break;
        case 'trimestre':
          clave = `${item.eje}-Q${Math.ceil(item.mes / 3)}`;
          break;
        case 'mes':
        default:
          clave = `${item.eje}-${String(item.mes).padStart(2, '0')}`;
          break;
      }
      
      if (clave) {
        agrupado[clave] = (agrupado[clave] || 0) + (item[campo] || 0);
      }
    });
    
    return agrupado;
  }
  
  /**
   * Formatea el nombre del período
   * @private
   * @param {string} periodo - Período a formatear
   * @param {string} agrupacion - Tipo de agrupación
   * @returns {string} Nombre formateado
   */
  _formatearNombrePeriodo(periodo, agrupacion) {
    if (agrupacion === 'año') {
      return periodo;
    }
    
    if (agrupacion === 'trimestre') {
      return periodo.replace('-Q', ' T');
    }
    
    // Para meses
    const [año, mes] = periodo.split('-');
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    return `${meses[parseInt(mes) - 1]} ${año}`;
  }
  
  /**
   * Calcula el promedio de un campo en un array
   * @private
   * @param {Array} datos - Datos
   * @param {string} campo - Campo a promediar
   * @returns {number} Promedio
   */
  _calcularPromedio(datos, campo) {
    if (datos.length === 0) return 0;
    const suma = datos.reduce((sum, item) => sum + (item[campo] || 0), 0);
    return suma / datos.length;
  }
  
  /**
   * Calcula la tendencia entre dos valores
   * @private
   * @param {number} inicial - Valor inicial
   * @param {number} final - Valor final
   * @returns {number} Porcentaje de tendencia
   */
  _calcularTendencia(inicial, final) {
    if (inicial === 0) return final > 0 ? 100 : 0;
    return ((final - inicial) / inicial) * 100;
  }
  
  /**
   * Calcula la variación entre dos valores
   * @private
   * @param {number} anterior - Valor anterior
   * @param {number} actual - Valor actual
   * @returns {number} Porcentaje de variación
   */
  _calcularVariacion(anterior, actual) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  }
  
  /**
   * Determina el período de análisis
   * @private
   * @param {Array} datosTemporales - Datos temporales
   * @returns {Object} Información del período
   */
  _determinarPeriodoAnalisis(datosTemporales) {
    if (datosTemporales.length === 0) {
      return { inicio: null, fin: null, totalPeriodos: 0 };
    }
    
    return {
      inicio: datosTemporales[0].nombrePeriodo,
      fin: datosTemporales[datosTemporales.length - 1].nombrePeriodo,
      totalPeriodos: datosTemporales.length
    };
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché del dashboard limpiada');
  }
}

// Crear instancia singleton
export const dashboardService = new DashboardService();

// Exportación por defecto
export default dashboardService;
