// components/ventas/VentasResumen.jsx
import React, { useMemo } from 'react';
import { DataCard } from '../common';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const VentasResumen = ({ 
  ventasData = [], 
  mapaContactos = {}, 
  mapaUsuarios = {}, 
  mapaFormasPago = {},
  filtrosActivos = {}
}) => {
  // Detectar y manejar vendedores duplicados
  const { mapaUsuariosConsolidado, duplicadosDetectados } = useMemo(() => {
    // Crear lista de usuarios para análisis
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return { mapaUsuariosConsolidado: mapaUsuarios, duplicadosDetectados: [] };
    }
    
    // Analizar duplicados
    const analisis = analizarDuplicados(usuariosList);
    
    // Crear mapa consolidado
    const mapaConsolidado = { ...mapaUsuarios };
    const duplicados = [];
    
    analisis.duplicados.forEach(duplicado => {
      duplicados.push(duplicado);
      // Usar el nombre consolidado para todos los IDs del grupo
      const nombreConsolidado = duplicado.nombre;
      
      // Consolidar todos los IDs del grupo al nombre del representativo
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
      });
    });
    
    return { 
      mapaUsuariosConsolidado: mapaConsolidado, 
      duplicadosDetectados: duplicados 
    };
  }, [mapaUsuarios]);

  // Calcular métricas básicas
  const metricas = useMemo(() => {
    if (!ventasData.length) {
      return {
        totalVentas: 0,
        cantidadFacturas: 0,
        promedioFactura: 0,
        clientesUnicos: 0,
        vendedoresActivos: 0,
        formasPagoUsadas: 0,
        ventaMasAlta: 0,
        ventaMasBaja: 0
      };
    }

    // MANTENER EL CÁLCULO ORIGINAL: suma de TODAS las facturas filtradas
    const totalVentas = ventasData.reduce((sum, venta) => sum + (venta.tot || 0), 0);
    const cantidadFacturas = ventasData.length;
    const promedioFactura = cantidadFacturas > 0 ? totalVentas / cantidadFacturas : 0;

    // Clientes únicos
    const clientesUnicos = new Set();
    ventasData.forEach(venta => {
      if (venta.clt) clientesUnicos.add(venta.clt);
    });

    // Vendedores con al menos 1 factura positiva (consolidados)
    const vendedoresConVentasPositivas = new Set();
    ventasData.forEach(venta => {
      if (venta.alt_usr !== undefined && venta.alt_usr !== null && (venta.tot || 0) > 0) {
        const nombreVendedor = mapaUsuariosConsolidado[venta.alt_usr];
        if (nombreVendedor) {
          vendedoresConVentasPositivas.add(nombreVendedor);
        }
      }
    });

    // Formas de pago usadas
    const formasPagoUsadas = new Set();
    ventasData.forEach(venta => {
      if (venta.fpg !== undefined && venta.fpg !== null) {
        formasPagoUsadas.add(venta.fpg);
      }
    });

    // Venta más alta y más baja
    const montos = ventasData.map(v => v.tot || 0);
    const ventaMasAlta = montos.length > 0 ? Math.max(...montos) : 0;
    const ventaMasBaja = montos.length > 0 ? Math.min(...montos) : 0;

    return {
      totalVentas,
      cantidadFacturas,
      promedioFactura,
      clientesUnicos: clientesUnicos.size,
      vendedoresActivos: vendedoresConVentasPositivas.size, // Solo vendedores con al menos 1 venta > 0
      formasPagoUsadas: formasPagoUsadas.size,
      ventaMasAlta,
      ventaMasBaja
    };
  }, [ventasData, mapaUsuariosConsolidado]);

  // Top performers
  const topPerformers = useMemo(() => {
    if (!ventasData.length) return { topCliente: null, topVendedor: null, topFormaPago: null };

    // Top cliente
    const ventasPorCliente = {};
    ventasData.forEach(venta => {
      if (venta.clt) {
        ventasPorCliente[venta.clt] = (ventasPorCliente[venta.clt] || 0) + (venta.tot || 0);
      }
    });
    
    const topClienteEntry = Object.entries(ventasPorCliente)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topCliente = topClienteEntry ? {
      id: topClienteEntry[0],
      nombre: mapaContactos[topClienteEntry[0]] || `Cliente ${topClienteEntry[0]}`,
      total: topClienteEntry[1]
    } : null;

    // Top vendedor (consolidado)
    const ventasPorVendedor = {};
    ventasData.forEach(venta => {
      const vendedorId = venta.alt_usr;
      if (vendedorId !== undefined && vendedorId !== null) {
        const nombreVendedor = mapaUsuariosConsolidado[vendedorId];
        if (nombreVendedor) {
          ventasPorVendedor[nombreVendedor] = (ventasPorVendedor[nombreVendedor] || 0) + (venta.tot || 0);
        }
      }
    });
    
    const topVendedorEntry = Object.entries(ventasPorVendedor)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topVendedor = topVendedorEntry ? {
      nombre: topVendedorEntry[0],
      total: topVendedorEntry[1]
    } : null;

    // Top forma de pago
    const ventasPorFormaPago = {};
    ventasData.forEach(venta => {
      const formaPagoId = venta.fpg;
      if (formaPagoId !== undefined && formaPagoId !== null) {
        ventasPorFormaPago[formaPagoId] = (ventasPorFormaPago[formaPagoId] || 0) + (venta.tot || 0);
      }
    });
    
    const topFormaPagoEntry = Object.entries(ventasPorFormaPago)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topFormaPago = topFormaPagoEntry ? {
      id: topFormaPagoEntry[0],
      nombre: mapaFormasPago[topFormaPagoEntry[0]] || `Forma de pago ${topFormaPagoEntry[0]}`,
      total: topFormaPagoEntry[1]
    } : null;

    return { topCliente, topVendedor, topFormaPago };
  }, [ventasData, mapaContactos, mapaUsuariosConsolidado, mapaFormasPago]);

  return (
    <div className="resumen-ventas">
      {/* Métricas principales */}
      <div className="summary-cards">
        <DataCard 
          title="Total Ventas" 
          value={metricas.totalVentas} 
          format="currency" 
          icon="euro-sign"
          type="primary"
        />
        <DataCard 
          title="Facturas Totales" 
          value={metricas.cantidadFacturas} 
          format="number" 
          icon="file-invoice-dollar"
          type="secondary"
        />
        <DataCard 
          title="Promedio por Factura" 
          value={metricas.promedioFactura} 
          format="currency" 
          icon="calculator"
          type="primary"
        />
      </div>

      {/* Información adicional */}
      <div className="stats-info">
        <div className="stat-item">
          <i className="fas fa-arrow-up"></i>
          <span>Venta más alta: {formatCurrency(metricas.ventaMasAlta)}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-arrow-down"></i>
          <span>Venta más baja: {formatCurrency(metricas.ventaMasBaja)}</span>
        </div>
        {topPerformers.topCliente && (
          <div className="stat-item">
            <i className="fas fa-crown"></i>
            <span>
              Top Cliente: {topPerformers.topCliente.nombre} 
              ({formatCurrency(topPerformers.topCliente.total)})
            </span>
          </div>
        )}
        {topPerformers.topVendedor && (
          <div className="stat-item">
            <i className="fas fa-medal"></i>
            <span>
              Top Vendedor: {topPerformers.topVendedor.nombre} 
              ({formatCurrency(topPerformers.topVendedor.total)})
            </span>
          </div>
        )}

      </div>

      {/* Alerta si hay filtros activos */}
      {filtrosActivos.hayFiltrosActivos && (
        <div className="filtros-activos-info">
          <i className="fas fa-filter"></i>
          <span>
            Mostrando resultados con filtros aplicados. 
            Los datos pueden no representar el total de la actividad.
          </span>
        </div>
      )}
    </div>
  );
};

export default VentasResumen;