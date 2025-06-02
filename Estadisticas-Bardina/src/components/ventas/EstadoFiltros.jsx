// components/ventas/EstadoFiltros.jsx
import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';

const EstadoFiltros = ({ ventasData = [], filtrosActivos = {} }) => {
  const estadisticas = useMemo(() => {
    if (!ventasData.length) {
      return {
        totalFacturas: 0,
        facturasPositivas: 0,
        devoluciones: 0,
        totalVentas: 0,
        totalDevoluciones: 0,
        ventaNeta: 0
      };
    }

    const ventasPositivas = ventasData.filter(v => (v.tot || 0) > 0);
    const devoluciones = ventasData.filter(v => (v.tot || 0) <= 0);
    
    const totalVentas = ventasPositivas.reduce((sum, v) => sum + (v.tot || 0), 0);
    const totalDevoluciones = Math.abs(devoluciones.reduce((sum, v) => sum + (v.tot || 0), 0));
    
    return {
      totalFacturas: ventasData.length,
      facturasPositivas: ventasPositivas.length,
      devoluciones: devoluciones.length,
      totalVentas,
      totalDevoluciones,
      ventaNeta: totalVentas - totalDevoluciones
    };
  }, [ventasData]);

  if (!filtrosActivos.hayFiltrosActivos) {
    return null;
  }

  return (
    <div className="estado-filtros">
      <div className="estado-grid">
        <div className="estado-item">
          <i className="fas fa-file-invoice"></i>
          <div className="estado-content">
            <span className="estado-value">{estadisticas.totalFacturas}</span>
            <span className="estado-label">Facturas Totales</span>
          </div>
        </div>
        
        <div className="estado-item success">
          <i className="fas fa-arrow-up"></i>
          <div className="estado-content">
            <span className="estado-value">{estadisticas.facturasPositivas}</span>
            <span className="estado-label">Ventas</span>
            <span className="estado-sublabel">{formatCurrency(estadisticas.totalVentas)}</span>
          </div>
        </div>
        
        {estadisticas.devoluciones > 0 && (
          <div className="estado-item warning">
            <i className="fas fa-arrow-down"></i>
            <div className="estado-content">
              <span className="estado-value">{estadisticas.devoluciones}</span>
              <span className="estado-label">Devoluciones</span>
              <span className="estado-sublabel">{formatCurrency(estadisticas.totalDevoluciones)}</span>
            </div>
          </div>
        )}
        
        <div className="estado-item primary">
          <i className="fas fa-calculator"></i>
          <div className="estado-content">
            <span className="estado-value">{formatCurrency(estadisticas.ventaNeta)}</span>
            <span className="estado-label">Venta Neta</span>
            <span className="estado-sublabel">
              {estadisticas.totalVentas > 0 
                ? `${((estadisticas.ventaNeta / estadisticas.totalVentas) * 100).toFixed(1)}% efectivo`
                : '0% efectivo'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoFiltros;