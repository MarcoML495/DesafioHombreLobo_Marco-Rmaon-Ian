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
│   │   └── cors.php        # Configuración CORS
│   ├── routes/
│   ├── .env                 # Configuración (crear desde .env.example)
│   ├── Dockerfile
│   └── composer.json
├── front/                   # Frontend Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── game.ts     # Lógica principal del juego
│   │   │   ├── gameLobby.ts
│   │   │   └── notifications.ts
│   │   └── styles/
│   │       └── game.css    # Estilos del juego
│   ├── public/
│   ├── .env                 # Variables de entorno frontend
│   ├── vite.config.ts       # Configuración Vite
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
git clone https://github.com/MarcoML495/DesafioHombreLobo_Marco-Rmaon-Ian.git
cd DesafioHombreLobo_Marco-Rmaon-Ian
git checkout dev
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
VITE_REVERB_HOST=localhost        # Cambiar a tu IP para red local
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http

# Cloudinary (para avatares)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

> ⚠️ **Importante:** `DB_HOST=mysql` y `REVERB_HOST=back` son nombres de servicios Docker, NO cambiar a `localhost` o `127.0.0.1`

### Paso 3: Configurar Frontend (.env)

```bash
cd ../front

# Crear archivo .env
touch .env
```

**Para desarrollo local (solo tú):**

```env
VITE_API_URL=http://localhost/api
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

**Para jugar en red local con amigos:**

```env
# Reemplaza 192.168.1.100 con tu IP local
VITE_API_URL=http://192.168.1.100/api
VITE_REVERB_HOST=192.168.1.100
VITE_REVERB_PORT=8080
```

**¿Cómo obtener tu IP?**

```bash
# Mac
ipconfig getifaddr en0

# Linux
hostname -I

# Windows
ipconfig
```

### Paso 4: Verificar configuración de red (CORS)

Edita `back/config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Paso 5: Construir y levantar contenedores

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
vite_front    | ⚡ VITE v7.2.4 ready in 92 ms
vite_front    | ➜  Network: http://172.21.0.3:5173/
nginx_laravel | Configuration complete; ready for start up
```

### Paso 6: Verificar que todo funciona

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
curl http://localhost/api/health

# Probar frontend
curl http://localhost:5173
# Debe devolver HTML
```

---

## 🌐 URLs del entorno

### Desarrollo local (solo tú)

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación Vite |
| **Backend API** | http://localhost/api | API REST (vía Nginx) |
| **Backend directo** | http://localhost:8000 | Laravel artisan serve |
| **WebSocket** | ws://localhost:8080 | Reverb WebSocket |
| **MySQL** | localhost:3306 | Base de datos |

### Red local (jugar con amigos)

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://TU_IP:5173 | Tus amigos acceden aquí |
| **Backend API** | http://TU_IP/api | API REST |
| **WebSocket** | ws://TU_IP:8080 | WebSocket |

Ejemplo: Si tu IP es `192.168.1.100`, tus amigos acceden a `http://192.168.1.100:5173`

---

## 🎮 Configuración para jugar en red local

### 1. Obtén tu IP local

**Mac:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I
```

**Windows:**
```bash
ipconfig
# Busca "Dirección IPv4"
```

### 2. Actualiza `front/.env`

```env
VITE_API_URL=http://192.168.1.100/api
VITE_REVERB_HOST=192.168.1.100
VITE_REVERB_PORT=8080
```

### 3. Configura el firewall

**Mac:**
```bash
# Desactivar firewall temporalmente
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Reactivar después
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

**Linux:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 8080/tcp
```

**Windows:**
- Panel de Control → Firewall → Configuración avanzada
- Crear regla de entrada para puertos 80, 5173, 8080

### 4. Reinicia el frontend

```bash
docker compose restart front
```

### 5. Comparte la URL con tus amigos

```
http://TU_IP:5173
```

**Requisitos:**
- Deben estar en la misma red WiFi
- Tu firewall debe permitir las conexiones

---

## 🎯 Uso diario

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

## 🎮 Sistema de Juego

### Mecánicas principales

- **Chat deshabilitado para jugadores muertos:** Los jugadores eliminados solo pueden leer mensajes
- **Fases día/noche:** Sistema de temporizador sincronizado
  - Día: 60 segundos
  - Noche: 40 segundos
- **WebSockets en tiempo real:** Lobby y chat funcionan sin recargar
- **Sistema de votación:** Votar para eliminar jugadores
- **Notificaciones personalizadas:** Sin alerts del navegador

### Temporizador del juego

El sistema de fases funciona así:

1. **Backend es la fuente de verdad:** El servidor dice cuándo empezó la fase
2. **Frontend calcula:** Cada navegador resta segundos desde el timestamp
3. **Sincronización:** WebSocket avisa a todos cuando cambia la fase
4. **No se desincroniza:** Si recargas, vuelve a calcular desde el backend

### Chat y comunicación

- **Jugadores vivos:** Pueden enviar mensajes según la fase
- **Jugadores muertos:** Input deshabilitado, solo lectura
- **Lobos en noche:** Chat privado entre lobos
- **Aldeanos en noche:** Chat deshabilitado

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

### Cuando cambias tu IP o red

```bash
# 1. Actualizar front/.env con nueva IP
nano front/.env

