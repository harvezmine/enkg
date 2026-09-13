#!/usr/bin/env bash
# Persiapan SEKALI di home server (Ubuntu/Debian) untuk situs ENKG:
# Node.js 22, PM2, nginx, folder aplikasi, konfigurasi nginx, dan PM2 startup.
#
# Jalankan dari akar repo di server:
#   ./deploy/setup-server.sh
# Lalu deploy pertama:
#   ./deploy/deploy.sh

set -euo pipefail

APP_DIR="${ENKG_APP_DIR:-/var/www/enkg}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

node_major() { node -v 2>/dev/null | sed 's/^v//; s/\..*//' || echo 0; }

if [[ "$(node_major)" -lt 20 ]]; then
  echo "▸ Memasang Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v nginx >/dev/null; then
  echo "▸ Memasang nginx"
  sudo apt-get update
  sudo apt-get install -y nginx
fi

if ! command -v pm2 >/dev/null; then
  echo "▸ Memasang PM2"
  sudo npm install -g pm2
fi

echo "▸ Menyiapkan $APP_DIR"
sudo mkdir -p "$APP_DIR/releases" "$APP_DIR/logs"
sudo chown -R "$USER:$USER" "$APP_DIR"
if [[ ! -f "$APP_DIR/.env.production" ]]; then
  cp "$REPO_DIR/.env.example" "$APP_DIR/.env.production"
  chmod 600 "$APP_DIR/.env.production"
  echo "  ✎ Periksa isi $APP_DIR/.env.production (NEXT_PUBLIC_SITE_URL, PORT)"
fi

echo "▸ Memasang konfigurasi nginx"
sudo cp "$REPO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/enkg
sudo ln -sfn /etc/nginx/sites-available/enkg /etc/nginx/sites-enabled/enkg
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo "▸ PM2 ikut menyala setelah reboot + rotasi log"
sudo env PATH="$PATH" "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null
pm2 install pm2-logrotate >/dev/null
pm2 set pm2-logrotate:max_size 10M >/dev/null
pm2 set pm2-logrotate:retain 14 >/dev/null

echo "✓ Server siap. Lanjut: ./deploy/deploy.sh"
echo "  Setelah itu cek lokal: curl -I -H 'Host: everynationkg.com' http://127.0.0.1:8080"
