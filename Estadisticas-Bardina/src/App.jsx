// src/App.jsx - Versión completa con routing y store
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// Componentes y páginas
import { ErrorBoundary, LoadingSpinner, ErrorMessage } from './components/common';
import { 
  Dashboard, 
  EstadisticasVentas, 
  EstadisticasCompras, 
  VentasDetalladas,
  SellOut,
  Inventario
} from './pages';

// Hooks
import { useAppData, useNotifications } from './hooks';
import useAppStore from './stores/useAppStore';

// Configuración
import { NAVIGATION, APP_CONFIG } from './config/app.config';

// Estilos
import './styles.css';
import './styles/utils.css';

function AppContent() {
  const { data, loading, errors, isDataLoaded } = useAppData();
  const { isLoading } = useAppStore();
  const { showNotification } = useNotifications();

  // Mostrar errores como notificaciones
  useEffect(() => {
    if (errors.global) {
      showNotification(`Error global: ${errors.global}`, 'error');
    }
    if (errors.ventas) {
      showNotification(`Error en ventas: ${errors.ventas}`, 'error');
    }
    if (errors.compras) {
      showNotification(`Error en compras: ${errors.compras}`, 'error');
    }
  }, [errors, showNotification]);

  // Componente de layout
  const Layout = ({ children }) => (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-chart-line"></i> 
            {APP_CONFIG.name}
          </h1>
          <p className="app-subtitle">{APP_CONFIG.description}</p>
        </div>
        
        <nav className="app-nav">
          {NAVIGATION
            .filter(item => item.enabled)
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                  `nav-button ${isActive ? 'active' : ''}`
                }
              >
                <i className={`fas fa-${item.icon}`}></i>
                {item.label}
                {item.badge && (
                  <span className="nav-button-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
        </nav>
      </header>

      <main className="app-content">
        {children}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© 2025 {APP_CONFIG.name}</p>
            <div className="footer-details">
              <small>
                {APP_CONFIG.author} | v{APP_CONFIG.version}
                {APP_CONFIG.features.debugging && (
                  <span className="badge badge-warning ml-2">DEV</span>
                )}
              </small>
            </div>
          </div>
          <div className="footer-actions">
            <button 
              className="footer-button" 
              onClick={() => window.location.reload()}
              title="Actualizar datos"
            >
              <i className="fas fa-sync"></i>
            </button>
            <button 
              className="footer-button"
              onClick={() => {
                const debugInfo = useAppStore.getState().getDebugInfo();
                console.log('🔍 Debug Info:', debugInfo);
                showNotification('Info de debug en consola', 'info');
              }}
              title="Info de debug"
            >
              <i className="fas fa-bug"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );

  // Loading global
  if (loading.global || isLoading()) {
    return (
      <Layout>
        <LoadingSpinner 
          text="Cargando sistema de estadísticas..." 
          progress={data.ventas ? 75 : data.contactos ? 50 : 25}
        />
      </Layout>
    );
  }

  // Error global crítico
  if (errors.global && !isDataLoaded) {
    return (
      <Layout>
        <ErrorMessage 
          error={`Error crítico: ${errors.global}`}
          retry={() => window.location.reload()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to={APP_CONFIG.routes.default} replace />} />
        
        {/* Rutas principales */}
        <Route 
          path="/dashboard" 
          element={
            <Dashboard 
              ventasData={data.ventas} 
              comprasData={data.compras} 
            />
          } 
        />
        
        <Route 
          path="/ventas" 
          element={
            <EstadisticasVentas 
              data={data.ventas} 
              contactos={data.contactos} 
              usuarios={data.usuarios}
            />
          } 
        />
        
        <Route 
          path="/compras" 
          element={
            <EstadisticasCompras 
              data={data.compras} 
            />
          } 
        />

        {/* Nuevas rutas */}
        <Route 
          path="/ventas-detalladas" 
          element={
            <VentasDetalladas 
              data={data.ventas} 
              contactos={data.contactos} 
              usuarios={data.usuarios}
            />
          } 
        />
        
        <Route 
          path="/sellout" 
          element={
            <SellOut 
              ventasData={data.ventas}
              comprasData={data.compras}
            />
          } 
        />
        
        <Route 
          path="/inventario" 
          element={<Inventario />} 
        />

        {/* Ruta 404 */}
        <Route path="*" element={
          <div className="no-data-message">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Página no encontrada</h3>
            <p>La página que buscas no existe.</p>
            <NavLink to="/dashboard" className="btn btn-primary">
              <i className="fas fa-home"></i>
              Ir al Dashboard
            </NavLink>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;

