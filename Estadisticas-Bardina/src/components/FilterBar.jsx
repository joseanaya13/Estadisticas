// components/FilterBar.jsx
import React from 'react';
import { obtenerNombreMes } from '../utils/formatters';

const FilterBar = ({ filters, onChange, onReset }) => {
  const handleChange = (e, filterId) => {
    onChange(filterId, e.target.value);
  };
  
  return (
    <div className="filter-bar">
      <h3>
        <i className="fas fa-filter"></i> Filtros
      </h3>
      <div className="filter-controls">
        {filters.map((filter) => (
          <div key={filter.id} className="filter-control">
            <label htmlFor={filter.id}>{filter.label}:</label>
            
            {filter.type === 'select' && (
              <select
                id={filter.id}
                value={filter.value}
                onChange={(e) => handleChange(e, filter.id)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'date' && (
              <input
                type="date"
                id={filter.id}
                value={filter.value}
                onChange={(e) => handleChange(e, filter.id)}
              />
            )}
            
            {filter.type === 'text' && (
              <input
                type="text"
                id={filter.id}
                value={filter.value}
                placeholder={filter.placeholder || ''}
                onChange={(e) => handleChange(e, filter.id)}
              />
            )}
          </div>
        ))}
        
        <button className="filter-reset" onClick={onReset}>
          <i className="fas fa-undo"></i> Reiniciar
        </button>
      </div>
    </div>
  );
};

export default FilterBar;


