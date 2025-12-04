# 🐺 Los Lobos de Castronegro - ManadaFullHouse

Juego multijugador de hombres lobo con **Laravel + Vite + WebSockets** en tiempo real.

## 📋 Requisitos

- **Docker** (versión 20.10+)
- **Docker Compose** (versión 2.0+)
- (Opcional) DBeaver u otro cliente para MySQL

---

## 📁 Estructura del proyecto

```text
proyecto/
├── back/                    # Laravel API + WebSockets
│   ├── app/
│   ├── config/
│   ├── routes/
│   ├── .env                 # Configuración (crear desde .env.example)
│   ├── Dockerfile
│   └── composer.json
├── front/                   # Frontend Vite + TypeScript
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
└── Docker/
    ├── docker-compose.yml   # Orquestador de servicios
    └── nginx/
        └── default.conf     # Configuración Nginx
```

> **Importante:** Todos los comandos de Docker se ejecutan desde `Docker/`

---

## 🚀 Instalación desde cero

### Paso 1: Clonar el repositorio

```bash
git clone [url-del-repo]
cd proyecto
```

### Paso 2: Configurar Backend (.env)

```bash
cd back

# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env  # o tu editor preferido
```

**Configuración mínima necesaria en `back/.env`:**

```env
# Aplicación
APP_NAME="Los Lobos de Castronegro"
APP_ENV=local
APP_KEY=                          # Se genera automáticamente
APP_DEBUG=true
APP_URL=http://localhost

# Base de datos (usar estos valores exactos)
DB_CONNECTION=mysql
DB_HOST=mysql                     # Nombre del servicio en docker-compose
DB_PORT=3306
DB_DATABASE=ManadaFullHouse
DB_USERNAME=root
DB_PASSWORD=Miguel

# Reverb WebSocket (usar estos valores exactos)
REVERB_APP_ID=werewolf_lobby_app
REVERB_APP_KEY=werewolf_lobby_key
REVERB_APP_SECRET=your_super_secret_key
REVERB_HOST=back                  # Nombre del servicio backend
REVERB_PORT=8080
REVERB_SCHEME=http

# Frontend (para conexión WebSocket desde navegador)
VITE_REVERB_HOST=localhost        # NO cambiar
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http

# Cloudinary (para avatares)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

> ⚠️ **Importante:** `DB_HOST=mysql` y `REVERB_HOST=back` son nombres de servicios Docker, NO cambiar a `localhost` o `127.0.0.1`

### Paso 3: Verificar package.json del frontend

El archivo `front/package.json` debe incluir:

```json
{
  "dependencies": {
    "client-only": "^0.0.1",
    "laravel-echo": "^1.16.1",
    "pusher-js": "^8.4.0"
  }
}
```

Si falta alguna dependencia:

```bash
cd front
npm install laravel-echo pusher-js
```

### Paso 4: Construir y levantar contenedores

```bash
cd Docker

# Primera vez: construir imágenes (tarda 5-10 minutos)
docker compose build --no-cache

# Iniciar servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f
```

**Deberías ver:**

```
mysql_db      | Ready for start up
laravel_back  | 🚀 Iniciando servicios Laravel...
laravel_back  | ✅ MySQL está listo
laravel_back  | 🔌 Iniciando Reverb WebSocket Server...
laravel_back  | 🌐 Iniciando servidor Laravel...
vite_front    | 🚀 Iniciando servicios Vite...
vite_front    | ⚡ VITE v7.1.7 ready in 500 ms
nginx_laravel | Configuration complete; ready for start up
```

### Paso 5: Verificar que todo funciona

```bash
# Ver estado de contenedores
docker compose ps

# Todos deben estar "Up" o "Up (healthy)":
# NAME           STATUS
# mysql_db       Up (healthy)
# laravel_back   Up
# vite_front     Up
# nginx_laravel  Up

# Probar backend
curl http://localhost/api/register
# No debe dar error de conexión

# Probar frontend
curl http://localhost:5173
# Debe devolver HTML
```

---

## 🌐 URLs del entorno

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación Vite |
| **Backend API** | http://localhost/api | API REST (vía Nginx) |
| **Backend directo** | http://localhost:8000 | Laravel artisan serve |
| **WebSocket** | ws://localhost:8080 | Reverb WebSocket |
| **MySQL** | localhost:3306 | Base de datos |

---

## 🎮 Uso diario

### Iniciar el entorno

```bash
cd Docker
docker compose up -d
```

### Detener el entorno

```bash
docker compose down
```

### Ver logs

```bash
# Todos los servicios
docker compose logs -f

