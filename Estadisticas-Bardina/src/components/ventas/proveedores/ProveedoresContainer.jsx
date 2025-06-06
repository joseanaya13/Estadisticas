// components/ventas/proveedores/ProveedoresContainer.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { LoadingSpinner, ErrorMessage } from '../../common';
import { ProveedoresResumen, ProveedoresGraficos, ProveedoresTabla } from './';
import { lineasFacturasService, proveedoresService } from '../../../services';

const ProveedoresContainer = ({ filtros = {}, filtrosActivos = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analisisData, setAnalisisData] = useState(null);
  const [proveedoresMaestro, setProveedoresMaestro] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('dashboard'); // dashboard, graficos, tabla

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    loadAnalisisProveedores();
  }, [filtros]);

  const loadAnalisisProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏭 Cargando análisis por proveedores con filtros:', filtros);
      
      // Cargar maestro de proveedores primero
      const proveedoresResponse = await proveedoresService.getProveedores();
      const proveedoresList = proveedoresResponse.ent_m || [];
      setProveedoresMaestro(proveedoresList);
      
      console.log(`📋 Maestro de proveedores cargado: ${proveedoresList.length} proveedores`);
      
      // Preparar filtros para el servicio de líneas de factura
      const filtrosLineas = {
        ...filtros,
        // Convertir filtros de nombres amigables a campos de API si es necesario
      };
      
      // Cargar análisis por proveedores
      const analisisResponse = await lineasFacturasService.getAnalisisPorProveedores(
        filtrosLineas,
        proveedoresList
      );
      
      console.log('📊 Análisis por proveedores completado:', {
        totalProveedores: analisisResponse.proveedores?.length || 0,
        ventasTotal: analisisResponse.resumen?.ventasTotal || 0
      });
      
      setAnalisisData(analisisResponse);
      
    } catch (err) {
      console.error('❌ Error cargando análisis por proveedores:', err);
      setError(err.message || 'Error al cargar los datos de proveedores');
    } finally {
      setLoading(false);
    }
  };

  // Datos procesados para los componentes
  const datosParaComponentes = useMemo(() => {
    if (!analisisData || !analisisData.proveedores) {
      return {
        proveedores: [],
        resumen: null,
        totalProveedores: 0
      };
    }

    return {
      proveedores: analisisData.proveedores,
      resumen: analisisData.resumen,
      totalProveedores: analisisData.proveedores.length
    };
  }, [analisisData]);

  // Reintentar carga
  const handleRetry = () => {
    loadAnalisisProveedores();
  };

  if (loading) {
    return <LoadingSpinner text="Cargando análisis por proveedores..." />;
  }

  if (error) {
    return <ErrorMessage error={error} retry={handleRetry} />;
  }

  if (!analisisData) {
    return (
      <div className="no-data">
        <i className="fas fa-industry"></i>
        <h3>No hay datos disponibles</h3>
        <p>No se pudieron cargar los datos de análisis por proveedores.</p>
      </div>
    );
  }

  return (
    <div className="proveedores-container">
      
      {/* Navegación entre vistas */}
      <div className="proveedores-navigation">
        <div className="nav-buttons">
          <button
            className={`nav-btn ${vistaActiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => setVistaActiva('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i>
            Resumen Ejecutivo
          </button>
          <button
            className={`nav-btn ${vistaActiva === 'graficos' ? 'active' : ''}`}
            onClick={() => setVistaActiva('graficos')}
          >
            <i className="fas fa-chart-bar"></i>
            Análisis Gráfico
          </button>
          <button
            className={`nav-btn ${vistaActiva === 'tabla' ? 'active' : ''}`}
            onClick={() => setVistaActiva('tabla')}
          >
            <i className="fas fa-table"></i>
            Tabla Detallada
          </button>
        </div>
      </div>

      {/* Información del análisis */}
      {datosParaComponentes.resumen && (
        <div className="analisis-info">
          <div className="info-item">
            <i className="fas fa-industry"></i>
            <span>{datosParaComponentes.totalProveedores} proveedores analizados</span>
          </div>
          <div className="info-item">
            <i className="fas fa-euro-sign"></i>
            <span>{datosParaComponentes.resumen.ventasTotal?.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR'
            })} en ventas</span>
          </div>
          <div className="info-item">
            <i className="fas fa-percentage"></i>
            <span>{datosParaComponentes.resumen.margenGeneralPorcentual?.toFixed(1)}% margen promedio</span>
          </div>
          <div className="info-item">
            <i className="fas fa-calendar-alt"></i>
            <span>Actualizado: {new Date(datosParaComponentes.resumen.fechaAnalisis).toLocaleString('es-ES')}</span>
          </div>
        </div>
      )}

      {/* Contenido según la vista activa */}
      <div className="proveedores-content">
        {vistaActiva === 'dashboard' && (
          <div className="dashboard-view">
            <ProveedoresResumen
              proveedoresData={datosParaComponentes.proveedores}
              loading={loading}
              filtrosActivos={filtrosActivos}
            />
            
            {/* Mini gráficos en el dashboard */}
            <div className="dashboard-charts">
              <ProveedoresGraficos
                proveedoresData={datosParaComponentes.proveedores}
                loading={loading}
                viewMode="dashboard"
              />
            </div>
          </div>
        )}

        {vistaActiva === 'graficos' && (
          <div className="graficos-view">
            <ProveedoresGraficos
              proveedoresData={datosParaComponentes.proveedores}
              loading={loading}
              viewMode="full"
            />
          </div>
        )}

        {vistaActiva === 'tabla' && (
          <div className="tabla-view">
            <ProveedoresTabla
              proveedoresData={datosParaComponentes.proveedores}
              loading={loading}
              filtros={filtros}
            />
          </div>
        )}
      </div>

      {/* Información adicional si no hay datos */}
      {datosParaComponentes.totalProveedores === 0 && !loading && (
        <div className="no-data-proveedores">
          <div className="no-data-content">
            <i className="fas fa-industry"></i>
            <h3>No hay datos de proveedores</h3>
            <p>No se encontraron datos de proveedores con los filtros aplicados.</p>
            <div className="no-data-suggestions">
              <h4>Posibles causas:</h4>
              <ul>
                <li>Los filtros son demasiado restrictivos</li>
                <li>No hay líneas de factura en el período seleccionado</li>
                <li>Los datos de proveedores no están vinculados correctamente</li>
              </ul>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleRetry}
            >
              <i className="fas fa-sync"></i>
              Reintentar Carga
            </button>
          </div>
        </div>
      )}

      {/* Notas técnicas en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="development-notes">
          <details>
            <summary>🔧 Información de Desarrollo</summary>
            <div className="dev-info">
              <h4>Estructura de Datos:</h4>
              <pre>{JSON.stringify({
                totalProveedores: datosParaComponentes.totalProveedores,
                primerProveedor: datosParaComponentes.proveedores?.[0] ? {
                  nombre: datosParaComponentes.proveedores[0].nombre,
                  ventasTotal: datosParaComponentes.proveedores[0].ventasTotal,
                  numeroProductos: datosParaComponentes.proveedores[0].numeroProductos
                } : null,
                filtrosActivos: filtrosActivos
              }, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default ProveedoresContainer;