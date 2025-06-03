// src/pages/Inventario.jsx
import React, { useState } from 'react';
import { LoadingSpinner, ErrorMessage } from '../components/common';

const Inventario = () => {
  const [activeView, setActiveView] = useState('valoracion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const views = [
    { id: 'valoracion', label: 'Valoración', icon: 'euro-sign' },
    { id: 'marcas', label: 'Por Marcas', icon: 'tags' },
    { id: 'proveedores', label: 'Por Proveedores', icon: 'industry' },
    { id: 'antiguedad', label: 'Antigüedad', icon: 'clock' },
    { id: 'alertas', label: 'Alertas', icon: 'exclamation-triangle' }
  ];

  if (loading) return <LoadingSpinner text="Cargando inventario..." />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="inventario-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-boxes"></i>
          Gestión de Inventario
        </h1>
        <p className="page-subtitle">
          Control y análisis de stock por ubicación, marca y antigüedad
        </p>
      </div>

      <div className="inventario-navigation">
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

      <div className="inventario-content">
        <div className="construction-notice alert alert-info">
          <i className="fas fa-info-circle"></i>
          <div>
            <strong>ℹ️ Próximamente</strong>
            <p>Esta funcionalidad se implementará cuando estén disponibles los datos de stock y movimientos de almacén.</p>
          </div>
        </div>

        <div className="placeholder-content">
          <h3>📦 {views.find(v => v.id === activeView)?.label}</h3>
          <p>Vista en desarrollo...</p>
        </div>
      </div>
    </div>
  );
};

export default Inventario;

