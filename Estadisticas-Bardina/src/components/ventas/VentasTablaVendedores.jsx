// components/ventas/VentasTablaVendedores.jsx
import React, { useMemo } from 'react';
import { formatCurrency, obtenerNombreMes } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const VentasTablaVendedores = ({ 
  ventasData = [], 
  mapaUsuarios = {},
  filtros = {} 
}) => {
  
  // Consolidar vendedores duplicados
  const { mapaUsuariosConsolidado, duplicadosInfo } = useMemo(() => {
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return { 
        mapaUsuariosConsolidado: mapaUsuarios, 
        duplicadosInfo: { cantidad: 0, consolidaciones: {} }
      };
    }
    
    const analisis = analizarDuplicados(usuariosList);
    const mapaConsolidado = { ...mapaUsuarios };
    const consolidaciones = {};
    
    analisis.duplicados.forEach(duplicado => {
      const nombreConsolidado = duplicado.nombre;
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
        consolidaciones[nombreConsolidado] = duplicado.cantidad;
      });
    });
    
    return { 
      mapaUsuariosConsolidado: mapaConsolidado, 
      duplicadosInfo: {
        cantidad: analisis.cantidadDuplicados,
        consolidaciones
      }
    };
  }, [mapaUsuarios]);

  // Procesar datos de ventas por vendedor y mes
  const { ventasPorVendedorMes, totalesPorMes, totalesPorVendedor, totalGeneral } = useMemo(() => {
    const ventasPorVendedorMesData = {};
    const totalesMes = {};
    const totalesVendedor = {};
    let total = 0;

    ventasData.forEach(venta => {
      const vendedorId = venta.alt_usr;
      const mes = typeof venta.mes === 'string' ? parseInt(venta.mes) : venta.mes;
      const monto = venta.tot || 0;
      
      if (vendedorId !== undefined && vendedorId !== null && mes) {
        const nombreVendedor = mapaUsuariosConsolidado[vendedorId] || `Vendedor ${vendedorId}`;
        
        if (!ventasPorVendedorMesData[nombreVendedor]) {
          ventasPorVendedorMesData[nombreVendedor] = {};
        }
        
        if (!ventasPorVendedorMesData[nombreVendedor][mes]) {
          ventasPorVendedorMesData[nombreVendedor][mes] = 0;
        }
        
        ventasPorVendedorMesData[nombreVendedor][mes] += monto;
        
        // Totales por mes
        totalesMes[mes] = (totalesMes[mes] || 0) + monto;
        
        // Totales por vendedor
        totalesVendedor[nombreVendedor] = (totalesVendedor[nombreVendedor] || 0) + monto;
        
        // Total general
        total += monto;
      }
    });

    return {
      ventasPorVendedorMes: ventasPorVendedorMesData,
      totalesPorMes: totalesMes,
      totalesPorVendedor: totalesVendedor,
      totalGeneral: total
    };
  }, [ventasData, mapaUsuariosConsolidado]);

  // Obtener lista de meses ordenados
  const mesesOrdenados = useMemo(() => {
    return Object.keys(totalesPorMes)
      .map(mes => parseInt(mes))
      .sort((a, b) => a - b);
  }, [totalesPorMes]);

  // Obtener lista de vendedores ordenados por total de ventas
  const vendedoresOrdenados = useMemo(() => {
    return Object.entries(totalesPorVendedor)
      .sort(([, a], [, b]) => b - a)
      .map(([vendedor]) => vendedor);
  }, [totalesPorVendedor]);

  // Calcular porcentajes
  const calcularPorcentaje = (valor) => {
    if (totalGeneral === 0) return 0;
    return ((valor / totalGeneral) * 100).toFixed(2);
  };

  // Calcular porcentaje del mes
  const calcularPorcentajeMes = (valor, mes) => {
    const totalMes = totalesPorMes[mes] || 0;
    if (totalMes === 0) return 0;
    return ((valor / totalMes) * 100).toFixed(1);
  };

  if (!ventasData.length) {
    return (
      <div className="ventas-tabla-vendedores">
        <div className="no-data-message">
          <i className="fas fa-table"></i>
          <h3>No hay datos para mostrar</h3>
          <p>No se encontraron ventas con los filtros aplicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ventas-tabla-vendedores">
      {/* Información de la tabla */}
      <div className="tabla-info">
        <div className="info-item">
          <i className="fas fa-users"></i>
          <span>{vendedoresOrdenados.length} vendedores activos</span>
        </div>
        <div className="info-item">
          <i className="fas fa-calendar"></i>
          <span>{mesesOrdenados.length} meses con ventas</span>
        </div>
        <div className="info-item">
          <i className="fas fa-euro-sign"></i>
          <span>Total: {formatCurrency(totalGeneral)}</span>
        </div>
        {duplicadosInfo.cantidad > 0 && (
          <div className="info-item warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{duplicadosInfo.cantidad} vendedores consolidados</span>
          </div>
        )}
      </div>

      {/* Tabla de vendedores */}
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
            {vendedoresOrdenados.map((vendedor, index) => {
              const esDuplicado = duplicadosInfo.consolidaciones[vendedor] > 1;
              
              return (
                <tr key={vendedor} className="vendedor-row">
                  <td className="vendedor-info">
                    <i className="fas fa-user"></i>
                    <span className="vendedor-nombre" title={esDuplicado ? `Consolidado de ${duplicadosInfo.consolidaciones[vendedor]} IDs` : ''}>
                      {vendedor}
                      {esDuplicado && (
                        <span className="consolidado-badge">{duplicadosInfo.consolidaciones[vendedor]}</span>
                      )}
                    </span>
                  </td>
                  {mesesOrdenados.map(mes => {
                    const valor = ventasPorVendedorMes[vendedor]?.[mes] || 0;
                    const porcentajeMes = calcularPorcentajeMes(valor, mes);
                    
                    return (
                      <td key={mes} className={`mes-valor ${valor > 0 ? 'con-ventas' : 'sin-ventas'}`}>
                        {valor > 0 ? (
                          <div className="valor-container">
                            <span className="valor-principal">{formatCurrency(valor)}</span>
                            <span className="valor-porcentaje">{porcentajeMes}%</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                  <td className="total-vendedor">
                    {formatCurrency(totalesPorVendedor[vendedor])}
                  </td>
                  <td className="porcentaje-vendedor">
                    <div className="porcentaje-bar">
                      <div 
                        className="porcentaje-fill"
                        style={{ width: `${calcularPorcentaje(totalesPorVendedor[vendedor])}%` }}
                      />
                      <span className="porcentaje-text">
                        {calcularPorcentaje(totalesPorVendedor[vendedor])}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Fila de totales */}
            <tr className="totales-row">
              <td className="total-label">
                <i className="fas fa-chart-bar"></i>
                <strong>TOTALES</strong>
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
          </tbody>
        </table>
      </div>

      {/* Resumen de información */}
      <div className="tabla-resumen">
        <i className="fas fa-info-circle"></i>
        Mostrando ventas por vendedor y mes. 
        {filtros.año !== 'todos' && ` Año: ${filtros.año}.`}
        {filtros.mes !== 'todos' && ` Mes: ${obtenerNombreMes(parseInt(filtros.mes))}.`}
        {duplicadosInfo.cantidad > 0 && ` Se consolidaron ${duplicadosInfo.cantidad} vendedores con nombres duplicados.`}
      </div>
    </div>
  );
};

export default VentasTablaVendedores;