#!/usr/bin/env node

/**
 * Script de migración para refactorizar CSS
 * Mueve el contenido de los archivos existentes a la nueva estructura
 * 
 * Ejecutar con: node migrate-css.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Helper para logging con colores
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

// Función para leer archivo
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.warning(`No se pudo leer ${filePath}`);
    return '';
  }
}

// Función para escribir archivo
function writeFile(filePath, content, append = false) {
  try {
    if (append) {
      fs.appendFileSync(filePath, content);
    } else {
      fs.writeFileSync(filePath, content);
    }
    log.success(`Escrito: ${filePath}`);
  } catch (error) {
    log.error(`Error escribiendo ${filePath}: ${error.message}`);
  }
}

// Función para extraer secciones de CSS basadas en comentarios
function extractSection(content, startMarker, endMarker = null) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return '';

  let endIndex = content.length;
  if (endMarker) {
    const tempEnd = content.indexOf(endMarker, startIndex + startMarker.length);
    if (tempEnd !== -1) endIndex = tempEnd;
  }

  return content.substring(startIndex, endIndex);
}

// Función principal de migración
function migrateCSS() {
  log.section('🎨 Iniciando migración de CSS...');

  const stylesDir = path.join(__dirname, 'src', 'styles');

  // 1. MIGRAR VARIABLES
  log.section('1. Migrando variables...');
  const variablesContent = readFile(path.join(stylesDir, '_variables.css'));
  const baseContent = readFile(path.join(stylesDir, '_base.css'));
  const stylesContent = readFile(path.join(stylesDir, 'styles.css'));

  // Extraer todas las variables de root
  let allVariables = '';

  // De _variables.css
  if (variablesContent) {
    allVariables += variablesContent;
  }

  // Variables adicionales de styles.css
  const rootVars = stylesContent.match(/:root\s*{[^}]*}/gs);
  if (rootVars) {
    allVariables += '\n\n/* === Variables adicionales de styles.css === */\n';
    allVariables += rootVars.join('\n');
  }

  writeFile(path.join(stylesDir, 'core', '_variables.css'), allVariables);

  // 2. MIGRAR RESET Y BASE
  log.section('2. Migrando reset y estilos base...');

  // Reset CSS
  const resetContent = extractSection(baseContent, '/* === RESET CSS ===', '/* === TIPOGRAFÍA ===');
  writeFile(path.join(stylesDir, 'core', '_reset.css'), `/* === RESET CSS === */\n${resetContent}`);

  // Base styles (tipografía, elementos HTML)
  const baseStyles = extractSection(baseContent, '/* === TIPOGRAFÍA ===', '/* === LAYOUT FLEXBOX ===');
  writeFile(path.join(stylesDir, 'core', '_base.css'), `/* === BASE STYLES === */\n${baseStyles}`);

  // 3. MIGRAR LAYOUT
  log.section('3. Migrando layout...');

  // App Layout desde styles.css
  const layoutContent = `
/* === LAYOUT PRINCIPAL === */
${extractSection(stylesContent, '/* === LAYOUT PRINCIPAL ===', '/* === COMPONENTES ESPECÍFICOS')}

/* === CONTENEDORES BASE === */
${extractSection(baseContent, '.container', '.flex {')}
`;
  writeFile(path.join(stylesDir, 'layout', '_app-layout.css'), layoutContent);

  // Sidebar
  const sidebarContent = readFile(path.join(stylesDir, 'sidebar.css'));
  writeFile(path.join(stylesDir, 'layout', '_sidebar.css'), sidebarContent);

  // Responsive
  const responsiveContent = `
/* === RESPONSIVE DESIGN === */
${extractSection(stylesContent, '/* === RESPONSIVE DESIGN ===', '/* === DARK MODE ===')}
${extractSection(baseContent, '/* === RESPONSIVE BREAKPOINTS ===', '/* === ANIMACIONES ===')}
`;
  writeFile(path.join(stylesDir, 'layout', '_responsive.css'), responsiveContent);

  // 4. MIGRAR COMPONENTES
  log.section('4. Migrando componentes...');

  const componentsContent = readFile(path.join(stylesDir, '_components.css'));

  // Botones
  const buttonsContent = extractSection(componentsContent, '/* === BOTONES ===', '/* === TARJETAS');
  writeFile(path.join(stylesDir, 'components', '_buttons.css'), buttonsContent);

  // Cards
  const cardsContent = `
${extractSection(componentsContent, '/* === TARJETAS (CARDS) ===', '/* === DATA CARDS ===')}
${extractSection(componentsContent, '/* === DATA CARDS ===', '/* === CHART CONTAINER ===')}
`;
  writeFile(path.join(stylesDir, 'components', '_cards.css'), cardsContent);

  // Forms
  const formsContent = `
/* === FORMULARIOS === */
${extractSection(stylesContent, '.filter-control', '.filter-reset')}
${extractSection(baseContent, '/* === ELEMENTOS DE FORMULARIO BASE ===', '/* === TABLAS BASE ===')}
`;
  writeFile(path.join(stylesDir, 'components', '_forms.css'), formsContent);

  // Tables
  const tablesContent = `
${extractSection(componentsContent, '/* === TABLES ===', '/* === NAVIGATION ===')}
${extractSection(baseContent, '/* === TABLAS BASE ===', '/* === ELEMENTOS MULTIMEDIA ===')}
`;
  writeFile(path.join(stylesDir, 'components', '_tables.css'), tablesContent);

  // Charts
  const chartsContent = extractSection(componentsContent, '/* === CHART CONTAINER ===', '/* === LOADING SPINNER ===');
  writeFile(path.join(stylesDir, 'components', '_charts.css'), chartsContent);

  // Alerts
  const alertsContent = extractSection(componentsContent, '/* === ALERTS ===', '/* === BADGES ===');
  writeFile(path.join(stylesDir, 'components', '_alerts.css'), alertsContent);

  // Badges
  const badgesContent = extractSection(componentsContent, '/* === BADGES ===', '/* === TABLES ===');
  writeFile(path.join(stylesDir, 'components', '_badges.css'), badgesContent);

  // Loading
  const loadingContent = extractSection(componentsContent, '/* === LOADING SPINNER ===', '/* === ERROR MESSAGE ===');
  writeFile(path.join(stylesDir, 'components', '_loading.css'), loadingContent);

  // Navigation
  const navigationContent = extractSection(componentsContent, '/* === NAVIGATION ===', '/* === EXPORT BUTTON ===');
  writeFile(path.join(stylesDir, 'components', '_navigation.css'), navigationContent);

  // Filters
  const filtersContent = `
${extractSection(componentsContent, '/* === FILTER BAR ===', '/* === ALERTS ===')}
${extractSection(stylesContent, '.filter-bar', '.charts-container')}
`;
  writeFile(path.join(stylesDir, 'components', '_filters.css'), filtersContent);

  // Error states
  const errorContent = `
${extractSection(componentsContent, '/* === ERROR MESSAGE ===', '/* === FILTER BAR ===')}
${extractSection(componentsContent, '/* === NO DATA MESSAGE ===', '/* === RESPONSIVE ===')}
`;
  writeFile(path.join(stylesDir, 'components', '_error-states.css'), errorContent);

  // 5. MIGRAR PÁGINAS
  log.section('5. Migrando estilos de páginas...');

  const pagesContent = readFile(path.join(stylesDir, '_pages.css'));

  // Dashboard
  const dashboardContent = extractSection(pagesContent, '/* === DASHBOARD ===', '/* === COMPRAS ===');
  writeFile(path.join(stylesDir, 'pages', '_dashboard.css'), dashboardContent);

  // Ventas
  const ventasContent = extractSection(pagesContent, '/* === TABLA VENDEDORES ===', '/* === COMPRAS ===');
  writeFile(path.join(stylesDir, 'pages', '_ventas.css'), ventasContent);

  // Compras
  const comprasContent = extractSection(pagesContent, '/* === COMPRAS ===', '/* === PÁGINAS EN CONSTRUCCIÓN ===');
  writeFile(path.join(stylesDir, 'pages', '_compras.css'), comprasContent);

  // Common pages
  const commonPagesContent = extractSection(pagesContent, '/* === PÁGINAS EN CONSTRUCCIÓN ===', '/* === RESPONSIVE DESIGN ===');
  writeFile(path.join(stylesDir, 'pages', '_common-pages.css'), commonPagesContent);

  // 6. MIGRAR TEMAS
  log.section('6. Migrando temas...');

  // Light theme (default)
  writeFile(path.join(stylesDir, 'themes', '_light.css'), `
/* === TEMA CLARO (DEFAULT) === */
:root {
  /* Los valores por defecto ya están en _variables.css */
}
`);

  // Dark theme
  const darkThemeContent = `
/* === TEMA OSCURO === */
${extractSection(variablesContent, '/* === TEMA OSCURO ===', '/* === VARIABLES DE SISTEMA ===')}
${extractSection(stylesContent, '/* === DARK MODE ===', '/* === ANIMACIONES ===')}
`;
  writeFile(path.join(stylesDir, 'themes', '_dark.css'), darkThemeContent);

  // 7. MIGRAR UTILIDADES
  log.section('7. Migrando utilidades...');

  const utilsContent = readFile(path.join(stylesDir, 'utils.css'));

  // Helpers generales
  const helpersContent = `
/* === UTILIDADES GENERALES === */
${extractSection(baseContent, '/* === UTILIDADES DE ACCESIBILIDAD ===', '/* === CONTENEDORES BASE ===')}
${extractSection(utilsContent, '/* === CLASES DE UTILIDAD ===', '/* === COMPONENTES MODERNOS ===')}
${extractSection(stylesContent, '/* === UTILIDADES ADICIONALES ===', '/* === ACCESIBILIDAD ===')}
`;
  writeFile(path.join(stylesDir, 'utilities', '_helpers.css'), helpersContent);

  // Animations
  const animationsContent = `
/* === ANIMACIONES === */
${extractSection(baseContent, '/* === ANIMACIONES ===', '/* === SCROLL BEHAVIOR ===')}
${extractSection(stylesContent, '/* === ANIMACIONES ===', '/* === UTILIDADES ADICIONALES ===')}
`;
  writeFile(path.join(stylesDir, 'utilities', '_animations.css'), animationsContent);

  // Spacing utilities
  const spacingContent = extractSection(baseContent, '/* === ESPACIADO ===', '/* === DISPLAY ===');
  writeFile(path.join(stylesDir, 'utilities', '_spacing.css'), spacingContent);

  // Typography utilities
  const typographyContent = extractSection(baseContent, '/* === TEXTO ===', '/* === COLORES DE TEXTO ===');
  writeFile(path.join(stylesDir, 'utilities', '_typography.css'), typographyContent);

  // Color utilities
  const colorContent = `
${extractSection(baseContent, '/* === COLORES DE TEXTO ===', '/* === BORDES ===')}
${extractSection(utilsContent, '.text-primary', '.bg-surface')}
`;
  writeFile(path.join(stylesDir, 'utilities', '_colors.css'), colorContent);

  // 8. CREAR ARCHIVO INDEX PRINCIPAL
  log.section('8. Creando archivo index.css principal...');

  const indexContent = `/**
 * Estilos principales - Estadísticas Bardina
 * Sistema de diseño modular y escalable
 * 
 * Orden de importación:
 * 1. Core: Variables, funciones, reset, base
 * 2. Layout: Estructura principal
 * 3. Components: Componentes reutilizables
 * 4. Pages: Estilos específicos de páginas
 * 5. Themes: Temas claro/oscuro
 * 6. Utilities: Utilidades y helpers
 */

/* === CORE === */
@import './core/_variables.css';
@import './core/_functions.css';
@import './core/_reset.css';
@import './core/_base.css';

/* === LAYOUT === */
@import './layout/_app-layout.css';
@import './layout/_sidebar.css';
@import './layout/_responsive.css';

/* === COMPONENTS === */
@import './components/_buttons.css';
@import './components/_cards.css';
@import './components/_forms.css';
@import './components/_tables.css';
@import './components/_charts.css';
@import './components/_alerts.css';
@import './components/_badges.css';
@import './components/_loading.css';
@import './components/_modals.css';
@import './components/_navigation.css';
@import './components/_filters.css';
@import './components/_error-states.css';

/* === PAGES === */
@import './pages/_dashboard.css';
@import './pages/_ventas.css';
@import './pages/_compras.css';
@import './pages/_common-pages.css';

/* === THEMES === */
@import './themes/_light.css';
@import './themes/_dark.css';

/* === UTILITIES === */
@import './utilities/_helpers.css';
@import './utilities/_animations.css';
@import './utilities/_spacing.css';
@import './utilities/_typography.css';
@import './utilities/_colors.css';
@import './utilities/_print.css';
`;

  writeFile(path.join(stylesDir, 'index.css'), indexContent);

  // 9. CREAR ARCHIVO DE FUNCIONES CSS (PLACEHOLDER)
  log.section('9. Creando archivo de funciones CSS...');

  const functionsContent = `/**
 * Funciones y mixins CSS
 * Utilidades para cálculos y funciones CSS avanzadas
 */

/* === FUNCIONES DE CÁLCULO === */

/* Función para espaciado fluido */
.fluid-spacing {
  --min-space: 1rem;
  --max-space: 2rem;
  --preferred-space: calc(var(--min-space) + (var(--max-space) - var(--min-space)) * ((100vw - 320px) / (1920 - 320)));
  padding: clamp(var(--min-space), var(--preferred-space), var(--max-space));
}

/* Función para tipografía fluida */
.fluid-text {
  --min-size: 1rem;
  --max-size: 1.5rem;
  --preferred-size: calc(var(--min-size) + (var(--max-size) - var(--min-size)) * ((100vw - 320px) / (1920 - 320)));
  font-size: clamp(var(--min-size), var(--preferred-size), var(--max-size));
}

/* === MIXINS CON CUSTOM PROPERTIES === */

/* Mixin para contenedor con aspect ratio */
.aspect-ratio {
  --aspect-ratio: 16/9;
  position: relative;
  padding-bottom: calc(100% / var(--aspect-ratio));
}

.aspect-ratio > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Mixin para truncar texto */
.line-clamp {
  --lines: 3;
  display: -webkit-box;
  -webkit-line-clamp: var(--lines);
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* === FUNCIONES DE COLOR === */

/* Función para overlay con transparencia */
.color-overlay {
  --overlay-color: var(--primary-color);
  --overlay-opacity: 0.8;
  position: relative;
}

.color-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--overlay-color);
  opacity: var(--overlay-opacity);
  pointer-events: none;
}
`;

  writeFile(path.join(stylesDir, 'core', '_functions.css'), functionsContent);

  // 10. CREAR ESTILOS DE IMPRESIÓN
  log.section('10. Creando estilos de impresión...');

  const printContent = `/**
 * Estilos para impresión
 * Optimizaciones para salida impresa
 */

@media print {
  /* === RESET PARA IMPRESIÓN === */
  * {
    background: transparent !important;
    color: #000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* === LAYOUT === */
  .sidebar,
  .mobile-tab-bar,
  .nav-buttons,
  .filter-bar,
  .action-btn,
  .export-button-container {
    display: none !important;
  }

  .app-content {
    margin: 0 !important;
    padding: 0 !important;
  }

  /* === PÁGINAS === */
  @page {
    margin: 2cm;
    size: A4;
  }

  /* === ELEMENTOS === */
  a,
  a:visited {
    text-decoration: underline;
  }

  a[href^="http"]:after {
    content: " (" attr(href) ")";
  }

  /* === TABLAS === */
  table {
    border-collapse: collapse !important;
  }

  table, th, td {
    border: 1px solid #ddd !important;
  }

  /* === IMÁGENES Y GRÁFICOS === */
  img {
    max-width: 100% !important;
  }

  /* === SALTOS DE PÁGINA === */
  h1, h2, h3 {
    page-break-after: avoid;
  }

  table, figure {
    page-break-inside: avoid;
  }
}
`;

  writeFile(path.join(stylesDir, 'utilities', '_print.css'), printContent);

  log.section('✅ Migración completada!');
  log.info('\nPróximos pasos:');
  log.info('1. Actualizar App.jsx para importar styles/index.css');
  log.info('2. Revisar y ajustar el contenido migrado');
  log.info('3. Eliminar archivos CSS antiguos del backup');
  log.info('4. Probar la aplicación completamente');
}

// Ejecutar migración
migrateCSS();