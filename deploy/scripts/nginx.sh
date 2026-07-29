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

mkdir -p /var/www/certbot /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/snippets

# Snippet de cabeçalhos de segurança, incluído pelo server e por cada location
# que tenha add_header próprio (o add_header local cancela a herança).
install -m 0644 "${APP_DIR}/deploy/nginx/security-headers.conf" \
  /etc/nginx/snippets/fast-security-headers.conf

# Antes do certificado existir, servimos apenas HTTP (o certbot precisa da
# porta 80 para o desafio). Depois da emissão, habilitamos o bloco TLS.
if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  log "Certificado encontrado — gerando configuração com HTTPS."
  SSL_MODE="on"
else
  log "Sem certificado ainda — gerando configuração HTTP temporária."
  SSL_MODE="off"
fi

# A diretiva `http2 on;` só existe a partir do nginx 1.25.1. Em versões
# anteriores (Ubuntu 22.04 traz a 1.18, a 24.04 traz a 1.24) o HTTP/2 é
# declarado no próprio `listen`.
NGINX_VER="$(nginx -v 2>&1 | sed -n 's|.*nginx/\([0-9][0-9.]*\).*|\1|p')"

if [ -n "$NGINX_VER" ] && \
   [ "$(printf '%s\n1.25.1\n' "$NGINX_VER" | sort -V | head -1)" = "1.25.1" ]; then
  HTTP2_LISTEN=""
  HTTP2_DIRECTIVE="http2 on;"
  log "nginx ${NGINX_VER} — usando a diretiva http2 on."
else
  HTTP2_LISTEN=" http2"
  HTTP2_DIRECTIVE="# HTTP/2 declarado no listen (nginx ${NGINX_VER:-<1.25.1})"
  log "nginx ${NGINX_VER:-antigo} — HTTP/2 declarado no listen."
fi

# Atrás de um CDN (CloudFront), a origem recebe HTTP e NÃO deve redirecionar —
# senão entra em loop (ERR_TOO_MANY_REDIRECTS). O CDN termina o TLS com o
# visitante. Ative com FAST_BEHIND_CDN=1 no .env.
case "${FAST_BEHIND_CDN:-}" in
  1|true|yes|on) BEHIND_CDN=1 ;;
  *)             BEHIND_CDN=0 ;;
esac

sed -e "s|{{DOMAIN}}|${DOMAIN}|g" \
    -e "s|{{PORT}}|${PORT}|g" \
    -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    -e "s|{{HTTP2_LISTEN}}|${HTTP2_LISTEN}|g" \
    -e "s|{{HTTP2_DIRECTIVE}}|${HTTP2_DIRECTIVE}|g" \
    "$TEMPLATE" > "$AVAILABLE"

if [ "$SSL_MODE" = "off" ]; then
  # Sem certificado: remove o bloco TLS e serve por HTTP, sem redirecionar.
  sed -i '/# >>> SSL-BEGIN/,/# <<< SSL-END/d' "$AVAILABLE"
  sed -i '/{{HTTPS_REDIRECT}}/d' "$AVAILABLE"
  sed -i 's|{{FWD_PROTO}}|$scheme|g' "$AVAILABLE"
  log "Modo HTTP (sem certificado ainda)."
elif [ "$BEHIND_CDN" = "1" ]; then
  # Com TLS, atrás do CloudFront: NÃO redireciona; o :80 serve o app ao CDN.
  sed -i '/{{HTTPS_REDIRECT}}/d' "$AVAILABLE"
  sed -i 's|{{FWD_PROTO}}|https|g' "$AVAILABLE"
  log "Modo atrás de CDN (FAST_BEHIND_CDN): origem serve por HTTP, sem redirect."
else
  # Deploy padrão: redireciona HTTP → HTTPS na própria origem.
  sed -i 's|{{HTTPS_REDIRECT}}|return 301 https://$host$request_uri;|' "$AVAILABLE"
  sed -i 's|{{FWD_PROTO}}|$scheme|g' "$AVAILABLE"
  log "Modo padrão: redirect HTTP → HTTPS na origem."
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
