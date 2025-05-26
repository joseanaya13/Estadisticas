// components/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ error, retry = null }) => {
  return (
    <div className="error-message">
      <i className="fas fa-exclamation-triangle"></i>
      <h3>Error</h3>
      <p>{error}</p>
      {retry && (
        <button className="retry-button" onClick={retry}>
          <i className="fas fa-sync"></i> Intentar de nuevo
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

