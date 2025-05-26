// App.jsx - Actualizado con servicio de contactos
import React, { useState, useEffect } from 'react';
import { Dashboard, EstadisticasVentas, EstadisticasCompras, LoadingSpinner, ErrorMessage } from './components';
import { ventasService, comprasService, contactosService } from './services/api';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ventasData, setVentasData] = useState(null);
  const [comprasData, setComprasData] = useState(null);
  const [contactosData, setContactosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingProgress(0);
        
        console.log('Iniciando carga de datos...');
        
        // Obtener datos en paralelo - incluir contactos
        setLoadingProgress(25);
        const [ventasResponse, comprasResponse, contactosResponse] = await Promise.all([
          ventasService.getFacturas(),
          comprasService.getAlbaranes(),
          contactosService.getContactos()
        ]);
        
        setLoadingProgress(75);
        
        console.log('Datos cargados:', {
          ventas: ventasResponse.fac_t?.length || 0,
          compras: comprasResponse.com_alb_g?.length || 0,
          contactos: contactosResponse.ent_m?.length || 0
        });
        
        setVentasData(ventasResponse);
        setComprasData(comprasResponse);
        setContactosData(contactosResponse);
        
        setLoadingProgress(100);
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
        }, 500); // Pequeña pausa para mostrar el 100%
      }
    };

    fetchData();
  }, []);

  const handleRetry = () => {
    setError(null);
    // Recargar la página para reiniciar todo
    window.location.reload();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingSpinner 
          text="Cargando datos de estadísticas..." 
          progress={loadingProgress}
        />
      );
    }

    if (error) {
      return (
        <ErrorMessage 
          error={error}
          retry={handleRetry}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard ventasData={ventasData} comprasData={comprasData} />;
      case 'ventas':
        return <EstadisticasVentas data={ventasData} contactos={contactosData} />;
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
        <p>
          <small>
            <i className="fas fa-database"></i> 
            {ventasData && ` ${ventasData.fac_t?.length || 0} facturas`}
            {comprasData && ` • ${comprasData.com_alb_g?.length || 0} albaranes`}
            {contactosData && ` • ${contactosData.ent_m?.length || 0} contactos`}
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;

