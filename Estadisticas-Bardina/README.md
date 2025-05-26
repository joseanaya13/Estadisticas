# Despliegue con Docker - Estadísticas Bardina

Esta guía te ayudará a desplegar la aplicación de Estadísticas Bardina usando Docker en tu dominio `bardina.cperp.es`.

## 📋 Requisitos Previos

- **Servidor con Docker instalado** (Ubuntu 20.04+ recomendado)
- **Docker Compose** versión 1.27+
- **Dominio configurado**: `bardina.cperp.es` apuntando a tu servidor
- **Puertos abiertos**: 80 (HTTP) y 443 (HTTPS)
- **Acceso SSH** al servidor

## 🚀 Instalación Rápida

### 1. Preparar el servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 2. Clonar y configurar el proyecto

```bash
# Crear directorio para el proyecto
sudo mkdir -p /opt/bardina-estadisticas
cd /opt/bardina-estadisticas

# Copiar todos los archivos del proyecto aquí
# (puedes usar scp, rsync o git clone)

# Dar permisos de ejecución al script de despliegue
chmod +x deploy.sh
```

### 3. Desplegar la aplicación

```bash
# Ejecutar el script de despliegue
sudo ./deploy.sh production
```

El script automáticamente:
- ✅ Construye la imagen Docker
- ✅ Inicia los contenedores
- ✅ Configura Nginx
- ✅ Obtiene certificados SSL de Let's Encrypt
- ✅ Configura renovación automática de certificados

## 📁 Estructura de Archivos

Asegúrate de tener estos archivos en tu servidor:

```
/opt/bardina-estadisticas/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf (o nginx-ssl.conf para HTTPS)
├── deploy.sh
├── .dockerignore
├── .env.production
├── package.json
├── vite.config.js
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── ...
├── public/
├── logs/ (se crea automáticamente)
├── ssl/ (se crea automáticamente)
└── certbot-webroot/ (se crea automáticamente)
```

## 🔧 Configuración Manual

### Variables de Entorno

Edita el archivo `.env.production` si necesitas cambiar alguna configuración:

```bash
sudo nano .env.production
```

### Configuración de Nginx

Para HTTPS personalizado, edita `nginx.conf`:

```bash
sudo nano nginx.conf
```

## 🔍 Comandos Útiles

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f estadisticas-bardina

# Reiniciar la aplicación
docker-compose restart

# Parar la aplicación
docker-compose down

# Actualizar la aplicación
sudo ./deploy.sh production

# Entrar al contenedor
docker-compose exec estadisticas-bardina sh
```

## 🔒 SSL/HTTPS

El script de despliegue automáticamente:

1. **Obtiene certificados SSL** de Let's Encrypt
2. **Configura HTTPS** en Nginx
3. **Redirecciona HTTP a HTTPS**
4. **Programa renovación automática**

### Verificar SSL

```bash
# Verificar certificado
openssl s_client -connect bardina.cperp.es:443 -servername bardina.cperp.es

# Ver fecha de expiración
echo | openssl s_client -connect bardina.cperp.es:443 2>/dev/null | openssl x509 -dates -noout
```

### Renovar SSL manualmente

```bash
docker-compose exec certbot certbot renew --quiet
docker-compose restart estadisticas-bardina
```

## 🔧 Solución de Problemas

### La aplicación no carga

```bash
# Verificar que el contenedor está corriendo
docker-compose ps

# Ver logs de errores
docker-compose logs estadisticas-bardina

# Verificar conectividad
curl -I http://localhost/health
```

### Problemas de SSL

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

### API no funciona

```bash
# Verificar conectividad a la API
curl -I https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/v1/fac_t?api_key=XWjaumCm

# Verificar proxy de Nginx
docker-compose exec estadisticas-bardina nginx -t
```

## 📊 Monitoreo

### Verificar salud de la aplicación

```bash
# Health check HTTP
curl http://bardina.cperp.es/health

# Health check HTTPS
curl https://bardina.cperp.es/health
```

### Ver métricas de uso

```bash
# Uso de recursos
docker stats estadisticas-bardina

# Espacio en disco
df -h
du -sh /opt/bardina-estadisticas/
```

## 🔄 Actualización

Para actualizar la aplicación:

```bash
# 1. Parar la aplicación actual
docker-compose down

# 2. Actualizar código fuente
# (subir nuevos archivos o hacer git pull)

# 3. Redesplegar
sudo ./deploy.sh production
```

## 🗃 Backup

### Crear backup

```bash
# Backup completo
sudo tar -czf bardina-backup-$(date +%Y%m%d).tar.gz \
  /opt/bardina-estadisticas/ \
  --exclude=node_modules \
  --exclude=logs

# Backup solo configuración
sudo tar -czf bardina-config-$(date +%Y%m%d).tar.gz \
  /opt/bardina-estadisticas/*.yml \
  /opt/bardina-estadisticas/*.conf \
  /opt/bardina-estadisticas/.env* \
  /opt/bardina-estadisticas/ssl/
```

### Restaurar backup

```bash
# Extraer backup
sudo tar -xzf bardina-backup-YYYYMMDD.tar.gz -C /

# Reiniciar servicios
cd /opt/bardina-estadisticas
sudo ./deploy.sh production
```

## 🔧 Configuración Avanzada

### Rate Limiting

Para limitar las solicitudes por IP, agrega a `nginx.conf`:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            # ... resto de configuración
        }
    }
}
```

### Logs Personalizados

```bash
# Configurar rotación de logs
sudo nano /etc/logrotate.d/bardina-nginx

# Contenido del archivo:
/opt/bardina-estadisticas/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose exec estadisticas-bardina nginx -s reload
    endscript
}
```

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs**: `docker-compose logs -f`
2. **Verifica la configuración**: `docker-compose config`
3. **Comprueba la conectividad**: `curl -I https://bardina.cperp.es/health`
4. **Consulta la documentación de la API**: https://s5.consultoraprincipado.com/bardina/CP_Erp_V1_dat_dat/swagger

## 🎉 ¡Listo!

Tu aplicación debería estar disponible en:
- **HTTP**: http://bardina.cperp.es (redirige a HTTPS)
- **HTTPS**: https://bardina.cperp.es

¡La aplicación de Estadísticas Bardina está ahora corriendo en producción con Docker! 🚀