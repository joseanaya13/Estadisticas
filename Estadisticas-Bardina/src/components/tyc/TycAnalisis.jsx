// components/tyc/TycAnalisis.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { LoadingSpinner, ErrorMessage } from '../common';
import { tycAnalisisService } from '../../services/transaccionales/tycAnalisisService';
import { formatNumber, formatDate } from '../../utils/formatters';
import './TycAnalisis.css';

const TycAnalisis = ({ 
  proveedores = [], 
  marcas = [], 
  familias = [], 
  temporadas = [],
  almacenes = [],
  empresas = []
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datosAnalisis, setDatosAnalisis] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('matriz'); // matriz, estadisticas, graficos
  const [filtros, setFiltros] = useState({
    proveedor: 'todos',
    marca: 'todas',
    familia: 'todas',
    temporada: 'todas',
    almacen: 'todos',
    empresa: 'todas',
    articulo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Cargar análisis inicial
  useEffect(() => {
    cargarAnalisis();
  }, []);

  const cargarAnalisis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando análisis TyC con filtros:', filtros);
      const resultado = await tycAnalisisService.getAnalisisTyC(filtros);
      
      setDatosAnalisis(resultado);
      console.log('Análisis TyC cargado:', resultado);
      
    } catch (err) {
      console.error('Error al cargar análisis TyC:', err);
      setError(err.message || 'Error al cargar el análisis');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    cargarAnalisis();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      proveedor: 'todos',
      marca: 'todas', 
      familia: 'todas',
      temporada: 'todas',
      almacen: 'todos',
      empresa: 'todas',
      articulo: '',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  // Exportar datos
  const exportarDatos = async () => {
    try {
      if (!datosAnalisis?.matriz?.length) {
        alert('No hay datos para exportar');
        return;
      }

      const exportData = await tycAnalisisService.exportarMatriz(datosAnalisis.matriz, 'csv');
      
      // Crear CSV
      const csvContent = [
        exportData.headers.join(','),
        ...exportData.rows.map(row => row.join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = exportData.nombreArchivo;
      link.click();
      
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al exportar los datos');
    }
  };

  if (loading) {
    return (
      <div className="tyc-analisis-loading">
        <LoadingSpinner />
        <p>Cargando análisis de Tallas y Colores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tyc-analisis-error">
        <ErrorMessage message={error} />
        <button onClick={cargarAnalisis} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="tyc-analisis">
      {/* Header */}
      <div className="tyc-header">
        <div className="tyc-title">
          <h2>
            <i className="fas fa-th-large"></i>
            Análisis de Tallas y Colores (TyC)
          </h2>
          <p>Análisis detallado de existencias y ventas por talla y color</p>
        </div>
        
        <div className="tyc-actions">
          <button 
            onClick={exportarDatos}
            className="btn btn-secondary"
            disabled={!datosAnalisis?.matriz?.length}
          >
            <i className="fas fa-download"></i>
            Exportar
          </button>
          <button onClick={() => tycAnalisisService.limpiarCache()} className="btn btn-outline">
            <i className="fas fa-sync"></i>
            Limpiar Caché
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="tyc-filtros">
        <div className="filtros-grid">
          <div className="filtro-grupo">
            <label>Proveedor</label>
            <select 
              value={filtros.proveedor} 
              onChange={(e) => setFiltros({...filtros, proveedor: e.target.value})}
            >
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(prv => (
                <option key={prv.id} value={prv.id}>{prv.name}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Marca</label>
            <select 
              value={filtros.marca} 
              onChange={(e) => setFiltros({...filtros, marca: e.target.value})}
            >
              <option value="todas">Todas las marcas</option>
              {marcas.map(marca => (
                <option key={marca.id} value={marca.id}>{marca.name}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Familia</label>
            <select 
              value={filtros.familia} 
              onChange={(e) => setFiltros({...filtros, familia: e.target.value})}
            >
              <option value="todas">Todas las familias</option>
              {familias.map(fam => (
                <option key={fam.id} value={fam.id}>{fam.name}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Temporada</label>
            <select 
              value={filtros.temporada} 
              onChange={(e) => setFiltros({...filtros, temporada: e.target.value})}
            >
              <option value="todas">Todas las temporadas</option>
              {temporadas.map(temp => (
                <option key={temp.id} value={temp.id}>{temp.name}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Fecha Inicio</label>
            <input 
              type="date" 
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
            />
          </div>

          <div className="filtro-grupo">
            <label>Fecha Fin</label>
            <input 
              type="date" 
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
            />
          </div>
        </div>

        <div className="filtros-acciones">
          <button onClick={aplicarFiltros} className="btn btn-primary">
            <i className="fas fa-search"></i>
            Aplicar Filtros
          </button>
          <button onClick={limpiarFiltros} className="btn btn-outline">
            <i className="fas fa-times"></i>
            Limpiar
          </button>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="tyc-nav">
        <button 
          className={`nav-btn ${vistaActiva === 'matriz' ? 'active' : ''}`}
          onClick={() => setVistaActiva('matriz')}
        >
          <i className="fas fa-table"></i>
          Matriz TyC
        </button>
        <button 
          className={`nav-btn ${vistaActiva === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setVistaActiva('estadisticas')}
        >
          <i className="fas fa-chart-bar"></i>
          Estadísticas
        </button>
        <button 
          className={`nav-btn ${vistaActiva === 'graficos' ? 'active' : ''}`}
          onClick={() => setVistaActiva('graficos')}
        >
          <i className="fas fa-chart-line"></i>
          Gráficos
        </button>
      </div>

      {/* Contenido principal */}
      <div className="tyc-content">
        {datosAnalisis ? (
          <>
            {vistaActiva === 'matriz' && (
              <TycMatriz 
                matriz={datosAnalisis.matriz} 
                maestroTallas={datosAnalisis.maestros.tallas}
                maestroColores={datosAnalisis.maestros.colores}
              />
            )}
            {vistaActiva === 'estadisticas' && (
              <TycEstadisticas estadisticas={datosAnalisis.estadisticas} />
            )}
            {vistaActiva === 'graficos' && (
              <TycGraficos 
                matriz={datosAnalisis.matriz}
                estadisticas={datosAnalisis.estadisticas} 
              />
            )}
          </>
        ) : (
          <div className="tyc-empty">
            <i className="fas fa-info-circle"></i>
            <p>Aplica filtros para generar el análisis TyC</p>
          </div>
        )}
      </div>

      {/* Metadatos */}
      {datosAnalisis?.metadatos && (
        <div className="tyc-metadatos">
          <div className="metadatos-grid">
            <div className="metadato">
              <i className="fas fa-cube"></i>
              <span>Artículos: {datosAnalisis.metadatos.totalArticulos}</span>
            </div>
            <div className="metadato">
              <i className="fas fa-boxes"></i>
              <span>Registros Stock: {datosAnalisis.metadatos.totalRegistrosStock}</span>
            </div>
            <div className="metadato">
              <i className="fas fa-shopping-cart"></i>
              <span>Registros Ventas: {datosAnalisis.metadatos.totalRegistrosVentas}</span>
            </div>
            <div className="metadato">
              <i className="fas fa-clock"></i>
              <span>Generado: {formatDate(datosAnalisis.metadatos.fechaGeneracion)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Matriz TyC
const TycMatriz = ({ matriz, maestroTallas, maestroColores }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina] = useState(20);
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'art', direccion: 'asc' });

  // Aplicar ordenamiento
  const matrizOrdenada = useMemo(() => {
    const copia = [...matriz];
    copia.sort((a, b) => {
      let valorA = a[ordenamiento.campo];
      let valorB = b[ordenamiento.campo];

      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }

      if (ordenamiento.direccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
    return copia;
  }, [matriz, ordenamiento]);

  // Paginación
  const matrizPaginada = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    return matrizOrdenada.slice(inicio, fin);
  }, [matrizOrdenada, paginaActual, filasPorPagina]);

  const totalPaginas = Math.ceil(matrizOrdenada.length / filasPorPagina);

  const handleSort = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'desc' ? 'asc' : 'desc'
    }));
    setPaginaActual(1);
  };

  if (!matriz.length) {
    return (
      <div className="tyc-empty">
        <i className="fas fa-table"></i>
        <p>No hay datos para mostrar en la matriz</p>
      </div>
    );
  }

  const tallasEjemplo = matriz[0]?.tallas || [];

  return (
    <div className="tyc-matriz">
      <div className="matriz-info">
        <h3>Matriz de Tallas y Colores</h3>
        <p>Mostrando {matrizPaginada.length} de {matrizOrdenada.length} registros</p>
      </div>

      <div className="tabla-wrapper">
        <table className="tyc-table">
          <thead>
            <tr>
              <th className="sticky-col" onClick={() => handleSort('art')}>
                Artículo
                {ordenamiento.campo === 'art' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('articuloNombre')}>
                Nombre
                {ordenamiento.campo === 'articuloNombre' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('colorNombre')}>
                Color
                {ordenamiento.campo === 'colorNombre' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              
              {/* Columnas de tallas dinámicas */}
              {tallasEjemplo.map((talla, index) => (
                <th key={`talla-${index}`} className="talla-col">
                  {talla}
                  <div className="talla-headers">
                    <span className="stock-header">Stock</span>
                    <span className="ventas-header">Ventas</span>
                  </div>
                </th>
              ))}
              
              <th onClick={() => handleSort('totalExistencias')}>
                Total Stock
                {ordenamiento.campo === 'totalExistencias' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('totalVentas')}>
                Total Ventas
                {ordenamiento.campo === 'totalVentas' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('rotacion')}>
                Rotación
                {ordenamiento.campo === 'rotacion' && (
                  <i className={`fas fa-sort-${ordenamiento.direccion === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {matrizPaginada.map((fila, index) => (
              <tr key={`${fila.art}-${fila.col}`} className="matriz-row">
                <td className="sticky-col">
                  <strong>{fila.art}</strong>
                </td>
                <td className="articulo-nombre">
                  {fila.articuloNombre}
                </td>
                <td className="color-cell">
                  <div className="color-info">
                    <div 
                      className="color-muestra"
                      style={{ backgroundColor: getColorHex(fila.colorNombre) }}
                    ></div>
                    <span>{fila.colorNombre}</span>
                  </div>
                </td>
                
                {/* Datos por talla */}
                {fila.tallas.map((talla, tallaIndex) => (
                  <td key={`${fila.art}-${fila.col}-${tallaIndex}`} className="talla-data">
                    <div className="talla-valores">
                      <div className="stock-valor">
                        {formatNumber(fila.existencias[tallaIndex])}
                      </div>
                      <div className="ventas-valor">
                        {formatNumber(fila.ventas[tallaIndex])}
                      </div>
                    </div>
                  </td>
                ))}
                
                <td className="total-stock">
                  <strong>{formatNumber(fila.totalExistencias)}</strong>
                </td>
                <td className="total-ventas">
                  <strong>{formatNumber(fila.totalVentas)}</strong>
                </td>
                <td className="rotacion-cell">
                  <div className="rotacion-valor">
                    {fila.rotacion.toFixed(2)}
                    <div className="rotacion-bar">
                      <div 
                        className="rotacion-fill"
                        style={{ width: `${Math.min(fila.rotacion * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="paginacion">
          <button 
            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
            disabled={paginaActual === 1}
            className="btn-paginacion"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <span className="paginacion-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          
          <button 
            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaActual === totalPaginas}
            className="btn-paginacion"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de Estadísticas
const TycEstadisticas = ({ estadisticas }) => {
  if (!estadisticas) return null;

  return (
    <div className="tyc-estadisticas">
      <div className="stats-grid">
        {/* Resumen General */}
        <div className="stat-card">
          <div className="stat-header">
            <h3>Resumen General</h3>
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Total Filas</span>
              <span className="stat-value">{formatNumber(estadisticas.resumen.totalFilas)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Existencias</span>
              <span className="stat-value">{formatNumber(estadisticas.resumen.totalExistencias)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Ventas</span>
              <span className="stat-value">{formatNumber(estadisticas.resumen.totalVentas)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rotación Promedio</span>
              <span className="stat-value">{estadisticas.resumen.rotacionPromedio.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Top Productos */}
        <div className="stat-card">
          <div className="stat-header">
            <h3>Top 5 - Más Stock</h3>
            <i className="fas fa-boxes"></i>
          </div>
          <div className="stat-content">
            {estadisticas.top.masStock.slice(0, 5).map((item, index) => (
              <div key={index} className="top-item">
                <div className="top-info">
                  <span className="top-name">{item.articulo}</span>
                  <span className="top-color">{item.color}</span>
                </div>
                <span className="top-value">{formatNumber(item.stock)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Ventas */}
        <div className="stat-card">
          <div className="stat-header">
            <h3>Top 5 - Más Ventas</h3>
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="stat-content">
            {estadisticas.top.masVentas.slice(0, 5).map((item, index) => (
              <div key={index} className="top-item">
                <div className="top-info">
                  <span className="top-name">{item.articulo}</span>
                  <span className="top-color">{item.color}</span>
                </div>
                <span className="top-value">{formatNumber(item.ventas)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Rotación */}
        <div className="stat-card">
          <div className="stat-header">
            <h3>Top 5 - Mayor Rotación</h3>
            <i className="fas fa-sync-alt"></i>
          </div>
          <div className="stat-content">
            {estadisticas.top.mayorRotacion.slice(0, 5).map((item, index) => (
              <div key={index} className="top-item">
                <div className="top-info">
                  <span className="top-name">{item.articulo}</span>
                  <span className="top-color">{item.color}</span>
                </div>
                <span className="top-value">{item.rotacion.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente placeholder para gráficos
const TycGraficos = ({ matriz, estadisticas }) => {
  return (
    <div className="tyc-graficos">
      <div className="graficos-placeholder">
        <i className="fas fa-chart-line"></i>
        <h3>Gráficos TyC</h3>
        <p>Funcionalidad de gráficos en desarrollo</p>
        <p>Se mostrarán gráficos de distribución por tallas, colores y rotación</p>
      </div>
    </div>
  );
};

// Función helper para colores
const getColorHex = (colorName) => {
  const colores = {
    'Blanco': '#FFFFFF',
    'Negro': '#000000', 
    'Rojo': '#FF0000',
    'Azul': '#0000FF',
    'Verde': '#00FF00',
    'Amarillo': '#FFFF00',
    'Rosa': '#FFC0CB',
    'Gris': '#808080',
    'Marrón': '#8B4513',
    'Naranja': '#FFA500',
    'Morado': '#800080',
    'Beige': '#F5F5DC',
    'Plateado': '#C0C0C0',
    'Dorado': '#FFD700'
  };
  
  return colores[colorName] || '#CCCCCC';
};

export default TycAnalisis;