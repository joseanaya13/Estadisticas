// hooks/useAdaptiveFilters.js
import { useMemo } from 'react';

/**
 * Hook para generar configuración de filtros adaptables según el contexto
 * @param {string} context - Contexto donde se usan los filtros (ventas, proveedores, compras, etc.)
 * @param {object} data - Datos disponibles para generar opciones
 * @param {object} mapas - Mapas de conversión ID -> Nombre
 * @param {object} filtros - Estado actual de los filtros
 * @returns {array} Configuración de filtros adaptada al contexto
 */
export const useAdaptiveFilters = (context, data, mapas = {}, filtros = {}) => {
  
  const filterConfig = useMemo(() => {
    // Configuraciones base por contexto
    const contextConfigs = {
      ventas: {
        primary: ['año', 'mes', 'vendedor', 'cliente', 'tienda'],
        secondary: ['fechaDesde', 'fechaHasta', 'formaPago', 'empresa'],
        exclude: ['proveedor', 'comprador']
      },
      proveedores: {
        primary: ['año', 'mes', 'proveedor', 'categoria'],
        secondary: ['fechaDesde', 'fechaHasta', 'marca'],
        exclude: ['vendedor', 'cliente', 'tienda', 'comprador']
      },
      compras: {
        primary: ['año', 'mes', 'proveedor', 'comprador'],
        secondary: ['fechaDesde', 'fechaHasta', 'categoria'],
        exclude: ['vendedor', 'cliente', 'tienda']
      },
      clientes: {
        primary: ['año', 'mes', 'cliente', 'vendedor'],
        secondary: ['fechaDesde', 'fechaHasta', 'tienda', 'zona'],
        exclude: ['proveedor', 'comprador']
      },
      productos: {
        primary: ['año', 'mes', 'categoria', 'marca'],
        secondary: ['fechaDesde', 'fechaHasta', 'proveedor'],
        exclude: ['vendedor', 'cliente', 'comprador']
      },
      inventario: {
        primary: ['categoria', 'marca', 'proveedor'],
        secondary: ['stock', 'estado'],
        exclude: ['año', 'mes', 'vendedor', 'cliente', 'fechaDesde', 'fechaHasta']
      }
    };

    const currentConfig = contextConfigs[context] || contextConfigs.ventas;
    
    // Definición completa de todos los filtros posibles
    const allFilters = {
      año: {
        id: "año",
        label: "Año",
        type: "select",
        value: filtros.año || "todos",
        options: generateYearOptions(data),
        group: "temporal",
        priority: 1
      },
      mes: {
        id: "mes",
        label: "Mes",
        type: "select", 
        value: filtros.mes || "todos",
        options: generateMonthOptions(),
        group: "temporal",
        priority: 2
      },
      fechaDesde: {
        id: "fechaDesde",
        label: "Desde",
        type: "date",
        value: filtros.fechaDesde || "",
        group: "temporal",
        priority: 3
      },
      fechaHasta: {
        id: "fechaHasta", 
        label: "Hasta",
        type: "date",
        value: filtros.fechaHasta || "",
        group: "temporal",
        priority: 4
      },
      vendedor: {
        id: "vendedor",
        label: "Vendedor",
        type: "select",
        value: filtros.vendedor || "todos",
        options: generateVendedorOptions(data, mapas.mapaUsuarios),
        group: "personas",
        priority: 5
      },
      cliente: {
        id: "cliente",
        label: "Cliente", 
        type: "select",
        value: filtros.cliente || "todos",
        options: generateClienteOptions(data, mapas.mapaContactos),
        group: "personas",
        priority: 6
      },
      proveedor: {
        id: "proveedor",
        label: "Proveedor",
        type: "select",
        value: filtros.proveedor || "todos", 
        options: generateProveedorOptions(data, mapas.mapaProveedores),
        group: "personas",
        priority: 7
      },
      comprador: {
        id: "comprador",
        label: "Comprador",
        type: "select",
        value: filtros.comprador || "todos",
        options: generateCompradorOptions(data, mapas.mapaUsuarios),
        group: "personas", 
        priority: 8
      },
      tienda: {
        id: "tienda",
        label: "Tienda",
        type: "select",
        value: filtros.tienda || "todas",
        options: generateTiendaOptions(data, mapas.mapaEmpresas),
        group: "ubicacion",
        priority: 9
      },
      zona: {
        id: "zona",
        label: "Zona",
        type: "select",
        value: filtros.zona || "todas",
        options: generateZonaOptions(data),
        group: "ubicacion",
        priority: 10
      },
      categoria: {
        id: "categoria",
        label: "Categoría",
        type: "select",
        value: filtros.categoria || "todas",
        options: generateCategoriaOptions(data),
        group: "producto",
        priority: 11
      },
      marca: {
        id: "marca", 
        label: "Marca",
        type: "select",
        value: filtros.marca || "todas",
        options: generateMarcaOptions(data),
        group: "producto",
        priority: 12
      },
      formaPago: {
        id: "formaPago",
        label: "Forma de Pago",
        type: "select",
        value: filtros.formaPago || "todas",
        options: generateFormaPagoOptions(data, mapas.mapaFormasPago),
        group: "comercial",
        priority: 13
      },
      empresa: {
        id: "empresa",
        label: "Empresa",
        type: "select", 
        value: filtros.empresa || "todas",
        options: generateEmpresaOptions(data, mapas.mapaEmpresas),
        group: "comercial",
        priority: 14
      },
      stock: {
        id: "stock",
        label: "Nivel de Stock",
        type: "select",
        value: filtros.stock || "todos",
        options: [
          { value: "todos", label: "Todos los niveles" },
          { value: "alto", label: "Stock alto (>100)" },
          { value: "medio", label: "Stock medio (10-100)" },
          { value: "bajo", label: "Stock bajo (<10)" },
          { value: "agotado", label: "Sin stock (0)" }
        ],
        group: "inventario",
        priority: 15
      },
      estado: {
        id: "estado",
        label: "Estado",
        type: "select",
        value: filtros.estado || "todos",
        options: [
          { value: "todos", label: "Todos los estados" },
          { value: "activo", label: "Activos" },
          { value: "inactivo", label: "Inactivos" },
          { value: "descontinuado", label: "Descontinuados" }
        ],
        group: "inventario", 
        priority: 16
      }
    };

    // Filtrar y ordenar según el contexto
    const selectedFilters = [];
    
    // Agregar filtros primarios
    currentConfig.primary.forEach(filterId => {
      if (allFilters[filterId] && !currentConfig.exclude.includes(filterId)) {
        selectedFilters.push({
          ...allFilters[filterId],
          isPrimary: true
        });
      }
    });
    
    // Agregar filtros secundarios
    currentConfig.secondary.forEach(filterId => {
      if (allFilters[filterId] && !currentConfig.exclude.includes(filterId)) {
        selectedFilters.push({
          ...allFilters[filterId],
          isPrimary: false
        });
      }
    });

    // Ordenar por prioridad
    return selectedFilters.sort((a, b) => a.priority - b.priority);
    
  }, [context, data, mapas, filtros]);

  return filterConfig;
};

