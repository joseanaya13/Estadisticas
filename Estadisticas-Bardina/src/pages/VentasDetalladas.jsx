// src/pages/VentasDetalladas.jsx
import React, { useState } from 'react';
import { LoadingSpinner, ErrorMessage } from '../components/common';

const VentasDetalladas = () => {
  const [activeView, setActiveView] = useState('proveedores');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚧 PÁGINA EN CONSTRUCCIÓN
  const views = [
    { id: 'proveedores', label: 'Por Proveedores', icon: 'industry' },
    { id: 'marcas', label: 'Por Marcas', icon: 'tags' },
    { id: 'temporadas', label: 'Por Temporadas', icon: 'calendar-alt' }
  ];

  if (loading) return <LoadingSpinner text="Cargando ventas detalladas..." />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="ventas-detalladas-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-chart-line"></i>
          Ventas Detalladas
        </h1>
        <p className="page-subtitle">
          Análisis profundo por proveedores, marcas y temporadas
        </p>
      </div>

      {/* Navegación de vistas */}
      <div className="ventas-navigation">
        <div className="nav-buttons">
          {views.map(view => (
            <button
              key={view.id}
              className={`nav-btn ${activeView === view.id ? 'active' : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              <i className={`fas fa-${view.icon}`}></i>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="ventas-detalladas-content">
        <div className="construction-notice alert alert-info">
          <i className="fas fa-hard-hat"></i>
          <div>
            <strong>🚧 Página en construcción</strong>
            <p>Esta funcionalidad se implementará en las próximas fases del desarrollo.</p>
          </div>
        </div>

        {/* Placeholder para futuras vistas */}
        {activeView === 'proveedores' && (
          <div className="placeholder-content">
            <h3>📊 Análisis por Proveedores</h3>
            <p>Aquí se mostrará el análisis detallado de ventas por proveedor.</p>
          </div>
        )}

        {activeView === 'marcas' && (
          <div className="placeholder-content">
            <h3>🏷️ Análisis por Marcas</h3>
            <p>Aquí se mostrará el análisis detallado de ventas por marca.</p>
          </div>
        )}

        {activeView === 'temporadas' && (
          <div className="placeholder-content">
            <h3>🌱 Análisis por Temporadas</h3>
            <p>Aquí se mostrará el análisis detallado de ventas por temporada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasDetalladas;



