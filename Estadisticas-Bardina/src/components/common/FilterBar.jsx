// components/common/FilterBar.jsx
import React, { useState, useMemo } from 'react';
import { useAdaptiveFilters } from '../../hooks/useAdaptiveFilters';

const FilterBar = ({ 
  context = 'ventas', 
  data, 
  mapas = {}, 
  filtros = {}, 
  onChange, 
  onReset,
  showAdvanced = false,
  className = ''
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Obtener configuración de filtros adaptables
  const filterConfig = useAdaptiveFilters(context, data, mapas, filtros);
  
  // Separar filtros primarios y secundarios
  const { primaryFilters, secondaryFilters, filterGroups } = useMemo(() => {
    const primary = filterConfig.filter(filter => filter.isPrimary);
    const secondary = filterConfig.filter(filter => !filter.isPrimary);
    
    // Agrupar filtros por categoría
    const groups = filterConfig.reduce((acc, filter) => {
      const group = filter.group || 'otros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(filter);
      return acc;
    }, {});
    
    return {
      primaryFilters: primary,
      secondaryFilters: secondary,
      filterGroups: groups
    };
  }, [filterConfig]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return filterConfig.filter(filter => {
      const value = filter.value;
      return value !== 'todos' && value !== 'todas' && value !== '' && value !== null && value !== undefined;
    }).length;
  }, [filterConfig]);

  // Renderizar campo de filtro individual
  const renderFilterField = (filter) => {
    const { id, label, type, value, options = [] } = filter;

    switch (type) {
      case 'select':
        return (
          <div key={id} className="filter-field">
            <label htmlFor={id} className="filter-label">
              {label}
            </label>
            <select
              id={id}
              className="filter-select"
              value={value}
              onChange={(e) => onChange(id, e.target.value)}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div key={id} className="filter-field">
            <label htmlFor={id} className="filter-label">
              {label}
            </label>
            <input
              id={id}
              type="date"
              className="filter-date"
              value={value}
              onChange={(e) => onChange(id, e.target.value)}
            />
          </div>
        );

      case 'text':
        return (
          <div key={id} className="filter-field">
            <label htmlFor={id} className="filter-label">
              {label}
            </label>
            <input
              id={id}
              type="text"
              className="filter-text"
              value={value}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              onChange={(e) => onChange(id, e.target.value)}
            />
          </div>
        );

      case 'range':
        return (
          <div key={id} className="filter-field filter-range">
            <label className="filter-label">{label}</label>
            <div className="range-inputs">
              <input
                type="number"
                className="filter-number"
                placeholder="Mín"
                value={value?.min || ''}
                onChange={(e) => onChange(id, { ...value, min: e.target.value })}
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                className="filter-number"
                placeholder="Máx"
                value={value?.max || ''}
                onChange={(e) => onChange(id, { ...value, max: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizar grupo de filtros
  const renderFilterGroup = (groupName, filters) => {
    if (!filters.length) return null;

    const groupIcons = {
      temporal: 'fas fa-calendar-alt',
      personas: 'fas fa-users',
      ubicacion: 'fas fa-map-marker-alt',
      producto: 'fas fa-box',
      comercial: 'fas fa-handshake',
      inventario: 'fas fa-warehouse',
      otros: 'fas fa-filter'
    };

    return (
      <div key={groupName} className="filter-group">
        <div className="filter-group-header">
          <i className={groupIcons[groupName] || groupIcons.otros}></i>
          <span className="filter-group-title">
            {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
          </span>
        </div>
        <div className="filter-group-fields">
          {filters.map(renderFilterField)}
        </div>
      </div>
    );
  };

  // Obtener contexto amigable para mostrar
  const getContextLabel = (context) => {
    const labels = {
      ventas: 'Ventas',
      proveedores: 'Proveedores', 
      compras: 'Compras',
      clientes: 'Clientes',
      productos: 'Productos',
      inventario: 'Inventario'
    };
    return labels[context] || 'General';
  };

  return (
    <div className={`filter-bar ${className} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header de filtros */}
      <div className="filter-header">
        <div className="filter-title">
          <i className="fas fa-filter"></i>
          <span>Filtros de {getContextLabel(context)}</span>
          {activeFiltersCount > 0 && (
            <span className="active-filters-badge">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div className="filter-controls">
          {secondaryFilters.length > 0 && (
            <button
              className={`btn-filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Mostrar/ocultar filtros avanzados"
            >
              <i className="fas fa-cog"></i>
              Avanzados
            </button>
          )}
          
          {activeFiltersCount > 0 && (
            <button
              className="btn-filter-reset"
              onClick={onReset}
              title="Limpiar todos los filtros"
            >
              <i className="fas fa-times"></i>
              Limpiar
            </button>
          )}
          
          <button
            className="btn-filter-collapse"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir filtros' : 'Contraer filtros'}
          >
            <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="filter-content">
          {/* Filtros primarios - Siempre visibles */}
          {primaryFilters.length > 0 && (
            <div className="primary-filters">
              <div className="filters-row">
                {primaryFilters.map(renderFilterField)}
              </div>
            </div>
          )}

          {/* Filtros secundarios/avanzados */}
          {showAdvancedFilters && secondaryFilters.length > 0 && (
            <div className="advanced-filters">
              <div className="advanced-filters-header">
                <i className="fas fa-cog"></i>
                <span>Filtros Avanzados</span>
              </div>
              
              {/* Mostrar por grupos */}
              <div className="filter-groups">
                {Object.entries(filterGroups).map(([groupName, groupFilters]) => {
                  const secondaryGroupFilters = groupFilters.filter(f => !f.isPrimary);
                  return renderFilterGroup(groupName, secondaryGroupFilters);
                })}
              </div>
            </div>
          )}

          {/* Información de filtros aplicados */}
          {activeFiltersCount > 0 && (
            <div className="filter-summary">
              <div className="filter-summary-content">
                <i className="fas fa-info-circle"></i>
                <span>
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} aplicado{activeFiltersCount !== 1 ? 's' : ''}
                </span>
                <div className="active-filters-list">
                  {filterConfig
                    .filter(filter => {
                      const value = filter.value;
                      return value !== 'todos' && value !== 'todas' && value !== '' && value !== null && value !== undefined;
                    })
                    .map(filter => (
                      <span key={filter.id} className="active-filter-tag">
                        {filter.label}: {
                          filter.type === 'select' 
                            ? filter.options.find(opt => opt.value === filter.value)?.label || filter.value
                            : filter.value
                        }
                        <button
                          className="remove-filter"
                          onClick={() => onChange(filter.id, filter.type === 'select' ? 'todos' : '')}
                          title={`Quitar filtro ${filter.label}`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </span>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de filtros cuando está colapsado */}
      {isCollapsed && activeFiltersCount > 0 && (
        <div className="collapsed-filters-indicator">
          <span className="collapsed-info">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterBar;


