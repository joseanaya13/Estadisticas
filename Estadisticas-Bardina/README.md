# Aplicación de Estadísticas de Compra y Venta

Una aplicación web moderna desarrollada con React 19 para visualizar estadísticas de compras y ventas conectada a una API REST.

## Características

- **Dashboard interactivo** con resumen de ventas, compras y balance
- **Estadísticas detalladas de ventas** con filtros y gráficos
- **Estadísticas detalladas de compras** con filtros y gráficos
- **Visualizaciones** con gráficos de barras, líneas y circulares
- **Tablas de datos** con paginación
- **Filtros avanzados** para analizar información específica
- **Diseño responsivo** para móviles y escritorio

## Tecnologías utilizadas

- **React 19** - La última versión del framework
- **Recharts** - Para visualizaciones de datos
- **Vite** - Para desarrollo rápido y construcción optimizada
- **Fetch API** - Para comunicación con el backend
- **CSS moderno** - Con variables CSS para temas y diseño responsivo
- **Font Awesome** - Para iconos

## Requisitos

- Node.js 18.0 o superior
- NPM 8.0 o superior

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/estadisticas-compra-venta.git
cd estadisticas-compra-venta
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
VITE_API_URL=https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat
VITE_API_KEY=XWjaumCm
```

## Ejecución

### Desarrollo

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo en `http://localhost:3000`.

### Producción

```bash
npm run build
```

Esto generará los archivos optimizados para producción en la carpeta `dist`.

Para servir los archivos de producción:

```bash
npm run serve
```

## Estructura del proyecto

```
/
├── public/                  # Archivos estáticos
├── src/
│   ├── components/          # Componentes React
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   ├── EstadisticasVentas.jsx  # Página de ventas
│   │   ├── EstadisticasCompras.jsx # Página de compras
│   │   ├── LoadingSpinner.jsx      # Componente de carga
│   │   ├── ErrorMessage.jsx        # Componente de error
│   │   ├── DataCard.jsx            # Tarjeta de datos
│   │   ├── ChartContainer.jsx      # Contenedor de gráficos
│   │   ├── DataTable.jsx           # Tabla de datos
│   │   ├── FilterBar.jsx           # Barra de filtros
│   │   └── index.js                # Exportación de componentes
│   ├── services/            # Servicios para comunicación con API
│   │   └── api.js           # Cliente API
│   ├── utils/               # Utilidades
│   │   └── formatters.js    # Funciones de formato
│   ├── App.jsx              # Componente principal
│   ├── index.jsx            # Punto de entrada
│   └── styles.css           # Estilos globales
├── .env                     # Variables de entorno
├── package.json             # Dependencias y scripts
├── vite.config.js           # Configuración de Vite
└── README.md                # Documentación
```

## API

La aplicación se conecta a la API de Consultoría Principado para obtener datos de compras y ventas. La documentación de la API está disponible en:

```
https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/swagger?api_key=XWjaumCm
```

### Endpoints principales

- `/fac_t` - Facturas de venta
- `/com_alb_g` - Albaranes de compra

## Personalización

### Temas

Los colores de la aplicación se pueden personalizar editando las variables CSS en `src/styles.css`:

```css
:root {
  --primary-color: #1976d2;
  --primary-light: #e3f2fd;
  --primary-dark: #0d47a1;
  /* ... */
}
```

## Despliegue

### Netlify

1. Crea una cuenta en [Netlify](https://www.netlify.com/)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno en la configuración del sitio
4. Configura el comando de construcción como `npm run build`
5. Configura el directorio de publicación como `dist`

### Vercel

1. Crea una cuenta en [Vercel](https://vercel.com/)
2. Importa tu repositorio de GitHub
3. Configura las variables de entorno
4. Despliega

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Para soporte o preguntas, contacta a [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com).