#!/usr/bin/env bash
# Emite (ou renova) o certificado Let's Encrypt e reaplica o nginx com HTTPS.
# Uso: ssl.sh <DOMINIO> <EMAIL>
set -euo pipefail

DOMAIN="${1:?domínio obrigatório}"
EMAIL="${2:?e-mail obrigatório}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log()  { printf "   %s\n" "$1"; }
warn() { printf "   \033[0;33m%s\033[0m\n" "$1"; }

if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  days_left=$(( ($(date -d "$(openssl x509 -enddate -noout -in "${CERT_DIR}/fullchain.pem" | cut -d= -f2)" +%s) - $(date +%s)) / 86400 ))
  if [ "$days_left" -gt 30 ]; then
    log "Certificado válido por mais ${days_left} dias — nada a fazer."
    bash "${APP_DIR}/deploy/scripts/nginx.sh" "$DOMAIN" "$APP_DIR" "${PORT:-3001}"
    exit 0
  fi
  log "Certificado expira em ${days_left} dias — renovando…"
  certbot renew --quiet --nginx || warn "Renovação falhou; o certificado atual segue em uso."
  systemctl reload nginx
  exit 0
fi

# ---- Pré-checagem de DNS ----------------------------------------------------
log "Verificando se ${DOMAIN} aponta para este servidor…"
resolved="$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1 || true)"
public_ip="$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)"

if [ -z "$resolved" ]; then
  warn "O domínio ${DOMAIN} não resolve. Aponte o registro A para este servidor e rode: sudo make ssl"
  warn "A aplicação continuará acessível via HTTP enquanto isso."
  exit 0
fi

if [ -n "$public_ip" ] && [ "$resolved" != "$public_ip" ]; then
  warn "${DOMAIN} resolve para ${resolved}, mas o IP público deste servidor é ${public_ip}."
  warn "Se houver um CDN/proxy na frente isso é esperado; caso contrário, ajuste o DNS."
fi

# ---- Emissão ----------------------------------------------------------------
log "Solicitando certificado ao Let's Encrypt…"
if certbot certonly \
     --webroot -w /var/www/certbot \
     -d "$DOMAIN" \
     --email "$EMAIL" \
     --agree-tos \
     --no-eff-email \
     --non-interactive \
     --keep-until-expiring; then
  log "Certificado emitido."
else
  warn "Não foi possível emitir o certificado agora."
  warn "Verifique se o DNS está propagado e a porta 80 acessível, depois rode: sudo make ssl"
  exit 0
fi

# Reaplica o nginx, agora com o bloco HTTPS ativo.
bash "${APP_DIR}/deploy/scripts/nginx.sh" "$DOMAIN" "$APP_DIR" "${PORT:-3001}"

# ---- Renovação automática ---------------------------------------------------
if systemctl list-timers 2>/dev/null | grep -q certbot; then
  log "Renovação automática já configurada (timer do certbot)."
else
  log "Criando timer de renovação automática…"
  cat > /etc/systemd/system/certbot-fast-renew.service <<'UNIT'
[Unit]
Description=Renova certificados Let's Encrypt do FAST

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
UNIT

  cat > /etc/systemd/system/certbot-fast-renew.timer <<'UNIT'
[Unit]
Description=Verificação diária de renovação de certificado

[Timer]
OnCalendar=daily
RandomizedDelaySec=6h
Persistent=true

[Install]
WantedBy=timers.target
UNIT

  systemctl daemon-reload
  systemctl enable --now certbot-fast-renew.timer >/dev/null 2>&1
  log "Renovação automática ativada."
fi
