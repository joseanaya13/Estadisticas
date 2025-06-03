// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { APP_CONFIG } from '../../config/app.config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString();
    
    console.error('🚨 Error Boundary capturó un error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log estructurado del error
    this.logError(error, errorInfo, errorId);
  }

  logError = (error, errorInfo, errorId) => {
    const errorData = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
      userAgent: navigator.userAgent,
      url: window.location.href,
      appVersion: APP_CONFIG.version
    };
    
    if (APP_CONFIG.logging.console) {
      console.group(`🚨 Error ${errorId}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // Aquí se podría enviar a un servicio de logging
    // this.sendToLoggingService(errorData);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (window.location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = APP_CONFIG.features.debugging;
      
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            
            <h1>¡Oops! Algo salió mal</h1>
            <p className="error-description">
              Se produjo un error inesperado en la aplicación. 
              Nuestro equipo ha sido notificado del problema.
            </p>

            <div className="error-id">
              <small>ID del error: {this.state.errorId}</small>
            </div>

            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary"
              >
                <i className="fas fa-redo"></i>
                Intentar de nuevo
              </button>
              
              <button 
                onClick={this.handleReload}
                className="btn btn-secondary"
              >
                <i className="fas fa-sync"></i>
                Recargar Página
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="btn btn-secondary"
              >
                <i className="fas fa-home"></i>
                Ir al Dashboard
              </button>
            </div>

            {isDevelopment && this.state.error && (
              <details className="error-details">
                <summary>🔧 Detalles técnicos (desarrollo)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  <h4>Stack trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                  
                  {this.state.errorInfo.componentStack && (
                    <>
                      <h4>Component stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-help">
              <h4>💡 ¿Qué puedes hacer?</h4>
              <ul>
                <li>Intentar de nuevo suele solucionar problemas temporales</li>
                <li>Recargar la página puede resolver problemas de carga</li>
                <li>Verificar tu conexión a internet</li>
                <li>Contactar al administrador si el problema persiste</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;