# Solo un servicio
docker compose logs -f back
docker compose logs -f front
docker compose logs -f nginx
```

### Reiniciar un servicio

```bash
docker compose restart back
docker compose restart front
docker compose restart nginx
```

---

## 🔧 Comandos Laravel comunes

### Ejecutar dentro del contenedor

```bash
# Entrar al contenedor
docker compose exec back bash

# O ejecutar comandos directamente
docker compose exec back php artisan [comando]
```

### Migraciones

```bash
# Ejecutar migraciones
docker compose exec back php artisan migrate

# Rollback
docker compose exec back php artisan migrate:rollback

# Refresh (drop + migrate)
docker compose exec back php artisan migrate:fresh

# Con seeders
docker compose exec back php artisan migrate:fresh --seed
```

### Caché y optimización

```bash
# Limpiar todas las cachés
docker compose exec back php artisan optimize:clear

# Limpiar config
docker compose exec back php artisan config:clear

# Limpiar rutas
docker compose exec back php artisan route:clear

# Limpiar vistas
docker compose exec back php artisan view:clear
```

### Otros comandos útiles

```bash
# Ver rutas
docker compose exec back php artisan route:list

# Crear controlador
docker compose exec back php artisan make:controller NombreController

# Crear modelo
docker compose exec back php artisan make:model NombreModelo -m

# Tinker (consola interactiva)
docker compose exec back php artisan tinker
```

---

## 📦 Gestión de dependencias

### Backend (Composer)

```bash
# Instalar paquete
docker compose exec back composer require vendor/package

# Actualizar dependencias
docker compose exec back composer update

# Dump autoload
docker compose exec back composer dump-autoload
```

### Frontend (npm)

```bash
# Entrar al contenedor
docker compose exec front sh

# Instalar paquete
npm install package-name

# Actualizar dependencias
npm update

# Salir
exit

# Reiniciar frontend para aplicar cambios
docker compose restart front
```

---

## 🗄️ Base de datos

### Acceso con DBeaver/MySQL Workbench

- **Host:** `localhost`
- **Puerto:** `3306`
- **Usuario:** `root`
- **Password:** `Miguel`
- **Base de datos:** `ManadaFullHouse`

### Desde Laravel

Laravel usa `DB_HOST=mysql` (nombre del servicio Docker), no `localhost`.

### Backup y restore

```bash
# Exportar base de datos
docker compose exec mysql mysqldump -uroot -pMiguel ManadaFullHouse > backup.sql

# Importar base de datos
docker compose exec -T mysql mysql -uroot -pMiguel ManadaFullHouse < backup.sql

# Acceder a MySQL directamente
docker compose exec mysql mysql -uroot -pMiguel ManadaFullHouse
```

---

## 🔄 Actualizar el proyecto

### Cuando hay cambios en código

```bash
# Frontend (TypeScript/CSS)
# Los cambios se reflejan automáticamente (hot reload)

# Backend (PHP)
# Laravel detecta cambios automáticamente
```

### Cuando hay cambios en dependencias

```bash
# Si cambió composer.json
docker compose exec back composer install

# Si cambió package.json
docker compose exec front npm install
docker compose restart front
```

### Cuando hay cambios en Dockerfile o docker-compose.yml

```bash
cd Docker

# Rebuild del servicio modificado
docker compose build --no-cache back
# o
docker compose build --no-cache front

# Reiniciar
docker compose up -d
```

---

## 🐛 Troubleshooting

### Contenedor no inicia o se reinicia

```bash
# Ver logs del contenedor problemático
docker compose logs back
docker compose logs front
docker compose logs nginx

# Ver qué contenedores están corriendo
docker compose ps

# Reiniciar contenedor específico
docker compose restart [servicio]
```

### Error "Cannot connect to MySQL"

```bash
# Ver logs de MySQL
docker compose logs mysql

# Esperar a que MySQL esté listo (puede tardar 30 segundos)
docker compose exec back php artisan db:show

# Verificar .env
docker compose exec back cat .env | grep DB_
```

### Error "CORS" o "Access-Control-Allow-Origin"

Laravel maneja CORS automáticamente. Verifica:

```bash
# Ver configuración CORS
docker compose exec back cat config/cors.php

# Debe tener:
# 'allowed_origins' => ['*']
# 'allowed_methods' => ['*']
# 'allowed_headers' => ['*']
```

### Frontend no conecta a WebSocket

```bash
# Verificar que Reverb está corriendo
docker compose logs back | grep -i reverb

# Debe mostrar:
# ✅ Reverb iniciado (PID: ...)

