// src/components/common/SidebarNavigation.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAppStore from '../../stores/useAppStore';
import { NAVIGATION } from '../../config/app.config';

const SidebarNavigation = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { filters, updateFilters, hasActiveFilters, data } = useAppStore();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Configuración de navegación con datos dinámicos
  const navigationItems = NAVIGATION.filter(item => item.enabled).map(item => ({
    ...item,
    badge: getBadgeForItem(item.id),
    color: getColorForItem(item.id)
  }));

  // Función para obtener badges dinámicos
  function getBadgeForItem(itemId) {
    switch (itemId) {
      case 'ventas':
        return data?.ventas?.fac_t?.length || 0;
      case 'compras':
        return data?.compras?.com_alb_g?.length || 0;
      case 'ventas-detalladas':
        return 'NEW';
      case 'sellout':
        return 'BETA';
      default:
        return null;
    }
  }

  // Función para obtener colores por sección
  function getColorForItem(itemId) {
    const colors = {
      'dashboard': '#667eea',
      'ventas': '#4ade80',
      'ventas-detalladas': '#f59e0b',
      'compras': '#8b5cf6',
      'sellout': '#06b6d4',
      'inventario': '#f97316'
    };
    return colors[itemId] || '#667eea';
  }

  // Filtros rápidos conectados al store
  const quickFilters = [
    {
      id: 'currentYear',
      label: 'Solo este año',
      checked: filters.selectedYear === new Date().getFullYear().toString(),
      onChange: () => {
        const currentYear = new Date().getFullYear().toString();
        updateFilters({ 
          selectedYear: filters.selectedYear === currentYear ? 'todos' : currentYear
        });
      }
    },
    {
      id: 'positiveOnly',
      label: 'Solo ventas positivas',
      checked: filters.soloVentasPositivas,
      onChange: () => {
        updateFilters({ 
          soloVentasPositivas: !filters.soloVentasPositivas 
        });
      }
    }
  ];

  const formatLastUpdate = () => {
    if (!data || !data.lastUpdate) return 'Sin actualizar';
    const date = new Date(data.lastUpdate);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Componente de Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Header del Sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fas fa-chart-line sidebar-logo-icon"></i>
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <h1>Bardina</h1>
              <span>Analytics</span>
            </div>
          )}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>

      {/* Navegación Principal */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">
            {!isCollapsed && <span>Principal</span>}
          </div>
          {navigationItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ '--item-color': item.color }}
                title={isCollapsed ? item.label : ''}
              >
                <div className="nav-item-content">
                  <i className={`fas fa-${item.icon} nav-item-icon`}></i>
                  {!isCollapsed && (
                    <>
                      <span className="nav-item-label">{item.label}</span>
                    </>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Filtros Rápidos */}
        {!isCollapsed && (
          <div className="nav-section">
            <div className="nav-section-title">
              <span>Filtros Rápidos</span>
              {hasActiveFilters() && (
                <div className="active-filters-indicator" title="Filtros activos">
                  <i className="fas fa-filter"></i>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer del Sidebar */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <>
            <div className="update-info">
              <i className="fas fa-clock"></i>
              <span>Actualizado: {formatLastUpdate()}</span>
            </div>
            <div className="sidebar-actions">
              <button 
                className="action-btn" 
                title="Actualizar datos"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync"></i>
              </button>
              <button 
                className="action-btn" 
                title="Configuración"
                onClick={() => console.log('Abrir configuración')}
              >
                <i className="fas fa-cog"></i>
              </button>
              <button 
                className="action-btn" 
                title="Ayuda"
                onClick={() => console.log('Abrir ayuda')}
              >
                <i className="fas fa-question-circle"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );

  // Componente de Mobile Tab Bar
  const MobileTabBar = () => (
    <nav className="mobile-tab-bar">
      {navigationItems.slice(0, 5).map(item => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={`tab-item ${isActive ? 'active' : ''}`}
            style={{ '--item-color': item.color }}
          >
            <div className="tab-item-content">
              <div className="tab-icon-container">
                <i className={`fas fa-${item.icon} tab-icon`}></i>
                {item.badge && typeof item.badge === 'string' && (
                  <span className="tab-badge">{item.badge}</span>
                )}
                {item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="tab-count">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
              <span className="tab-label">{item.label}</span>
            </div>
            {isActive && <div className="tab-indicator"></div>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && <DesktopSidebar />}
      
      {/* Mobile Tab Bar */}
      {isMobile && <MobileTabBar />}
    </>
  );
};

export default SidebarNavigation;