# 2. Reiniciar frontend
docker compose restart front
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

```bash
# Verificar configuración CORS
docker compose exec back cat config/cors.php

# Debe tener:
# 'supports_credentials' => true
# 'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth']

# Limpiar caché
docker compose exec back php artisan config:clear
docker compose restart back
```

### Frontend no conecta a WebSocket

```bash
# Verificar que Reverb está corriendo
docker compose logs back | grep -i reverb

# Debe mostrar:
# 🔌 Iniciando Reverb WebSocket Server...

# Verificar puerto expuesto
docker compose port back 8080
# Debe mostrar: 0.0.0.0:8080

# Verificar variables de entorno frontend
docker compose exec front cat .env
```

### Amigos no pueden conectarse

```bash
# 1. Verificar que Vite escucha en 0.0.0.0
docker compose logs front | grep Network
# Debe mostrar: Network: http://0.0.0.0:5173/

# 2. Verificar firewall
# Mac: Sistema → Seguridad → Firewall
# Linux: sudo ufw status
# Windows: Panel de Control → Firewall

# 3. Hacer ping desde otro dispositivo
ping TU_IP

# 4. Probar telnet al puerto
telnet TU_IP 5173
```

### Chat deshabilitado incorrectamente

```bash
# Verificar que game.css tiene los estilos
docker compose exec front cat src/styles/game.css | grep "chat-death-notice"

# Verificar que game.ts tiene la lógica
docker compose exec front cat src/components/game.ts | grep "isPlayerAlive"

# Reiniciar frontend
docker compose restart front
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
# Backend
docker compose exec back php artisan config:clear
docker compose restart back

# Frontend
docker compose restart front
```

### Error "intl extension required"

```bash
# Verificar que intl está instalado
docker compose exec back php -m | grep intl

# Si no aparece, rebuild
docker compose build --no-cache back
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

### Sincronización en tiempo real

```
Backend (Laravel)
    ↓
Reverb (WebSocket Server)
    ↓
Broadcast a canal (lobby.{id})
    ↓
Todos los clientes conectados reciben evento
    ↓
Frontend actualiza UI
```

---

## 👥 Para el equipo

### Primera vez que descargas el proyecto:

```bash
# 1. Clonar repo
git clone https://github.com/MarcoML495/DesafioHombreLobo_Marco-Rmaon-Ian.git
cd DesafioHombreLobo_Marco-Rmaon-Ian
git checkout dev

# 2. Configurar backend .env
cd back
cp .env.example .env
nano .env  # Editar DB_HOST=mysql, REVERB_HOST=back

# 3. Configurar frontend .env
cd ../front
touch .env
# Agregar variables VITE_* (ver sección Paso 3)

# 4. Construir e iniciar
cd ../Docker
docker compose build --no-cache
docker compose up -d

# 5. Ejecutar migraciones
docker compose exec back php artisan migrate

# 6. Acceder
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

### Para jugar en red local:

```bash
# 1. Obtener IP
ipconfig getifaddr en0  # Mac

# 2. Actualizar front/.env con tu IP
nano front/.env

# 3. Reiniciar frontend
docker compose restart front

# 4. Compartir URL con amigos
# http://TU_IP:5173
```

### Antes de hacer commit:

```bash
# Verificar que todo funciona
docker compose ps  # Todos deben estar "Up"

# Limpiar archivos temporales
docker compose exec back php artisan optimize:clear

# No commitear archivos .env
# Ya están en .gitignore
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
| **Obtener IP** | `ipconfig getifaddr en0` (Mac) |
| **Jugar en red** | Editar `front/.env` → `docker compose restart front` |

---

## 🔥 Características principales

✅ **Sistema de juego completo**
- Lobby con WebSocket en tiempo real
- Chat sincronizado entre jugadores
- Sistema de fases día/noche
- Votaciones y eliminaciones
- Notificaciones personalizadas

✅ **Multijugador en red local**
- Juega con amigos en la misma WiFi
- Configuración simple con variables de entorno
- Sin necesidad de servidor externo

✅ **UI/UX profesional**
- Diseño responsive
- Animaciones y transiciones suaves
- Sistema de notificaciones custom (sin alerts del navegador)
- Chat deshabilitado automáticamente para jugadores muertos

✅ **Infraestructura robusta**
- Docker para desarrollo consistente
- Laravel Reverb para WebSockets
- Vite con hot-reload
- MySQL con healthcheck

---

## 📞 Soporte

Si algo no funciona:

1. Ver logs: `docker compose logs -f`
2. Verificar servicios: `docker compose ps`
3. Consultar sección **Troubleshooting**
4. Revisar que `.env` tenga `DB_HOST=mysql` y `REVERB_HOST=back`
5. Para red local, verificar firewall y que `front/.env` tenga tu IP

---

## 📝 Créditos

Desarrollado por:
- Marco
- Ramon
- Ian

Proyecto académico - Desafío Hombre Lobo

---

**¡Que disfrutes cazando lobos! 🐺🌙**
