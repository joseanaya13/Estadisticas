// services/empresasService.js - Servicio para empresas y divisiones
import { apiClient } from "./apiClient.js";

export const empresasService = {
  /**
   * Obtiene todas las empresas
   * @returns {Promise} Promesa con los datos
   */
  getEmpresas: async () => {
    try {
      const response = await apiClient.get("/emp_m");
      return response;
    } catch (error) {
      console.error("Error al obtener empresas:", error);
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
   * Separa empresas principales de divisiones/tiendas
   * @param {Array} empresasList - Lista completa de empresas
   * @returns {Object} Empresas separadas por tipo
   */
  separarEmpresasYDivisiones: (empresasList = []) => {
    const empresasPrincipales = [];
    const divisiones = [];
    const tiendas = [];

    empresasList.forEach((empresa) => {
      if (empresa.es_emp === true) {
        empresasPrincipales.push(empresa);
      } else if (empresa.es_emp === false || empresa.es_emp === undefined) {
        // Puedes agregar lógica adicional para distinguir entre divisiones y tiendas
        // basándote en otros campos como 'tipo', 'categoria', etc.
        if (
          empresa.tipo === "tienda" ||
          empresa.name?.toLowerCase().includes("tienda")
        ) {
          tiendas.push(empresa);
        } else {
          divisiones.push(empresa);
        }
      }
    });

    return {
      empresasPrincipales: empresasPrincipales.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      divisiones: divisiones.sort((a, b) => a.name.localeCompare(b.name)),
      tiendas: tiendas.sort((a, b) => a.name.localeCompare(b.name)),
      todas: empresasList,
    };
  },

  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} empresasList - Lista de empresas
   * @returns {Object} Mapa de ID a nombre
   */
  crearMapaNombres: (empresasList = []) => {
    const mapa = {};
    empresasList.forEach((empresa) => {
      if (empresa.id && empresa.name) {
        mapa[empresa.id] = empresa.name;
      }
    });
    return mapa;
  },

  /**
   * Busca empresas por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} empresasList - Lista de empresas
   * @returns {Array} Empresas que coinciden
   */
  buscarPorNombre: (nombre, empresasList = []) => {
    if (!nombre) return [];

    const nombreLower = nombre.toLowerCase();
    return empresasList.filter(
      (empresa) =>
        empresa.name && empresa.name.toLowerCase().includes(nombreLower)
    );
  },

  /**
   * Obtiene opciones para filtros de UI
   * @param {Array} empresasList - Lista de empresas
   * @returns {Array} Opciones formateadas para select
   */
  getOpcionesFiltro: (empresasList = []) => {
    const { empresasPrincipales, divisiones, tiendas } =
      empresasService.separarEmpresasYDivisiones(empresasList);

    const opciones = [{ value: "todas", label: "Todas las ubicaciones" }];

    // Agregar empresas principales
    if (empresasPrincipales.length > 0) {
      empresasPrincipales.forEach((emp) => {
        opciones.push({
          value: `emp_${emp.id}`,
          label: `🏢 ${emp.name}`,
          tipo: "empresa",
        });
      });
    }

    // Agregar divisiones
    if (divisiones.length > 0) {
      divisiones.forEach((div) => {
        opciones.push({
          value: `div_${div.id}`,
          label: `🏪 ${div.name}`,
          tipo: "division",
        });
      });
    }

    // Agregar tiendas
    if (tiendas.length > 0) {
      tiendas.forEach((tienda) => {
        opciones.push({
          value: `tienda_${tienda.id}`,
          label: `🏬 ${tienda.name}`,
          tipo: "tienda",
        });
      });
    }

    return opciones;
  },

  /**
   * Obtiene el nombre de una empresa/división por ID
   * @param {string|number} id - ID de la empresa
   * @param {Array} empresasList - Lista de empresas
   * @returns {string} Nombre de la empresa
   */
  getNombreEmpresa: (id, empresasList = []) => {
    if (!id) return "Sin empresa";

    const empresa = empresasList.find(
      (e) => e.id === id || e.id === id.toString()
    );
    return empresa ? empresa.name : `Empresa ${id}`;
  },

  /**
   * Obtiene estadísticas de ventas por empresa/división
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} empresasList - Lista de empresas
   * @returns {Array} Estadísticas por empresa
   */
  getEstadisticasVentasPorEmpresa: (ventasData = [], empresasList = []) => {
    const mapaEmpresas = empresasService.crearMapaNombres(empresasList);
    const ventasPorEmpresa = {};

    ventasData.forEach((venta) => {
      // Priorizar división sobre empresa principal
      const empresaId = venta.emp_div || venta.emp;
      if (empresaId && venta.tot > 0) {
        if (!ventasPorEmpresa[empresaId]) {
          ventasPorEmpresa[empresaId] = {
            empresaId,
            nombreEmpresa: mapaEmpresas[empresaId] || `Empresa ${empresaId}`,
            totalVentas: 0,
            cantidadFacturas: 0,
            promedioFactura: 0,
          };
        }

        ventasPorEmpresa[empresaId].totalVentas += venta.tot || 0;
        ventasPorEmpresa[empresaId].cantidadFacturas += 1;
      }
    });

    return Object.values(ventasPorEmpresa)
      .map((empresa) => ({
        ...empresa,
        promedioFactura:
          empresa.cantidadFacturas > 0
            ? empresa.totalVentas / empresa.cantidadFacturas
            : 0,
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
  },

  /**
   * Valida una empresa
   * @param {Object} empresa - Empresa a validar
   * @returns {Object} Resultado de la validación
   */
  validarEmpresa: (empresa) => {
    const errores = [];

    if (!empresa.name || empresa.name.trim() === "") {
      errores.push("El nombre es requerido");
    }

    if (!empresa.id) {
      errores.push("El ID es requerido");
    }

    return {
      esValido: errores.length === 0,
      errores,
    };
  },

  /**
   * Obtiene la jerarquía de empresas (empresa principal -> divisiones)
   * @param {Array} empresasList - Lista de empresas
   * @returns {Array} Jerarquía organizada
   */
  getJerarquia: (empresasList = []) => {
    const { empresasPrincipales, divisiones } =
      empresasService.separarEmpresasYDivisiones(empresasList);

    return empresasPrincipales.map((empresa) => ({
      ...empresa,
      divisiones: divisiones.filter(
        (div) =>
          div.empresa_padre === empresa.id ||
          div.parent_id === empresa.id ||
          div.emp === empresa.id
      ),
    }));
  },

  /**
   * Obtiene empresas activas
   * @param {Array} empresasList - Lista de empresas
   * @returns {Array} Solo empresas activas
   */
  getEmpresasActivas: (empresasList = []) => {
    return empresasList.filter(
      (empresa) =>
        empresa.activa === true ||
        empresa.estado === "activa" ||
        empresa.active === true ||
        (!empresa.hasOwnProperty("activa") &&
          !empresa.hasOwnProperty("estado") &&
          !empresa.hasOwnProperty("active"))
    );
  },
};

export default empresasService;
