// components/common/FilterBarContextual.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getFiltrosConfig, getValoresDefecto } from '../../utils/filtrosConfig';

const FilterBar = ({ 
  contexto = 'ventas',
  filtros,
  onFiltrosChange,
  loading = false,
  className = ''
}) => {
  const [expandido, setExpandido] = useState(false);
  const [opcionesCache, setOpcionesCache] = useState({});

  // Configuración según contexto
  const config = useMemo(() => getFiltrosConfig(contexto), [contexto]);
  
  // Valores por defecto
  const valoresDefecto = useMemo(() => getValoresDefecto(contexto), [contexto]);

  // Verificar si hay filtros activos
  const hayFiltrosActivos = useMemo(() => {
    return Object.entries(filtros).some(([key, value]) => {
      const defecto = valoresDefecto[key];
      if (typeof defecto === 'object' && defecto !== null) {
        return JSON.stringify(value) !== JSON.stringify(defecto);
      }
      return value !== defecto && value !== '' && value !== null && value !== undefined;
    });
  }, [filtros, valoresDefecto]);

  // Cargar opciones asíncronas
  const cargarOpciones = async (filtroConfig, key) => {
    if (opcionesCache[key]) return opcionesCache[key];

    try {
      let opciones = [];
      
      if (filtroConfig.opciones === 'dinamico' && key === 'año') {
        // Generar años dinámicamente
        const añoActual = new Date().getFullYear();
        opciones = [
          { value: 'todos', label: 'Todos los años' },
          ...Array.from({ length: 5 }, (_, i) => ({
            value: (añoActual - i).toString(),
            label: (añoActual - i).toString()
          }))
        ];
      } else if (filtroConfig.endpoint) {
        // Cargar desde API
        const url = `${filtroConfig.endpoint}${filtroConfig.filtro ? `?${filtroConfig.filtro}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Adaptar formato según endpoint
        const dataKey = Object.keys(data).find(k => Array.isArray(data[k]));
        const items = data[dataKey] || [];
        
        opciones = [
          { value: filtroConfig.defecto, label: `Todos los ${filtroConfig.label.toLowerCase()}` },
          ...items.map(item => ({
            value: item.id || item.cod,
            label: item.name || item.nom
          }))
        ];
      } else if (Array.isArray(filtroConfig.opciones)) {
        opciones = filtroConfig.opciones;
      }

      setOpcionesCache(prev => ({ ...prev, [key]: opciones }));
      return opciones;
      
    } catch (error) {
      console.error(`Error cargando opciones para ${key}:`, error);
      return [{ value: filtroConfig.defecto, label: 'Error cargando datos' }];
    }
  };

  // Manejar cambio de filtro
  const handleFiltroChange = (key, value) => {
    const nuevosFiltros = { ...filtros, [key]: value };
    onFiltrosChange(nuevosFiltros);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    onFiltrosChange(valoresDefecto);
  };

  // Renderizar campo según tipo
  const renderizarCampo = (key, filtroConfig) => {
    const value = filtros[key] ?? filtroConfig.defecto;

    switch (filtroConfig.tipo) {
      case 'select':
      case 'select-async':
        return (
          <AsyncSelect
            key={key}
            label={filtroConfig.label}
            value={value}
            onChange={(val) => handleFiltroChange(key, val)}
            loadOptions={() => cargarOpciones(filtroConfig, key)}
            opciones={filtroConfig.opciones}
            disabled={loading}
          />
        );

      case 'rango-fecha':
        return (
          <DateRangeFilter
            key={key}
            label={filtroConfig.label}
            fechaDesde={filtros.fechaDesde}
            fechaHasta={filtros.fechaHasta}
            onChange={(desde, hasta) => {
              handleFiltroChange('fechaDesde', desde);
              handleFiltroChange('fechaHasta', hasta);
            }}
            disabled={loading}
          />
        );

      case 'rango':
        return (
          <RangeFilter
            key={key}
            label={filtroConfig.label}
            min={filtroConfig.min}
            max={filtroConfig.max}
            value={value}
            onChange={(val) => handleFiltroChange(key, val)}
            disabled={loading}
          />
        );

      case 'numero':
        return (
          <NumberFilter
            key={key}
            label={filtroConfig.label}
            value={value}
            placeholder={filtroConfig.placeholder}
            onChange={(val) => handleFiltroChange(key, val)}
            disabled={loading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`filter-bar-contextual ${className}`}>
      {/* Header con título y controles */}
      <div className="filter-header">
        <div className="filter-title">
          <i className="fas fa-filter"></i>
          <h3>{config.titulo}</h3>
          {hayFiltrosActivos && (
            <span className="filtros-activos-badge">
              {Object.values(filtros).filter(v => v && v !== 'todos' && v !== 'todas').length}
            </span>
          )}
        </div>
        
        <div className="filter-controls">
          {hayFiltrosActivos && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={limpiarFiltros}
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Limpiar
            </button>
          )}
          
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setExpandido(!expandido)}
            disabled={loading}
          >
            <i className={`fas fa-chevron-${expandido ? 'up' : 'down'}`}></i>
            {expandido ? 'Contraer' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* Filtros rápidos (siempre visibles) */}
      <div className="filtros-rapidos">
        {config.campos.slice(0, 3).map(campo => {
          const filtroConfig = config.filtros[campo];
          return filtroConfig ? renderizarCampo(campo, filtroConfig) : null;
        })}
      </div>

      {/* Filtros avanzados (expandibles) */}
      {expandido && config.campos.length > 3 && (
        <div className="filtros-avanzados">
          <div className="filtros-grid">
            {config.campos.slice(3).map(campo => {
              const filtroConfig = config.filtros[campo];
              return filtroConfig ? renderizarCampo(campo, filtroConfig) : null;
            })}
          </div>
        </div>
      )}

      {/* Información contextual */}
      {hayFiltrosActivos && (
        <div className="filtros-info">
          <i className="fas fa-info-circle"></i>
          <span>
            Filtros aplicados para {contexto}. 
            Los resultados se actualizarán automáticamente.
          </span>
        </div>
      )}
    </div>
  );
};