# Verificar puerto expuesto
docker compose port back 8080
# Debe mostrar: 0.0.0.0:8080
```

### Puerto 80, 3306, 5173 u 8000 ya en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80
sudo lsof -i :3306
sudo lsof -i :5173
sudo lsof -i :8000

# Matar proceso
sudo kill -9 [PID]

# O cambiar puerto en docker-compose.yml:
# ports:
#   - "8080:80"  # En lugar de 80:80
```

### Cambios en .env no se aplican

```bash
# Limpiar caché de configuración
docker compose exec back php artisan config:clear

# Reiniciar contenedor
docker compose restart back
```

### Error "intl extension required"

Ya está solucionado en el Dockerfile actual, pero si aparece:

```bash
# Verificar que intl está instalado
docker compose exec back php -m | grep intl

# Si no aparece, rebuild
docker compose build --no-cache back
```

### Dependencias (node_modules o vendor) no se instalan

```bash
# Backend
docker compose exec back composer install

# Frontend
docker compose exec front npm install

# Si persiste, rebuild
docker compose build --no-cache
```

---

## 🧹 Limpieza y reset

### Limpiar caché de Docker

```bash
# Limpiar todo (cuidado, borra TODAS las imágenes no usadas)
docker system prune -a

# Solo limpiar volúmenes del proyecto
cd Docker
docker compose down -v
```

### Reset completo del proyecto

```bash
cd Docker

# Detener y eliminar todo
docker compose down -v

# Eliminar imágenes
docker rmi docker-back docker-front

# Reconstruir desde cero
docker compose build --no-cache

# Iniciar
docker compose up -d

# Ejecutar migraciones
docker compose exec back php artisan migrate --force
```

---

## 📊 Arquitectura del proyecto

### Servicios Docker

```
┌─────────────────┐
│   Navegador     │
│  (localhost)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Puerto  │
    │ 5173    │  ← Frontend (Vite)
    └─────────┘
    
    ┌─────────┐
    │ Puerto  │
    │   80    │  ← Nginx (Proxy)
    └────┬────┘
         │
    ┌────┴────┐
    │ Puerto  │
    │  8000   │  ← Backend (Laravel)
    └────┬────┘
         │
    ┌────┴────┐
    │ Puerto  │
    │  8080   │  ← WebSocket (Reverb)
    └─────────┘
    
    ┌─────────┐
    │ Puerto  │
    │  3306   │  ← MySQL
    └─────────┘
```

### Flujo de datos

1. **Usuario → Frontend (5173)**: Interfaz del juego
2. **Frontend → Nginx (80) → Laravel (8000)**: API REST
3. **Frontend → WebSocket (8080)**: Chat y lobby en tiempo real
4. **Laravel → MySQL (3306)**: Persistencia de datos

---

## 👥 Para el equipo

### Primera vez que descargas el proyecto:

```bash
# 1. Clonar repo
git clone [url]
cd proyecto

# 2. Configurar .env
cd back
cp .env.example .env
nano .env  # Editar DB_HOST=mysql, REVERB_HOST=back

# 3. Construir e iniciar
cd ../Docker
docker compose build --no-cache
docker compose up -d

# 4. Ejecutar migraciones
docker compose exec back php artisan migrate

# 5. Acceder
# Frontend: http://localhost:5173
# Backend: http://localhost/api
```

### Para trabajar diariamente:

```bash
# Iniciar
cd Docker && docker compose up -d

# Ver logs si algo falla
docker compose logs -f

# Detener al terminar
docker compose down
```

### Antes de hacer commit:

```bash
# Verificar que todo funciona
docker compose ps  # Todos deben estar "Up"

# Limpiar archivos temporales
docker compose exec back php artisan optimize:clear
```

---

## 🎯 Resumen ejecutivo

| Acción | Comando |
|--------|---------|
| **Primera instalación** | `cp .env.example .env` → editar → `docker compose build` → `docker compose up -d` |
| **Iniciar** | `docker compose up -d` |
| **Detener** | `docker compose down` |
| **Ver logs** | `docker compose logs -f` |
| **Migraciones** | `docker compose exec back php artisan migrate` |
| **Reset completo** | `docker compose down -v` → `docker compose build --no-cache` |

---

## 📞 Soporte

Si algo no funciona:

1. Ver logs: `docker compose logs -f`
2. Verificar servicios: `docker compose ps`
3. Consultar sección **Troubleshooting**
4. Revisar que `.env` tenga `DB_HOST=mysql` y `REVERB_HOST=back`

---

**¡Que disfrutes cazando lobos! 🐺🌙**
