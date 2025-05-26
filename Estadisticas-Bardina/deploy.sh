#!/bin/bash

# Script de despliegue para Estadísticas Bardina
# Uso: ./deploy.sh [production|staging]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Configuración
ENVIRONMENT=${1:-production}
DOMAIN="bardina.cperp.es"
CONTAINER_NAME="estadisticas-bardina"
IMAGE_NAME="bardina/estadisticas"

log "Iniciando despliegue para entorno: $ENVIRONMENT"

# Verificar que Docker está instalado y funcionando
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
fi

if ! docker info &> /dev/null; then
    error "Docker no está funcionando"
fi

# Verificar que Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado"
fi

# Crear directorios necesarios
log "Creando directorios necesarios..."
mkdir -p logs ssl certbot-webroot

# Parar contenedores existentes si están corriendo
log "Parando contenedores existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Limpiar imágenes antiguas
log "Limpiando imágenes antiguas..."
docker image prune -f

# Construir nueva imagen
log "Construyendo nueva imagen..."
docker-compose build --no-cache

# Iniciar servicios
log "Iniciando servicios..."
docker-compose up -d

# Esperar a que el servicio esté disponible
log "Esperando a que el servicio esté disponible..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose exec -T $CONTAINER_NAME wget --quiet --tries=1 --spider http://localhost/health; then
        log "Servicio disponible!"
        break
    fi
    
    counter=$((counter + 1))
    sleep 1
    
    if [ $counter -eq $timeout ]; then
        error "El servicio no responde después de $timeout segundos"
    fi
done

# Mostrar estado de los contenedores
log "Estado de los contenedores:"
docker-compose ps

# Mostrar logs recientes
log "Logs recientes:"
docker-compose logs --tail=20

# Configurar SSL si es producción
if [ "$ENVIRONMENT" = "production" ]; then
    log "Configurando SSL para producción..."
    
    # Verificar si ya existe certificado
    if [ ! -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
        warn "No se encontró certificado SSL existente"
        
        # Crear configuración temporal de Nginx para validación
        log "Obteniendo certificado SSL de Let's Encrypt..."
        
        # Primera obtención del certificado
        docker run --rm \
            -v $(pwd)/ssl:/etc/letsencrypt \
            -v $(pwd)/certbot-webroot:/var/www/certbot \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email admin@$DOMAIN \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        if [ $? -eq 0 ]; then
            log "Certificado SSL obtenido correctamente"
            
            # Reiniciar Nginx para cargar el certificado
            docker-compose restart $CONTAINER_NAME
        else
            warn "No se pudo obtener el certificado SSL automáticamente"
            log "Puedes obtenerlo manualmente ejecutando:"
            log "docker run --rm -v \$(pwd)/ssl:/etc/letsencrypt -v \$(pwd)/certbot-webroot:/var/www/certbot certbot/certbot certonly --webroot --webroot-path=/var/www/certbot --email admin@$DOMAIN --agree-tos --no-eff-email -d $DOMAIN -d www.$DOMAIN"
        fi
    else
        log "Certificado SSL ya existe"
    fi
    
    # Configurar renovación automática
    log "Configurando renovación automática de certificados..."
    
    # Crear cron job para renovación (ejecutar como root)
    CRON_JOB="0 3 * * * cd $(pwd) && docker-compose exec certbot certbot renew --quiet && docker-compose restart $CONTAINER_NAME"
    
    if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log "Cron job para renovación automática configurado"
    else
        log "Cron job para renovación automática ya existe"
    fi
fi

# Información final
log "Despliegue completado exitosamente!"
log "La aplicación está disponible en:"
log "  - HTTP: http://$DOMAIN"
if [ "$ENVIRONMENT" = "production" ] && [ -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
    log "  - HTTPS: https://$DOMAIN"
fi

log "Para ver logs en tiempo real:"
log "  docker-compose logs -f"

log "Para parar la aplicación:"
log "  docker-compose down"

log "Para actualizar la aplicación:"
log "  ./deploy.sh $ENVIRONMENT"