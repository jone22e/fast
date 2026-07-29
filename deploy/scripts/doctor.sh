#!/usr/bin/env bash
# Diagnóstico do ambiente do FAST.
# Uso: doctor.sh <DOMINIO> <SERVICE> <PORTA>
set -uo pipefail

DOMAIN="${1:-fast.openflexi.com}"
SERVICE="${2:-fast.service}"
PORT="${3:-3001}"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELL='\033[0;33m'; NC='\033[0m'

ok()   { printf "  ${GREEN}✓${NC} %s\n" "$1"; }
bad()  { printf "  ${RED}✗${NC} %s\n" "$1"; }
warn() { printf "  ${YELL}!${NC} %s\n" "$1"; }

IS_ROOT=0; [ "$(id -u)" = "0" ] && IS_ROOT=1

printf "\nDiagnóstico do FAST\n───────────────────\n\n"
[ "$IS_ROOT" = "1" ] || printf "  ${YELL}!${NC} Sem sudo: checagens de certificado e nginx exigem root. Rode 'sudo make doctor' para o diagnóstico completo.\n\n"

# ---- Node -------------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  major="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  [ "$major" -ge 20 ] && ok "Node.js $(node -v)" || bad "Node.js $(node -v) — mínimo é v20"
else
  bad "Node.js não instalado"
fi

command -v npm >/dev/null 2>&1 && ok "npm $(npm -v)" || bad "npm não instalado"

# ---- Memória ----------------------------------------------------------------
# Uma auditoria sobe um Chromium; sem swap, o pico em uma máquina de 1 GB não
# gera erro — congela o servidor inteiro, SSH incluído.
if [ -r /proc/meminfo ]; then
  mem_mb=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
  swap_mb=$(awk '/SwapTotal/ {printf "%d", $2/1024}' /proc/meminfo)

  if [ "$mem_mb" -lt 1800 ]; then
    warn "RAM total ${mem_mb} MB — máquina pequena: o modo de baixa memória do Chromium é ativado automaticamente"
  else
    ok "RAM total ${mem_mb} MB"
  fi

  if [ "$swap_mb" -ge 1024 ]; then
    ok "Swap ativo (${swap_mb} MB)"
  elif [ "$swap_mb" -gt 0 ]; then
    warn "Swap de apenas ${swap_mb} MB — recomendado 2 GB: sudo make swap"
  else
    bad "Sem swap — em 1 GB de RAM o servidor pode travar por completo. Rode: sudo make swap"
  fi

  conc="$(grep -E '^FAST_MAX_CONCURRENCY=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' ')"
  if [ "$mem_mb" -lt 1800 ] && [ -n "$conc" ] && [ "$conc" -gt 1 ] 2>/dev/null; then
    warn "FAST_MAX_CONCURRENCY=${conc} com ${mem_mb} MB de RAM — use 1 nesta máquina"
  fi
fi

# ---- Arquivos ---------------------------------------------------------------
[ -f .env ] && ok ".env presente" || warn ".env ausente — rode: make env"
[ -d backend/dist ] && ok "Backend compilado" || warn "Backend não compilado — rode: make build"
[ -d frontend/dist ] && ok "Frontend compilado" || warn "Frontend não compilado — rode: make build"
[ -d node_modules ] && ok "Dependências instaladas" || warn "node_modules ausente — rode: make deps"

# ---- Chromium ---------------------------------------------------------------
chromium_found=false
for dir in "${PLAYWRIGHT_BROWSERS_PATH:-}" \
           "$HOME/.cache/ms-playwright" \
           "$HOME/Library/Caches/ms-playwright" \
           "/root/.cache/ms-playwright"; do
  [ -n "$dir" ] || continue
  if compgen -G "${dir}/chromium*" >/dev/null 2>&1; then
    ok "Chromium do Playwright instalado (${dir})"
    chromium_found=true
    break
  fi
done
[ "$chromium_found" = true ] || \
  bad "Chromium não encontrado — rode: npx playwright install --with-deps chromium"

