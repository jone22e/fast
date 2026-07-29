#!/usr/bin/env bash
# Cria (ou redimensiona) o arquivo de swap da máquina.
#
# Por que isto existe: uma t3.micro tem 1 GB de RAM e nenhum swap por padrão.
# Quando o Chromium encosta no limite, o kernel não tem para onde empurrar as
# páginas frias — ele entra em thrashing de reclaim e a máquina inteira congela,
# inclusive o SSH. Com swap, o mesmo pico vira lentidão momentânea em vez de um
# servidor perdido que só volta com reboot.
#
# O swap é rede de segurança, não memória extra: o limite do serviço no systemd
# continua sendo o que impede uma auditoria de consumir a máquina.
#
# Uso: swap.sh [TAMANHO_EM_GB]   (padrão: 2)
set -euo pipefail

SIZE_GB="${1:-2}"
SWAPFILE="/swapfile"

log() { printf "   %s\n" "$1"; }

[ "$(id -u)" -eq 0 ] || { echo "Execute como root (sudo)."; exit 1; }

CURRENT_KB="$(awk '/SwapTotal/ {print $2}' /proc/meminfo)"
CURRENT_GB=$(( CURRENT_KB / 1024 / 1024 ))

if [ "$CURRENT_KB" -gt 0 ] && [ "$CURRENT_GB" -ge "$SIZE_GB" ]; then
  log "Swap já ativo com ${CURRENT_GB} GB — nada a fazer."
  exit 0
fi

if swapon --show=NAME --noheadings 2>/dev/null | grep -qx "$SWAPFILE"; then
  log "Desativando o swap atual para redimensionar…"
  swapoff "$SWAPFILE"
fi

log "Criando ${SWAPFILE} com ${SIZE_GB} GB…"
rm -f "$SWAPFILE"
# fallocate é instantâneo; dd é o plano B em sistemas de arquivo que não o aceitam.
fallocate -l "${SIZE_GB}G" "$SWAPFILE" 2>/dev/null ||
  dd if=/dev/zero of="$SWAPFILE" bs=1M count=$(( SIZE_GB * 1024 )) status=none

chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE" >/dev/null
swapon "$SWAPFILE"

# Persiste no boot.
if ! grep -q "^${SWAPFILE} " /etc/fstab; then
  printf '%s none swap sw 0 0\n' "$SWAPFILE" >> /etc/fstab
  log "Entrada adicionada ao /etc/fstab."
fi

# swappiness baixo: o kernel só recorre ao swap sob pressão real, e não troca
# páginas quentes do Chromium por disco a cada pico — o que deixaria a auditoria
# lenta sem necessidade. vfs_cache_pressure menor preserva o cache de inodes,
# que é barato e ajuda a servir os arquivos estáticos.
cat > /etc/sysctl.d/60-fast-swap.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sysctl --quiet --load /etc/sysctl.d/60-fast-swap.conf

log "Swap ativo: $(free -h | awk '/Swap:/ {print $2}')"
