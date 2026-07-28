#!/usr/bin/env bash
# Instala e habilita a unidade systemd do FAST.
# Uso: service.sh <APP_DIR> <SERVICE_NAME>
set -euo pipefail

APP_DIR="${1:?diretório da aplicação obrigatório}"
SERVICE="${2:-fast.service}"
TEMPLATE="${APP_DIR}/deploy/systemd/fast.service.template"
UNIT="/etc/systemd/system/${SERVICE}"

log() { printf "   %s\n" "$1"; }

[ -f "$TEMPLATE" ] || { echo "Template não encontrado: $TEMPLATE"; exit 1; }

# O Chromium do Playwright é instalado no cache do usuário que rodou o install
# (root, via sudo). Apontamos o serviço para o mesmo cache.
BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/root/.cache/ms-playwright}"
if [ ! -d "$BROWSERS_PATH" ] && [ -d "${HOME:-/root}/.cache/ms-playwright" ]; then
  BROWSERS_PATH="${HOME}/.cache/ms-playwright"
fi

# O usuário de serviço precisa conseguir ler os binários do navegador.
if [ -d "$BROWSERS_PATH" ]; then
  chmod -R a+rX "$BROWSERS_PATH" 2>/dev/null || true
  # /root não é legível por outros usuários; ajustamos apenas o caminho de busca.
  if [[ "$BROWSERS_PATH" == /root/* ]]; then
    chmod a+x /root 2>/dev/null || true
  fi
fi

chown -R fast:fast "$APP_DIR" 2>/dev/null || true

sed -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    -e "s|{{BROWSERS_PATH}}|${BROWSERS_PATH}|g" \
    "$TEMPLATE" > "$UNIT"

systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1
log "Unidade ${SERVICE} instalada e habilitada no boot."
