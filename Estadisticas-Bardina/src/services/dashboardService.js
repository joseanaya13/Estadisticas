// services/dashboardService.js - Servicio para el dashboard principal
import ventasService from "./ventasService.js";
import comprasService from "./comprasService.js";
import { obtenerNombreMes } from "../utils/formatters.js";

export const dashboardService = {
  /**
   * Obtiene datos completos para el dashboard
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} Promesa con los datos del dashboard
   */
  getDashboardData: async (filters = {}) => {
    try {
      console.log("Obteniendo datos del dashboard con paginación completa...");

      // Construir parámetros de filtro para la API
      const params = {};

      // Filtro por ejercicio/año
      if (filters.eje) {
        params["filter[eje]"] = filters.eje;
      }

      // Filtro por mes
      if (filters.mes) {
        params["filter[mes]"] = filters.mes;
      }

      // Filtro por empresa
      if (filters.emp) {
        params["filter[emp]"] = filters.emp;
      }

      // Filtro por rango de fechas
      if (filters.fechaDesde && filters.fechaHasta) {
        params["filter[fch]"] = `${filters.fechaDesde},${filters.fechaHasta}`;
      }

      // Obtener datos de ventas y compras en paralelo
      const [ventasData, comprasData] = await Promise.all([
        ventasService.getFacturas(params),
        comprasService.getAlbaranes(params),
      ]);

      console.log(`Total facturas obtenidas: ${ventasData.fac_t.length}`);
      console.log(`Total albaranes obtenidos: ${comprasData.com_alb_g.length}`);

      // Procesar los datos
      const datosProcesados = dashboardService.procesarDatos(
        ventasData.fac_t,
        comprasData.com_alb_g
      );

      return {
        ...datosProcesados,
        ventasData,
        comprasData,
      };
    } catch (error) {
      console.error("Error al obtener datos del dashboard:", error);
      throw error;
    }
  },

  /**
   * Procesa los datos de ventas y compras para el dashboard
   * @param {Array} facturas - Array de facturas
   * @param {Array} albaranes - Array de albaranes
   * @returns {Object} Datos procesados
   */
  procesarDatos: (facturas = [], albaranes = []) => {
    // Calcular totales básicos
    const ventasTotales = facturas.reduce(
      (sum, item) => sum + (item.tot || 0),
      0
    );
    const comprasTotales = albaranes.reduce(
      (sum, item) => sum + (item.tot_alb || 0),
      0
    );
    const balance = ventasTotales - comprasTotales;
    const margenBeneficio =
      ventasTotales > 0 ? (balance / ventasTotales) * 100 : 0;

    // Procesar datos por mes
    const mesesVentas = {};
    facturas.forEach((item) => {
      const mes = item.mes;
      if (mes) {
        mesesVentas[mes] = (mesesVentas[mes] || 0) + (item.tot || 0);
      }
    });

    const mesesCompras = {};
    albaranes.forEach((item) => {
      const mes = item.mes;
      if (mes) {
        mesesCompras[mes] = (mesesCompras[mes] || 0) + (item.tot_alb || 0);
      }
    });

    // Combinar datos de ventas y compras por mes
    const mesesUnicos = new Set([
      ...Object.keys(mesesVentas).map((m) => parseInt(m)),
      ...Object.keys(mesesCompras).map((m) => parseInt(m)),
    ]);

    const datosPorMes = Array.from(mesesUnicos)
      .map((mes) => {
        const ventasMes = mesesVentas[mes] || 0;
        const comprasMes = mesesCompras[mes] || 0;
        return {
          mes,
          ventas: ventasMes,
          compras: comprasMes,
          balance: ventasMes - comprasMes,
          nombreMes: obtenerNombreMes(mes),
        };
      })
      .sort((a, b) => a.mes - b.mes);

    // Calcular tendencias
    const tendenciaVentas = dashboardService.calcularTendencia(
      datosPorMes.map((d) => d.ventas)
    );
    const tendenciaCompras = dashboardService.calcularTendencia(
      datosPorMes.map((d) => d.compras)
    );

    return {
      ventasTotales,
      comprasTotales,
      balance,
      margenBeneficio,
      datosPorMes,
      totalFacturas: facturas.length,
      totalAlbaranes: albaranes.length,
      tendenciaVentas,
      tendenciaCompras,
    };
  },

  /**
   * Aplica filtros a los datos ya cargados (filtrado local)
   * @param {Object} ventasData - Datos de ventas
   * @param {Object} comprasData - Datos de compras
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Object} Datos filtrados
   */
  aplicarFiltrosLocales: (ventasData, comprasData, filtros) => {
    // Filtrar ventas
    const ventasFiltradas = ventasService.filtrarFacturas(
      ventasData.fac_t || [],
      filtros
    );

    // Filtrar compras
    const comprasFiltradas = comprasService.filtrarAlbaranes(
      comprasData.com_alb_g || [],
      filtros
    );

    // Procesar datos filtrados
    const datosProcesados = dashboardService.procesarDatos(
      ventasFiltradas,
      comprasFiltradas
    );

    return {
      ...datosProcesados,
      ventasData: { ...ventasData, fac_t: ventasFiltradas },
      comprasData: { ...comprasData, com_alb_g: comprasFiltradas },
    };
  },

  /**
   * Calcula la tendencia de una serie de datos
   * @param {Array} valores - Array de valores numéricos
   * @returns {number} Tendencia en porcentaje
   */
  calcularTendencia: (valores) => {
    if (valores.length < 2) return 0;

    const mitad = Math.floor(valores.length / 2);
    const primeraMitad = valores.slice(0, mitad);
    const segundaMitad = valores.slice(mitad);

    const promedioPrimera =
      primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
    const promedioSegunda =
      segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;

    if (promedioPrimera === 0) return 0;

    return ((promedioSegunda - promedioPrimera) / promedioPrimera) * 100;
  },

  /**
   * Obtiene KPIs (indicadores clave) del dashboard
   * @param {Array} facturas - Array de facturas
   * @param {Array} albaranes - Array de albaranes
   * @returns {Object} KPIs calculados
   */
  calcularKPIs: (facturas = [], albaranes = []) => {
    const ventasTotales = facturas.reduce(
      (sum, item) => sum + (item.tot || 0),
      0
    );
    const comprasTotales = albaranes.reduce(
      (sum, item) => sum + (item.tot_alb || 0),
      0
    );
    const balance = ventasTotales - comprasTotales;

    // Ticket promedio
    const ticketPromedio =
      facturas.length > 0 ? ventasTotales / facturas.length : 0;

    // Compra promedio
    const compraPromedio =
      albaranes.length > 0 ? comprasTotales / albaranes.length : 0;

    // ROI (Return on Investment)
    const roi =
      comprasTotales > 0
        ? ((ventasTotales - comprasTotales) / comprasTotales) * 100
        : 0;

    // Margen bruto
    const margenBruto = ventasTotales > 0 ? (balance / ventasTotales) * 100 : 0;

    // Rotación (ventas por mes)
    const mesesConDatos = new Set();
    facturas.forEach((f) => f.mes && mesesConDatos.add(f.mes));
    const ventasPorMes =
      mesesConDatos.size > 0 ? ventasTotales / mesesConDatos.size : 0;

    return {
      ventasTotales,
      comprasTotales,
      balance,
      ticketPromedio,
      compraPromedio,
      roi,
      margenBruto,
      ventasPorMes,
      cantidadFacturas: facturas.length,
      cantidadAlbaranes: albaranes.length,
    };
  },

  /**
   * Compara períodos (mes actual vs anterior, etc.)
   * @param {Array} facturas - Array de facturas
   * @param {Array} albaranes - Array de albaranes
   * @param {string} tipoPeriodo - 'mes', 'trimestre', 'año'
   * @returns {Object} Comparación de períodos
   */
  compararPeriodos: (facturas = [], albaranes = [], tipoPeriodo = "mes") => {
    const hoy = new Date();
    let periodoActual, periodoAnterior;

    switch (tipoPeriodo) {
      case "mes":
        periodoActual = hoy.getMonth() + 1;
        periodoAnterior = periodoActual === 1 ? 12 : periodoActual - 1;
        break;
      case "trimestre":
        periodoActual = Math.ceil((hoy.getMonth() + 1) / 3);
        periodoAnterior = periodoActual === 1 ? 4 : periodoActual - 1;
        break;
      default:
        periodoActual = hoy.getFullYear();
        periodoAnterior = periodoActual - 1;
    }

    // Filtrar datos por período
    const ventasActuales = facturas.filter((f) => {
      if (tipoPeriodo === "mes") return f.mes === periodoActual;
      if (tipoPeriodo === "trimestre")
        return Math.ceil(f.mes / 3) === periodoActual;
      return f.eje === periodoActual;
    });

    const ventasAnteriores = facturas.filter((f) => {
      if (tipoPeriodo === "mes") return f.mes === periodoAnterior;
      if (tipoPeriodo === "trimestre")
        return Math.ceil(f.mes / 3) === periodoAnterior;
      return f.eje === periodoAnterior;
    });

    const comprasActuales = albaranes.filter((a) => {
      if (tipoPeriodo === "mes") return a.mes === periodoActual;
      if (tipoPeriodo === "trimestre")
        return Math.ceil(a.mes / 3) === periodoActual;
      return a.eje === periodoActual;
    });

    const comprasAnteriores = albaranes.filter((a) => {
      if (tipoPeriodo === "mes") return a.mes === periodoAnterior;
      if (tipoPeriodo === "trimestre")
        return Math.ceil(a.mes / 3) === periodoAnterior;
      return a.eje === periodoAnterior;
    });

    // Calcular totales
    const totalVentasActual = ventasActuales.reduce(
      (sum, v) => sum + (v.tot || 0),
      0
    );
    const totalVentasAnterior = ventasAnteriores.reduce(
      (sum, v) => sum + (v.tot || 0),
      0
    );
    const totalComprasActual = comprasActuales.reduce(
      (sum, c) => sum + (c.tot_alb || 0),
      0
    );
    const totalComprasAnterior = comprasAnteriores.reduce(
      (sum, c) => sum + (c.tot_alb || 0),
      0
    );

    // Calcular variaciones
    const variacionVentas =
      totalVentasAnterior > 0
        ? ((totalVentasActual - totalVentasAnterior) / totalVentasAnterior) *
          100
        : 0;

    const variacionCompras =
      totalComprasAnterior > 0
        ? ((totalComprasActual - totalComprasAnterior) / totalComprasAnterior) *
          100
        : 0;

    return {
      tipoPeriodo,
      periodoActual,
      periodoAnterior,
      ventasActuales: totalVentasActual,
      ventasAnteriores: totalVentasAnterior,
      comprasActuales: totalComprasActual,
      comprasAnteriores: totalComprasAnterior,
      variacionVentas,
      variacionCompras,
      mejoraVentas: variacionVentas > 0,
      mejoraCompras: variacionCompras < 0, // Menos compras puede ser mejor
    };
  },
};

export default dashboardService;
