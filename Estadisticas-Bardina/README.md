# 📊 Estadísticas Bardina

**Aplicación web moderna para visualización y análisis de datos de ventas y compras**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com)
[![Nginx](https://img.shields.io/badge/Nginx-Proxy-009639?style=flat&logo=nginx)](https://nginx.org)

## 🚀 Características Principales

- **📈 Dashboard Interactivo**: Visualización en tiempo real de métricas de ventas y compras
- **🔍 Filtrado Avanzado**: Filtros por fecha, empresa, cliente, proveedor y más
- **📊 Gráficos Dinámicos**: Barras, líneas, circulares y estadísticas comparativas
- **📱 Responsive**: Diseño adaptable para desktop, tablet y móvil
- **⚡ Rendimiento**: Carga rápida con paginación automática y lazy loading
- **🔒 Seguro**: Configuración SSL/HTTPS y headers de seguridad
- **🐳 Docker Ready**: Despliegue simplificado con Docker y Docker Compose

## 🛠️ Tecnologías

### Frontend
- **React 19.1.0** - Framework de JavaScript
- **Vite 6.3.5** - Build tool y dev server
- **Recharts 2.10.0** - Librería de gráficos
- **CSS3** - Estilos personalizados con variables CSS

### Backend/API
- **REST API** - Integración con ERP de Consultoría Principado
- **Fetch API** - Cliente HTTP nativo
- **Paginación automática** - Manejo eficiente de grandes datasets

### Despliegue
- **Docker** - Contenerización
- **Nginx** - Servidor web y proxy reverso
- **Let's Encrypt** - Certificados SSL gratuitos
- **Docker Compose** - Orquestación de servicios

## 📁 Estructura del Proyecto

```
Estadisticas-Bardina/
├── 📂 src/
│   ├── 📂 components/           # Componentes React
│   │   ├── Dashboard.jsx        # Dashboard principal
│   │   ├── EstadisticasVentas.jsx
│   │   ├── EstadisticasCompras.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── DataCard.jsx
│   │   ├── ChartContainer.jsx
│   │   ├── FilterBar.jsx
│   │   └── index.js
│   ├── 📂 services/             # Servicios API
│   │   ├── api.js              # Cliente API principal
│   │   └── empresasServices.js  # Servicio de empresas
│   ├── 📂 utils/               # Utilidades
│   │   └── formatters.js       # Formateadores de datos
│   ├── App.jsx                 # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── styles.css             # Estilos globales
├── 📂 public/                  # Archivos estáticos
├── 📄 Dockerfile              # Configuración Docker
├── 📄 docker-compose.yml      # Orquestación Docker
├── 📄 nginx.conf              # Configuración Nginx HTTP
├── 📄 nginx-ssl.conf          # Configuración Nginx HTTPS
├── 📄 deploy.sh               # Script de despliegue
├── 📄 vite.config.js          # Configuración Vite
├── 📄 package.json            # Dependencias Node.js
└── 📄 README.md               # Este archivo
```

## 🎯 Funcionalidades

### Dashboard Principal
- **Métricas generales**: Totales de ventas, compras y balance
- **Gráficos comparativos**: Ventas vs compras por mes
- **Tendencias**: Análisis de crecimiento y patrones
- **Filtros temporales**: Por año, mes y rango de fechas

### Estadísticas de Ventas
- **Análisis por cliente**: Top clientes y distribución
- **Análisis por tienda**: Rendimiento por sucursal
- **Formas de pago**: Distribución de métodos de pago
- **Tabla detallada**: Listado completo de facturas

### Estadísticas de Compras
- **Análisis por proveedor**: Top proveedores
- **Análisis por categoría**: Distribución por series
- **Tabla detallada**: Listado completo de albaranes
- **Métricas de compra**: Promedios y totales

### Filtros Avanzados
- **Filtros temporales**: Año, mes, rango de fechas
- **Filtros de entidad**: Cliente, proveedor, empresa
- **Filtros de ubicación**: Tienda, almacén, división
- **Reseteo rápido**: Limpieza de filtros con un clic

## ⚙️ Configuración y Desarrollo

### Requisitos Previos
- **Node.js** 18+ 
- **npm** o **yarn**
- **Docker** (opcional, para despliegue)

### Instalación Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd Estadisticas-Bardina

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

```env
# .env
VITE_API_URL=https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1
VITE_API_KEY=XWjaumCm
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint
```

## 🐳 Despliegue con Docker

### Despliegue Rápido

```bash
# 1. Clonar el proyecto en tu servidor
git clone <repository-url>
cd Estadisticas-Bardina

# 2. Configurar variables de producción
cp .env.production.example .env.production
# Editar .env.production según tus necesidades

# 3. Ejecutar script de despliegue
chmod +x deploy.sh
sudo ./deploy.sh production
```

### Despliegue Manual

```bash
# Construir y ejecutar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

### Configuración SSL Automática

El script `deploy.sh` automáticamente:
1. ✅ Obtiene certificados SSL de Let's Encrypt
2. ✅ Configura Nginx para HTTPS
3. ✅ Programa renovación automática
4. ✅ Redirecciona HTTP a HTTPS

## 📊 API y Endpoints

### Base URL
```
https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1
```

### Endpoints Principales
- **`/fac_t`** - Facturas de venta
- **`/com_alb_g`** - Albaranes de compra  
- **`/emp_m`** - Empresas y divisiones

### Características de la API
- **Paginación automática**: Manejo eficiente de grandes datasets
- **Filtrado avanzado**: Múltiples parámetros de filtrado
- **Manejo de errores**: Retry automático y fallbacks
- **Rate limiting**: Protección contra abuso

## 🔧 Comandos Útiles

### Docker
```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f estadisticas-bardina

# Reiniciar servicios
docker-compose restart

# Entrar al contenedor
docker-compose exec estadisticas-bardina sh

# Actualizar aplicación
./deploy.sh production
```

### Nginx
```bash
# Verificar configuración
docker-compose exec estadisticas-bardina nginx -t

# Recargar configuración
docker-compose exec estadisticas-bardina nginx -s reload

# Ver logs de acceso
tail -f logs/access.log
```

### SSL/Certificados
```bash
# Verificar certificado
openssl s_client -connect bardina.cperp.es:443 -servername bardina.cperp.es

# Renovar certificados manualmente
docker-compose exec certbot certbot renew --quiet
docker-compose restart estadisticas-bardina

# Ver fecha de expiración
echo | openssl s_client -connect bardina.cperp.es:443 2>/dev/null | openssl x509 -dates -noout
```

## 🔍 Monitoreo y Mantenimiento

### Health Check
```bash
# Verificar estado de la aplicación
curl https://bardina.cperp.es/health

# Verificar respuesta de la API
curl -I "https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1/fac_t?api_key=XWjaumCm"
```

### Logs y Debugging
```bash
# Ver logs de la aplicación
docker-compose logs --tail=100 estadisticas-bardina

# Ver logs de Nginx
tail -f logs/access.log
tail -f logs/error.log

# Monitorear recursos
docker stats estadisticas-bardina
```

### Backup
```bash
# Backup completo
sudo tar -czf bardina-backup-$(date +%Y%m%d).tar.gz \
  /opt/bardina-estadisticas/ \
  --exclude=node_modules \
  --exclude=logs

# Backup solo configuración
sudo tar -czf bardina-config-$(date +%Y%m%d).tar.gz \
  *.yml *.conf .env* ssl/
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### La aplicación no carga
```bash
# 1. Verificar contenedores
docker-compose ps

# 2. Ver logs de errores
docker-compose logs estadisticas-bardina

# 3. Verificar conectividad
curl -I http://localhost/health
```

#### Problemas de API
```bash
# Verificar conectividad a la API
curl -I "https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1/fac_t?api_key=XWjaumCm"

# Verificar configuración de proxy
docker-compose exec estadisticas-bardina nginx -t
```

#### Problemas de SSL
```bash
# Verificar certificados
ls -la ssl/live/bardina.cperp.es/

# Regenerar certificados
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/certbot-webroot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@bardina.cperp.es --agree-tos \
  -d bardina.cperp.es -d www.bardina.cperp.es
```

## 🔒 Seguridad

### Headers de Seguridad
- **HSTS**: Forzar HTTPS
- **X-Frame-Options**: Prevenir clickjacking
- **X-Content-Type-Options**: Prevenir MIME sniffing
- **CSP**: Content Security Policy
- **Referrer Policy**: Control de referencias

### Rate Limiting
- **API**: Limitación de requests por minuto
- **SSL**: Protección contra fuerza bruta
- **Proxy**: Protección DDoS básica

### Certificados SSL
- **Let's Encrypt**: Certificados gratuitos
- **Renovación automática**: Cada 3 meses
- **Redirección HTTPS**: Forzar conexiones seguras

## 🚀 Roadmap y Mejoras Futuras

- [ ] **Autenticación**: Sistema de login y usuarios
- [ ] **Exportación**: PDF, Excel, CSV
- [ ] **Alertas**: Notificaciones por email/SMS
- [ ] **Caché**: Redis para mejorar rendimiento
- [ ] **PWA**: Aplicación web progresiva
- [ ] **Modo oscuro**: Tema dark/light
- [ ] **Internacionalización**: Múltiples idiomas
- [ ] **API GraphQL**: Alternativa REST
- [ ] **Microservicios**: Arquitectura distribuida
- [ ] **Kubernetes**: Orquestación avanzada

## 🤝 Contribución

¿Quieres contribuir? ¡Genial! Sigue estos pasos:

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

### Estándares de Código
- **ESLint**: Linting automático
- **Prettier**: Formateo de código
- **Conventional Commits**: Formato de commits
- **Semantic Versioning**: Versionado semántico

## 📞 Soporte y Contacto

- **Documentación**: [Wiki del proyecto](docs/)
- **Issues**: [GitHub Issues](issues/)
- **API Docs**: [Swagger UI](https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/swagger)
- **Email**: admin@bardina.cperp.es

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎉 Agradecimientos

- **Consultoría Principado** - Por proporcionar la API y datos
- **React Team** - Por el increíble framework
- **Recharts** - Por la librería de gráficos
- **Docker** - Por simplificar el despliegue
- **Let's Encrypt** - Por certificados SSL gratuitos

---

<div align="center">

**Desarrollado con ❤️ para Consultoría Principado**

[🌐 Sitio Web](https://bardina.cperp.es) • [📊 Dashboard](https://bardina.cperp.es) • [📚 Documentación](docs/)

</div>