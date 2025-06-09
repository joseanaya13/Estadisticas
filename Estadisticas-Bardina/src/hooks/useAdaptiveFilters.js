// hooks/useAdaptiveFilters.js
import { useMemo } from 'react';

/**
 * Hook para generar configuración de filtros adaptables según el contexto
 * @param {string} context - Contexto donde se usan los filtros (ventas, proveedores, compras, etc.)
 * @param {object} data - Datos disponibles para generar opciones
 * @param {object} mapas - Mapas de conversión ID -> Nombre
 * @param {object} filtros - Estado actual de los filtros
 * @param {array} empresasData - Array completo de empresas con flag es_emp
 * @returns {array} Configuración de filtros adaptada al contexto
 */
export const useAdaptiveFilters = (context, data, mapas = {}, filtros = {}, empresasData = []) => {
  
  const filterConfig = useMemo(() => {
    // Configuraciones base por contexto
    const contextConfigs = {
      dashboard: {
        primary: ['año', 'mes', 'empresa'],
        secondary: ['fechaDesde', 'fechaHasta'],
        exclude: ['vendedor', 'cliente', 'proveedor', 'comprador', 'categoria', 'marca']
      },
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
        options: generateTiendaOptions(data, mapas.mapaEmpresas, empresasData),
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
        options: generateEmpresaOptions(data, mapas.mapaEmpresas, empresasData),
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
    
  }, [context, data, mapas, filtros, empresasData]);

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
  if (!data || !data.fac_t || !Object.keys(mapaUsuarios).length) {
    return [{ value: "todos", label: "Cargando vendedores..." }];
  }

  // Calcular totales de ventas por vendedor (usando alt_usr)
  const ventasPorVendedor = {};
  data.fac_t.forEach((item) => {
    if (item.alt_usr !== undefined && item.alt_usr !== null) {
      const vendedorId = item.alt_usr.toString();
      if (!ventasPorVendedor[vendedorId]) {
        ventasPorVendedor[vendedorId] = 0;
      }
      ventasPorVendedor[vendedorId] += item.tot || 0;
    }
  });

  // Filtrar solo vendedores con ventas > 0
  const vendedoresConVentasPositivas = Object.keys(ventasPorVendedor).filter(
    (vendedorId) => ventasPorVendedor[vendedorId] > 0
  );

  const opciones = [{ value: "todos", label: "Todos los vendedores" }];
  const nombresUsados = new Set();

  vendedoresConVentasPositivas
    .sort((a, b) => {
      const nombreA = mapaUsuarios[a] || `Vendedor ${a}`;
      const nombreB = mapaUsuarios[b] || `Vendedor ${b}`;
      return nombreA.localeCompare(nombreB);
    })
    .forEach((vendedorId) => {
      const nombreVendedor = mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`;

      if (!nombresUsados.has(nombreVendedor)) {
        nombresUsados.add(nombreVendedor);
        opciones.push({
          value: vendedorId,
          label: nombreVendedor,
        });
      }
    });

  return opciones;
};

const generateClienteOptions = (data, mapaContactos = {}) => {
  if (!data || !data.fac_t || !Object.keys(mapaContactos).length) {
    return [{ value: "todos", label: "Cargando clientes..." }];
  }
  
  // Obtener clientes únicos que tienen facturas (usando cnt)
  const clientes = [...new Set(
    data.fac_t.map(item => item.cnt).filter(cnt => cnt && cnt !== '')
  )];

  return [
    { value: "todos", label: "Todos los clientes" },
    ...clientes
      .sort((a, b) => {
        const nombreA = mapaContactos[a] || `Cliente ${a}`;
        const nombreB = mapaContactos[b] || `Cliente ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .map(clienteId => ({
        value: clienteId,
        label: mapaContactos[clienteId] || `Cliente ${clienteId}`
      }))
  ];
};

const generateProveedorOptions = (data, mapaProveedores = {}) => {
  // TODO: Implementar según la estructura de datos de proveedores
  return [
    { value: "todos", label: "Todos los proveedores" }
  ];
};

const generateCompradorOptions = (data, mapaUsuarios = {}) => {
  // TODO: Implementar lógica específica para compradores
  return [
    { value: "todos", label: "Todos los compradores" }
  ];
};

const generateTiendaOptions = (data, mapaEmpresas = {}, empresasData = []) => {
  if (!data || !data.fac_t || !Object.keys(mapaEmpresas).length) {
    return [{ value: "todas", label: "Cargando tiendas..." }];
  }
  
  // Filtrar solo tiendas (es_emp: false) de empresasData
  const tiendasDisponibles = empresasData.filter(emp => emp.es_emp === false);
  const idsValidosTiendas = new Set(tiendasDisponibles.map(t => t.id));
  
  // Obtener tiendas únicas que tienen facturas y son tiendas reales
  const tiendas = [...new Set(
    data.fac_t.map(item => item.emp)
      .filter(emp => emp && emp !== '' && idsValidosTiendas.has(emp))
  )];

  return [
    { value: "todas", label: "Todas las tiendas" },
    ...tiendas
      .sort((a, b) => {
        const nombreA = mapaEmpresas[a] || `Tienda ${a}`;
        const nombreB = mapaEmpresas[b] || `Tienda ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .map(tiendaId => ({
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
  if (!data || !data.fac_t || !Object.keys(mapaFormasPago).length) {
    return [{ value: "todas", label: "Cargando formas de pago..." }];
  }
  
  // Obtener formas de pago únicas que se han usado (usando fpa)
  const formasPago = [...new Set(
    data.fac_t.map(item => item.fpa).filter(fpa => fpa && fpa !== '')
  )];

  return [
    { value: "todas", label: "Todas las formas de pago" },
    ...formasPago
      .sort((a, b) => {
        const nombreA = mapaFormasPago[a] || `Forma ${a}`;
        const nombreB = mapaFormasPago[b] || `Forma ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .map(formaId => ({
        value: formaId,
        label: mapaFormasPago[formaId] || `Forma ${formaId}`
      }))
  ];
};

const generateEmpresaOptions = (data, mapaEmpresas = {}, empresasData = []) => {
  if (!data || !data.fac_t || !Object.keys(mapaEmpresas).length) {
    return [{ value: "todas", label: "Cargando empresas..." }];
  }
  
  // Filtrar solo empresas/divisiones (es_emp: true) de empresasData
  const empresasDisponibles = empresasData.filter(emp => emp.es_emp === true);
  const idsValidosEmpresas = new Set(empresasDisponibles.map(e => e.id));
  
  // Obtener empresas únicas que tienen facturas y son empresas reales
  const empresas = [...new Set(
    data.fac_t.map(item => item.emp)
      .filter(emp => emp && emp !== '' && idsValidosEmpresas.has(emp))
  )];

  return [
    { value: "todas", label: "Todas las empresas" },
    ...empresas
      .sort((a, b) => {
        const nombreA = mapaEmpresas[a] || `Empresa ${a}`;
        const nombreB = mapaEmpresas[b] || `Empresa ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .map(empresaId => ({
        value: empresaId,
        label: mapaEmpresas[empresaId] || `Empresa ${empresaId}`
      }))
  ];
};

export default useAdaptiveFilters;