// src/App.jsx - Versión corregida con mejor manejo de errores y datos
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';

// Componentes y páginas
import { ErrorBoundary, LoadingSpinner, ErrorMessage } from './components/common';
import SidebarNavigation from './components/common/SidebarNavigation';
import { 
  Dashboard, 
  EstadisticasVentas, 
  EstadisticasCompras, 
  SellOut,
  Inventario
} from './pages';

// Hooks
import { useAppData, useNotifications } from './hooks';
import useAppStore from './stores/useAppStore';

// Configuración
import { APP_CONFIG } from './config/app.config';

// Estilos
//  import './styles1/styles.css';
//  import './styles1/utils.css';
//  import './styles1/sidebar.css';
 import './styles/index.css';

function AppContent() {
  const { data, loading, errors, isDataLoaded, isInitialized, stats, loadAllData } = useAppData();
  const { isLoading } = useAppStore();
  const { showNotification } = useNotifications();

  // Mostrar errores como notificaciones con mejor manejo
  useEffect(() => {
    if (errors.global && !loading.global) {
      showNotification(`Error crítico: ${errors.global}`, 'error');
    }
    if (errors.ventas && !loading.ventas) {
      showNotification(`Problema con ventas: ${errors.ventas}`, 'warning');
    }
    if (errors.compras && !loading.compras) {
      showNotification(`Problema con compras: ${errors.compras}`, 'warning');
    }
    if (errors.maestros && !loading.maestros) {
      showNotification(`Datos maestros limitados: ${errors.maestros}`, 'info');
    }
  }, [errors, loading, showNotification]);

  // Debug mejorado
  useEffect(() => {
    if (APP_CONFIG.features.debugging && isInitialized) {
      console.log('🔍 App Stats:', stats);
    }
  }, [stats, isInitialized]);

  // Loading global con información más detallada
  if (loading.global && !isInitialized) {
    const loadingProgress = stats.retryCount > 0 ? 
      `Reintentando (${stats.retryCount}/3)...` : 
      'Cargando sistema de estadísticas...';
    
    return (
      <div className="app-loading">
        <LoadingSpinner 
          text={loadingProgress}
          progress={
            data.ventas && data.compras ? 90 : 
            data.ventas || data.compras ? 60 : 
            data.contactos || data.usuarios ? 30 : 10
          }
        />
        {stats.retryCount > 0 && (
          <div className="retry-info">
            <p>Algunos servicios no responden correctamente.</p>
            <p>Reintentando automáticamente...</p>
          </div>
        )}
      </div>
    );
  }

  // Error crítico mejorado
  if (errors.global && !data.ventas && !data.compras && stats.retryCount >= 3) {
    return (
      <div className="app-error">
        <ErrorMessage 
          error={`Error crítico del sistema: ${errors.global}`}
          retry={() => {
            console.log('🔄 Reintentando carga manual...');
            loadAllData(true);
          }}
        />
        <div className="error-details">
          <h4>Estado del sistema:</h4>
          <ul>
            <li>Ventas: {data.ventas ? '✅ Cargadas' : '❌ Error'}</li>
            <li>Compras: {data.compras ? '✅ Cargadas' : '❌ Error'}</li>
            <li>Contactos: {data.contactos ? '✅ Cargados' : '⚠️ No disponibles'}</li>
            <li>Usuarios: {data.usuarios ? '✅ Cargados' : '⚠️ No disponibles'}</li>
            <li>Reintentos: {stats.retryCount}/3</li>
          </ul>
        </div>
      </div>
    );
  }

  // Si no hay datos críticos pero no hay error global, mostrar advertencia
  if (isInitialized && !data.ventas && !data.compras && !loading.global) {
    return (
      <div className="app-warning">
        <div className="warning-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Datos no disponibles</h2>
          <p>No se pudieron cargar los datos principales del sistema.</p>
          <div className="warning-actions">
            <button 
              onClick={() => loadAllData(true)}
              className="btn btn-primary"
            >
              <i className="fas fa-refresh"></i>
              Reintentar carga
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              <i className="fas fa-sync"></i>
              Recargar página
            </button>
          </div>
          <div className="system-status">
            <h4>Estado de servicios:</h4>
            <div className="status-grid">
              <div className={`status-item ${data.ventas ? 'success' : 'error'}`}>
                <i className={`fas fa-${data.ventas ? 'check' : 'times'}`}></i>
                <span>Ventas</span>
              </div>
              <div className={`status-item ${data.compras ? 'success' : 'error'}`}>
                <i className={`fas fa-${data.compras ? 'check' : 'times'}`}></i>
                <span>Compras</span>
              </div>
              <div className={`status-item ${data.contactos ? 'success' : 'warning'}`}>
                <i className={`fas fa-${data.contactos ? 'check' : 'exclamation'}`}></i>
                <span>Contactos</span>
              </div>
              <div className={`status-item ${data.usuarios ? 'success' : 'warning'}`}>
                <i className={`fas fa-${data.usuarios ? 'check' : 'exclamation'}`}></i>
                <span>Usuarios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <SidebarNavigation />
      
      {/* Banner de advertencia si hay errores no críticos */}
      {(errors.ventas || errors.compras || errors.maestros) && isInitialized && (
        <div className="app-warnings-banner">
          <div className="warnings-content">
            <i className="fas fa-info-circle"></i>
            <div className="warnings-text">
              <strong>Funcionamiento parcial</strong>
              {errors.ventas && <span>• Datos de ventas limitados</span>}
              {errors.compras && <span>• Datos de compras limitados</span>}
              {errors.maestros && <span>• Información de referencia incompleta</span>}
            </div>
            <button 
              onClick={() => loadAllData(true)}
              className="btn btn-sm btn-secondary"
              title="Reintentar carga de datos"
            >
              <i className="fas fa-refresh"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="app-content">
        <Routes>
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to={APP_CONFIG.routes.default} replace />} />
          
          {/* Rutas principales con validación de datos */}
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
              data.ventas ? (
                <EstadisticasVentas 
                  data={data.ventas} 
                  contactos={data.contactos} 
                  usuarios={data.usuarios}
                />
              ) : (
                <div className="service-unavailable">
                  <i className="fas fa-exclamation-circle"></i>
                  <h3>Datos de ventas no disponibles</h3>
                  <p>No se pudieron cargar los datos de ventas.</p>
                  <button 
                    onClick={() => loadAllData(true)}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-refresh"></i>
                    Reintentar
                  </button>
                </div>
              )
            } 
          />
          
          <Route 
            path="/compras" 
            element={
              data.compras ? (
                <EstadisticasCompras 
                  data={data.compras} 
                />
              ) : (
                <div className="service-unavailable">
                  <i className="fas fa-exclamation-circle"></i>
                  <h3>Datos de compras no disponibles</h3>
                  <p>No se pudieron cargar los datos de compras.</p>
                  <button 
                    onClick={() => loadAllData(true)}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-refresh"></i>
                    Reintentar
                  </button>
                </div>
              )
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

      {/* Footer mejorado con información del sistema */}
      <footer className="app-footer-minimal">
        <div className="footer-minimal-content">
          <small>© 2025 {APP_CONFIG.name} | v{APP_CONFIG.version}</small>
          
          {/* Indicador de estado del sistema */}
          <div className="system-indicator">
            <div 
              className={`status-dot ${stats.hasErrors ? 'warning' : stats.dataFreshness === 'stale' ? 'warning' : 'success'}`}
              title={
                stats.hasErrors ? 'Sistema con advertencias' :
                stats.dataFreshness === 'stale' ? 'Datos desactualizados' :
                'Sistema funcionando correctamente'
              }
            ></div>
            <small>
              {stats.hasErrors ? 'Parcial' : 
               stats.dataFreshness === 'stale' ? 'Desactualizado' : 
               'Operativo'}
            </small>
          </div>
          
          {APP_CONFIG.features.debugging && (
            <button 
              className="debug-button"
              onClick={() => {
                console.log('🔍 Debug Info completo:', {
                  data: Object.keys(data).reduce((acc, key) => {
                    acc[key] = data[key] ? 'loaded' : 'not loaded';
                    return acc;
                  }, {}),
                  loading,
                  errors,
                  stats
                });
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

