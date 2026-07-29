#!/usr/bin/env bash
# Cria o .env ou completa o existente com as chaves novas do .env.example.
#
# Por que isto existe: o .env não é versionado (tem segredos), então um
# `git pull` nunca traz as variáveis novas. Sem esta etapa, uma atualização
# aplica código novo com configuração velha — e o pior caso é silencioso:
# um valor antigo continua sobrescrevendo o padrão novo e mais seguro.
#
# A regra é conservadora: chaves ausentes são acrescentadas com o valor de
# exemplo; chaves já presentes NUNCA são alteradas. O que já foi decidido no
# servidor continua valendo.
#
# Uso: env.sh <APP_DIR>
set -euo pipefail

APP_DIR="${1:-$(pwd)}"
ENV_FILE="${APP_DIR}/.env"
EXAMPLE="${APP_DIR}/.env.example"

GREEN='\033[0;32m'; YELL='\033[0;33m'; NC='\033[0m'
ok()   { printf "   ${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "   ${YELL}!${NC} %s\n" "$1"; }

[ -f "$EXAMPLE" ] || { echo "   .env.example não encontrado em $APP_DIR"; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  cp "$EXAMPLE" "$ENV_FILE"
  ok ".env criado a partir de .env.example — revise antes de usar em produção"
  exit 0
fi

# ---- Completa as chaves que faltam -----------------------------------------
added=0
while IFS= read -r line; do
  case "$line" in
    ''|'#'*) continue ;;
  esac
  key="${line%%=*}"
  # Só nomes de variável; ignora linhas que não sejam atribuição.
  case "$key" in
    *[!A-Za-z0-9_]*|'') continue ;;
  esac

  if ! grep -qE "^[[:space:]]*${key}=" "$ENV_FILE"; then
    if [ "$added" -eq 0 ]; then
      printf '\n# ---------------------------------------------------------------------------\n' >> "$ENV_FILE"
      printf '# Adicionado automaticamente por `make env` (chaves novas do .env.example)\n' >> "$ENV_FILE"
      printf '# ---------------------------------------------------------------------------\n' >> "$ENV_FILE"
    fi
    printf '%s\n' "$line" >> "$ENV_FILE"
    ok "acrescentado: ${key}"
    added=$((added + 1))
  fi
done < "$EXAMPLE"

[ "$added" -eq 0 ] && ok ".env já tem todas as chaves do exemplo (valores preservados)"

# ---- Correção de valores herdados que não servem mais ----------------------
#
# Aqui um valor JÁ EXISTENTE pode ser reescrito — o que só se justifica em dois
# casos, ambos representados abaixo: o valor derruba a máquina, ou o significado
# da variável mudou e o número antigo virou um limite errado. Fora disso, a
# configuração do servidor é lei.
#
# Toda alteração é anunciada com o motivo e precedida de uma cópia de segurança.
backup_made=0
backup_once() {
  [ "$backup_made" -eq 1 ] && return
  cp "$ENV_FILE" "${ENV_FILE}.bak"
  ok "cópia de segurança: ${ENV_FILE}.bak"
  backup_made=1
}

current() {
  grep -E "^[[:space:]]*$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d ' "'
}

set_value() {
  backup_once
  # Reescreve todas as ocorrências da chave, para não deixar uma linha antiga
  # depois da nova (a última venceria e o ajuste seria em vão).
  sed -i.tmp -E "s|^[[:space:]]*$1=.*|$1=$2|" "$ENV_FILE"
  rm -f "${ENV_FILE}.tmp"
}

mem_mb=0
[ -r /proc/meminfo ] && mem_mb=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)

# 1) Uma auditoria por vez em máquina pequena. Duas instâncias do Chromium em
#    1 GB é exatamente o que congela o servidor inteiro.
conc="$(current FAST_MAX_CONCURRENCY)"
if [ "$mem_mb" -gt 0 ] && [ "$mem_mb" -lt 1800 ] && [ -n "$conc" ] && [ "$conc" -gt 1 ] 2>/dev/null; then
  set_value FAST_MAX_CONCURRENCY 1
  warn "FAST_MAX_CONCURRENCY: ${conc} → 1 (só há ${mem_mb} MB de RAM; cada auditoria abre um Chromium)"
fi

# 2) O FAST_RATE_LIMIT mudou de significado: antes contava TODAS as requisições
#    (inclusive arquivos estáticos), agora conta só as rotas leves de API. Um 10
#    herdado bloquearia uso legítimo — as auditorias têm limite próprio.
rate="$(current FAST_RATE_LIMIT)"
if [ -n "$rate" ] && [ "$rate" -lt 30 ] 2>/dev/null; then
  set_value FAST_RATE_LIMIT 60
  warn "FAST_RATE_LIMIT: ${rate} → 60 (agora vale só para /api/; estáticos não contam)"
fi

[ "$backup_made" -eq 1 ] && ok "valores ajustados — o serviço será reiniciado com eles"

exit 0
