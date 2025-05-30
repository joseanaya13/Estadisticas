// services/ventasService.js - Servicio para facturas de venta
import { apiClient } from './apiClient.js';

export const ventasService = {
  /**
   * Obtiene todas las facturas (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos
   */
  getFacturas: (params = {}) => {
    const query = apiClient.buildQueryParams(params);
    return apiClient.getAllPaginated(`/fac_t${query}`, 'fac_t');
  },
  
  /**
   * Obtiene una factura por ID
   * @param {number} id - ID de la factura
   * @returns {Promise} Promesa con los datos
   */
  getFactura: (id) => {
    return apiClient.get(`/fac_t/${id}`);
  },
  
  /**
   * Obtiene facturas con filtros específicos
   * @param {Object} filtros - Filtros aplicados
   * @returns {Promise} Promesa con los datos filtrados
   */
  getFacturasFiltradas: (filtros = {}) => {
    const params = {};
    
    // Convertir filtros de la UI a parámetros de API
    if (filtros.eje && filtros.eje !== 'todos') {
      params['filter[eje]'] = filtros.eje;
    }
    
    if (filtros.mes && filtros.mes !== 'todos') {
      params['filter[mes]'] = filtros.mes;
    }
    
    if (filtros.emp && filtros.emp !== 'todas') {
      params['filter[emp]'] = filtros.emp;
    }
    
    if (filtros.fechaDesde && filtros.fechaHasta) {
      params['filter[fch]'] = `${filtros.fechaDesde},${filtros.fechaHasta}`;
    } else if (filtros.fechaDesde) {
      params['filter[fch][gte]'] = filtros.fechaDesde;
    } else if (filtros.fechaHasta) {
      params['filter[fch][lte]'] = filtros.fechaHasta;
    }
    
    return ventasService.getFacturas(params);
  },
  
  /**
   * Obtiene estadísticas básicas de ventas
   * @param {Array} facturas - Array de facturas
   * @returns {Object} Estadísticas calculadas
   */
  calcularEstadisticas: (facturas = []) => {
    if (!facturas.length) {
      return {
        total: 0,
        cantidad: 0,
        promedio: 0,
        ventasPorMes: [],
        ventasPorCliente: [],
        ventasPorVendedor: []
      };
    }
    
    // Calcular totales básicos
    const total = facturas.reduce((sum, item) => sum + (item.tot || 0), 0);
    const cantidad = facturas.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    // Ventas por mes
    const mesesMap = {};
    facturas.forEach(item => {
      const mes = item.mes;
      if (mes) {
        mesesMap[mes] = (mesesMap[mes] || 0) + (item.tot || 0);
      }
    });
    
    const ventasPorMes = Object.entries(mesesMap).map(([mes, total]) => ({
      mes: parseInt(mes),
      total
    })).sort((a, b) => a.mes - b.mes);
    
    // Ventas por cliente
    const clientesMap = {};
    facturas.forEach(item => {
      const cliente = item.clt;
      if (cliente) {
        clientesMap[cliente] = (clientesMap[cliente] || 0) + (item.tot || 0);
      }
    });
    
    const ventasPorCliente = Object.entries(clientesMap)
      .map(([cliente, total]) => ({
        cliente,
        total
      }))
      .sort((a, b) => b.total - a.total);
    
    // Ventas por vendedor
    const vendedoresMap = {};
    facturas.forEach(item => {
      const vendedor = item.alt_usr;
      if (vendedor !== undefined && vendedor !== null) {
        if (!vendedoresMap[vendedor]) {
          vendedoresMap[vendedor] = {
            vendedor,
            totalVentas: 0,
            cantidadFacturas: 0
          };
        }
        vendedoresMap[vendedor].totalVentas += (item.tot || 0);
        vendedoresMap[vendedor].cantidadFacturas += 1;
      }
    });
    
    const ventasPorVendedor = Object.values(vendedoresMap)
      .map(vendedor => ({
        ...vendedor,
        promedioFactura: vendedor.cantidadFacturas > 0 ? 
          vendedor.totalVentas / vendedor.cantidadFacturas : 0
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
    
    return {
      total,
      cantidad,
      promedio,
      ventasPorMes,
      ventasPorCliente,
      ventasPorVendedor
    };
  },
  
  /**
   * Obtiene el resumen de ventas por período
   * @param {Array} facturas - Array de facturas
   * @param {string} periodo - 'mes', 'dia', 'semana'
   * @returns {Array} Datos agrupados por período
   */
  agruparPorPeriodo: (facturas = [], periodo = 'mes') => {
    const grupos = {};
    
    facturas.forEach(factura => {
      let clave;
      
      switch (periodo) {
        case 'dia':
          if (factura.fch) {
            clave = new Date(factura.fch).toLocaleDateString('es-ES');
          }
          break;
        case 'semana':
          if (factura.fch) {
            const fecha = new Date(factura.fch);
            const semana = Math.ceil(fecha.getDate() / 7);
            clave = `Semana ${semana}`;
          }
          break;
        case 'mes':
        default:
          clave = factura.mes;
          break;
      }
      
      if (clave) {
        if (!grupos[clave]) {
          grupos[clave] = {
            periodo: clave,
            totalVentas: 0,
            cantidadFacturas: 0,
            promedioFactura: 0
          };
        }
        
        grupos[clave].totalVentas += (factura.tot || 0);
        grupos[clave].cantidadFacturas += 1;
      }
    });
    
    // Calcular promedios
    return Object.values(grupos).map(grupo => ({
      ...grupo,
      promedioFactura: grupo.cantidadFacturas > 0 ? 
        grupo.totalVentas / grupo.cantidadFacturas : 0
    })).sort((a, b) => {
      if (periodo === 'dia') {
        return new Date(a.periodo.split('/').reverse().join('-')) - 
               new Date(b.periodo.split('/').reverse().join('-'));
      }
      return a.periodo.toString().localeCompare(b.periodo.toString());
    });
  },
  
  /**
   * Filtra facturas por múltiples criterios (lado cliente)
   * @param {Array} facturas - Array de facturas
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Array} Facturas filtradas
   */
  filtrarFacturas: (facturas = [], filtros = {}) => {
    return facturas.filter(factura => {
      // Filtro por año
      if (filtros.año && filtros.año !== 'todos') {
        const año = parseInt(filtros.año);
        const facturaAño = typeof factura.eje === 'string' ? parseInt(factura.eje) : factura.eje;
        if (facturaAño !== año) return false;
      }
      
      // Filtro por mes
      if (filtros.mes && filtros.mes !== 'todos') {
        const mes = parseInt(filtros.mes);
        const facturaMes = typeof factura.mes === 'string' ? parseInt(factura.mes) : factura.mes;
        if (facturaMes !== mes) return false;
      }
      
      // Filtro por cliente
      if (filtros.cliente && filtros.cliente !== 'todos') {
        const clienteId = filtros.cliente;
        const facturaCliente = typeof factura.clt === 'string' ? factura.clt : factura.clt?.toString();
        if (facturaCliente !== clienteId) return false;
      }
      
      // Filtro por vendedor (con manejo de duplicados)
      if (filtros.vendedor && filtros.vendedor !== 'todos' && filtros.mapaIdRepresentativo) {
        const vendedorId = parseInt(filtros.vendedor);
        const facturaVendedor = typeof factura.alt_usr === 'string' ? parseInt(factura.alt_usr) : factura.alt_usr;
        const idRepresentativo = filtros.mapaIdRepresentativo[facturaVendedor] || facturaVendedor;
        if (idRepresentativo !== vendedorId) return false;
      }
      
      // Filtro por rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        if (!factura.fch) return false;
        
        const fechaFactura = new Date(factura.fch);
        
        if (filtros.fechaDesde) {
          const desde = new Date(filtros.fechaDesde);
          desde.setHours(0, 0, 0, 0);
          if (fechaFactura < desde) return false;
        }
        
        if (filtros.fechaHasta) {
          const hasta = new Date(filtros.fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (fechaFactura > hasta) return false;
        }
      }
      
      return true;
    });
  }
};

export default ventasService;