// src/components/layout/Layout.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity ${
            sidebarOpen ? 'opacity-75' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          mobile={true}
        />
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar isOpen={true} onClose={() => {}} mobile={false} />
      </div>

      {/* Contenido principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}