# 🏗️ ESTRUCTURA COMPLETA - APLICACIÓN BARDINA

## 📁 ESTRUCTURA DE DIRECTORIOS

```
Estadisticas-Bardina/
├── 📁 public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── 📁 src/
│   ├── 📁 components/           # Componentes reutilizables
│   │   ├── 📁 common/          # Componentes base
│   │   │   ├── ChartContainer.jsx
│   │   │   ├── DataCard.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ExportButton.jsx
│   │   │   ├── DateRangePicker.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 ventas/          # Componentes específicos de ventas
│   │   │   ├── VentasResumen.jsx
│   │   │   ├── VentasGraficos.jsx
│   │   │   ├── VentasTablaVendedores.jsx
│   │   │   ├── EstadoFiltros.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 ventasDetalladas/  # 🆕 Nuevos componentes
│   │   │   ├── VentasDetalladas.jsx
│   │   │   ├── VentasPorProveedor.jsx
│   │   │   ├── VentasPorMarca.jsx
│   │   │   ├── VentasPorTemporada.jsx
│   │   │   ├── AnalisisPareto.jsx
│   │   │   ├── GraficoSunburst.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 compras/         # Componentes de compras
│   │   │   ├── ComprasResumen.jsx
│   │   │   ├── ComprasGraficos.jsx
│   │   │   ├── ComprasPorProveedor.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 sellout/         # 🆕 Componentes de Sell Out
│   │   │   ├── SellOutDashboard.jsx
│   │   │   ├── RatiosVC.jsx
│   │   │   ├── SellOutPorProveedor.jsx
│   │   │   ├── SellOutPorMarca.jsx
│   │   │   ├── RotacionStock.jsx
│   │   │   ├── SugerenciasRecompra.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 inventario/      # 🆕 Componentes de inventario
│   │   │   ├── InventarioDashboard.jsx
│   │   │   ├── ValoracionInventario.jsx
│   │   │   ├── StockPorMarca.jsx
│   │   │   ├── StockPorProveedor.jsx
│   │   │   ├── StockPorDivision.jsx
│   │   │   ├── AnalisisAntiguedad.jsx
│   │   │   ├── AlertasStock.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 dashboard/       # Componentes del dashboard
│   │   │   ├── DashboardKPIs.jsx
│   │   │   ├── AlertasNegocio.jsx
│   │   │   ├── TendenciasGenerales.jsx
│   │   │   └── index.js
│   │   │
│   │   └── index.js            # Exportaciones centralizadas
│   │
│   ├── 📁 pages/               # Páginas principales
│   │   ├── Dashboard.jsx       # ✅ Implementado
│   │   ├── EstadisticasVentas.jsx # ✅ Implementado
│   │   ├── EstadisticasCompras.jsx # ✅ Implementado
│   │   ├── VentasDetalladas.jsx    # 🆕 Por implementar
│   │   ├── SellOut.jsx            # 🆕 Por implementar
│   │   ├── Inventario.jsx         # 🆕 Por implementar
│   │   └── index.js
│   │
│   ├── 📁 services/            # Servicios API
│   │   ├── 📁 api/            # APIs base
│   │   │   ├── apiClient.js    # ✅ Cliente HTTP base
│   │   │   ├── apiUtils.js     # ✅ Utilidades API
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 core/           # Servicios principales
│   │   │   ├── ventasService.js     # ✅ Implementado
│   │   │   ├── comprasService.js    # ✅ Implementado
│   │   │   ├── dashboardService.js  # ✅ Implementado
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 maestros/       # Servicios de datos maestros
│   │   │   ├── contactosService.js    # ✅ Implementado
│   │   │   ├── usuariosService.js     # ✅ Implementado
│   │   │   ├── empresasService.js     # ✅ Implementado
│   │   │   ├── formasPagoService.js   # ✅ Implementado
│   │   │   ├── articulosService.js    # 🆕 Por implementar
│   │   │   ├── proveedoresService.js  # 🆕 Por implementar
│   │   │   ├── marcasService.js       # 🆕 Por implementar
│   │   │   ├── temporadasService.js   # 🆕 Por implementar
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 transaccionales/ # Servicios de datos transaccionales
│   │   │   ├── lineasVentasService.js    # 🆕 Por implementar
│   │   │   ├── lineasComprasService.js   # 🆕 Por implementar
│   │   │   ├── movimientosService.js     # 🆕 Por implementar
│   │   │   ├── stockService.js           # 🆕 Por implementar
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 analytics/      # Servicios de análisis
│   │   │   ├── selloutService.js         # 🆕 Por implementar
│   │   │   ├── inventarioService.js      # 🆕 Por implementar
│   │   │   ├── rotacionService.js        # 🆕 Por implementar
│   │   │   ├── rentabilidadService.js    # 🆕 Por implementar
│   │   │   └── index.js
│   │   │
│   │   └── index.js           # Exportación principal de servicios
│   │
│   ├── 📁 utils/              # Utilidades generales
│   │   ├── formatters.js      # ✅ Formateadores
│   │   ├── usuariosUtils.js   # ✅ Utilidades usuarios
│   │   ├── dateUtils.js       # 🆕 Utilidades de fechas
│   │   ├── mathUtils.js       # 🆕 Utilidades matemáticas
│   │   ├── exportUtils.js     # 🆕 Utilidades de exportación
│   │   ├── filterUtils.js     # 🆕 Utilidades de filtros
│   │   ├── constants.js       # 🆕 Constantes de aplicación
│   │   └── index.js
│   │
│   ├── 📁 hooks/              # 🆕 Custom hooks
│   │   ├── useApi.js          # Hook para llamadas API
│   │   ├── useFilters.js      # Hook para manejo de filtros
│   │   ├── useExport.js       # Hook para exportaciones
│   │   ├── useDebounce.js     # Hook para debounce
│   │   ├── useLocalStorage.js # Hook para localStorage (NO en Claude)
│   │   └── index.js
│   │
│   ├── 📁 context/            # 🆕 Context API
│   │   ├── AppContext.js      # Context principal
│   │   ├── FiltersContext.js  # Context de filtros
│   │   ├── DataContext.js     # Context de datos
│   │   └── index.js
│   │
│   ├── 📁 styles/             # Estilos
│   │   ├── styles.css         # ✅ Estilos principales
│   │   ├── components.css     # 🆕 Estilos de componentes
│   │   ├── pages.css          # 🆕 Estilos de páginas
│   │   ├── themes.css         # 🆕 Temas y variables CSS
│   │   └── responsive.css     # 🆕 Estilos responsivos
│   │
│   ├── 📁 config/             # 🆕 Configuración
│   │   ├── api.config.js      # Configuración API
│   │   ├── app.config.js      # Configuración aplicación
│   │   ├── charts.config.js   # Configuración gráficos
│   │   └── index.js
│   │
│   ├── App.jsx                # ✅ Componente principal
│   ├── main.jsx               # ✅ Punto de entrada
│   └── index.css              # ✅ Estilos base
│
├── 📁 docs/                   # 🆕 Documentación
│   ├── API.md                 # Documentación de APIs
│   ├── COMPONENTS.md          # Documentación de componentes
│   ├── DEPLOYMENT.md          # Guía de despliegue
│   └── CHANGELOG.md           # Historial de cambios
│
├── package.json               # ✅ Dependencias
├── vite.config.js            # ✅ Configuración Vite
├── .eslintrc.js              # 🆕 Configuración ESLint
├── .gitignore                # Git ignore
└── README.md                 # Documentación principal
```

