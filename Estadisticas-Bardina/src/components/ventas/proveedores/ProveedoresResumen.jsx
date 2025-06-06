// components/ventas/proveedores/ProveedoresResumen.jsx
import React, { useMemo } from 'react';
import { DataCard } from '../../common';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

const ProveedoresResumen = ({ 
  proveedoresData = [], 
  loading = false,
  filtrosActivos = {}
}) => {
  // Calcular métricas generales
  const metricas = useMemo(() => {
    if (!proveedoresData.length) {
      return {
        totalProveedores: 0,
        ventasTotal: 0,
        beneficioTotal: 0,
        margenPromedio: 0,
        ticketPromedio: 0,
        productosUnicos: 0,
        transaccionesTotal: 0,
        concentracion: 0
      };
    }

    const ventasTotal = proveedoresData.reduce((sum, prv) => sum + (prv.ventasTotal || 0), 0);
    const beneficioTotal = proveedoresData.reduce((sum, prv) => sum + (prv.beneficioTotal || 0), 0);
    const transaccionesTotal = proveedoresData.reduce((sum, prv) => sum + (prv.numeroFacturas || 0), 0);
    const productosSet = new Set();
    
    proveedoresData.forEach(prv => {
      if (prv.productos && prv.productos.size) {
        prv.productos.forEach(prod => productosSet.add(prod));
      }
    });

    // Calcular concentración (Top 3 proveedores)
    const top3Ventas = proveedoresData
      .sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0))
      .slice(0, 3)
      .reduce((sum, prv) => sum + (prv.ventasTotal || 0), 0);

    return {
      totalProveedores: proveedoresData.length,
      ventasTotal,
      beneficioTotal,
      margenPromedio: ventasTotal > 0 ? (beneficioTotal / ventasTotal) * 100 : 0,
      ticketPromedio: transaccionesTotal > 0 ? ventasTotal / transaccionesTotal : 0,
      productosUnicos: productosSet.size,
      transaccionesTotal,
      concentracion: ventasTotal > 0 ? (top3Ventas / ventasTotal) * 100 : 0
    };
  }, [proveedoresData]);

  // Top performers
  const topPerformers = useMemo(() => {
    if (!proveedoresData.length) return { topVentas: null, topMargen: null, topProductos: null };

    const sortedByVentas = [...proveedoresData].sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0));
    const sortedByMargen = [...proveedoresData].sort((a, b) => (b.margenPorcentual || 0) - (a.margenPorcentual || 0));
    const sortedByProductos = [...proveedoresData].sort((a, b) => (b.numeroProductos || 0) - (a.numeroProductos || 0));

    return {
      topVentas: sortedByVentas[0] || null,
      topMargen: sortedByMargen[0] || null, 
      topProductos: sortedByProductos[0] || null
    };
  }, [proveedoresData]);

  if (loading) {
    return (
      <div className="proveedores-resumen loading">
        <div className="summary-cards">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="data-card loading">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="proveedores-resumen">
      {/* Métricas principales */}
      <div className="summary-cards">
        <DataCard 
          title="Proveedores Activos" 
          value={metricas.totalProveedores} 
          format="number" 
          icon="industry"
          type="primary"
        />
        <DataCard 
          title="Ventas Totales" 
          value={metricas.ventasTotal} 
          format="currency" 
          icon="euro-sign"
          type="success"
        />
        <DataCard 
          title="Beneficio Total" 
          value={metricas.beneficioTotal} 
          format="currency" 
          icon="chart-line"
          type="warning"
        />
        <DataCard 
          title="Margen Promedio" 
          value={formatPercentage(metricas.margenPromedio)} 
          format="text" 
          icon="percentage"
          type="info"
        />
      </div>

      {/* Métricas adicionales */}
      <div className="stats-info">
        <div className="stat-item">
          <i className="fas fa-shopping-cart"></i>
          <span>Ticket promedio: {formatCurrency(metricas.ticketPromedio)}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-boxes"></i>
          <span>Productos únicos: {metricas.productosUnicos.toLocaleString('es-ES')}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-file-invoice"></i>
          <span>Transacciones: {metricas.transaccionesTotal.toLocaleString('es-ES')}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-chart-pie"></i>
          <span>Concentración Top 3: {formatPercentage(metricas.concentracion)}</span>
        </div>
      </div>

      {/* Top performers */}
      {(topPerformers.topVentas || topPerformers.topMargen || topPerformers.topProductos) && (
        <div className="top-performers">
          <h3>
            <i className="fas fa-trophy"></i>
            Proveedores Destacados
          </h3>
          <div className="performers-grid">
            {topPerformers.topVentas && (
              <div className="performer-card ventas">
                <div className="performer-icon">
                  <i className="fas fa-crown"></i>
                </div>
                <div className="performer-info">
                  <h4>Mayor Facturación</h4>
                  <p className="performer-name">{topPerformers.topVentas.nombre}</p>
                  <p className="performer-value">{formatCurrency(topPerformers.topVentas.ventasTotal)}</p>
                  <p className="performer-detail">
                    {topPerformers.topVentas.numeroProductos} productos • {topPerformers.topVentas.numeroFacturas} facturas
                  </p>
                </div>
              </div>
            )}

            {topPerformers.topMargen && (
              <div className="performer-card margen">
                <div className="performer-icon">
                  <i className="fas fa-medal"></i>
                </div>
                <div className="performer-info">
                  <h4>Mejor Margen</h4>
                  <p className="performer-name">{topPerformers.topMargen.nombre}</p>
                  <p className="performer-value">{formatPercentage(topPerformers.topMargen.margenPorcentual)}</p>
                  <p className="performer-detail">
                    {formatCurrency(topPerformers.topMargen.beneficioTotal)} beneficio
                  </p>
                </div>
              </div>
            )}

            {topPerformers.topProductos && (
              <div className="performer-card productos">
                <div className="performer-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="performer-info">
                  <h4>Más Diversificado</h4>
                  <p className="performer-name">{topPerformers.topProductos.nombre}</p>
                  <p className="performer-value">{topPerformers.topProductos.numeroProductos} productos</p>
                  <p className="performer-detail">
                    {formatCurrency(topPerformers.topProductos.ventasTotal)} en ventas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Análisis de concentración */}
      {metricas.concentracion > 0 && (
        <div className="concentracion-analysis">
          <h4>
            <i className="fas fa-chart-pie"></i>
            Análisis de Concentración
          </h4>
          <div className="concentracion-content">
            <div className="concentracion-bar">
              <div 
                className="concentracion-fill"
                style={{ width: `${Math.min(metricas.concentracion, 100)}%` }}
              >
                <span className="concentracion-text">
                  {formatPercentage(metricas.concentracion)}
                </span>
              </div>
            </div>
            <p className="concentracion-description">
              {metricas.concentracion > 70 ? (
                <>
                  <span className="concentration-high">Alta concentración:</span>
                  Los 3 principales proveedores representan más del 70% de las ventas
                </>
              ) : metricas.concentracion > 50 ? (
                <>
                  <span className="concentration-medium">Concentración media:</span>
                  Los 3 principales proveedores representan entre 50-70% de las ventas
                </>
              ) : (
                <>
                  <span className="concentration-low">Baja concentración:</span>
                  Las ventas están bien distribuidas entre proveedores
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Alerta si hay filtros activos */}
      {filtrosActivos.hayFiltrosActivos && (
        <div className="filtros-activos-info">
          <i className="fas fa-info-circle"></i>
          <span>
            Análisis basado en {metricas.totalProveedores} proveedores con filtros aplicados.
            Los datos pueden no representar el total de la actividad.
          </span>
        </div>
      )}
    </div>
  );
};

export default ProveedoresResumen;