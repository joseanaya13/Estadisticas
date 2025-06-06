// src/components/index.js - BARREL EXPORT PRINCIPAL
// Componentes comunes
export * from './common';

// Páginas principales (mantener compatibilidad)
export { default as Dashboard } from '../pages/Dashboard';
export { default as EstadisticasVentas } from '../pages/EstadisticasVentas';
export { default as EstadisticasCompras } from '../pages/EstadisticasCompras';

// Componentes específicos por módulo
export * from './ventas';
export * from './dashboard';

// 🆕 Nuevos módulos (descomentar cuando estén listos)
// export * from './compras';
// export * from './sellout';
// export * from './inventario';