# ---- Chave da IA ------------------------------------------------------------
if [ -f .env ] && grep -qE '^FAST_AI_URL=.+' .env; then
  ai_url="$(grep -E '^FAST_AI_URL=' .env | head -1 | cut -d= -f2-)"
  ok "FAST_AI_URL configurada (Módulo 10 ativo via Ollama)"
  # Testa se o endpoint do Ollama responde (host da API, sem o caminho /api/generate).
  ai_base="$(printf '%s' "$ai_url" | sed -E 's#(/api/.*)$##')"
  if [ -n "$ai_base" ] && curl -fsS --max-time 6 "$ai_base/api/tags" >/dev/null 2>&1; then
    ok "Ollama acessível em $ai_base"
  else
    warn "Ollama em $ai_base não respondeu — confirme que o serviço está no ar e alcançável"
  fi
else
  warn "FAST_AI_URL não definida — auditoria técnica roda, análise por IA fica desativada"
fi

# ---- Serviço ----------------------------------------------------------------
if command -v systemctl >/dev/null 2>&1; then
  if systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE}"; then
    if systemctl is-active --quiet "$SERVICE"; then
      ok "Serviço ${SERVICE} ativo"
    else
      bad "Serviço ${SERVICE} parado — veja: journalctl -u ${SERVICE} -n 50"
    fi
  else
    warn "Serviço ${SERVICE} não instalado — rode: sudo make service"
  fi
fi

# ---- Backend ----------------------------------------------------------------
if curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  ok "Backend respondendo em 127.0.0.1:${PORT}"
else
  bad "Backend não responde em 127.0.0.1:${PORT}"
fi

# ---- nginx ------------------------------------------------------------------
if command -v nginx >/dev/null 2>&1; then
  if [ "$IS_ROOT" = "1" ]; then
    nginx -t >/dev/null 2>&1 && ok "Configuração do nginx válida" || bad "Configuração do nginx inválida (nginx -t)"
  else
    # Sem root, o nginx -t não lê os certificados e falha por permissão (falso
    # negativo). Não reportamos como erro.
    warn "Config do nginx: rode 'sudo make doctor' para validar (nginx -t exige root)"
  fi
  [ -L "/etc/nginx/sites-enabled/${DOMAIN}" ] && ok "Site ${DOMAIN} habilitado" || warn "Site ${DOMAIN} não habilitado — rode: sudo make nginx"
else
  warn "nginx não instalado"
fi

# ---- TLS --------------------------------------------------------------------
# /etc/letsencrypt/live só é legível por root; sem sudo daria falso negativo.
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if [ "$IS_ROOT" != "1" ]; then
  warn "Certificado da origem: rode 'sudo make doctor' para checar (arquivos exigem root)"
elif [ -f "$CERT" ]; then
  end="$(openssl x509 -enddate -noout -in "$CERT" 2>/dev/null | cut -d= -f2)"
  days=$(( ($(date -d "$end" +%s) - $(date +%s)) / 86400 ))
  if [ "$days" -gt 30 ]; then ok "Certificado TLS válido por ${days} dias"
  elif [ "$days" -gt 0 ]; then warn "Certificado TLS expira em ${days} dias — rode: sudo make ssl"
  else bad "Certificado TLS expirado — rode: sudo make ssl"; fi
else
  warn "Sem certificado para ${DOMAIN} — rode: sudo make ssl"
fi

# ---- DNS --------------------------------------------------------------------
resolved="$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1)"
[ -n "$resolved" ] && ok "DNS: ${DOMAIN} → ${resolved}" || warn "DNS de ${DOMAIN} não resolve"

# ---- Público ----------------------------------------------------------------
if curl -fsS --max-time 8 "https://${DOMAIN}/api/health" >/dev/null 2>&1; then
  ok "https://${DOMAIN} acessível publicamente"
elif curl -fsS --max-time 8 "http://${DOMAIN}/api/health" >/dev/null 2>&1; then
  warn "http://${DOMAIN} responde, mas HTTPS ainda não"
else
  warn "Domínio não respondeu externamente (pode ser DNS, firewall ou o serviço parado)"
fi

printf "\n"
