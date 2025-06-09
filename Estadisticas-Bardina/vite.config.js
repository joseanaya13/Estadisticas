import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['lodash-es', 'date-fns', 'clsx'],
          export: ['file-saver', 'xlsx'],
          state: ['zustand']
        }
      }
    },
    target: 'es2020',
    sourcemap: true
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'recharts',
      'zustand',
      'date-fns',
      'clsx',
      'file-saver',
      'xlsx'
    ]
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
});
