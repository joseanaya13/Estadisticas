// App.jsx - ACTUALIZADO CON RUTAS TYC
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner, ErrorBoundary } from './components/common';
import SidebarNavigation from './components/layout/SidebarNavigation';
import EstadisticasVentas from './pages/EstadisticasVentas';
import EstadisticasCompras from './pages/EstadisticasCompras';
import Dashboard from './pages/Dashboard';
import AnalisisTyC from './pages/AnalisisTyC'; // ✅ NUEVA PÁGINA
import { dataService } from './services/core/dataService';
import { dashboardService } from './services/core/dashboardService';
import { NAVIGATION } from './config/app.config';
import './styles/main.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando datos iniciales...');
      
      // Cargar datos principales
      const [ventasData, comprasData] = await Promise.all([
        dataService.getVentasData().catch(err => {
          console.warn('Error cargando ventas:', err);
          return { fac_t: [] };
        }),
        dataService.getComprasData().catch(err => {
          console.warn('Error cargando compras:', err);
          return { com_alb_g: [] };
        })
      ]);

      // Combinar datos
      const combinedData = {
        ...ventasData,
        ...comprasData
      };

      setData(combinedData);
      
      console.log('Datos cargados exitosamente:', {
        ventas: ventasData.fac_t?.length || 0,
        compras: comprasData.com_alb_g?.length || 0
      });

    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      setError('Error al cargar los datos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
        <h2>Cargando Bardina Analytics</h2>
        <p>Preparando datos del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Error al cargar la aplicación</h2>
          <p>{error}</p>
          <button onClick={loadInitialData} className="btn btn-primary">
            <i className="fas fa-sync"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={setSidebarCollapsed}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            navigation={NAVIGATION}
          />
          
          <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
            <Routes>
              {/* Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    ventasData={{ fac_t: data.fac_t || [] }}
                    comprasData={{ com_alb_g: data.com_alb_g || [] }}
                  />
                } 
              />
              
              {/* Análisis de Ventas */}
              <Route 
                path="/ventas" 
                element={
                  <EstadisticasVentas 
                    data={data}
                    contactos={data.ent_m || []}
                    usuarios={data.usr_m || []}
                  />
                } 
              />
              
              {/* Análisis de Compras */}
              <Route 
                path="/compras" 
                element={
                  <EstadisticasCompras 
                    data={data}
                    proveedores={data.prv_m || []}
                    usuarios={data.usr_m || []}
                  />
                } 
              />
              
              {/* ✅ NUEVA RUTA: Análisis TyC */}
              <Route 
                path="/tyc" 
                element={<AnalisisTyC />} 
              />
              
              {/* Páginas futuras - Redirects temporales */}
              <Route 
                path="/sellout" 
                element={
                  <div className="page-placeholder">
                    <i className="fas fa-chart-area"></i>
                    <h2>Sell Out</h2>
                    <p>Análisis de rotación y rendimiento - Próximamente</p>
                    <button onClick={() => window.history.back()} className="btn btn-outline">
                      <i className="fas fa-arrow-left"></i>
                      Volver
                    </button>
                  </div>
                } 
              />
              
              <Route 
                path="/inventario" 
                element={
                  <div className="page-placeholder">
                    <i className="fas fa-boxes"></i>
                    <h2>Inventario</h2>
                    <p>Control y análisis de stock - Próximamente</p>
                    <button onClick={() => window.history.back()} className="btn btn-outline">
                      <i className="fas fa-arrow-left"></i>
                      Volver
                    </button>
                  </div>
                } 
              />
              
              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route 
                path="*" 
                element={
                  <div className="page-404">
                    <i className="fas fa-question-circle"></i>
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe o ha sido movida.</p>
                    <button onClick={() => window.location.href = '/dashboard'} className="btn btn-primary">
                      <i className="fas fa-home"></i>
                      Ir al Dashboard
                    </button>
                  </div>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

