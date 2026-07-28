# =============================================================================
#  FAST — Plataforma de auditoria web
#
#  Instalação completa:   sudo make install
#  Atualização:           sudo make update
#
#  Ambos são idempotentes: podem ser executados quantas vezes for necessário.
# =============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help install update build deps env ssl nginx service start stop restart \
        status logs dev clean uninstall check doctor

# ---- Configuração ------------------------------------------------------------
APP_NAME    := fast
APP_DIR     := $(shell pwd)
SERVICE     := $(APP_NAME).service
NODE_MAJOR  := 22

# Lê o .env quando existir, para que DOMAIN/EMAIL sigam a configuração real.
ifneq (,$(wildcard $(APP_DIR)/.env))
  include $(APP_DIR)/.env
  export
endif

DOMAIN := $(or $(FAST_DOMAIN),fast.openflexi.com)
EMAIL  := $(or $(FAST_SSL_EMAIL),admin@openflexi.com)

# ---- Cores -------------------------------------------------------------------
BLUE  := \033[0;34m
GREEN := \033[0;32m
YELL  := \033[0;33m
RED   := \033[0;31m
NC    := \033[0m

define step
	@printf "$(BLUE)==>$(NC) %s\n" $(1)
endef

define ok
	@printf "$(GREEN) ✓$(NC) %s\n" $(1)
endef

# =============================================================================
help:
	@printf "\n$(GREEN)FAST$(NC) — auditoria web (performance + SEO + GEO + IA)\n\n"
	@printf "  $(YELL)sudo make install$(NC)   Instalação completa: dependências, build, nginx, SSL e serviço\n"
	@printf "  $(YELL)sudo make update$(NC)    Atualiza o código, reconstrói e reinicia o serviço\n"
	@printf "\n  Comandos auxiliares:\n"
	@printf "    make dev         Sobe backend e frontend em modo de desenvolvimento\n"
	@printf "    make build       Compila backend e frontend\n"
	@printf "    make start       Inicia o serviço\n"
	@printf "    make stop        Para o serviço\n"
	@printf "    make restart     Reinicia o serviço\n"
	@printf "    make status      Estado do serviço\n"
	@printf "    make logs        Acompanha os logs em tempo real\n"
	@printf "    make ssl         Emite ou renova o certificado TLS\n"
	@printf "    make nginx       Reaplica a configuração do nginx\n"
	@printf "    make doctor      Diagnóstico do ambiente\n"
	@printf "    make clean       Remove artefatos de build e node_modules\n"
	@printf "    sudo make uninstall  Remove serviço e configuração do nginx\n\n"
	@printf "  Domínio configurado: $(GREEN)$(DOMAIN)$(NC)\n\n"

# =============================================================================
#  INSTALAÇÃO
# =============================================================================
install: check env deps build nginx service ssl start
	@printf "\n$(GREEN)══════════════════════════════════════════════════════════$(NC)\n"
	@printf "$(GREEN) FAST instalado com sucesso$(NC)\n"
	@printf "$(GREEN)══════════════════════════════════════════════════════════$(NC)\n\n"
	@printf "  Acesse:   https://$(DOMAIN)\n"
	@printf "  Serviço:  systemctl status $(SERVICE)\n"
	@printf "  Logs:     make logs\n\n"
	@if [ -z "$(FAST_AI_URL)" ]; then \
	  printf "  $(YELL)Atenção:$(NC) FAST_AI_URL não definida em .env —\n"; \
	  printf "  a auditoria técnica funciona, mas o Módulo 10 (análise por IA via Ollama) fica desativado.\n"; \
	  printf "  Após configurar o endpoint do Ollama, execute: sudo make restart\n\n"; \
	fi

# =============================================================================
#  ATUALIZAÇÃO
# =============================================================================
update: check
	$(call step,"Baixando alterações do repositório")
	@if [ -d .git ]; then \
	  git fetch --all --quiet && git pull --ff-only || \
	    { printf "$(RED)Falha no git pull. Resolva os conflitos e tente de novo.$(NC)\n"; exit 1; }; \
	else \
	  printf "$(YELL)Sem repositório git — pulando etapa de download.$(NC)\n"; \
	fi
	@$(MAKE) --no-print-directory deps
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory nginx
	@$(MAKE) --no-print-directory service
	@$(MAKE) --no-print-directory restart
	$(call ok,"Atualização concluída")
	@printf "\n  https://$(DOMAIN)\n\n"

# =============================================================================
#  ETAPAS
# =============================================================================
check:
	@if [ "$$(uname -s)" != "Linux" ]; then \
	  printf "$(YELL)Aviso:$(NC) install/update são feitos para Linux (Debian/Ubuntu).\n"; \
	  printf "Em macOS use $(GREEN)make dev$(NC) para desenvolvimento local.\n"; \
	  exit 1; \
	fi
	@if [ "$$(id -u)" != "0" ]; then \
	  printf "$(RED)Este alvo precisa de root.$(NC) Execute: sudo make $(MAKECMDGOALS)\n"; \
	  exit 1; \
	fi

env:
	@if [ ! -f .env ]; then \
	  cp .env.example .env; \
	  printf "$(GREEN) ✓$(NC) .env criado a partir de .env.example — revise antes de usar em produção\n"; \
	else \
	  printf "$(GREEN) ✓$(NC) .env já existe (mantido)\n"; \
	fi

deps:
	$(call step,"Instalando dependências de sistema")
	@bash deploy/scripts/system-deps.sh "$(NODE_MAJOR)"
	$(call step,"Instalando dependências do projeto")
	@# NODE_ENV=production vem do .env e faria o npm pular as devDependencies
	@# (typescript, @types/node, vite, vue-tsc) — que são justamente o que o
	@# build precisa. Forçamos a instalação completa aqui.
	@NODE_ENV=development npm ci --include=dev --no-audit --fund=false 2>/dev/null \
	  || NODE_ENV=development npm install --include=dev --no-audit --fund=false
	$(call step,"Instalando Chromium para o Playwright")
	@npx --yes playwright install --with-deps chromium
	$(call ok,"Dependências prontas")

build:
	$(call step,"Compilando backend e frontend")
	@npm run build
	$(call ok,"Build concluído")

nginx:
	$(call step,"Configurando nginx para $(DOMAIN)")
	@bash deploy/scripts/nginx.sh "$(DOMAIN)" "$(APP_DIR)" "$(or $(PORT),3001)"
	$(call ok,"nginx configurado")

service:
	$(call step,"Instalando serviço systemd")
	@bash deploy/scripts/service.sh "$(APP_DIR)" "$(SERVICE)"
	$(call ok,"Serviço instalado")

ssl:
	$(call step,"Emitindo certificado TLS para $(DOMAIN)")
	@bash deploy/scripts/ssl.sh "$(DOMAIN)" "$(EMAIL)"

# =============================================================================
#  OPERAÇÃO
# =============================================================================
start:
	@systemctl start $(SERVICE)
	@sleep 2
	@systemctl is-active --quiet $(SERVICE) \
	  && printf "$(GREEN) ✓$(NC) Serviço ativo\n" \
	  || { printf "$(RED) ✗ Serviço não subiu. Veja: journalctl -u $(SERVICE) -n 50$(NC)\n"; exit 1; }

stop:
	@systemctl stop $(SERVICE) && printf "$(GREEN) ✓$(NC) Serviço parado\n"

restart:
	@systemctl restart $(SERVICE)
	@sleep 2
	@systemctl is-active --quiet $(SERVICE) \
	  && printf "$(GREEN) ✓$(NC) Serviço reiniciado\n" \
	  || { printf "$(RED) ✗ Falha ao reiniciar. Veja: journalctl -u $(SERVICE) -n 50$(NC)\n"; exit 1; }

status:
	@systemctl status $(SERVICE) --no-pager || true

logs:
	@journalctl -u $(SERVICE) -f --output=short-iso

# =============================================================================
#  DESENVOLVIMENTO
# =============================================================================
dev:
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@if [ ! -d node_modules ]; then NODE_ENV=development npm install --include=dev; fi
	@npx --yes playwright install chromium
	@printf "$(GREEN)Backend$(NC) http://127.0.0.1:$(or $(PORT),3001)  ·  $(GREEN)Frontend$(NC) http://localhost:5173\n\n"
	@npm run dev

# =============================================================================
#  MANUTENÇÃO
# =============================================================================
doctor:
	@bash deploy/scripts/doctor.sh "$(DOMAIN)" "$(SERVICE)" "$(or $(PORT),3001)"

clean:
	@rm -rf node_modules backend/node_modules frontend/node_modules \
	        backend/dist frontend/dist
	@printf "$(GREEN) ✓$(NC) Artefatos removidos\n"

uninstall: check
	@systemctl stop $(SERVICE) 2>/dev/null || true
	@systemctl disable $(SERVICE) 2>/dev/null || true
	@rm -f /etc/systemd/system/$(SERVICE)
	@systemctl daemon-reload
	@rm -f /etc/nginx/sites-enabled/$(DOMAIN) /etc/nginx/sites-available/$(DOMAIN)
	@nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
	@printf "$(GREEN) ✓$(NC) Serviço e configuração do nginx removidos\n"
	@printf "   Os arquivos do projeto e o certificado TLS foram mantidos.\n"
