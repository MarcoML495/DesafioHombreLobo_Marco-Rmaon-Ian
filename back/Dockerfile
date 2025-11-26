FROM php:8.2-fpm

# Extensiones necesarias
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    && docker-php-ext-install pdo_mysql zip gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Solo composer.* para cache
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-progress || true

# Copiamos el resto al hacer build inicial
COPY . .

# Permisos
RUN chown -R www-data:www-data storage bootstrap/cache

# php-fpm se lanza por defecto
