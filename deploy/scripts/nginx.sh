#!/usr/bin/env bash
# Gera e ativa a configuração do nginx para o FAST.
# Uso: nginx.sh <DOMINIO> <APP_DIR> <PORTA>
set -euo pipefail

DOMAIN="${1:?domínio obrigatório}"
APP_DIR="${2:?diretório da aplicação obrigatório}"
PORT="${3:-3001}"

TEMPLATE="${APP_DIR}/deploy/nginx/fast.conf.template"
AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

log() { printf "   %s\n" "$1"; }

[ -f "$TEMPLATE" ] || { echo "Template não encontrado: $TEMPLATE"; exit 1; }

mkdir -p /var/www/certbot /etc/nginx/sites-available /etc/nginx/sites-enabled

# Antes do certificado existir, servimos apenas HTTP (o certbot precisa da
# porta 80 para o desafio). Depois da emissão, habilitamos o bloco TLS.
if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  log "Certificado encontrado — gerando configuração com HTTPS."
  SSL_MODE="on"
else
  log "Sem certificado ainda — gerando configuração HTTP temporária."
  SSL_MODE="off"
fi

sed -e "s|{{DOMAIN}}|${DOMAIN}|g" \
    -e "s|{{PORT}}|${PORT}|g" \
    -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    "$TEMPLATE" > "$AVAILABLE"

if [ "$SSL_MODE" = "off" ]; then
  # Remove tudo entre os marcadores do bloco TLS até o certificado existir.
  sed -i '/# >>> SSL-BEGIN/,/# <<< SSL-END/d' "$AVAILABLE"
  # Sem TLS, o bloco :80 serve a aplicação diretamente em vez de redirecionar.
  sed -i 's|# {{HTTP_ONLY}} ||g' "$AVAILABLE"
  sed -i '/{{HTTPS_REDIRECT}}/d' "$AVAILABLE"
else
  sed -i '/# {{HTTP_ONLY}}/d' "$AVAILABLE"
  sed -i 's|{{HTTPS_REDIRECT}}|return 301 https://$host$request_uri;|' "$AVAILABLE"
fi

ln -sfn "$AVAILABLE" "$ENABLED"

# O site default do Debian captura o :80 e atrapalha o desafio do certbot.
if [ -L /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
  log "Site 'default' do nginx desabilitado."
fi

if ! nginx -t 2>/dev/null; then
  echo "Configuração do nginx inválida:"
  nginx -t
  exit 1
fi

systemctl reload nginx 2>/dev/null || systemctl start nginx
log "nginx recarregado."
