# ManadaFullHouse -- Entorno de desarrollo con Docker

Proyecto dividido en:

-   `back/` → Laravel (API)
-   `front/` → Vite (frontend TypeScript)
-   `Docker/` → Docker Compose, Nginx, etc.

Este README explica cómo levantar el entorno completo para desarrollo
sin volverse loco 😄

------------------------------------------------------------------------
## 1. Requisitos

-   Docker
-   Docker Compose
-   (Opcional) DBeaver u otro cliente para MySQL

------------------------------------------------------------------------

## 2. Estructura del proyecto

``` text
root/
├─ back/          # Laravel
├─ front/         # Vite
└─ Docker/
   ├─ docker-compose.yml
   └─ nginx/
      └─ default.conf
```

> Todos los comandos de Docker se ejecutan desde la carpeta `Docker/`.

------------------------------------------------------------------------

## 3. Configuración inicial

### 3.1. Configurar `.env` de Laravel

En `back/`:

1.  Copiar el `.env` de ejemplo (si aún no existe):

    ``` bash
    cd back
    cp .env.example .env
    ```

2.  Editar `back/.env` para usar la BD del contenedor MySQL:

    ``` env
    APP_URL=http://localhost:8000

    DB_CONNECTION=mysql
    DB_HOST=mysql
    DB_PORT=3306
    DB_DATABASE=ManadaFullHouse
    DB_USERNAME=root
    DB_PASSWORD=Miguel

    VITE_APP_URL=${APP_URL}
    ```

> `DB_HOST=mysql` es el NOMBRE del servicio en `docker-compose.yml`, no
> cambiarlo a `127.0.0.1`.

### 3.2. Puertos estándar del proyecto

En `Docker/docker-compose.yml` se asume:

-   API Laravel: **http://localhost:8000**
-   Frontend Vite: **http://localhost:5173**
-   MySQL: **localhost:3306** (root / Miguel)

``` yaml
nginx:
  ports:
    - "8000:80"

front:
  ports:
    - "5173:5173"

mysql:
  ports:
    - "3306:3306"
```

------------------------------------------------------------------------

## 4. Levantar el entorno

Desde la carpeta `Docker/`:

### 4.1. Primera vez (o cuando cambie algo de Docker)

``` bash
cd Docker
docker-compose up --build
```

Para levantarlo en segundo plano:

``` bash
docker-compose up --build -d
```

### 4.2. Detener el entorno

``` bash
docker-compose down
```

------------------------------------------------------------------------

## 5. Comandos habituales (Laravel)

### 5.1. Ejecutar migraciones

``` bash
docker exec -it laravel_back php artisan migrate
```

### 5.2. Ejecutar seeders

``` bash
docker exec -it laravel_back php artisan db:seed
```

### 5.3. Limpiar cachés

``` bash
docker exec -it laravel_back php artisan optimize:clear
```

### 5.4. Consola Bash

``` bash
docker exec -it laravel_back bash
```

------------------------------------------------------------------------

## 6. Frontend (Vite)

El contenedor `vite_front` ya ejecuta `npm run dev` automáticamente.

Acceder al contenedor:

``` bash
docker exec -it vite_front bash
```

------------------------------------------------------------------------

## 7. Base de datos

### 7.1. Datos de acceso (DBeaver)

-   Host: `localhost`
-   Puerto: `3306`
-   Usuario: `root`
-   Password: `Miguel`
-   BD: `ManadaFullHouse`

### 7.2. Desde Laravel

``` env
DB_HOST=mysql
```

------------------------------------------------------------------------

## 8. URLs del entorno

-   API Laravel → http://localhost:8000\
-   Frontend Vite → http://localhost:5173

------------------------------------------------------------------------

## 9. Troubleshooting

### 9.1. Laravel no responde

``` bash
docker logs nginx_laravel
docker logs laravel_back
```

### 9.2. BD no conecta

``` bash
docker logs mysql_db
docker exec -it laravel_back php artisan migrate
```

### 9.3. Cambios en `.env` no aplican

``` bash
docker exec -it laravel_back php artisan config:clear
```

------------------------------------------------------------------------

## 10. Resumen para el equipo

1.  Configurar `.env`.
2.  `cd Docker && docker-compose up --build -d`
3.  Ejecutar migraciones.
4.  API en `localhost:8000`, Front en `localhost:5173`.
5.  Para apagar: `docker-compose down`
