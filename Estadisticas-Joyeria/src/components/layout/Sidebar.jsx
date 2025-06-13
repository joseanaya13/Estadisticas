// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';

// Iconos SVG para el menú
const DashboardIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const SalesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H4.5m-1.5 0h15.25M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const ProductsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);

const ReportsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const InventoryIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const SettingsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Icono de diamante personalizado para joyería
const DiamondIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6,2L10,8L14,2M4,9L8,9L12,20L16,9L20,9M6.5,3L10.91,3L8.71,7M13.09,3L17.5,3L15.29,7" />
  </svg>
);

const menuItems = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { name: 'Ventas', href: '/sales', icon: SalesIcon },
];



export default function Sidebar({ isOpen, onClose, mobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href) => {
    navigate(href);
    if (mobile) {
      onClose();
    }
  };

  return (
    <div
      className={`
        ${mobile ? 'relative' : ''} 
        ${mobile && !isOpen ? 'translate-x-[-100%]' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
        flex flex-col w-64 bg-gradient-to-b from-gold-800 to-gold-900 shadow-xl
        ${mobile ? 'absolute inset-y-0 left-0 z-50' : 'h-screen'}
      `}
    >
      {/* Header del sidebar */}
      <div className="flex items-center justify-between h-16 px-4 bg-gold-900">
        <div className="flex items-center space-x-3">
          <DiamondIcon className="h-8 w-8 text-gold-200" />
          <h1 className="text-xl font-bold text-gold-100">Joyería Elite</h1>
        </div>
        {mobile && (
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-gold-200 hover:text-white hover:bg-gold-800 transition-colors"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gold-700 text-white shadow-md' 
                  : 'text-gold-200 hover:bg-gold-700 hover:text-white'
                }
              `}
            >
              <item.icon 
                className={`
                  mr-3 h-5 w-5 transition-colors
                  ${isActive ? 'text-gold-200' : 'text-gold-300 group-hover:text-gold-200'}
                `} 
              />
              {item.name}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-gold-300 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gold-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gold-800/50">
          <div className="w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gold-100">JU</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gold-100 truncate">
              Joyería Usuario
            </p>
            <p className="text-xs text-gold-300 truncate">
              admin@joyeria.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}