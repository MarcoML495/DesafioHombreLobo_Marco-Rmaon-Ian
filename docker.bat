@echo off
REM 🐺 Los Lobos de Castronegro - Script de gestion Docker
REM Para Windows

setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="restart" goto restart
if "%1"=="build" goto build
if "%1"=="rebuild" goto rebuild
if "%1"=="logs" goto logs
if "%1"=="logs-back" goto logs-back
if "%1"=="logs-front" goto logs-front
if "%1"=="logs-nginx" goto logs-nginx
if "%1"=="logs-mysql" goto logs-mysql
if "%1"=="shell-back" goto shell-back
if "%1"=="shell-front" goto shell-front
if "%1"=="db-migrate" goto db-migrate
if "%1"=="db-fresh" goto db-fresh
if "%1"=="db-seed" goto db-seed
if "%1"=="status" goto status
if "%1"=="test" goto test
if "%1"=="clean" goto clean
if "%1"=="install" goto install
goto help

:help
echo.
echo 🐺 Los Lobos de Castronegro - Comandos disponibles:
echo.
echo Comandos principales:
echo   docker.bat up          - Iniciar todos los contenedores
echo   docker.bat down        - Detener todos los contenedores
echo   docker.bat restart     - Reiniciar todos los contenedores
echo   docker.bat build       - Construir imagenes
echo   docker.bat rebuild     - Reconstruir todo desde cero
echo.
echo Logs:
echo   docker.bat logs        - Ver logs de todos los servicios
echo   docker.bat logs-back   - Ver logs del backend
echo   docker.bat logs-front  - Ver logs del frontend
echo   docker.bat logs-nginx  - Ver logs de Nginx
echo   docker.bat logs-mysql  - Ver logs de MySQL
echo.
echo Base de datos:
echo   docker.bat db-migrate  - Ejecutar migraciones
echo   docker.bat db-fresh    - Reset BD + migraciones
echo   docker.bat db-seed     - Ejecutar seeders
echo.
echo Shell:
echo   docker.bat shell-back  - Entrar al contenedor backend
echo   docker.bat shell-front - Entrar al contenedor frontend
echo.
echo Utilidades:
echo   docker.bat status      - Ver estado de contenedores
echo   docker.bat test        - Ejecutar tests
echo   docker.bat clean       - Limpiar todo (borra volumenes)
echo   docker.bat install     - Primera instalacion
echo.
goto end

:up
echo 🚀 Iniciando contenedores...
cd Docker
docker compose up -d
cd ..
echo ✅ Contenedores iniciados!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost/api
goto end

:down
echo 🛑 Deteniendo contenedores...
cd Docker
docker compose down
cd ..
echo ✅ Contenedores detenidos
goto end

:restart
echo 🔄 Reiniciando contenedores...
cd Docker
docker compose restart
cd ..
echo ✅ Contenedores reiniciados
goto end

:build
echo 🏗️ Construyendo imagenes...
cd Docker
docker compose build
cd ..
echo ✅ Imagenes construidas
goto end

:rebuild
echo 🔨 Reconstruyendo todo desde cero...
cd Docker
docker compose down -v
docker compose build --no-cache
docker compose up -d
cd ..
echo ✅ Rebuild completo!
goto end

:logs
cd Docker
docker compose logs -f
cd ..
goto end

:logs-back
cd Docker
docker compose logs -f back
cd ..
goto end

:logs-front
cd Docker
docker compose logs -f front
cd ..
goto end

:logs-nginx
cd Docker
docker compose logs -f nginx
cd ..
goto end

:logs-mysql
cd Docker
docker compose logs -f mysql
cd ..
goto end

:shell-back
echo 🐚 Abriendo shell en backend...
cd Docker
docker compose exec back bash
cd ..
goto end

:shell-front
echo 🐚 Abriendo shell en frontend...
cd Docker
docker compose exec front sh
cd ..
goto end

:db-migrate
echo 🗄️ Ejecutando migraciones...
cd Docker
docker compose exec back php artisan migrate
cd ..
echo ✅ Migraciones completadas
goto end

:db-fresh
echo ⚠️ Reseteando base de datos...
cd Docker
docker compose exec back php artisan migrate:fresh
cd ..
echo ✅ Base de datos reseteada
goto end

:db-seed
echo 🌱 Ejecutando seeders...
cd Docker
docker compose exec back php artisan db:seed
cd ..
echo ✅ Seeders completados
goto end

:status
echo 📊 Estado de contenedores:
cd Docker
docker compose ps
cd ..
goto end

:test
echo 🧪 Ejecutando tests...
cd Docker
docker compose exec back php artisan test
cd ..
echo ✅ Tests completados
goto end

:clean
echo ⚠️ ADVERTENCIA: Esto borrara la base de datos!
set /p confirm="¿Estas seguro? (S/N): "
if /i "%confirm%"=="S" (
    echo 🧹 Limpiando todo...
    cd Docker
    docker compose down -v
    cd ..
    echo ✅ Limpieza completa
) else (
    echo Operacion cancelada
)
goto end

:install
echo 📦 Instalacion inicial...
echo 1. Verificando .env...
if not exist "back\.env" (
    echo ⚠️ No existe back\.env, copiando desde .env.example
    copy "back\.env.example" "back\.env"
    echo ⚠️ Edita back\.env antes de continuar
    goto end
)
echo 2. Construyendo contenedores...
cd Docker
docker compose build --no-cache
echo 3. Iniciando servicios...
docker compose up -d
echo 4. Esperando a MySQL...
timeout /t 10 /nobreak > nul
echo 5. Ejecutando migraciones...
docker compose exec back php artisan migrate --force
cd ..
echo ✅ Instalacion completa!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost/api
goto end

:end
endlocal