// components/ventas/proveedores/ProveedoresTabla.jsx
import React, { useMemo, useState } from 'react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import { ExportButton } from '../../common';

const ProveedoresTabla = ({ 
  proveedoresData = [], 
  loading = false,
  filtros = {}
}) => {
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'ventasTotal', direccion: 'desc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina] = useState(20);
  const [proveedorExpandido, setProveedorExpandido] = useState(null);

  // Procesar y ordenar datos
  const datosOrdenados = useMemo(() => {
    if (!proveedoresData.length) return [];
    
    const datos = [...proveedoresData];
    
    datos.sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenamiento.campo) {
        case 'nombre':
          valorA = (a.nombre || '').toLowerCase();
          valorB = (b.nombre || '').toLowerCase();
          break;
        case 'ventasTotal':
          valorA = a.ventasTotal || 0;
          valorB = b.ventasTotal || 0;
          break;
        case 'beneficioTotal':
          valorA = a.beneficioTotal || 0;
          valorB = b.beneficioTotal || 0;
          break;
        case 'margenPorcentual':
          valorA = a.margenPorcentual || 0;
          valorB = b.margenPorcentual || 0;
          break;
        case 'numeroProductos':
          valorA = a.numeroProductos || 0;
          valorB = b.numeroProductos || 0;
          break;
        case 'numeroFacturas':
          valorA = a.numeroFacturas || 0;
          valorB = b.numeroFacturas || 0;
          break;
        case 'ticketPromedio':
          valorA = a.ticketPromedio || 0;
          valorB = b.ticketPromedio || 0;
          break;
        case 'precioPromedio':
          valorA = a.precioPromedio || 0;
          valorB = b.precioPromedio || 0;
          break;
        default:
          valorA = a.ventasTotal || 0;
          valorB = b.ventasTotal || 0;
      }
      
      if (ordenamiento.direccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
    
    return datos;
  }, [proveedoresData, ordenamiento]);

  // Datos paginados
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    return datosOrdenados.slice(inicio, fin);
  }, [datosOrdenados, paginaActual, filasPorPagina]);

  // Información de paginación
  const infoPaginacion = useMemo(() => {
    const totalPaginas = Math.ceil(datosOrdenados.length / filasPorPagina);
    const inicio = (paginaActual - 1) * filasPorPagina + 1;
    const fin = Math.min(paginaActual * filasPorPagina, datosOrdenados.length);
    
    return { totalPaginas, inicio, fin, total: datosOrdenados.length };
  }, [datosOrdenados.length, paginaActual, filasPorPagina]);

  // Totales generales
  const totales = useMemo(() => {
    return {
      ventasTotal: datosOrdenados.reduce((sum, p) => sum + (p.ventasTotal || 0), 0),
      beneficioTotal: datosOrdenados.reduce((sum, p) => sum + (p.beneficioTotal || 0), 0),
      numeroFacturas: datosOrdenados.reduce((sum, p) => sum + (p.numeroFacturas || 0), 0),
      numeroProductos: new Set(datosOrdenados.flatMap(p => 
        Array.from(p.productos || [])
      )).size
    };
  }, [datosOrdenados]);

  // Manejar cambio de ordenamiento
  const handleSort = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'desc' ? 'asc' : 'desc'
    }));
    setPaginaActual(1); // Resetear a primera página
  };

  // Preparar datos para exportación
  const prepararDatosExportacion = (datos) => {
    return datos.map(proveedor => ({
      'Proveedor': proveedor.nombre,
      'Ventas Totales': proveedor.ventasTotal || 0,
      'Beneficio Total': proveedor.beneficioTotal || 0,
      'Margen %': proveedor.margenPorcentual || 0,
      'Nº Productos': proveedor.numeroProductos || 0,
      'Nº Facturas': proveedor.numeroFacturas || 0,
      'Ticket Promedio': proveedor.ticketPromedio || 0,
      'Precio Promedio': proveedor.precioPromedio || 0,
      'Cantidad Total': proveedor.cantidadTotal || 0
    }));
  };

  // Generar nombre de archivo
  const getNombreArchivo = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const filtroTexto = filtros.año !== 'todos' ? `_${filtros.año}` : '';
    return `proveedores_analisis${filtroTexto}_${fecha}`;
  };

  // Expandir/contraer detalles del proveedor
  const toggleExpansion = (proveedorId) => {
    setProveedorExpandido(prev => prev === proveedorId ? null : proveedorId);
  };

  if (loading) {
    return (
      <div className="proveedores-tabla loading">
        <div className="table-loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando datos de proveedores...</p>
        </div>
      </div>
    );
  }

  if (!proveedoresData.length) {
    return (
      <div className="proveedores-tabla">
        <div className="no-data">
          <i className="fas fa-industry"></i>
          <h3>No hay datos de proveedores</h3>
          <p>No se encontraron proveedores con los filtros aplicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proveedores-tabla">
      
      {/* Header con información y controles */}
      <div className="tabla-header">
        <div className="tabla-info">
          <div className="info-item">
            <i className="fas fa-industry"></i>
            <span>{infoPaginacion.total} proveedores</span>
          </div>
          <div className="info-item">
            <i className="fas fa-euro-sign"></i>
            <span>{formatCurrency(totales.ventasTotal)} total</span>
          </div>
          <div className="info-item">
            <i className="fas fa-chart-line"></i>
            <span>{formatCurrency(totales.beneficioTotal)} beneficio</span>
          </div>
          <div className="info-item">
            <i className="fas fa-boxes"></i>
            <span>{totales.numeroProductos} productos únicos</span>
          </div>
        </div>
        
        <div className="tabla-controles">
          <ExportButton
            data={datosOrdenados}
            filename={getNombreArchivo()}
            prepareDataFn={prepararDatosExportacion}
            className="btn-sm"
          />
        </div>
      </div>

      {/* Tabla principal */}
      <div className="table-wrapper">
        <table className="proveedores-table">
          <thead>
            <tr>
              <th className="proveedor-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('nombre')}
                >
                  Proveedor
                  {ordenamiento.campo === 'nombre' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="numero-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('ventasTotal')}
                >
                  Ventas Totales
                  {ordenamiento.campo === 'ventasTotal' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="numero-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('beneficioTotal')}
                >
                  Beneficio
                  {ordenamiento.campo === 'beneficioTotal' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="porcentaje-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('margenPorcentual')}
                >
                  Margen %
                  {ordenamiento.campo === 'margenPorcentual' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="numero-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('numeroProductos')}
                >
                  Productos
                  {ordenamiento.campo === 'numeroProductos' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="numero-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('numeroFacturas')}
                >
                  Facturas
                  {ordenamiento.campo === 'numeroFacturas' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="numero-col">
                <button 
                  className="sort-button"
                  onClick={() => handleSort('ticketPromedio')}
                >
                  Ticket Promedio
                  {ordenamiento.campo === 'ticketPromedio' && (
                    <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </th>
              <th className="acciones-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosPaginados.map((proveedor, index) => (
              <React.Fragment key={proveedor.proveedorId || index}>
                <tr className="proveedor-row">
                  <td className="proveedor-col">
                    <div className="proveedor-info">
                      <i className="fas fa-industry"></i>
                      <div className="proveedor-detalles">
                        <span className="proveedor-nombre">{proveedor.nombre}</span>
                        <span className="proveedor-id">ID: {proveedor.proveedorId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="numero-col ventas-valor">
                    <div className="valor-container">
                      <span className="valor-principal">
                        {formatCurrency(proveedor.ventasTotal || 0)}
                      </span>
                    </div>
                  </td>
                  <td className="numero-col beneficio-valor">
                    <div className="valor-container">
                      <span className="valor-principal">
                        {formatCurrency(proveedor.beneficioTotal || 0)}
                      </span>
                    </div>
                  </td>
                  <td className="porcentaje-col">
                    <div className="margen-container">
                      <div className="margen-bar">
                        <div 
                          className="margen-fill"
                          style={{ 
                            width: `${Math.min(Math.max(proveedor.margenPorcentual || 0, 0), 100)}%`,
                            backgroundColor: (proveedor.margenPorcentual || 0) > 25 ? '#00C49F' :
                                           (proveedor.margenPorcentual || 0) > 15 ? '#FFBB28' : '#FF8042'
                          }}
                        ></div>
                      </div>
                      <span className="margen-text">
                        {formatPercentage(proveedor.margenPorcentual || 0)}
                      </span>
                    </div>
                  </td>
                  <td className="numero-col">
                    <span className="badge badge-primary">
                      {proveedor.numeroProductos || 0}
                    </span>
                  </td>
                  <td className="numero-col">
                    <span className="badge badge-secondary">
                      {proveedor.numeroFacturas || 0}
                    </span>
                  </td>
                  <td className="numero-col">
                    {formatCurrency(proveedor.ticketPromedio || 0)}
                  </td>
                  <td className="acciones-col">
                    <button
                      className="btn-accion"
                      onClick={() => toggleExpansion(proveedor.proveedorId)}
                      title="Ver detalles"
                    >
                      <i className={`fas fa-chevron-${proveedorExpandido === proveedor.proveedorId ? 'up' : 'down'}`}></i>
                    </button>
                  </td>
                </tr>
                
                {/* Fila expandible con detalles */}
                {proveedorExpandido === proveedor.proveedorId && (
                  <tr className="detalle-row">
                    <td colSpan="8">
                      <div className="proveedor-detalles-expandido">
                        <div className="detalles-grid">
                          <div className="detalle-seccion">
                            <h4><i className="fas fa-chart-bar"></i> Métricas Adicionales</h4>
                            <div className="metricas-adicionales">
                              <div className="metrica-item">
                                <span className="metrica-label">Precio Promedio:</span>
                                <span className="metrica-valor">{formatCurrency(proveedor.precioPromedio || 0)}</span>
                              </div>
                              <div className="metrica-item">
                                <span className="metrica-label">Cantidad Total:</span>
                                <span className="metrica-valor">{(proveedor.cantidadTotal || 0).toLocaleString('es-ES')}</span>
                              </div>
                              <div className="metrica-item">
                                <span className="metrica-label">Líneas de Factura:</span>
                                <span className="metrica-valor">{proveedor.numeroLineas || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          {proveedor.topProductos && proveedor.topProductos.length > 0 && (
                            <div className="detalle-seccion">
                              <h4><i className="fas fa-star"></i> Top Productos</h4>
                              <div className="top-productos">
                                {proveedor.topProductos.slice(0, 3).map((producto, idx) => (
                                  <div key={idx} className="producto-item">
                                    <span className="producto-nombre">{producto.nombre}</span>
                                    <span className="producto-ventas">{formatCurrency(producto.ventasTotal)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {proveedor.ventasPorMes && proveedor.ventasPorMes.length > 0 && (
                            <div className="detalle-seccion">
                              <h4><i className="fas fa-calendar-alt"></i> Últimos Meses</h4>
                              <div className="ventas-mensuales">
                                {proveedor.ventasPorMes.slice(-3).map((mesData, idx) => (
                                  <div key={idx} className="mes-item">
                                    <span className="mes-nombre">{mesData.mes}</span>
                                    <span className="mes-ventas">{formatCurrency(mesData.ventas)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {infoPaginacion.totalPaginas > 1 && (
        <div className="tabla-paginacion">
          <div className="paginacion-info">
            Mostrando {infoPaginacion.inicio}-{infoPaginacion.fin} de {infoPaginacion.total} proveedores
          </div>
          <div className="paginacion-controles">
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual(1)}
              disabled={paginaActual === 1}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
            >
              <i className="fas fa-angle-left"></i>
            </button>
            <span className="pagina-actual">
              {paginaActual} de {infoPaginacion.totalPaginas}
            </span>
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual(prev => Math.min(infoPaginacion.totalPaginas, prev + 1))}
              disabled={paginaActual === infoPaginacion.totalPaginas}
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual(infoPaginacion.totalPaginas)}
              disabled={paginaActual === infoPaginacion.totalPaginas}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresTabla;