// src/App.jsx
import { useState } from 'react';
import Layout from './components/layout/Layout';
import Breadcrumbs from './components/layout/Breadcrumbs';

// Componentes temporales para las páginas (hasta que se creen)
function Dashboard() {
  const breadcrumbPages = [];

  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="space-y-6">
        {/* Header con métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">€2,450</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500 ml-1">vs ayer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-blue-600 font-medium">+8%</span>
              <span className="text-gray-500 ml-1">vs ayer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Oro</p>
                <p className="text-2xl font-bold text-gold-600">15.2 kg</p>
              </div>
              <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6,2L10,8L14,2M4,9L8,9L12,20L16,9L20,9M6.5,3L10.91,3L8.71,7M13.09,3L17.5,3L15.29,7" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-yellow-600 font-medium">-2.1 kg</span>
              <span className="text-gray-500 ml-1">esta semana</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beneficio</p>
                <p className="text-2xl font-bold text-gray-900">€892</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-purple-600 font-medium">36.4%</span>
              <span className="text-gray-500 ml-1">margen</span>
            </div>
          </div>
        </div>

        {/* Gráficos y tablas placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas por Día</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de ventas por implementar</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Más Vendidos</h3>
            <div className="space-y-3">
              {[
                { name: 'Anillo Oro 18k', sales: '€450', qty: '3' },
                { name: 'Collar Plata 925', sales: '€320', qty: '5' },
                { name: 'Pendientes Diamante', sales: '€680', qty: '2' },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.qty} unidades</p>
                  </div>
                  <p className="font-bold text-gray-900">{product.sales}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { type: 'sale', desc: 'Venta - Anillo Oro 18k', time: '10:30 AM', amount: '€450' },
              { type: 'inventory', desc: 'Stock actualizado - Collares Plata', time: '9:15 AM', amount: '' },
              { type: 'sale', desc: 'Venta - Pendientes Diamante', time: '8:45 AM', amount: '€680' },
            ].map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'sale' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{activity.desc}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  {activity.amount && (
                    <p className="font-bold text-green-600">{activity.amount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sales() {
  const breadcrumbPages = [{ name: 'Ventas', href: '/sales' }];
  
  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Módulo de Ventas</h2>
        <p className="text-gray-600">Aquí irá el sistema completo de gestión de ventas...</p>
      </div>
    </div>
  );
}

function Products() {
  const breadcrumbPages = [{ name: 'Productos', href: '/products' }];
  
  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Productos</h2>
        <p className="text-gray-600">Aquí irá el catálogo completo de productos de joyería...</p>
      </div>
    </div>
  );
}

function Inventory() {
  const breadcrumbPages = [{ name: 'Inventario', href: '/inventory' }];
  
  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Control de Inventario</h2>
        <p className="text-gray-600">Aquí irá el sistema de control de stock...</p>
      </div>
    </div>
  );
}

function Reports() {
  const breadcrumbPages = [{ name: 'Reportes', href: '/reports' }];
  
  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reportes y Análisis</h2>
        <p className="text-gray-600">Aquí irán los reportes detallados y análisis...</p>
      </div>
    </div>
  );
}

function Settings() {
  const breadcrumbPages = [{ name: 'Configuración', href: '/settings' }];
  
  return (
    <div>
      <Breadcrumbs pages={breadcrumbPages} />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Sistema</h2>
        <p className="text-gray-600">Aquí irán todas las opciones de configuración...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('/');

  // Simulador simple de routing (después se puede reemplazar con React Router)
  const renderPage = () => {
    switch (currentPage) {
      case '/sales': return <Sales />;
      case '/products': return <Products />;
      case '/inventory': return <Inventory />;
      case '/reports': return <Reports />;
      case '/settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}
