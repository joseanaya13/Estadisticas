// services/contactosService.js - Servicio para contactos/clientes
import { apiClient } from "./apiClient.js";

export const contactosService = {
  /**
   * Obtiene todos los contactos (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getContactos: (params = {}) => {
    const query = apiClient.buildQueryParams(params);
    return apiClient.getAllPaginated(`/ent_m${query}`, "ent_m");
  },

  /**
   * Obtiene un contacto por ID
   * @param {number} id - ID del contacto
   * @returns {Promise} Promesa con los datos
   */
  getContacto: (id) => {
    return apiClient.get(`/ent_m/${id}`);
  },

  /**
   * Obtiene el nombre de un contacto por su ID
   * @param {string|number} id - ID del contacto
   * @param {Array} contactosList - Lista de contactos (opcional)
   * @returns {string} Nombre del contacto
   */
  getNombreContacto: (id, contactosList = []) => {
    if (!id) return "Sin cliente";

    const contacto = contactosList.find(
      (c) => c.id === id || c.id === id.toString()
    );
    return contacto ? contacto.name : `Cliente ${id}`;
  },

  /**
   * Busca contactos por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} contactosList - Lista de contactos
   * @returns {Array} Array de contactos que coinciden
   */
  buscarPorNombre: (nombre, contactosList = []) => {
    if (!nombre) return [];

    const nombreLower = nombre.toLowerCase();
    return contactosList.filter(
      (contacto) =>
        contacto.name && contacto.name.toLowerCase().includes(nombreLower)
    );
  },

  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} contactosList - Lista de contactos
   * @returns {Object} Mapa de ID a nombre
   */
  crearMapaNombres: (contactosList = []) => {
    const mapa = {};
    contactosList.forEach((contacto) => {
      if (contacto.id && contacto.name) {
        mapa[contacto.id] = contacto.name;
      }
    });
    return mapa;
  },

  /**
   * Busca contactos por tipo (cliente, proveedor, etc.)
   * @param {string} tipo - Tipo de contacto
   * @param {Array} contactosList - Lista de contactos
   * @returns {Array} Contactos filtrados por tipo
   */
  buscarPorTipo: (tipo, contactosList = []) => {
    return contactosList.filter((contacto) => {
      // Aquí puedes agregar lógica específica según los campos que tenga tu API
      // Por ejemplo, si hay un campo 'tipo' o 'es_cliente'
      if (contacto.tipo === tipo) return true;

      // Otras condiciones según tu modelo de datos
      return false;
    });
  },

  /**
   * Obtiene estadísticas de contactos
   * @param {Array} contactosList - Lista de contactos
   * @returns {Object} Estadísticas de contactos
   */
  getEstadisticas: (contactosList = []) => {
    if (!contactosList.length) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        porTipo: {},
      };
    }

    const estadisticas = {
      total: contactosList.length,
      activos: 0,
      inactivos: 0,
      porTipo: {},
    };

    contactosList.forEach((contacto) => {
      // Contar activos/inactivos si existe el campo
      if (contacto.activo === true || contacto.estado === "activo") {
        estadisticas.activos++;
      } else if (contacto.activo === false || contacto.estado === "inactivo") {
        estadisticas.inactivos++;
      }

      // Agrupar por tipo si existe el campo
      if (contacto.tipo) {
        estadisticas.porTipo[contacto.tipo] =
          (estadisticas.porTipo[contacto.tipo] || 0) + 1;
      }
    });

    return estadisticas;
  },

  /**
   * Obtiene contactos que aparecen en las ventas
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} contactosList - Lista completa de contactos
   * @returns {Array} Contactos que tienen ventas
   */
  getContactosConVentas: (ventasData = [], contactosList = []) => {
    const clientesConVentas = new Set();

    ventasData.forEach((venta) => {
      if (venta.clt && venta.clt !== "0" && venta.clt !== "null") {
        clientesConVentas.add(venta.clt.toString());
      }
    });

    return contactosList.filter((contacto) =>
      clientesConVentas.has(contacto.id.toString())
    );
  },

  /**
   * Obtiene estadísticas de ventas por cliente
   * @param {Array} ventasData - Datos de ventas
   * @param {Array} contactosList - Lista de contactos
   * @returns {Array} Estadísticas por cliente
   */
  getEstadisticasVentasPorCliente: (ventasData = [], contactosList = []) => {
    const mapaContactos = contactosService.crearMapaNombres(contactosList);
    const ventasPorCliente = {};

    ventasData.forEach((venta) => {
      const clienteId = venta.clt;
      if (
        clienteId &&
        clienteId !== "0" &&
        clienteId !== "null" &&
        venta.tot > 0
      ) {
        if (!ventasPorCliente[clienteId]) {
          ventasPorCliente[clienteId] = {
            clienteId,
            nombreCliente: mapaContactos[clienteId] || `Cliente ${clienteId}`,
            totalVentas: 0,
            cantidadFacturas: 0,
            promedioFactura: 0,
          };
        }

        ventasPorCliente[clienteId].totalVentas += venta.tot || 0;
        ventasPorCliente[clienteId].cantidadFacturas += 1;
      }
    });

    return Object.values(ventasPorCliente)
      .map((cliente) => ({
        ...cliente,
        promedioFactura:
          cliente.cantidadFacturas > 0
            ? cliente.totalVentas / cliente.cantidadFacturas
            : 0,
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
  },

  /**
   * Valida un contacto
   * @param {Object} contacto - Contacto a validar
   * @returns {Object} Resultado de la validación
   */
  validarContacto: (contacto) => {
    const errores = [];

    if (!contacto.name || contacto.name.trim() === "") {
      errores.push("El nombre es requerido");
    }

    if (!contacto.id) {
      errores.push("El ID es requerido");
    }

    // Agregar más validaciones según necesidades

    return {
      esValido: errores.length === 0,
      errores,
    };
  },

  /**
   * Normaliza un contacto
   * @param {Object} contacto - Contacto a normalizar
   * @returns {Object} Contacto normalizado
   */
  normalizarContacto: (contacto) => {
    return {
      ...contacto,
      name: contacto.name ? contacto.name.trim() : "",
      // Agregar más normalizaciones según necesidades
    };
  },
};

export default contactosService;
