# ─────────────────────────────────────────────
# Stage 1: Node – build frontend assets (Vite)
# ─────────────────────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copy only dependency manifests first for layer-cache efficiency
COPY package.json package-lock.json ./

# Install ALL node dependencies (including devDeps needed for Vite build)
# Use npm install instead of npm ci to handle platform-specific lock file differences
# (package-lock.json generated on Windows may have mismatched optional native deps for Linux)
RUN npm install --legacy-peer-deps

# Copy the rest of the source so Vite can find resources/
COPY . .

# Build the production frontend bundle into public/build
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: PHP – install Composer dependencies
# ─────────────────────────────────────────────
FROM composer:2.8 AS composer-builder

WORKDIR /app

COPY composer.json composer.lock ./

# Install production PHP dependencies only (no dev tools)
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ─────────────────────────────────────────────
# Stage 3: Final runtime image
# ─────────────────────────────────────────────
FROM php:8.2-fpm-alpine

# ── System dependencies ──────────────────────
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    sqlite-dev \
    postgresql-dev \
    git \
    bash

# ── PHP extensions ───────────────────────────
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp && \
    docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_sqlite \
        pdo_pgsql \
        pgsql \
        mbstring \
        xml \
        bcmath \
        gd \
        opcache \
        pcntl

# ── Copy application source ──────────────────
WORKDIR /var/www/html

COPY . .

# ── Copy built vendor + public/build from previous stages ──
COPY --from=composer-builder /app/vendor ./vendor
COPY --from=node-builder      /app/public/build ./public/build

# ── Storage & bootstrap cache directories ────
RUN mkdir -p \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/cache/data \
        storage/logs \
        bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache

# ── Nginx configuration ──────────────────────
RUN rm -f /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf

# ── Supervisor configuration ─────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── PHP OPcache tuning ───────────────────────
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# ── Entrypoint ────────────────────────────────
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
