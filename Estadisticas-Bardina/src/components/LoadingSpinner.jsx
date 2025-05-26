// components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ text = 'Cargando...', progress = null }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>{text}</p>
      {progress && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
