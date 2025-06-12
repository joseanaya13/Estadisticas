# Dashboard de Joyería - Guía de Desarrollo

## 📋 Descripción del Proyecto
Dashboard de análisis de ventas para joyería conectado a la API de Velneo, con tablas dinámicas y análisis en tiempo real.

## 🚀 Configuración del Proyecto

### Instalación de Dependencias
```bash
# Dependencias principales
npm install

# Librerías adicionales necesarias
npm install @tanstack/react-query axios recharts lucide-react date-fns
npm install @headlessui/react @heroicons/react
npm install react-router-dom clsx
npm install @tanstack/react-table

# Dependencias de desarrollo
npm install -D @types/node
```

### Configuración de Tailwind CSS 5
```bash
# Ya debería estar instalado, pero por si acaso:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Actualizar `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        silver: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      }
    },
  },
  plugins: [],
}
```

### Scripts de Ejecución
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## 🗄️ Estructura de la Base de Datos Velneo

### Tablas Principales

#### 1. `fac_t` - Cabeceras de Facturas
```typescript
interface FacturaHeader {
  id: number;
  fch: string;        // Fecha ISO
  hor: string;        // Hora 
  num_fac: string;    // Número de factura
  fpg: number;        // ID forma de pago
  emp_div: string;    // División
  alt_usr: number;    // ID usuario/vendedor
  fin: boolean;       // Finalizada
  tot: number;        // Total
  bas_tot: number;    // Base total
  iva_tot: number;    // IVA total
}
```

#### 2. `fac_lin_t` - Líneas de Facturas
```typescript
interface FacturaLinea {
  id: number;
  fac: number;        // FK a fac_t.id
  art: number;        // ID artículo
  name: string;       // Nombre artículo
  can: number;        // Cantidad
  pre_pvp: number;    // Precio venta
  imp_pvp: number;    // Importe total
  cos: number;        // Coste
  ben: number;        // Beneficio
  fam: string;        // Código familia
  tll: number;        // Talla
  col: number;        // Color
  prv: number;        // ID proveedor
}
```

#### 3. `art_m` - Maestro de Artículos
```typescript
interface Articulo {
  id: number;
  name: string;       // Nombre
  ref: string;        // Referencia
  fam: string;        // Código familia
  prv: number;        // ID proveedor
  peso: number;       // Peso en gramos
  cos: number;        // Coste
  exs: number;        // Stock actual
  pvp: number;        // Precio venta público
}
```

### Tablas de Referencia

#### 4. `fpg_m` - Formas de Pago
```typescript
interface FormaPago {
  id: number;
  name: string;       // "CONTADO", "TARJETA", etc.
}
```

#### 5. `usr_m` - Usuarios/Vendedores
```typescript
interface Usuario {
  id: number;
  name: string;       // "TPV_LaPongueta", "TPV_Luis"
}
```

#### 6. `fam_m` - Familias de Productos
```typescript
interface Familia {
  id: string;         // "001002", "001003"
  name: string;       // "ORO", "PLATA", "PILAS", "CORREAS"
}
```

#### 7. `ent_m` - Entidades (Proveedores)
```typescript
interface Entidad {
  id: number;
  name: string;       // Nombre proveedor
  es_prv: boolean;    // Es proveedor
}
```

## 🏗️ Estructura del Proyecto React

```
src/
├── components/
│   ├── ui/              # Componentes UI base
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Table.jsx
│   │   ├── Modal.jsx
│   │   └── Loading.jsx
│   ├── charts/          # Componentes de gráficos
│   │   ├── SalesChart.jsx
│   │   ├── FamilyChart.jsx
│   │   └── VendorChart.jsx
│   ├── filters/         # Filtros y controles
│   │   ├── DateFilter.jsx
│   │   ├── VendorFilter.jsx
│   │   └── FamilyFilter.jsx
│   └── tables/          # Tablas dinámicas
│       ├── SalesTable.jsx
│       ├── ProductTable.jsx
│       └── PivotTable.jsx
├── hooks/               # Custom hooks
│   ├── useVelneoAPI.js
│   ├── useSalesData.js
│   └── useFilters.js
├── services/            # Servicios API
│   ├── velneoAPI.js
│   └── dataTransform.js
├── utils/               # Utilidades
│   ├── formatters.js
│   ├── constants.js
│   └── helpers.js
├── pages/               # Páginas principales
│   ├── Dashboard.jsx
│   ├── Sales.jsx
│   ├── Products.jsx
│   └── Reports.jsx
├── types/               # Tipos TypeScript
│   └── velneo.types.ts
└── App.jsx
```

## 🔌 Configuración de la API

### Variables de Entorno (.env)
```env
VITE_VELNEO_API_URL=http://localhost:8080/api
VITE_VELNEO_API_KEY=tu_api_key_aqui
```

### Servicio API Base
```javascript
// src/services/velneoAPI.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_VELNEO_API_URL,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_VELNEO_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const velneoAPI = {
  // Facturas
  getFacturas: (params) => api.get('/fac_t', { params }),
  getLineasFactura: (params) => api.get('/fac_lin_t', { params }),
  
  // Maestros
  getArticulos: (params) => api.get('/art_m', { params }),
  getFormasPago: () => api.get('/fpg_m'),
  getUsuarios: () => api.get('/usr_m'),
  getFamilias: () => api.get('/fam_m'),
  getProveedores: () => api.get('/ent_m?es_prv=true'),
  
  // Consultas combinadas
  getVentasCompletas: async (filtros) => {
    const [facturas, lineas, articulos, formasPago, usuarios, familias] = 
      await Promise.all([
        api.get('/fac_t', { params: { fin: true, ...filtros } }),
        api.get('/fac_lin_t'),
        api.get('/art_m'),
        api.get('/fpg_m'),
        api.get('/usr_m'),
        api.get('/fam_m')
      ]);
    
    return {
      facturas: facturas.data.fac_t,
      lineas: lineas.data.fac_lin_t,
      articulos: articulos.data.art_m,
      formasPago: formasPago.data.fpg_m,
      usuarios: usuarios.data.usr_m,
      familias: familias.data.fam_m
    };
  }
};
```

## 📊 Estructura de Datos Combinada

### Vista Principal para Tablas Dinámicas
```typescript
interface VentaCompleta {
  // Datos de factura
  facturaId: number;
  fecha: Date;
  hora: string;
  numeroFactura: string;
  division: string;
  total: number;
  
