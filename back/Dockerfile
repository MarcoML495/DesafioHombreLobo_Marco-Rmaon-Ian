FROM php:8.2-fpm

# Instalar dependencias del sistema (incluye libicu-dev para intl)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libicu-dev \
    && docker-php-ext-install pdo_mysql zip gd pcntl sockets intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar archivos de dependencias primero
COPY composer.json composer.lock* ./

# Instalar dependencias durante BUILD
RUN composer install --no-interaction --prefer-dist --no-scripts --no-dev --optimize-autoloader || true

# Copiar código fuente
COPY . .

# Ejecutar scripts post-install
RUN composer dump-autoload --optimize --no-scripts || true

# Configurar permisos
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Exponer puertos
EXPOSE 8000 8080

