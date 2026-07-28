#!/usr/bin/env bash
# Instala as dependências de sistema necessárias ao FAST.
# Uso: system-deps.sh <NODE_MAJOR>
set -euo pipefail

NODE_MAJOR="${1:-22}"

log() { printf "   %s\n" "$1"; }

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Este script assume Debian/Ubuntu (apt-get)."
  echo "Instale manualmente: nodejs >= ${NODE_MAJOR}, nginx, certbot, git, curl."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

log "Atualizando índice de pacotes…"
apt-get update -qq

log "Instalando pacotes base…"
apt-get install -y -qq \
  curl ca-certificates gnupg git build-essential \
  nginx certbot python3-certbot-nginx >/dev/null

# ---- Node.js ----------------------------------------------------------------
install_node=true
if command -v node >/dev/null 2>&1; then
  current="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  if [ "$current" -ge "$NODE_MAJOR" ]; then
    log "Node.js v$(node -v | tr -d v) já atende ao mínimo exigido."
    install_node=false
  else
    log "Node.js v${current} é antigo; instalando a versão ${NODE_MAJOR}…"
  fi
fi

if [ "$install_node" = true ]; then
  log "Instalando Node.js ${NODE_MAJOR}.x via NodeSource…"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
  log "Node.js $(node -v) instalado."
fi

# ---- Usuário de serviço -----------------------------------------------------
if ! id -u fast >/dev/null 2>&1; then
  log "Criando usuário de sistema 'fast'…"
  useradd --system --create-home --home-dir /var/lib/fast --shell /usr/sbin/nologin fast
fi

# ---- Firewall (se ativo) ----------------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  log "Liberando portas 80 e 443 no ufw…"
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

log "Dependências de sistema prontas."
