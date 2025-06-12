// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';

// Componentes temporales para las otras páginas
const Products = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💎</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
        <p className="text-gray-600">Gestión completa del catálogo de productos de joyería</p>
      </div>
    </div>
  </div>
);

const Inventory = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Control de Inventario</h1>
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
        <p className="text-gray-600">Control de stock y movimientos de inventario</p>
      </div>
    </div>
  </div>
);

const Reports = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
        <p className="text-gray-600">Reportes detallados y análisis de negocio</p>
      </div>
    </div>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
        <p className="text-gray-600">Configuración general del sistema</p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
