// components/ChartContainer.jsx
import React from 'react';

const ChartContainer = ({ title, children, height = 300 }) => {
  return (
    <div className="chart-box">
      <h3>{title}</h3>
      <div style={{ height: `${height}px`, width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
