// Transformar datos combinados de Velneo a estructura unificada
export const transformSalesData = (rawData) => {
  const { facturas, lineas, articulos, formasPago, usuarios, familias } = rawData;
  
  if (!facturas || !lineas) {
    return {
      ventasCompletas: [],
      totales: {
        ventas: 0,
        beneficio: 0,
        transacciones: 0
      }
    };
  }

  // Crear maps para búsquedas rápidas
  const articulosMap = new Map(articulos?.map(a => [a.id, a]) || []);
  const formasPagoMap = new Map(formasPago?.map(f => [f.id, f]) || []);
  const usuariosMap = new Map(usuarios?.map(u => [u.id, u]) || []);
  const familiasMap = new Map(familias?.map(f => [f.id, f]) || []);

  // Combinar facturas con líneas
  const ventasCompletas = [];
  
  facturas.forEach(factura => {
    // Encontrar líneas de esta factura
    const lineasFactura = lineas.filter(linea => linea.fac === factura.id);
    
    lineasFactura.forEach(linea => {
      const articulo = articulosMap.get(linea.art);
      const formaPago = formasPagoMap.get(factura.fpg);
      const usuario = usuariosMap.get(factura.alt_usr);
      const familia = familiasMap.get(linea.fam);
      
      const ventaCompleta = {
        // Datos de factura
        facturaId: factura.id,
        fecha: factura.fch,
        hora: factura.hor,
        numeroFactura: factura.num_fac,
        division: factura.emp_div,
        totalFactura: factura.tot,
        finalizada: factura.fin,
        
        // Forma de pago
        formaPagoId: factura.fpg,
        formaPago: formaPago?.name || 'Desconocido',
        
        // Vendedor
        vendedorId: factura.alt_usr,
        vendedor: usuario?.name || 'Desconocido',
        
        // Línea de factura
        lineaId: linea.id,
        cantidad: linea.can || 0,
        precioVenta: linea.pre_pvp || 0,
        importeTotal: linea.imp_pvp || 0,
        coste: linea.cos || 0,
        beneficio: (linea.imp_pvp || 0) - (linea.cos || 0), // CALCULADO CORRECTAMENTE
        talla: linea.tll,
        color: linea.col,
        
        // Artículo
        articuloId: linea.art,
        nombreArticulo: articulo?.name || linea.name || 'Sin nombre',
        referenciaArticulo: articulo?.ref || '',
        pesoGramos: articulo?.peso || 0,
        stockActual: articulo?.exs || 0,
        costeMaestro: articulo?.cos || 0,
        pvpMaestro: articulo?.pvp || 0,
        
        // Familia y proveedor
        familiaId: linea.fam,
        familia: familia?.name || 'Sin familia',
        proveedorId: linea.prv,
        proveedor: 'Por definir', // Se puede agregar tabla de proveedores
        
        // Campos calculados CORRECTAMENTE (no usar linea.ben que está mal)
        beneficioCalculado: (linea.imp_pvp || 0) - (linea.cos || 0),
        margen: linea.imp_pvp > 0 ? (((linea.imp_pvp - linea.cos) / linea.imp_pvp) * 100) : 0,
        pesoTotalLinea: (articulo?.peso || 0) * (linea.can || 0),
        fechaCompleta: combineDateTime(factura.fch, factura.hor)
      };
      
      ventasCompletas.push(ventaCompleta);
    });
  });

  // Calcular totales con beneficio corregido
  const totales = {
    ventas: ventasCompletas.reduce((sum, v) => sum + v.importeTotal, 0),
    beneficio: ventasCompletas.reduce((sum, v) => sum + v.beneficioCalculado, 0), // Usar el calculado
    transacciones: new Set(ventasCompletas.map(v => v.facturaId)).size,
    articulosVendidos: ventasCompletas.reduce((sum, v) => sum + v.cantidad, 0),
    pesoTotal: ventasCompletas.reduce((sum, v) => sum + v.pesoTotalLinea, 0)
  };

  return {
    ventasCompletas,
    totales,
    metadata: {
      fechaGeneracion: new Date().toISOString(),
      totalRegistros: ventasCompletas.length,
      rangoFechas: {
        desde: Math.min(...facturas.map(f => new Date(f.fch).getTime())),
        hasta: Math.max(...facturas.map(f => new Date(f.fch).getTime()))
      }
    }
  };
};