---

## 📋 DESCRIPCIÓN DETALLADA DE MÓDULOS

### 🧩 **COMPONENTES**

#### **📁 common/** - Componentes Reutilizables
```javascript
// ChartContainer.jsx - ✅ Contenedor de gráficos
// DataCard.jsx - ✅ Tarjetas de métricas
// ErrorMessage.jsx - ✅ Mensajes de error
// FilterBar.jsx - ✅ Barra de filtros
// LoadingSpinner.jsx - ✅ Indicador de carga
// ExportButton.jsx - 🆕 Botón de exportación
// DateRangePicker.jsx - 🆕 Selector de fechas
// SearchInput.jsx - 🆕 Campo de búsqueda
```

#### **📁 ventas/** - Componentes de Ventas ✅
```javascript
// VentasResumen.jsx - Resumen de ventas
// VentasGraficos.jsx - Gráficos de ventas
// VentasTablaVendedores.jsx - Tabla de vendedores
// EstadoFiltros.jsx - Estado de filtros aplicados
```

#### **📁 ventasDetalladas/** - Análisis Detallado 🆕
```javascript
// VentasDetalladas.jsx - Página principal
// VentasPorProveedor.jsx - Análisis por proveedor
// VentasPorMarca.jsx - Análisis por marca
// VentasPorTemporada.jsx - Análisis por temporada
// AnalisisPareto.jsx - Gráfico 80/20
// GraficoSunburst.jsx - Gráfico multinivel
```

