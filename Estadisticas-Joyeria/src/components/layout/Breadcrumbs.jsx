// src/components/layout/Breadcrumbs.jsx
import { useNavigate, useLocation } from 'react-router-dom';

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

export default function Breadcrumbs({ pages = [] }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href) => {
    navigate(href);
  };

  // Generar páginas automáticamente basándose en la ruta actual si no se proporcionan
  const generatePages = () => {
    const pathParts = location.pathname.split('/').filter(part => part);
    const generatedPages = [];
    
    const pageNames = {
      'sales': 'Ventas',
      'products': 'Productos',
      'inventory': 'Inventario',
      'reports': 'Reportes',
      'settings': 'Configuración'
    };

    pathParts.forEach((part, index) => {
      const href = '/' + pathParts.slice(0, index + 1).join('/');
      generatedPages.push({
        name: pageNames[part] || part.charAt(0).toUpperCase() + part.slice(1),
        href: href
      });
    });

    return generatedPages;
  };

  const displayPages = pages.length > 0 ? pages : generatePages();

  // Si estamos en el dashboard, no mostrar breadcrumbs
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {/* Home */}
        <li>
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="ml-2 text-sm font-medium">Dashboard</span>
          </button>
        </li>

        {/* Páginas intermedias */}
        {displayPages.map((page, index) => (
          <li key={page.href} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            {index === displayPages.length - 1 ? (
              // Página actual (no clickeable)
              <span className="text-sm font-medium text-gray-900" aria-current="page">
                {page.name}
              </span>
            ) : (
              // Páginas intermedias (clickeables)
              <button
                onClick={() => handleNavigation(page.href)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {page.name}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}