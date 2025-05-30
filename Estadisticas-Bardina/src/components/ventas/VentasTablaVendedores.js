// components/ventas/VentasTablaVendedores.jsx
import React, { useMemo } from 'react';
import { formatCurrency, obtenerNombreMes } from '../../utils/formatters';

const VentasTablaVendedores = ({ 
  ventasData, 
  mapaUsuarios = {}, 
  filtros = {},
  titulo = "Ventas por Vendedor y Mes" 
}) => {
  
  // Procesar datos para la tabla
  const datosTabla = useMemo(() => {
    if (!ventasData || !ventasData.length) return { filas: [], totalesPorMes: {}, totalGeneral: 0 };
    
    // Agrupar por vendedor y mes
    const agrupado = {};
    const mesesUnicos = new Set();
    let totalGeneral = 0;
    
    ventasData.forEach(venta => {
      const vendedorId = venta.alt_usr;
      const mes = venta.mes;
      const total = venta.tot || 0;
      
      // Solo procesar si tiene vendedor y mes
      if (vendedorId !== undefined && vendedorId !== null && mes) {
        // Crear entrada para el vendedor si no existe
        if (!agrupado[vendedorId]) {
          agrupado[vendedorId] = {
            vendedorId,
            nombreVendedor: mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`,
            ventasPorMes: {},
            totalVendedor: 0
          };
        }
        
        // Inicializar mes si no existe
        if (!agrupado[vendedorId].ventasPorMes[mes]) {
          agrupado[vendedorId].ventasPorMes[mes] = 0;
        }
        
        // Acumular totales
        agrupado[vendedorId].ventasPorMes[mes] += total;
        agrupado[vendedorId].totalVendedor += total;
        totalGeneral += total;
        
        // Agregar mes a la lista de meses únicos
        mesesUnicos.add(mes);
      }
    });
    
    // Convertir meses únicos a array ordenado
    const mesesOrdenados = Array.from(mesesUnicos).sort((a, b) => a - b);
    
    // Calcular totales por mes
    const totalesPorMes = {};
    mesesOrdenados.forEach(mes => {
      totalesPorMes[mes] = Object.values(agrupado).reduce((sum, vendedor) => 
        sum + (vendedor.ventasPorMes[mes] || 0), 0
      );
    });
    
    // Convertir a array de filas ordenado por total descendente
    const filas = Object.values(agrupado)
      .sort((a, b) => b.totalVendedor - a.totalVendedor)
      .map(vendedor => ({
        ...vendedor,
        mesesOrdenados
      }));
    
    return {
      filas,
      mesesOrdenados,
      totalesPorMes,
      totalGeneral
    };
  }, [ventasData, mapaUsuarios]);
  
  const { filas, mesesOrdenados, totalesPorMes, totalGeneral } = datosTabla;
  
  if (!filas.length) {
    return (
      <div className="data-table">
        <h3>
          <i className="fas fa-user-tie"></i> {titulo}
        </h3>
        <div className="no-data">
          <i className="fas fa-info-circle"></i>
          <p>No hay datos de ventas por vendedor para mostrar con los filtros aplicados.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="data-table">
      <h3>
        <i className="fas fa-user-tie"></i> {titulo}
      </h3>
      
      <div className="tabla-info">
        <span className="info-item">
          <i className="fas fa-users"></i>
          <strong>{filas.length}</strong> vendedores
        </span>
        <span className="info-item">
          <i className="fas fa-calendar"></i>
          <strong>{mesesOrdenados.length}</strong> meses
        </span>
        <span className="info-item">
          <i className="fas fa-euro-sign"></i>
          Total: <strong>{formatCurrency(totalGeneral)}</strong>
        </span>
      </div>
      
      <div className="table-wrapper">
        <table className="ventas-vendedores-table">
          <thead>
            <tr>
              <th className="vendedor-col">Vendedor</th>
              {mesesOrdenados.map(mes => (
                <th key={mes} className="mes-col">
                  {obtenerNombreMes(mes)}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="porcentaje-col">%</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(vendedor => {
              const porcentaje = totalGeneral > 0 ? 
                (vendedor.totalVendedor / totalGeneral) * 100 : 0;
              
              return (
                <tr key={vendedor.vendedorId} className="vendedor-row">
                  <td className="vendedor-nombre">
                    <div className="vendedor-info">
                      <i className="fas fa-user"></i>
                      <span title={`ID: ${vendedor.vendedorId}`}>
                        {vendedor.nombreVendedor}
                      </span>
                    </div>
                  </td>
                  {mesesOrdenados.map(mes => {
                    const ventaMes = vendedor.ventasPorMes[mes] || 0;
                    const porcentajeMes = totalesPorMes[mes] > 0 ? 
                      (ventaMes / totalesPorMes[mes]) * 100 : 0;
                    
                    return (
                      <td key={mes} className={`mes-valor ${ventaMes > 0 ? 'con-ventas' : 'sin-ventas'}`}>
                        <div className="valor-container">
                          <span className="valor-principal">
                            {ventaMes > 0 ? formatCurrency(ventaMes) : '-'}
                          </span>
                          {ventaMes > 0 && porcentajeMes >= 5 && (
                            <span className="valor-porcentaje">
                              {porcentajeMes.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="total-vendedor">
                    <strong>{formatCurrency(vendedor.totalVendedor)}</strong>
                  </td>
                  <td className="porcentaje-vendedor">
                    <div className="porcentaje-bar">
                      <div 
                        className="porcentaje-fill" 
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      ></div>
                      <span className="porcentaje-text">
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="totales-row">
              <td className="total-label">
                <strong>
                  <i className="fas fa-calculator"></i>
                  TOTALES
                </strong>
              </td>
              {mesesOrdenados.map(mes => (
                <td key={mes} className="total-mes">
                  <strong>{formatCurrency(totalesPorMes[mes])}</strong>
                </td>
              ))}
              <td className="total-general">
                <strong>{formatCurrency(totalGeneral)}</strong>
              </td>
              <td className="porcentaje-total">
                <strong>100%</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {filas.length > 10 && (
        <div className="tabla-resumen">
          <p>
            <i className="fas fa-info-circle"></i>
            Mostrando {filas.length} vendedores. 
            El vendedor más productivo es <strong>{filas[0]?.nombreVendedor}</strong> 
            con {formatCurrency(filas[0]?.totalVendedor)}.
          </p>
        </div>
      )}
    </div>
  );
};

export default VentasTablaVendedores;