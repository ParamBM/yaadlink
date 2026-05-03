#!/bin/bash
set -e

echo "──────────────────────────────────────"
echo " YaadLink – Container Startup"
echo "──────────────────────────────────────"

cd /var/www/html

# ── 1. Generate APP_KEY if not set ────────────────────────────────────────────
if [ -z "$APP_KEY" ]; then
    echo "[entrypoint] Generating application key..."
    php artisan key:generate --force
fi

# ── 2. Run database migrations ────────────────────────────────────────────────
echo "[entrypoint] Running migrations..."
php artisan migrate --force

# ── 3. Cache config / routes / views for production ──────────────────────────
echo "[entrypoint] Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── 4. Ensure correct ownership of storage ────────────────────────────────────
chown -R www-data:www-data storage bootstrap/cache

# ── 5. Start all services via Supervisor ─────────────────────────────────────
echo "[entrypoint] Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
