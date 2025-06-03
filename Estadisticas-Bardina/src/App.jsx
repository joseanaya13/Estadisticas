// src/App.jsx - Versión actualizada con Sidebar
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
// Componentes y páginas
import { ErrorBoundary, LoadingSpinner, ErrorMessage } from './components/common';
import SidebarNavigation from './components/common/SidebarNavigation';
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
import { APP_CONFIG } from './config/app.config';

// Estilos
import './styles/styles.css';
import './styles/utils.css';
import './styles/sidebar.css';

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

  // Loading global
  if (loading.global || isLoading()) {
    return (
      <div className="app-loading">
        <LoadingSpinner 
          text="Cargando sistema de estadísticas..." 
          progress={data.ventas ? 75 : data.contactos ? 50 : 25}
        />
      </div>
    );
  }

  // Error global crítico
  if (errors.global && !isDataLoaded) {
    return (
      <div className="app-error">
        <ErrorMessage 
          error={`Error crítico: ${errors.global}`}
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <SidebarNavigation />
      
      {/* Main Content */}
      <main className="app-content">
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
      </main>

      {/* Footer opcional (ahora más minimalista) */}
      <footer className="app-footer-minimal">
        <div className="footer-minimal-content">
          <small>© 2025 {APP_CONFIG.name} | v{APP_CONFIG.version}</small>
          {APP_CONFIG.features.debugging && (
            <button 
              className="debug-button"
              onClick={() => {
                const debugInfo = useAppStore.getState().getDebugInfo();
                console.log('🔍 Debug Info:', debugInfo);
                showNotification('Info de debug en consola', 'info');
              }}
              title="Info de debug"
            >
              <i className="fas fa-bug"></i>
            </button>
          )}
        </div>
      </footer>
    </div>
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