#### **📁 sellout/** - Análisis de Rendimiento 🆕
```javascript
// SellOutDashboard.jsx - Dashboard principal
// RatiosVC.jsx - Ratios Venta/Compra
// SellOutPorProveedor.jsx - Rendimiento por proveedor
// SellOutPorMarca.jsx - Rendimiento por marca
// RotacionStock.jsx - Análisis de rotación
// SugerenciasRecompra.jsx - Recomendaciones
```

#### **📁 inventario/** - Gestión de Stock 🆕
```javascript
// InventarioDashboard.jsx - Dashboard de inventario
// ValoracionInventario.jsx - Valoración de stock
// StockPorMarca.jsx - Stock por marca
// StockPorProveedor.jsx - Stock por proveedor
// StockPorDivision.jsx - Stock por división
// AnalisisAntiguedad.jsx - Antigüedad de stock
// AlertasStock.jsx - Alertas automáticas
```

### 🔧 **SERVICIOS**

#### **📁 core/** - Servicios Principales
```javascript
// ventasService.js - ✅ Gestión de facturas
// comprasService.js - ✅ Gestión de albaranes
// dashboardService.js - ✅ Agregación de datos
```

#### **📁 maestros/** - Datos Maestros
```javascript
// ✅ Implementados:
// contactosService.js - Clientes
// usuariosService.js - Vendedores
// empresasService.js - Tiendas
// formasPagoService.js - Métodos de pago

// 🆕 Por implementar:
// articulosService.js - Productos
// proveedoresService.js - Proveedores
// marcasService.js - Marcas
// temporadasService.js - Temporadas
```

#### **📁 transaccionales/** - Datos Transaccionales 🆕
```javascript
// lineasVentasService.js - Líneas de facturas
// lineasComprasService.js - Líneas de albaranes
// movimientosService.js - Movimientos de almacén
// stockService.js - Existencias actuales
```

#### **📁 analytics/** - Servicios de Análisis 🆕
```javascript
// selloutService.js - Cálculos de sell-out
// inventarioService.js - Análisis de inventario
// rotacionService.js - Rotación de productos
// rentabilidadService.js - Análisis de rentabilidad
```

### 🛠️ **UTILIDADES**

#### **📁 utils/** - Funciones de Apoyo
```javascript
// formatters.js - ✅ Formateo de datos
// usuariosUtils.js - ✅ Gestión de usuarios
// dateUtils.js - 🆕 Manejo de fechas
// mathUtils.js - 🆕 Cálculos matemáticos
// exportUtils.js - 🆕 Exportación de datos
// filterUtils.js - 🆕 Filtrado avanzado
// constants.js - 🆕 Constantes globales
```

#### **📁 hooks/** - Custom Hooks 🆕
```javascript
// useApi.js - Gestión de llamadas API
// useFilters.js - Manejo de filtros
// useExport.js - Exportación de datos
// useDebounce.js - Optimización de búsquedas
```

### 📄 **PÁGINAS**

#### **Páginas Actuales** ✅
```javascript
// Dashboard.jsx - Panel principal
// EstadisticasVentas.jsx - Análisis de ventas
// EstadisticasCompras.jsx - Análisis de compras
```

#### **Páginas Nuevas** 🆕
```javascript
// VentasDetalladas.jsx - Análisis por proveedor/marca
// SellOut.jsx - Análisis de rendimiento
// Inventario.jsx - Gestión de stock
```

---

## 🔄 **FLUJO DE DATOS**

### **Arquitectura de Datos:**
```
📊 API Velneo
    ↓
🔧 Services Layer
    ↓
🎯 Context/State Management
    ↓
📱 Components
    ↓
👤 User Interface
```

### **Patrón de Servicios:**
```javascript
// Ejemplo de estructura de servicio
export class NuevoService {
  constructor() {
    this.endpoint = '/nuevo_endpoint';
    this.dataKey = 'nuevo_data';
    this._cache = new Map();
    this._cacheExpiry = 10 * 60 * 1000;
  }
  
  async getData(params = {}, useCache = true) {
    // Implementación con caché
  }
  
  async processData(rawData) {
    // Procesamiento específico
  }
  
  clearCache() {
    // Limpieza de caché
  }
}
```

---

## 🚀 **PLAN DE IMPLEMENTACIÓN DETALLADO**

### **FASE 1: INFRAESTRUCTURA (Semanas 1-2)**

#### **Semana 1:**
1. **Estructura de directorios completa**
2. **Servicios base para nuevas APIs:**
   - `articulosService.js`
   - `proveedoresService.js`  
   - `marcasService.js`
   - `lineasVentasService.js`