// Componentes auxiliares
const AsyncSelect = ({ label, value, onChange, loadOptions, disabled }) => {
  const [opciones, setOpciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const opts = await loadOptions();
        setOpciones(opts);
      } catch (error) {
        console.error('Error cargando opciones:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [loadOptions]);

  return (
    <div className="form-group">
      <label>{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || cargando}
        className="form-control"
      >
        {cargando ? (
          <option>Cargando...</option>
        ) : (
          opciones.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

const DateRangeFilter = ({ label, fechaDesde, fechaHasta, onChange, disabled }) => (
  <div className="form-group date-range">
    <label>{label}</label>
    <div className="date-inputs">
      <input
        type="date"
        value={fechaDesde || ''}
        onChange={(e) => onChange(e.target.value, fechaHasta)}
        disabled={disabled}
        className="form-control"
        placeholder="Desde"
      />
      <input
        type="date"
        value={fechaHasta || ''}
        onChange={(e) => onChange(fechaDesde, e.target.value)}
        disabled={disabled}
        className="form-control"
        placeholder="Hasta"
      />
    </div>
  </div>
);

const RangeFilter = ({ label, min, max, value, onChange, disabled }) => (
  <div className="form-group range-filter">
    <label>{label}</label>
    <div className="range-inputs">
      <input
        type="number"
        min={min}
        max={max}
        value={value?.min || min}
        onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
        disabled={disabled}
        className="form-control"
        placeholder="Min"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value?.max || max}
        onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
        disabled={disabled}
        className="form-control"
        placeholder="Max"
      />
    </div>
  </div>
);

const NumberFilter = ({ label, value, placeholder, onChange, disabled }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
      className="form-control"
      placeholder={placeholder}
    />
  </div>
);

export default FilterBar;


