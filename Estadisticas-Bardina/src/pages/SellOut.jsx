// src/pages/SellOut.jsx
import React, { useState } from 'react';
import { LoadingSpinner, ErrorMessage } from '../components/common';

const SellOut = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'ratios', label: 'Ratios V/C', icon: 'chart-pie' },
    { id: 'rotacion', label: 'Rotación', icon: 'sync-alt' },
    { id: 'sugerencias', label: 'Sugerencias', icon: 'lightbulb' }
  ];

  if (loading) return <LoadingSpinner text="Cargando análisis de sell out..." />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="sellout-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-chart-area"></i>
          Sell Out Analysis
        </h1>
        <p className="page-subtitle">
          Análisis de rendimiento y rotación de inventario
        </p>
      </div>

      <div className="sellout-navigation">
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

      <div className="sellout-content">
        <div className="construction-notice alert alert-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>⚠️ Funcionalidad avanzada</strong>
            <p>Esta página requiere datos de líneas de ventas y stock. Se implementará cuando estén disponibles las APIs correspondientes.</p>
          </div>
        </div>

        <div className="placeholder-content">
          <h3>📊 {views.find(v => v.id === activeView)?.label}</h3>
          <p>Funcionalidad en desarrollo...</p>
        </div>
      </div>
    </div>
  );
};

export default SellOut;