// Agrupar datos por período (día, semana, mes)
export const groupByPeriod = (ventasCompletas, periodo = 'day') => {
  const grupos = {};
  
  ventasCompletas.forEach(venta => {
    let clave;
    const fecha = new Date(venta.fecha);
    
    switch (periodo) {
      case 'day':
        clave = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const inicioSemana = getStartOfWeek(fecha);
        clave = inicioSemana.toISOString().split('T')[0];
        break;
      case 'month':
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        clave = fecha.getFullYear().toString();
        break;
      default:
        clave = fecha.toISOString().split('T')[0];
    }
    
    if (!grupos[clave]) {
      grupos[clave] = {
        periodo: clave,
        ventas: 0,
        beneficio: 0,
        transacciones: new Set(),
        cantidadArticulos: 0,
        detalles: []
      };
    }
    
    grupos[clave].ventas += venta.importeTotal;
    grupos[clave].beneficio += (venta.importeTotal - venta.coste * venta.cantidad); // Calcular beneficio correcto
    grupos[clave].transacciones.add(venta.facturaId);
    grupos[clave].cantidadArticulos += venta.cantidad;
    grupos[clave].detalles.push(venta);
  });
  
  // Convertir Sets a números y ordenar
  return Object.values(grupos)
    .map(grupo => ({
      ...grupo,
      transacciones: grupo.transacciones.size,
      ticketMedio: grupo.transacciones.size > 0 ? grupo.ventas / grupo.transacciones.size : 0
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
};

// Crear datos para gráficos
export const prepareChartData = (ventasCompletas, tipo = 'ventas-por-dia') => {
  switch (tipo) {
    case 'ventas-por-dia':
      return groupByPeriod(ventasCompletas, 'day').map(grupo => ({
        fecha: grupo.periodo,
        ventas: grupo.ventas,
        beneficio: grupo.beneficio,
        transacciones: grupo.transacciones
      }));
      
    case 'ventas-por-familia':
      return groupByFamily(ventasCompletas);
      
    case 'ventas-por-vendedor':
      return groupByVendor(ventasCompletas);
      
    case 'top-productos':
      return getTopProductsChart(ventasCompletas);
      
    default:
      return [];
  }
};

// Agrupar por familia
const groupByFamily = (ventasCompletas) => {
  const familias = {};
  
  ventasCompletas.forEach(venta => {
    const key = venta.familiaId || 'sin-familia';
    const nombre = venta.familia || 'Sin Familia';
    
    if (!familias[key]) {
      familias[key] = {
        familia: nombre,
        ventas: 0,
        beneficio: 0,
        cantidad: 0,
        transacciones: new Set()
      };
    }
    
    familias[key].ventas += venta.importeTotal;
    familias[key].beneficio += venta.beneficio;
    familias[key].cantidad += venta.cantidad;
    familias[key].transacciones.add(venta.facturaId);
  });
  
  return Object.values(familias)
    .map(f => ({
      ...f,
      transacciones: f.transacciones.size,
      margenPorcentaje: f.ventas > 0 ? (f.beneficio / f.ventas) * 100 : 0
    }))
    .sort((a, b) => b.ventas - a.ventas);
};

// Agrupar por vendedor
const groupByVendor = (ventasCompletas) => {
  const vendedores = {};
  
  ventasCompletas.forEach(venta => {
    const key = venta.vendedorId || 0;
    const nombre = venta.vendedor || 'Sin Vendedor';
    
    if (!vendedores[key]) {
      vendedores[key] = {
        vendedor: nombre,
        ventas: 0,
        beneficio: 0,
        transacciones: new Set(),
        cantidadArticulos: 0
      };
    }
    
    vendedores[key].ventas += venta.importeTotal;
    vendedores[key].beneficio += venta.beneficio;
    vendedores[key].transacciones.add(venta.facturaId);
    vendedores[key].cantidadArticulos += venta.cantidad;
  });
  
  return Object.values(vendedores)
    .map(v => ({
      ...v,
      transacciones: v.transacciones.size,
      ticketMedio: v.transacciones.size > 0 ? v.ventas / v.transacciones.size : 0,
      margenPorcentaje: v.ventas > 0 ? (v.beneficio / v.ventas) * 100 : 0
    }))
    .sort((a, b) => b.ventas - a.ventas);
};

// Top productos para gráficos
const getTopProductsChart = (ventasCompletas, limit = 10) => {
  const productos = {};
  
  ventasCompletas.forEach(venta => {
    const key = venta.articuloId;
    const nombre = venta.nombreArticulo;
    
    if (!productos[key]) {
      productos[key] = {
        producto: nombre,
        ventas: 0,
        cantidad: 0,
        beneficio: 0
      };
    }
    
    productos[key].ventas += venta.importeTotal;
    productos[key].cantidad += venta.cantidad;
    productos[key].beneficio += venta.beneficio;
  });
  
  return Object.values(productos)
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limit);
};

// Utilidades auxiliares
const combineDateTime = (fecha, hora) => {
  if (!fecha) return null;
  
  try {
    const fechaObj = new Date(fecha);
    if (hora) {
      const [horas, minutos] = hora.split(':').map(n => parseInt(n, 10));
      fechaObj.setHours(horas || 0, minutos || 0, 0, 0);
    }
    return fechaObj.toISOString();
  } catch (error) {
    console.error('Error combinando fecha/hora:', error);
    return fecha;
  }
};

const getStartOfWeek = (fecha) => {
  const fecha2 = new Date(fecha);
  const dia = fecha2.getDay();
  const diferencia = fecha2.getDate() - dia + (dia === 0 ? -6 : 1); // Lunes como inicio
  return new Date(fecha2.setDate(diferencia));
};

// Filtrar datos por criterios
export const filterSalesData = (ventasCompletas, filtros = {}) => {
  return ventasCompletas.filter(venta => {
    // Filtro por fechas
    if (filtros.fechaDesde) {
      const fechaVenta = new Date(venta.fecha);
      const fechaDesde = new Date(filtros.fechaDesde);
      if (fechaVenta < fechaDesde) return false;
    }
    
    if (filtros.fechaHasta) {
      const fechaVenta = new Date(venta.fecha);
      const fechaHasta = new Date(filtros.fechaHasta);
      if (fechaVenta > fechaHasta) return false;
    }
    
    // Filtro por vendedor
    if (filtros.vendedorId && venta.vendedorId !== filtros.vendedorId) {
      return false;
    }
    
    // Filtro por familia
    if (filtros.familiaId && venta.familiaId !== filtros.familiaId) {
      return false;
    }
    
    // Filtro por forma de pago
    if (filtros.formaPagoId && venta.formaPagoId !== filtros.formaPagoId) {
      return false;
    }
    
    // Filtro por monto mínimo
    if (filtros.montoMinimo && venta.importeTotal < filtros.montoMinimo) {
      return false;
    }
    
    return true;
  });
};