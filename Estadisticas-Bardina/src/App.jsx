// App.jsx corregido
import React, { useState, useEffect } from 'react';
import { Dashboard, EstadisticasVentas, EstadisticasCompras, LoadingSpinner, ErrorMessage } from './components';
import { ventasService, comprasService, dashboardService } from './services/api';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ventasData, setVentasData] = useState(null);
  const [comprasData, setComprasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos en paralelo utilizando los servicios correctos
        const [ventasResponse, comprasResponse] = await Promise.all([
          ventasService.getFacturas(),
          comprasService.getAlbaranes()
        ]);
        
        setVentasData(ventasResponse);
        setComprasData(comprasResponse);
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner text="Cargando datos de estadísticas..." />;
    }

    if (error) {
      return (
        <ErrorMessage 
          error={error}
          retry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard ventasData={ventasData} comprasData={comprasData} />;
      case 'ventas':
        return <EstadisticasVentas data={ventasData} />;
      case 'compras':
        return <EstadisticasCompras data={comprasData} />;
      default:
        return <Dashboard ventasData={ventasData} comprasData={comprasData} />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <i className="fas fa-chart-line"></i> Estadísticas de Compra y Venta
        </h1>
        <nav className="app-nav">
          <button 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </button>
          <button 
            className={`nav-button ${activeTab === 'ventas' ? 'active' : ''}`}
            onClick={() => setActiveTab('ventas')}
          >
            <i className="fas fa-shopping-cart"></i> Ventas
          </button>
          <button 
            className={`nav-button ${activeTab === 'compras' ? 'active' : ''}`}
            onClick={() => setActiveTab('compras')}
          >
            <i className="fas fa-truck"></i> Compras
          </button>
        </nav>
      </header>
      <main className="app-content">
        {renderContent()}
      </main>
      <footer className="app-footer">
        <p>© 2025 Estadísticas de Compra y Venta - Desarrollado para Consultoría Principado</p>
      </footer>
    </div>
  );
}

export default App;