#### **Semana 2:**
3. **Hooks personalizados:**
   - `useApi.js`
   - `useFilters.js`
   - `useExport.js`
4. **Utilidades adicionales:**
   - `dateUtils.js`
   - `mathUtils.js`
   - `exportUtils.js`

### **FASE 2: VENTAS DETALLADAS (Semanas 3-4)**

#### **Semana 3:**
1. **Página VentasDetalladas.jsx**
2. **Componente VentasPorProveedor.jsx**
3. **Servicio lineasVentasService.js completo**

#### **Semana 4:**
4. **Componente VentasPorMarca.jsx**
5. **Componente VentasPorTemporada.jsx**
6. **Gráficos especializados (Sunburst, Pareto)**

### **FASE 3: INVENTARIO (Semanas 5-6)**

#### **Semana 5:**
1. **Página Inventario.jsx**
2. **Servicio stockService.js**
3. **Componente ValoracionInventario.jsx**

#### **Semana 6:**
4. **Componente StockPorMarca.jsx**
5. **Componente AnalisisAntiguedad.jsx**
6. **Sistema de alertas AlertasStock.jsx**

### **FASE 4: SELL OUT (Semanas 7-8)**

#### **Semana 7:**
1. **Página SellOut.jsx**
2. **Servicio selloutService.js**
3. **Componente RatiosVC.jsx**

#### **Semana 8:**
4. **Componente SellOutPorProveedor.jsx**
5. **Componente RotacionStock.jsx**
6. **Sistema SugerenciasRecompra.jsx**

---

## 📱 **NAVEGACIÓN COMPLETA**

### **App.jsx - Estructura Principal:**
```javascript
const navigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'tachometer-alt',
    component: Dashboard,
    badge: null
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: 'shopping-cart',
    component: EstadisticasVentas,
    badge: null
  },
  {
    id: 'ventas-detalladas', // 🆕
    label: 'Ventas Detalladas',
    icon: 'chart-line',
    component: VentasDetalladas,
    badge: 'NUEVO'
  },
  {
    id: 'compras',
    label: 'Compras',
    icon: 'truck',
    component: EstadisticasCompras,
    badge: null
  },
  {
    id: 'sellout', // 🆕
    label: 'Sell Out',
    icon: 'chart-area',
    component: SellOut,
    badge: 'NUEVO'
  },
  {
    id: 'inventario', // 🆕
    label: 'Inventario',
    icon: 'boxes',
    component: Inventario,
    badge: 'NUEVO'
  }
];
```

---

## 🔧 **CONFIGURACIÓN Y DEPENDENCIAS**

### **package.json - Dependencias Adicionales:**
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "recharts": "^2.10.0",
    "date-fns": "^2.29.0",
    "lodash": "^4.17.21",
    "file-saver": "^2.0.5",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "eslint": "^9.25.0",
    "eslint-plugin-react": "^7.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "vite": "^6.3.5"
  }
}
```

### **vite.config.js - Configuración Ampliada:**
```javascript
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
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@context': '/src/context',
      '@config': '/src/config',
      '@pages': '/src/pages'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['lodash', 'date-fns'],
          export: ['file-saver', 'xlsx']
        }
      }
    }
  }
});
```

---

## 🎯 **CONSIDERACIONES DE IMPLEMENTACIÓN**

### **🔒 Seguridad:**
- Validación de datos en servicios
- Sanitización de inputs de usuario
- Manejo seguro de tokens API

### **⚡ Performance:**
- Lazy loading de componentes
- Caché inteligente en servicios
- Optimización de re-renders
- Paginación automática

### **📱 Responsive:**
- Diseño mobile-first
- Breakpoints consistentes
- Navegación adaptativa
- Gráficos responsivos

### **🔄 Mantenibilidad:**
- Código modular y reutilizable
- Documentación inline
- Testing unitario
- Logging estructurado

---

## 🎖️ **RESULTADO ESPERADO**

Al completar esta estructura, la aplicación Bardina tendrá:

✅ **6 módulos principales** completamente funcionales
✅ **15+ componentes especializados** para análisis
✅ **12+ servicios API** para gestión de datos
✅ **Sistema de filtros avanzado** en todas las vistas
✅ **Exportación de datos** en múltiples formatos
✅ **Dashboards interactivos** con drill-down
✅ **Alertas automáticas** basadas en KPIs
✅ **Análisis predictivo** para recompras

**La aplicación se convertirá en una herramienta de inteligencia comercial completa para la toma de decisiones estratégicas.**