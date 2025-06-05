// components/DataCard.jsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const DataCard = ({ 
  title, 
  value, 
  type = 'default', 
  format = 'text', 
  icon = null, 
  change = null,
  changeType = 'neutral' 
}) => {
  const renderValue = () => {
    if (format === 'currency') {
      return formatCurrency(value);
    }
    if (format === 'number') {
      return value.toLocaleString('es-ES');
    }
    return value;
  };

  const getCardClassName = () => {
    let className = 'data-card';
    if (type !== 'default') {
      className += ` data-card-${type}`;
    }
    return className;
  };

  const renderChange = () => {
    if (!change) return null;
    
    const changeIcon = changeType === 'positive' ? 'fa-arrow-up' : 
                     changeType === 'negative' ? 'fa-arrow-down' : 
                     'fa-minus';

    return (
      <div className={`data-card-change ${changeType}`}>
        <i className={`fas ${changeIcon} data-card-change-icon`}></i>
        <span>{change}</span>
      </div>
    );
  };

  return (
    <div className={getCardClassName()}>
      <div className="data-card-header">
        <h3 className="data-card-title">{title}</h3>
        {icon && <i className={`fas fa-${icon} data-card-icon`}></i>}
      </div>
      <p className="data-card-value">{renderValue()}</p>
      {renderChange()}
    </div>
  );
};

export default DataCard;
