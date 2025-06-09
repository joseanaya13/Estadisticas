// utils/filtrosConfig.js - Configuración de filtros por contexto
export const FILTROS_CONFIG = {
  // FILTROS PARA VENTAS GENERALES
  ventas: {
    campos: ['fecha', 'cliente', 'vendedor', 'tienda', 'formaPago'],
    titulo: 'Filtros de Ventas',
    filtros: {
      fecha: {
        tipo: 'rango-fecha',
        label: 'Período',
        campos: ['fechaDesde', 'fechaHasta'],
        required: false
      },
      año: {
        tipo: 'select',
        label: 'Año',
        opciones: 'dinamico', // Se cargan dinámicamente
        defecto: 'todos'
      },
      mes: {
        tipo: 'select',
        label: 'Mes',
        opciones: [
          { value: 'todos', label: 'Todos los meses' },
          { value: '1', label: 'Enero' },
          { value: '2', label: 'Febrero' },
          { value: '3', label: 'Marzo' },
          { value: '4', label: 'Abril' },
          { value: '5', label: 'Mayo' },
          { value: '6', label: 'Junio' },
          { value: '7', label: 'Julio' },
          { value: '8', label: 'Agosto' },
          { value: '9', label: 'Septiembre' },
          { value: '10', label: 'Octubre' },
          { value: '11', label: 'Noviembre' },
          { value: '12', label: 'Diciembre' }
        ],
        defecto: 'todos'
      },
      cliente: {
        tipo: 'select-async',
        label: 'Cliente',
        endpoint: '/ent_m',
        filtro: 'es_clt=true',
        defecto: 'todos'
      },
      vendedor: {
        tipo: 'select-async',
        label: 'Vendedor',
        endpoint: '/usr_m',
        defecto: 'todos'
      },
      tienda: {
        tipo: 'select-async',
        label: 'Tienda/Almacén',
        endpoint: '/emp_m',
        defecto: 'todas'
      },
      formaPago: {
        tipo: 'select-async',
        label: 'Forma de Pago',
        endpoint: '/fpg_m',
        defecto: 'todas'
      }
    }
  },

  // FILTROS PARA PROVEEDORES - CONTEXTUALES
  proveedores: {
    campos: ['fecha', 'proveedor', 'marca', 'categoria', 'margen'],
    titulo: 'Filtros de Proveedores',
    filtros: {
      fecha: {
        tipo: 'rango-fecha',
        label: 'Período',
        campos: ['fechaDesde', 'fechaHasta'],
        required: false
      },
      año: {
        tipo: 'select',
        label: 'Año',
        opciones: 'dinamico',
        defecto: 'todos'
      },
      mes: {
        tipo: 'select',
        label: 'Mes',
        opciones: [
          { value: 'todos', label: 'Todos los meses' },
          { value: '1', label: 'Enero' },
          { value: '2', label: 'Febrero' },
          { value: '3', label: 'Marzo' },
          { value: '4', label: 'Abril' },
          { value: '5', label: 'Mayo' },
          { value: '6', label: 'Junio' },
          { value: '7', label: 'Julio' },
          { value: '8', label: 'Agosto' },
          { value: '9', label: 'Septiembre' },
          { value: '10', label: 'Octubre' },
          { value: '11', label: 'Noviembre' },
          { value: '12', label: 'Diciembre' }
        ],
        defecto: 'todos'
      },
      proveedor: {
        tipo: 'select-async',
        label: 'Proveedor Específico',
        endpoint: '/ent_m',
        filtro: 'es_prv=true',
        defecto: 'todos'
      },
      marca: {
        tipo: 'select-async',
        label: 'Marca',
        endpoint: '/mar_m',
        defecto: 'todas'
      },
      categoria: {
        tipo: 'select',
        label: 'Categoría de Producto',
        opciones: 'familias', // Se cargan de familias de productos
        defecto: 'todas'
      },
      margen: {
        tipo: 'rango',
        label: 'Rango de Margen (%)',
        min: 0,
        max: 100,
        defecto: { min: 0, max: 100 }
      },
      ventasMinimas: {
        tipo: 'numero',
        label: 'Ventas Mínimas (€)',
        placeholder: 'Ej: 1000',
        defecto: null
      }
    }
  },

  // FILTROS PARA PRODUCTOS
  productos: {
    campos: ['fecha', 'categoria', 'marca', 'proveedor', 'precio'],
    titulo: 'Filtros de Productos',
    filtros: {
      fecha: {
        tipo: 'rango-fecha',
        label: 'Período',
        campos: ['fechaDesde', 'fechaHasta'],
        required: false
      },
      categoria: {
        tipo: 'select-async',
        label: 'Categoría',
        endpoint: '/fam_m',
        defecto: 'todas'
      },
      marca: {
        tipo: 'select-async',
        label: 'Marca',
        endpoint: '/mar_m',
        defecto: 'todas'
      },
      proveedor: {
        tipo: 'select-async',
        label: 'Proveedor',
        endpoint: '/ent_m',
        filtro: 'es_prv=true',
        defecto: 'todos'
      },
      precio: {
        tipo: 'rango',
        label: 'Rango de Precio (€)',
        min: 0,
        max: 1000,
        defecto: { min: 0, max: 1000 }
      },
      stock: {
        tipo: 'select',
        label: 'Estado de Stock',
        opciones: [
          { value: 'todos', label: 'Todos' },
          { value: 'con-stock', label: 'Con Stock' },
          { value: 'sin-stock', label: 'Sin Stock' },
          { value: 'stock-bajo', label: 'Stock Bajo' }
        ],
        defecto: 'todos'
      }
    }
  },

  // FILTROS PARA CLIENTES
  clientes: {
    campos: ['fecha', 'tipoCliente', 'zona', 'ventasMinimas'],
    titulo: 'Filtros de Clientes',
    filtros: {
      fecha: {
        tipo: 'rango-fecha',
        label: 'Período',
        campos: ['fechaDesde', 'fechaHasta'],
        required: false
      },
      tipoCliente: {
        tipo: 'select',
        label: 'Tipo de Cliente',
        opciones: [
          { value: 'todos', label: 'Todos' },
          { value: 'particulares', label: 'Particulares' },
          { value: 'empresas', label: 'Empresas' },
          { value: 'vip', label: 'VIP' }
        ],
        defecto: 'todos'
      },
      zona: {
        tipo: 'select-async',
        label: 'Zona Geográfica',
        endpoint: '/zonas',
        defecto: 'todas'
      },
      ventasMinimas: {
        tipo: 'numero',
        label: 'Ventas Mínimas (€)',
        placeholder: 'Ej: 500',
        defecto: null
      }
    }
  },

  // FILTROS PARA VENDEDORES
  vendedores: {
    campos: ['fecha', 'vendedor', 'tienda', 'comision'],
    titulo: 'Filtros de Vendedores',
    filtros: {
      fecha: {
        tipo: 'rango-fecha',
        label: 'Período',
        campos: ['fechaDesde', 'fechaHasta'],
        required: false
      },
      vendedor: {
        tipo: 'select-async',
        label: 'Vendedor Específico',
        endpoint: '/usr_m',
        defecto: 'todos'
      },
      tienda: {
        tipo: 'select-async',
        label: 'Tienda',
        endpoint: '/emp_m',
        defecto: 'todas'
      },
      comision: {
        tipo: 'rango',
        label: 'Rango de Comisión (%)',
        min: 0,
        max: 20,
        defecto: { min: 0, max: 20 }
      }
    }
  }
};

// Función para obtener configuración por contexto
export const getFiltrosConfig = (contexto) => {
  return FILTROS_CONFIG[contexto] || FILTROS_CONFIG.ventas;
};

// Valores por defecto según contexto
export const getValoresDefecto = (contexto) => {
  const config = getFiltrosConfig(contexto);
  const valores = {};
  
  Object.entries(config.filtros).forEach(([key, filtro]) => {
    valores[key] = filtro.defecto;
  });
  
  return valores;
};