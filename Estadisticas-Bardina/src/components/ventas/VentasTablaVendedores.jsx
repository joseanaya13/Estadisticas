// components/ventas/VentasTablaVendedores.jsx
import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const VentasTablaVendedores = ({ 
  ventasData = [], 
  mapaUsuarios = {}, 
  filtros = {} 
}) => {
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'total', direccion: 'desc' });
  
  // Detectar y manejar vendedores duplicados
  const { mapaUsuariosConsolidado, duplicadosInfo } = useMemo(() => {
    // Crear lista de usuarios para análisis
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return { mapaUsuariosConsolidado: mapaUsuarios, duplicadosInfo: [] };
    }
    
    // Analizar duplicados
    const analisis = analizarDuplicados(usuariosList);
    
    // Crear mapa consolidado
    const mapaConsolidado = { ...mapaUsuarios };
    const infoDuplicados = [];
    
    analisis.duplicados.forEach(duplicado => {
      infoDuplicados.push(duplicado);
      // Usar el ID más pequeño como representativo
      const nombreConsolidado = duplicado.nombre;
      
      // Consolidar todos los IDs del grupo al nombre del representativo
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
      });
    });
    
    return { 
      mapaUsuariosConsolidado: mapaConsolidado, 
      duplicadosInfo: infoDuplicados 
    };
  }, [mapaUsuarios]);
  
  // Obtener meses únicos del período actual (filtrado)
  const mesesPeriodo = useMemo(() => {
    const mesesSet = new Set();
    ventasData.forEach(venta => {
      if (venta.mes) {
        mesesSet.add(venta.mes);
      }
    });
    return Array.from(mesesSet).sort((a, b) => a - b);
  }, [ventasData]);
  
  // Calcular datos de ventas por vendedor y mes (consolidados) - FILTRADOS POR AL MENOS 1 VENTA POSITIVA
  const datosVendedores = useMemo(() => {
    if (!ventasData.length) return [];
    
    // Agrupar por nombre de vendedor (consolidado)
    const ventasPorVendedorNombre = {};
    
    ventasData.forEach(venta => {
      const vendedorId = venta.alt_usr;
      if (vendedorId !== undefined && vendedorId !== null) {
        const nombreVendedor = mapaUsuariosConsolidado[vendedorId] || `Vendedor ${vendedorId}`;
        
        if (!ventasPorVendedorNombre[nombreVendedor]) {
          ventasPorVendedorNombre[nombreVendedor] = {
            nombre: nombreVendedor,
            idsOriginales: new Set(),
            ventasPorMes: {},
            totalGeneral: 0,
            cantidadFacturas: 0,
            tieneVentasPositivas: false
          };
        }
        
        const vendedorData = ventasPorVendedorNombre[nombreVendedor];
        vendedorData.idsOriginales.add(vendedorId);
        
        const mes = venta.mes;
        if (mes) {
          if (!vendedorData.ventasPorMes[mes]) {
            vendedorData.ventasPorMes[mes] = 0;
          }
          vendedorData.ventasPorMes[mes] += (venta.tot || 0);
        }
        
        vendedorData.totalGeneral += (venta.tot || 0);
        vendedorData.cantidadFacturas += 1;
        
        // Marcar si tiene al menos 1 venta positiva
        if ((venta.tot || 0) > 0) {
          vendedorData.tieneVentasPositivas = true;
        }
      }
    });
    
    // Filtrar solo vendedores que tienen al menos 1 venta positiva
    const vendedoresValidos = Object.values(ventasPorVendedorNombre)
      .filter(vendedor => vendedor.tieneVentasPositivas);
    
    // Calcular total SOLO de vendedores válidos para porcentajes correctos
    const totalGeneralValido = vendedoresValidos.reduce((sum, vendedor) => sum + vendedor.totalGeneral, 0);
    
    // Convertir a array con porcentajes correctos
    return vendedoresValidos.map(vendedor => {
      const porcentajeTotal = totalGeneralValido > 0 ? (vendedor.totalGeneral / totalGeneralValido) * 100 : 0;
      const esConsolidado = vendedor.idsOriginales.size > 1;
      
      return {
        ...vendedor,
        porcentajeTotal,
        esConsolidado,
        cantidadIds: vendedor.idsOriginales.size,
        promedioFactura: vendedor.cantidadFacturas > 0 ? 
          vendedor.totalGeneral / vendedor.cantidadFacturas : 0
      };
    });
  }, [ventasData, mapaUsuariosConsolidado]);
  
  // Calcular totales por mes (solo de vendedores con ventas > 0)
  const totalesPorMes = useMemo(() => {
    const totales = {};
    mesesPeriodo.forEach(mes => {
      totales[mes] = 0;
    });
    
    // Solo sumar las ventas de vendedores que están incluidos en datosVendedores
    datosVendedores.forEach(vendedor => {
      mesesPeriodo.forEach(mes => {
        if (vendedor.ventasPorMes[mes]) {
          totales[mes] += vendedor.ventasPorMes[mes];
        }
      });
    });
    
    return totales;
  }, [datosVendedores, mesesPeriodo]);
  
  // Calcular total general (solo de vendedores con ventas > 0)
  const totalGeneral = useMemo(() => {
    return datosVendedores.reduce((sum, vendedor) => sum + vendedor.totalGeneral, 0);
  }, [datosVendedores]);
  
  // Aplicar ordenamiento
  const datosOrdenados = useMemo(() => {
    const datos = [...datosVendedores];
    
    datos.sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenamiento.campo) {
        case 'nombre':
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
          break;
        case 'total':
          valorA = a.totalGeneral;
          valorB = b.totalGeneral;
          break;
        case 'porcentaje':
          valorA = a.porcentajeTotal;
          valorB = b.porcentajeTotal;
          break;
        case 'promedio':
          valorA = a.promedioFactura;
          valorB = b.promedioFactura;
          break;
        default:
          // Para ordenar por mes específico
          if (ordenamiento.campo.startsWith('mes_')) {
            const mes = parseInt(ordenamiento.campo.split('_')[1]);
            valorA = a.ventasPorMes[mes] || 0;
            valorB = b.ventasPorMes[mes] || 0;
          } else {
            valorA = a.totalGeneral;
            valorB = b.totalGeneral;
          }
      }
      
      if (ordenamiento.direccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
    
    return datos;
  }, [datosVendedores, ordenamiento]);
  
  // Manejar cambio de ordenamiento
  const handleSort = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  // Generar descripción del período
  const descripcionPeriodo = useMemo(() => {
    if (filtros.año !== 'todos' && filtros.mes !== 'todos') {
      return `${filtros.mes}/${filtros.año}`;
    } else if (filtros.año !== 'todos') {
      return `Año ${filtros.año}`;
    } else if (mesesPeriodo.length > 0) {
      return `${mesesPeriodo.length} meses`;
    }
    return 'Todo el período';
  }, [filtros, mesesPeriodo]);

  if (!ventasData.length) {
    return (
      <div className="no-data">
        <i className="fas fa-user-slash"></i>
        <p>No hay datos de vendedores para mostrar con los filtros actuales.</p>
      </div>
    );
  }

  if (datosVendedores.length === 0) {
    return (
      <div className="no-data">
        <i className="fas fa-user-slash"></i>
        <p>No hay vendedores con al menos 1 venta positiva para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="ventas-tabla-vendedores">
      {/* Información sobre la tabla */}
      <div className="tabla-info">
        <div className="info-item">
          <i className="fas fa-calendar-alt"></i>
          <span>{descripcionPeriodo}</span>
        </div>
        <div className="info-item">
          <i className="fas fa-file-invoice-dollar"></i>
          <span>{ventasData.length} facturas</span>
        </div>
        <div className="info-item">
          <i className="fas fa-users"></i>
          <span>{datosVendedores.length} vendedores activos</span>
        </div>
      </div>

      {/* Tabla de vendedores */}
      <div className="table-wrapper">
        <table className="ventas-vendedores-table">
          <thead>
            <tr>
              <th 
                className="vendedor-col clickable"
                onClick={() => handleSort('nombre')}
              >
                Vendedor
                {ordenamiento.campo === 'nombre' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              {mesesPeriodo.map(mes => (
                <th 
                  key={mes} 
                  className="mes-col clickable"
                  onClick={() => handleSort(`mes_${mes}`)}
                >
                  {new Date(2024, mes - 1).toLocaleDateString('es-ES', { month: 'short' })}
                  {ordenamiento.campo === `mes_${mes}` && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
              ))}
              <th 
                className="total-col clickable"
                onClick={() => handleSort('total')}
              >
                Total
                {ordenamiento.campo === 'total' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th 
                className="porcentaje-col clickable"
                onClick={() => handleSort('porcentaje')}
              >
                %
                {ordenamiento.campo === 'porcentaje' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {datosOrdenados.map((vendedor, index) => (
              <tr key={index} className="vendedor-row">
                <td className="vendedor-col">
                  <div className="vendedor-info">
                    <i className="fas fa-user"></i>
                    <span 
                      className="vendedor-nombre"
                    >
                      {vendedor.nombre}
                    </span>
                  </div>
                </td>
                {mesesPeriodo.map(mes => {
                  const ventaMes = vendedor.ventasPorMes[mes] || 0;
                  const porcentajeMes = totalesPorMes[mes] > 0 ? 
                    (ventaMes / totalesPorMes[mes]) * 100 : 0;
                  
                  return (
                    <td 
                      key={mes} 
                      className={`mes-valor ${ventaMes > 0 ? 'con-ventas' : 'sin-ventas'}`}
                    >
                      {ventaMes > 0 ? (
                        <div className="valor-container">
                          <span className="valor-principal">
                            {formatCurrency(ventaMes)}
                          </span>
                          <span className="valor-porcentaje">
                            {porcentajeMes.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  );
                })}
                <td className="total-vendedor">
                  {formatCurrency(vendedor.totalGeneral)}
                </td>
                <td className="porcentaje-vendedor">
                  <div className="porcentaje-bar">
                    <div 
                      className="porcentaje-fill"
                      style={{ width: `${Math.min(vendedor.porcentajeTotal, 100)}%` }}
                    ></div>
                    <span className="porcentaje-text">
                      {vendedor.porcentajeTotal.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            
            {/* Fila de totales */}
            <tr className="totales-row">
              <td className="total-label">
                <i className="fas fa-calculator"></i>
                TOTALES
              </td>
              {mesesPeriodo.map(mes => (
                <td key={mes} className="total-mes">
                  {formatCurrency(totalesPorMes[mes])}
                </td>
              ))}
              <td className="total-general">
                {formatCurrency(totalGeneral)}
              </td>
              <td className="porcentaje-total">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default VentasTablaVendedores;