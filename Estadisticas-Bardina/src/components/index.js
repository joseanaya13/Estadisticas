// components/index.js - Archivo índice para exportar todos los componentes
export { default as Dashboard } from './Dashboard';
export { default as EstadisticasVentas } from '../pages/EstadisticasVentas';
export { default as EstadisticasCompras } from '../pages/EstadisticasCompras';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorMessage } from './ErrorMessage';
export { default as DataCard } from './DataCard';
export { default as ChartContainer } from './ChartContainer';
export { default as FilterBar } from './FilterBar';

// Exportar componentes de ventas específicos
export { default as VentasResumen } from './ventas/VentasResumen';
export { default as VentasGraficos } from './ventas/VentasGraficos';
export { default as VentasTablaVendedores } from './ventas/VentasTablaVendedores';