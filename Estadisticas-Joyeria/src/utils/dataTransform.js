// Transformar datos combinados de Velneo a estructura unificada
export const transformSalesData = (rawData) => {
  const { facturas, lineas, articulos, formasPago, usuarios, familias, proveedores } = rawData;
  
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
  const proveedoresMap = new Map(proveedores?.map(p => [p.id, p]) || []);

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
      const proveedor = proveedoresMap.get(linea.prv);
      
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
        proveedor: proveedor?.name || 'Sin proveedor', // NOMBRE DEL PROVEEDOR
        
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