  // Forma de pago
  formaPagoId: number;
  formaPago: string;     // "CONTADO", "TARJETA"
  
  // Vendedor
  vendedorId: number;
  vendedor: string;      // "TPV_LaPongueta", "TPV_Luis"
  
  // Línea de factura
  lineaId: number;
  cantidad: number;
  precioVenta: number;
  importeTotal: number;
  coste: number;
  beneficio: number;
  talla: number;
  color: number;
  
  // Artículo
  articuloId: number;
  nombreArticulo: string;
  referenciaArticulo: string;
  pesoGramos: number;
  stockActual: number;
  
  // Familia y proveedor
  familiaId: string;
  familia: string;       // "ORO", "PLATA", "PILAS", "CORREAS"
  proveedorId: number;
  proveedor: string;
}
```

## 🎨 Componentes UI Base

### Paleta de Colores
```css
/* Para familias de productos */
.familia-oro { @apply bg-gold-100 text-gold-800 border-gold-200; }
.familia-plata { @apply bg-silver-100 text-silver-800 border-silver-200; }
.familia-pilas { @apply bg-blue-100 text-blue-800 border-blue-200; }
.familia-correas { @apply bg-amber-100 text-amber-800 border-amber-200; }

/* Estados de beneficio */
.beneficio-positivo { @apply text-green-600 bg-green-50; }
.beneficio-negativo { @apply text-red-600 bg-red-50; }
.beneficio-neutro { @apply text-gray-600 bg-gray-50; }
```

## 🚀 Comandos de Ejecución

```bash
# Desarrollo
npm run dev

# Construcción para producción  
npm run build

# Vista previa de producción
npm run preview

# Linting
npm run lint
```

## 📈 Funcionalidades Principales

### Dashboard Principal
- Resumen de ventas del día/mes
- Gráficos por familia de productos
- Top vendedores
- Análisis de beneficio

### Tablas Dinámicas
- Ventas por período
- Productos más vendidos
- Análisis por vendedor
- Control de stock
- Peso total por familia

### Filtros Disponibles
- Rango de fechas
- Vendedor
- Familia de producto
- Forma de pago
- Proveedor

### Métricas Clave
- Ventas totales
- Beneficio neto
- Margen de beneficio
- Peso total vendido
- Número de transacciones
- Ticket medio

## 🔧 Configuración Adicional

### React Query para Cache
```javascript
// src/main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});
```

Esta estructura te permitirá crear un dashboard completo y profesional para el análisis de ventas de la joyería.
