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

# ---- Limites de memória proporcionais à máquina --------------------------
# Em uma t3.micro (1 GB) o serviço precisa caber em ~700 MB: o resto é kernel,
# nginx e o SSH que salva a máquina quando algo dá errado. Em máquinas maiores
# o teto sobe junto, sempre deixando uma folga de 25% para o sistema.
TOTAL_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
MEMORY_MAX_MB=$(( TOTAL_MB * 70 / 100 ))
MEMORY_HIGH_MB=$(( TOTAL_MB * 55 / 100 ))
[ "$MEMORY_MAX_MB" -lt 512 ] && MEMORY_MAX_MB=512
[ "$MEMORY_HIGH_MB" -lt 384 ] && MEMORY_HIGH_MB=384

# Heap do Node: um terço do teto, com piso de 256 MB. O restante do orçamento
# fica para o Chromium, que roda em processos separados.
NODE_HEAP_MB=$(( MEMORY_MAX_MB / 3 ))
[ "$NODE_HEAP_MB" -lt 256 ] && NODE_HEAP_MB=256
[ "$NODE_HEAP_MB" -gt 1024 ] && NODE_HEAP_MB=1024

log "RAM total ${TOTAL_MB} MB — limite do serviço ${MEMORY_MAX_MB} MB, heap do Node ${NODE_HEAP_MB} MB."

sed -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    -e "s|{{BROWSERS_PATH}}|${BROWSERS_PATH}|g" \
    -e "s|{{MEMORY_MAX}}|${MEMORY_MAX_MB}M|g" \
    -e "s|{{MEMORY_HIGH}}|${MEMORY_HIGH_MB}M|g" \
    -e "s|{{NODE_HEAP_MB}}|${NODE_HEAP_MB}|g" \
    "$TEMPLATE" > "$UNIT"

systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1
log "Unidade ${SERVICE} instalada e habilitada no boot."
