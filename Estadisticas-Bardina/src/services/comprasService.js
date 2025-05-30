// services/comprasService.js - Servicio para albaranes de compra
import { apiClient } from "./apiClient.js";

export const comprasService = {
  /**
   * Obtiene todos los albaranes (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getAlbaranes: (params = {}) => {
    const query = apiClient.buildQueryParams(params);
    return apiClient.getAllPaginated(`/com_alb_g${query}`, "com_alb_g");
  },

  /**
   * Obtiene un albarán por ID
   * @param {number} id - ID del albarán
   * @returns {Promise} Promesa con los datos
   */
  getAlbaran: (id) => {
    return apiClient.get(`/com_alb_g/${id}`);
  },

  /**
   * Obtiene albaranes con filtros específicos
   * @param {Object} filtros - Filtros aplicados
   * @returns {Promise} Promesa con los datos filtrados
   */
  getAlbaranesFiltrados: (filtros = {}) => {
    const params = {};

    // Convertir filtros de la UI a parámetros de API
    if (filtros.eje && filtros.eje !== "todos") {
      params["filter[eje]"] = filtros.eje;
    }

    if (filtros.mes && filtros.mes !== "todos") {
      params["filter[mes]"] = filtros.mes;
    }

    if (filtros.proveedor && filtros.proveedor !== "todos") {
      params["filter[prv]"] = filtros.proveedor;
    }

    if (filtros.fechaDesde && filtros.fechaHasta) {
      params["filter[fch]"] = `${filtros.fechaDesde},${filtros.fechaHasta}`;
    } else if (filtros.fechaDesde) {
      params["filter[fch][gte]"] = filtros.fechaDesde;
    } else if (filtros.fechaHasta) {
      params["filter[fch][lte]"] = filtros.fechaHasta;
    }

    return comprasService.getAlbaranes(params);
  },

  /**
   * Obtiene estadísticas básicas de compras
   * @param {Array} albaranes - Array de albaranes
   * @returns {Object} Estadísticas calculadas
   */
  calcularEstadisticas: (albaranes = []) => {
    if (!albaranes.length) {
      return {
        total: 0,
        cantidad: 0,
        promedio: 0,
        comprasPorMes: [],
        comprasPorProveedor: [],
        comprasPorSerie: [],
      };
    }

    // Calcular totales básicos
    const total = albaranes.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
    const cantidad = albaranes.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;

    // Compras por mes
    const mesesMap = {};
    albaranes.forEach((item) => {
      const mes = item.mes;
      if (mes) {
        mesesMap[mes] = (mesesMap[mes] || 0) + (item.tot_alb || 0);
      }
    });

    const comprasPorMes = Object.entries(mesesMap)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        total,
      }))
      .sort((a, b) => a.mes - b.mes);

    // Compras por proveedor
    const proveedoresMap = {};
    albaranes.forEach((item) => {
      const proveedor = item.prv;
      if (proveedor) {
        proveedoresMap[proveedor] =
          (proveedoresMap[proveedor] || 0) + (item.tot_alb || 0);
      }
    });

    const comprasPorProveedor = Object.entries(proveedoresMap)
      .map(([proveedor, total]) => ({
        proveedor: parseInt(proveedor),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    // Compras por serie
    const seriesMap = {};
    albaranes.forEach((item) => {
      const serie = item.ser;
      if (serie !== undefined) {
        seriesMap[serie] = (seriesMap[serie] || 0) + (item.tot_alb || 0);
      }
    });

    const comprasPorSerie = Object.entries(seriesMap).map(([serie, total]) => ({
      serie: parseInt(serie),
      total,
    }));

    return {
      total,
      cantidad,
      promedio,
      comprasPorMes,
      comprasPorProveedor,
      comprasPorSerie,
    };
  },

  /**
   * Obtiene el resumen de compras por período
   * @param {Array} albaranes - Array de albaranes
   * @param {string} periodo - 'mes', 'dia', 'semana'
   * @returns {Array} Datos agrupados por período
   */
  agruparPorPeriodo: (albaranes = [], periodo = "mes") => {
    const grupos = {};

    albaranes.forEach((albaran) => {
      let clave;

      switch (periodo) {
        case "dia":
          if (albaran.fch) {
            clave = new Date(albaran.fch).toLocaleDateString("es-ES");
          }
          break;
        case "semana":
          if (albaran.fch) {
            const fecha = new Date(albaran.fch);
            const semana = Math.ceil(fecha.getDate() / 7);
            clave = `Semana ${semana}`;
          }
          break;
        case "mes":
        default:
          clave = albaran.mes;
          break;
      }

      if (clave) {
        if (!grupos[clave]) {
          grupos[clave] = {
            periodo: clave,
            totalCompras: 0,
            cantidadAlbaranes: 0,
            promedioAlbaran: 0,
          };
        }

        grupos[clave].totalCompras += albaran.tot_alb || 0;
        grupos[clave].cantidadAlbaranes += 1;
      }
    });

    // Calcular promedios
    return Object.values(grupos)
      .map((grupo) => ({
        ...grupo,
        promedioAlbaran:
          grupo.cantidadAlbaranes > 0
            ? grupo.totalCompras / grupo.cantidadAlbaranes
            : 0,
      }))
      .sort((a, b) => {
        if (periodo === "dia") {
          return (
            new Date(a.periodo.split("/").reverse().join("-")) -
            new Date(b.periodo.split("/").reverse().join("-"))
          );
        }
        return a.periodo.toString().localeCompare(b.periodo.toString());
      });
  },

  /**
   * Filtra albaranes por múltiples criterios (lado cliente)
   * @param {Array} albaranes - Array de albaranes
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Array} Albaranes filtrados
   */
  filtrarAlbaranes: (albaranes = [], filtros = {}) => {
    return albaranes.filter((albaran) => {
      // Filtro por año
      if (filtros.año && filtros.año !== "todos") {
        const año = parseInt(filtros.año);
        const albaranAño =
          typeof albaran.eje === "string" ? parseInt(albaran.eje) : albaran.eje;
        if (albaranAño !== año) return false;
      }

      // Filtro por mes
      if (filtros.mes && filtros.mes !== "todos") {
        const mes = parseInt(filtros.mes);
        const albaranMes =
          typeof albaran.mes === "string" ? parseInt(albaran.mes) : albaran.mes;
        if (albaranMes !== mes) return false;
      }

      // Filtro por proveedor
      if (filtros.proveedor && filtros.proveedor !== "todos") {
        const proveedorId = parseInt(filtros.proveedor);
        const albaranProveedor =
          typeof albaran.prv === "string" ? parseInt(albaran.prv) : albaran.prv;
        if (albaranProveedor !== proveedorId) return false;
      }

      // Filtro por rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        if (!albaran.fch) return false;

        const fechaAlbaran = new Date(albaran.fch);

        if (filtros.fechaDesde) {
          const desde = new Date(filtros.fechaDesde);
          desde.setHours(0, 0, 0, 0);
          if (fechaAlbaran < desde) return false;
        }

        if (filtros.fechaHasta) {
          const hasta = new Date(filtros.fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (fechaAlbaran > hasta) return false;
        }
      }

      return true;
    });
  },

  /**
   * Obtiene los top proveedores por volumen de compras
   * @param {Array} albaranes - Array de albaranes
   * @param {number} limite - Número de proveedores a retornar
   * @returns {Array} Top proveedores
   */
  getTopProveedores: (albaranes = [], limite = 5) => {
    const proveedoresMap = {};

    albaranes.forEach((albaran) => {
      const proveedor = albaran.prv;
      if (proveedor) {
        if (!proveedoresMap[proveedor]) {
          proveedoresMap[proveedor] = {
            proveedor,
            totalCompras: 0,
            cantidadAlbaranes: 0,
            promedioAlbaran: 0,
          };
        }

        proveedoresMap[proveedor].totalCompras += albaran.tot_alb || 0;
        proveedoresMap[proveedor].cantidadAlbaranes += 1;
      }
    });

    return Object.values(proveedoresMap)
      .map((proveedor) => ({
        ...proveedor,
        promedioAlbaran:
          proveedor.cantidadAlbaranes > 0
            ? proveedor.totalCompras / proveedor.cantidadAlbaranes
            : 0,
      }))
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, limite);
  },

  /**
   * Obtiene análisis por series
   * @param {Array} albaranes - Array de albaranes
   * @returns {Array} Análisis por series
   */
  getAnalisisPorSeries: (albaranes = []) => {
    const seriesMap = {};

    albaranes.forEach((albaran) => {
      const serie = albaran.ser;
      if (serie !== undefined) {
        if (!seriesMap[serie]) {
          seriesMap[serie] = {
            serie,
            totalCompras: 0,
            cantidadAlbaranes: 0,
            promedioAlbaran: 0,
          };
        }

        seriesMap[serie].totalCompras += albaran.tot_alb || 0;
        seriesMap[serie].cantidadAlbaranes += 1;
      }
    });

    return Object.values(seriesMap)
      .map((serie) => ({
        ...serie,
        promedioAlbaran:
          serie.cantidadAlbaranes > 0
            ? serie.totalCompras / serie.cantidadAlbaranes
            : 0,
      }))
      .sort((a, b) => b.totalCompras - a.totalCompras);
  },
};

export default comprasService;
