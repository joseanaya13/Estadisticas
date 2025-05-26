#!/bin/bash

# Script de despliegue para producción con dominio externo
# Uso: ./deploy-production.sh

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
DOMAIN="bardina.cperp.es"
CONTAINER_NAME="estadisticas-bardina"
COMPOSE_FILE="docker-compose-production.yml"

log "🚀 Iniciando despliegue para producción en $DOMAIN"

# Verificar prerrequisitos
log "🔍 Verificando prerrequisitos..."

if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
fi

if ! docker info &> /dev/null; then
    error "Docker no está funcionando"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado"
fi

# Verificar que tenemos acceso externo
log "🌐 Verificando conectividad externa..."
EXTERNAL_IP=$(curl -s https://ipv4.icanhazip.com/)
log "IP externa detectada: $EXTERNAL_IP"

# Verificar resolución DNS
log "🔍 Verificando resolución DNS para $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN)
if [ "$RESOLVED_IP" != "$EXTERNAL_IP" ]; then
    warn "DNS resolution: $DOMAIN -> $RESOLVED_IP"
    warn "Tu IP externa: $EXTERNAL_IP"
    warn "Verifica que el DNS esté configurado correctamente"
fi

# Crear directorios necesarios
log "📁 Creando directorios necesarios..."
mkdir -p logs ssl certbot-webroot

# Usar configuración de producción
log "⚙️ Configurando archivos para producción..."
cp nginx-production.conf nginx.conf
cp docker-compose-production.yml docker-compose.yml

# Parar contenedores existentes
log "🛑 Parando contenedores existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Limpiar imágenes antiguas
log "🧹 Limpiando imágenes antiguas..."
docker image prune -f

# Construir nueva imagen
log "🔨 Construyendo imagen para producción..."
docker-compose build --no-cache

# Iniciar servicios
log "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que el servicio esté disponible
log "⏳ Esperando a que el servicio esté disponible..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost/health > /dev/null; then
        log "✅ Servicio disponible localmente!"
        break
    fi
    
    counter=$((counter + 1))
    sleep 1
    
    if [ $counter -eq $timeout ]; then
        error "❌ El servicio no responde después de $timeout segundos"
    fi
done

# Mostrar estado de los contenedores
log "📊 Estado de los contenedores:"
docker-compose ps

# Verificar puertos
log "🔍 Verificando puertos..."
if netstat -tlnp | grep -q ":80 "; then
    log "✅ Puerto 80 está abierto"
else
    warn "⚠️ Puerto 80 no está disponible"
fi

if netstat -tlnp | grep -q ":443 "; then
    log "✅ Puerto 443 está abierto"
else
    warn "⚠️ Puerto 443 no está disponible"
fi

# Probar acceso externo
log "🌐 Probando acceso externo..."
if curl -s --connect-timeout 10 http://$DOMAIN/health > /dev/null; then
    log "✅ Acceso externo HTTP funciona!"
else
    warn "⚠️ No se puede acceder externamente por HTTP"
    log "Verifica:"
    log "  1. Port forwarding en el router (puerto 80)"
    log "  2. Firewall del servidor"
    log "  3. Configuración DNS"
fi

# Configurar SSL
log "🔒 Configurando SSL..."

# Verificar si ya tenemos certificados
if [ -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
    log "✅ Certificados SSL ya existen"
else
    log "📜 Obteniendo certificados SSL de Let's Encrypt..."
    
    # Obtener certificado
    docker-compose --profile ssl run --rm certbot
    
    if [ -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
        log "✅ Certificados SSL obtenidos correctamente"
        
        # Activar configuración HTTPS en nginx
        log "🔧 Activando configuración HTTPS..."
        
        # Descommentar la configuración HTTPS en nginx.conf
        sed -i 's/^    # \(.*\)$/    \1/' nginx.conf
        
        # Reiniciar para cargar SSL
        docker-compose restart $CONTAINER_NAME
        
        # Probar HTTPS
        sleep 5
        if curl -s --connect-timeout 10 https://$DOMAIN/health > /dev/null; then
            log "✅ HTTPS funciona correctamente!"
        else
            warn "⚠️ HTTPS no está funcionando aún"
        fi
    else
        warn "⚠️ No se pudieron obtener certificados SSL"
        log "La aplicación funcionará solo en HTTP"
    fi
fi

# Configurar renovación automática de certificados
log "🔄 Configurando renovación automática de certificados..."
CRON_JOB="0 3 * * * cd $(pwd) && docker-compose --profile ssl run --rm certbot renew --quiet && docker-compose restart $CONTAINER_NAME"

if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    log "✅ Renovación automática configurada"
else
    log "✅ Renovación automática ya configurada"
fi

# Mostrar información final
log "🎉 ¡Despliegue completado!"
log ""
log "📋 Información del despliegue:"
log "  🌐 Dominio: $DOMAIN"
log "  🔗 HTTP: http://$DOMAIN"
if [ -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
    log "  🔒 HTTPS: https://$DOMAIN"
fi
log "  📊 Health Check: http://$DOMAIN/health"
log ""
log "📝 Comandos útiles:"
log "  Ver logs: docker-compose logs -f"
log "  Reiniciar: docker-compose restart"
log "  Parar: docker-compose down"
log "  Estado: docker-compose ps"
log ""
log "🔧 Verificaciones importantes:"
log "  1. ✅ Port forwarding configurado (puertos 80 y 443)"
log "  2. ✅ DNS apuntando a tu IP pública"
log "  3. ✅ Firewall permite tráfico HTTP/HTTPS"

# Verificar acceso final
log ""
log "🧪 Verificación final..."
if curl -s --connect-timeout 10 http://$DOMAIN > /dev/null; then
    log "✅ ¡La aplicación está accesible desde internet!"
else
    error "❌ La aplicación no es accesible desde internet"
fi