// components/DataCard.jsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const DataCard = ({ title, value, type = 'default', format = 'text', icon = null }) => {
  const renderValue = () => {
    if (format === 'currency') {
      return formatCurrency(value);
    }
    if (format === 'number') {
      return value.toLocaleString('es-ES');
    }
    return value;
  };

  return (
    <div className={`data-card ${type}`}>
      <div className="card-header">
        {icon && <i className={`fas fa-${icon}`}></i>}
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <p className="card-value">{renderValue()}</p>
      </div>
    </div>
  );
};

export default DataCard;