// Funciones generadoras de opciones
const generateYearOptions = (data) => {
  if (!data || !data.fac_t) return [{ value: "todos", label: "Todos los años" }];
  
  const años = [...new Set(
    data.fac_t.map(item => {
      const año = typeof item.eje === "string" ? parseInt(item.eje) : item.eje;
      return año;
    }).filter(año => año && !isNaN(año))
  )].sort((a, b) => b - a);

  return [
    { value: "todos", label: "Todos los años" },
    ...años.map(año => ({ value: año.toString(), label: año.toString() }))
  ];
};

const generateMonthOptions = () => {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  return [
    { value: "todos", label: "Todos los meses" },
    ...meses.map((mes, index) => ({
      value: (index + 1).toString(),
      label: mes
    }))
  ];
};

const generateVendedorOptions = (data, mapaUsuarios = {}) => {
  if (!data || !data.fac_t) return [{ value: "todos", label: "Todos los vendedores" }];
  
  const vendedores = [...new Set(
    data.fac_t.map(item => item.usr).filter(usr => usr)
  )].sort((a, b) => {
    const nombreA = mapaUsuarios[a] || `Vendedor ${a}`;
    const nombreB = mapaUsuarios[b] || `Vendedor ${b}`;
    return nombreA.localeCompare(nombreB);
  });

  return [
    { value: "todos", label: "Todos los vendedores" },
    ...vendedores.map(vendedorId => ({
      value: vendedorId,
      label: mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`
    }))
  ];
};

const generateClienteOptions = (data, mapaContactos = {}) => {
  if (!data || !data.fac_t) return [{ value: "todos", label: "Todos los clientes" }];
  
  const clientes = [...new Set(
    data.fac_t.map(item => item.cnt).filter(cnt => cnt)
  )].sort((a, b) => {
    const nombreA = mapaContactos[a] || `Cliente ${a}`;
    const nombreB = mapaContactos[b] || `Cliente ${b}`;
    return nombreA.localeCompare(nombreB);
  });

  return [
    { value: "todos", label: "Todos los clientes" },
    ...clientes.map(clienteId => ({
      value: clienteId,
      label: mapaContactos[clienteId] || `Cliente ${clienteId}`
    }))
  ];
};

const generateProveedorOptions = (data, mapaProveedores = {}) => {
  // Esta función necesitará adaptarse según la estructura de datos de proveedores
  return [
    { value: "todos", label: "Todos los proveedores" }
    // TODO: Implementar lógica específica para proveedores
  ];
};

const generateCompradorOptions = (data, mapaUsuarios = {}) => {
  // Similar a vendedores pero para el contexto de compras
  return [
    { value: "todos", label: "Todos los compradores" }
    // TODO: Implementar lógica específica para compradores
  ];
};

const generateTiendaOptions = (data, mapaEmpresas = {}) => {
  if (!data || !data.fac_t) return [{ value: "todas", label: "Todas las tiendas" }];
  
  const tiendas = [...new Set(
    data.fac_t.map(item => item.emp).filter(emp => emp)
  )];

  return [
    { value: "todas", label: "Todas las tiendas" },
    ...tiendas.map(tiendaId => ({
      value: tiendaId,
      label: mapaEmpresas[tiendaId] || `Tienda ${tiendaId}`
    }))
  ];
};

const generateZonaOptions = (data) => {
  // TODO: Implementar según estructura de datos de zonas
  return [
    { value: "todas", label: "Todas las zonas" }
  ];
};

const generateCategoriaOptions = (data) => {
  // TODO: Implementar según estructura de datos de categorías
  return [
    { value: "todas", label: "Todas las categorías" }
  ];
};

const generateMarcaOptions = (data) => {
  // TODO: Implementar según estructura de datos de marcas
  return [
    { value: "todas", label: "Todas las marcas" }
  ];
};

const generateFormaPagoOptions = (data, mapaFormasPago = {}) => {
  if (!data || !data.fac_t) return [{ value: "todas", label: "Todas las formas de pago" }];
  
  const formasPago = [...new Set(
    data.fac_t.map(item => item.fpa).filter(fpa => fpa)
  )];

  return [
    { value: "todas", label: "Todas las formas de pago" },
    ...formasPago.map(formaId => ({
      value: formaId,
      label: mapaFormasPago[formaId] || `Forma ${formaId}`
    }))
  ];
};

const generateEmpresaOptions = (data, mapaEmpresas = {}) => {
  return generateTiendaOptions(data, mapaEmpresas); // Misma lógica
};

export default useAdaptiveFilters;