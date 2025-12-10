# 🐺 Los Lobos de Castronegro - Makefile
# Comandos para gestionar Docker fácilmente

.PHONY: help build up down restart logs logs-back logs-front logs-nginx logs-mysql shell-back shell-front db-migrate db-fresh db-seed clean rebuild status test

# Colores para output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

# Directorio de Docker
DOCKER_DIR = Docker

## help: Muestra esta ayuda
help:
	@echo ''
	@echo '$(CYAN)🐺 Los Lobos de Castronegro - Comandos disponibles:$(RESET)'
	@echo ''
	@echo '$(GREEN)Comandos principales:$(RESET)'
	@echo '  $(YELLOW)make up$(RESET)          - Iniciar todos los contenedores'
	@echo '  $(YELLOW)make down$(RESET)        - Detener todos los contenedores'
	@echo '  $(YELLOW)make restart$(RESET)     - Reiniciar todos los contenedores'
	@echo '  $(YELLOW)make build$(RESET)       - Construir imágenes'
	@echo '  $(YELLOW)make rebuild$(RESET)     - Reconstruir todo desde cero'
	@echo ''
	@echo '$(GREEN)Logs:$(RESET)'
	@echo '  $(YELLOW)make logs$(RESET)        - Ver logs de todos los servicios'
	@echo '  $(YELLOW)make logs-back$(RESET)   - Ver logs del backend'
	@echo '  $(YELLOW)make logs-front$(RESET)  - Ver logs del frontend'
	@echo '  $(YELLOW)make logs-nginx$(RESET)  - Ver logs de Nginx'
	@echo '  $(YELLOW)make logs-mysql$(RESET)  - Ver logs de MySQL'
	@echo ''
	@echo '$(GREEN)Base de datos:$(RESET)'
	@echo '  $(YELLOW)make db-migrate$(RESET)  - Ejecutar migraciones'
	@echo '  $(YELLOW)make db-fresh$(RESET)    - Reset BD + migraciones'
	@echo '  $(YELLOW)make db-seed$(RESET)     - Ejecutar seeders'
	@echo ''
	@echo '$(GREEN)Shell:$(RESET)'
	@echo '  $(YELLOW)make shell-back$(RESET)  - Entrar al contenedor backend'
	@echo '  $(YELLOW)make shell-front$(RESET) - Entrar al contenedor frontend'
	@echo ''
	@echo '$(GREEN)Utilidades:$(RESET)'
	@echo '  $(YELLOW)make status$(RESET)      - Ver estado de contenedores'
	@echo '  $(YELLOW)make test$(RESET)        - Ejecutar tests'
	@echo '  $(YELLOW)make clean$(RESET)       - Limpiar todo (⚠️  borra volúmenes)'
	@echo ''

## up: Iniciar contenedores
up:
	@echo "$(GREEN)🚀 Iniciando contenedores...$(RESET)"
	cd $(DOCKER_DIR) && docker compose up -d
	@echo "$(GREEN)✅ Contenedores iniciados!$(RESET)"
	@echo "$(CYAN)Frontend: http://localhost:5173$(RESET)"
	@echo "$(CYAN)Backend:  http://localhost/api$(RESET)"

## down: Detener contenedores
down:
	@echo "$(YELLOW)🛑 Deteniendo contenedores...$(RESET)"
	cd $(DOCKER_DIR) && docker compose down
	@echo "$(GREEN)✅ Contenedores detenidos$(RESET)"

## restart: Reiniciar contenedores
restart:
	@echo "$(YELLOW)🔄 Reiniciando contenedores...$(RESET)"
	cd $(DOCKER_DIR) && docker compose restart
	@echo "$(GREEN)✅ Contenedores reiniciados$(RESET)"

## build: Construir imágenes
build:
	@echo "$(GREEN)🏗️  Construyendo imágenes...$(RESET)"
	cd $(DOCKER_DIR) && docker compose build
	@echo "$(GREEN)✅ Imágenes construidas$(RESET)"

## rebuild: Reconstruir todo desde cero
rebuild:
	@echo "$(YELLOW)🔨 Reconstruyendo todo desde cero...$(RESET)"
	cd $(DOCKER_DIR) && docker compose down -v
	cd $(DOCKER_DIR) && docker compose build --no-cache
	cd $(DOCKER_DIR) && docker compose up -d
	@echo "$(GREEN)✅ Rebuild completo!$(RESET)"

## logs: Ver logs de todos los servicios
logs:
	cd $(DOCKER_DIR) && docker compose logs -f

## logs-back: Ver logs del backend
logs-back:
	cd $(DOCKER_DIR) && docker compose logs -f back

## logs-front: Ver logs del frontend
logs-front:
	cd $(DOCKER_DIR) && docker compose logs -f front

## logs-nginx: Ver logs de Nginx
logs-nginx:
	cd $(DOCKER_DIR) && docker compose logs -f nginx

## logs-mysql: Ver logs de MySQL
logs-mysql:
	cd $(DOCKER_DIR) && docker compose logs -f mysql

## shell-back: Entrar al contenedor backend
shell-back:
	@echo "$(CYAN)🐚 Abriendo shell en backend...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back bash

## shell-front: Entrar al contenedor frontend
shell-front:
	@echo "$(CYAN)🐚 Abriendo shell en frontend...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec front sh

## db-migrate: Ejecutar migraciones
db-migrate:
	@echo "$(GREEN)🗄️  Ejecutando migraciones...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back php artisan migrate
	@echo "$(GREEN)✅ Migraciones completadas$(RESET)"

## db-fresh: Reset BD + migraciones
db-fresh:
	@echo "$(YELLOW)⚠️  Reseteando base de datos...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back php artisan migrate:fresh
	@echo "$(GREEN)✅ Base de datos reseteada$(RESET)"

## db-seed: Ejecutar seeders
db-seed:
	@echo "$(GREEN)🌱 Ejecutando seeders...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back php artisan db:seed
	@echo "$(GREEN)✅ Seeders completados$(RESET)"

## status: Ver estado de contenedores
status:
	@echo "$(CYAN)📊 Estado de contenedores:$(RESET)"
	cd $(DOCKER_DIR) && docker compose ps

## test: Ejecutar tests
test:
	@echo "$(GREEN)🧪 Ejecutando tests...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back php artisan test
	@echo "$(GREEN)✅ Tests completados$(RESET)"

## clean: Limpiar todo (⚠️ borra volúmenes)
clean:
	@echo "$(YELLOW)⚠️  ¿Estás seguro? Esto borrará la base de datos. [y/N]$(RESET)" && read ans && [ $${ans:-N} = y ]
	@echo "$(YELLOW)🧹 Limpiando todo...$(RESET)"
	cd $(DOCKER_DIR) && docker compose down -v
	@echo "$(GREEN)✅ Limpieza completa$(RESET)"

## install: Primera instalación
install:
	@echo "$(GREEN)📦 Instalación inicial...$(RESET)"
	@echo "$(CYAN)1. Verificando .env...$(RESET)"
	@if [ ! -f back/.env ]; then \
		echo "$(YELLOW)⚠️  No existe back/.env, copiando desde .env.example$(RESET)"; \
		cp back/.env.example back/.env; \
		echo "$(YELLOW)⚠️  Edita back/.env antes de continuar$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)2. Construyendo contenedores...$(RESET)"
	cd $(DOCKER_DIR) && docker compose build --no-cache
	@echo "$(CYAN)3. Iniciando servicios...$(RESET)"
	cd $(DOCKER_DIR) && docker compose up -d
	@echo "$(CYAN)4. Esperando a MySQL...$(RESET)"
	sleep 10
	@echo "$(CYAN)5. Ejecutando migraciones...$(RESET)"
	cd $(DOCKER_DIR) && docker compose exec back php artisan migrate --force
	@echo "$(GREEN)✅ Instalación completa!$(RESET)"
	@echo "$(CYAN)Frontend: http://localhost:5173$(RESET)"
	@echo "$(CYAN)Backend:  http://localhost/api$(RESET)"

## artisan: Ejecutar comando artisan (uso: make artisan cmd="route:list")
artisan:
	cd $(DOCKER_DIR) && docker compose exec back php artisan $(cmd)

## composer: Ejecutar comando composer (uso: make composer cmd="require package")
composer:
	cd $(DOCKER_DIR) && docker compose exec back composer $(cmd)

## npm: Ejecutar comando npm (uso: make npm cmd="install package")
npm:
	cd $(DOCKER_DIR) && docker compose exec front npm $(cmd)
