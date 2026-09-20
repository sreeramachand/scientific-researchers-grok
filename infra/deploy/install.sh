#!/usr/bin/env bash
# First-time VPS bootstrap for Ubuntu/Debian (DigitalOcean, Hetzner, Lightsail, etc.).
# Run as root on a fresh VM after pointing DNS A/AAAA at this host.
#
#   curl is not required — copy this repo up and run:
#     sudo bash infra/deploy/install.sh
#
# Idempotent: safe to re-run. Does not overwrite /etc/scientific-researchers/env
# if that file already exists.

set -euo pipefail

APP_USER="${APP_USER:-sr}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/scientific-researchers}"
SITE_DOMAIN="${SITE_DOMAIN:-scientificresearchers.org}"
ACME_EMAIL="${ACME_EMAIL:-admin@${SITE_DOMAIN}}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root (sudo bash infra/deploy/install.sh)" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer targets Debian/Ubuntu (apt). Install Caddy, Python 3.12+, rsync, and a venv by hand on other distros." >&2
  exit 1
fi

apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  debian-keyring \
  debian-archive-keyring \
  apt-transport-https \
  gnupg \
  python3 \
  python3-pip \
  python3-venv \
  rsync \
  ufw

if [[ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]]; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
fi
if [[ ! -f /etc/apt/sources.list.d/caddy-stable.list ]]; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
fi
apt-get update -y
apt-get install -y caddy

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "/home/${APP_USER}" --shell /bin/bash "${APP_USER}"
fi

mkdir -p \
  "${DEPLOY_ROOT}/releases" \
  "${DEPLOY_ROOT}/shared/venv" \
  "${DEPLOY_ROOT}/shared/media" \
  "${DEPLOY_ROOT}/scripts" \
  /etc/scientific-researchers \
  /etc/systemd/system/caddy.service.d

if [[ ! -x "${DEPLOY_ROOT}/shared/venv/bin/python" ]]; then
  python3 -m venv "${DEPLOY_ROOT}/shared/venv"
fi
"${DEPLOY_ROOT}/shared/venv/bin/pip" install --upgrade pip

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

SERVICE_TMP="$(mktemp)"
sed \
  -e "s|/opt/scientific-researchers|${DEPLOY_ROOT}|g" \
  -e "s|^User=sr$|User=${APP_USER}|" \
  -e "s|^Group=sr$|Group=${APP_USER}|" \
  "${REPO_ROOT}/infra/systemd/scientific-researchers-api.service" \
  > "${SERVICE_TMP}"
install -m 0644 "${SERVICE_TMP}" /etc/systemd/system/scientific-researchers-api.service
rm -f "${SERVICE_TMP}"

SUDOERS_TMP="$(mktemp)"
sed "s|^sr |${APP_USER} |" "${REPO_ROOT}/infra/deploy/sudoers" > "${SUDOERS_TMP}"
if [[ "${DEPLOY_ROOT}" != "/opt/scientific-researchers" ]]; then
  sed -i "s|/opt/scientific-researchers|${DEPLOY_ROOT}|g" "${SUDOERS_TMP}"
fi
install -m 0440 "${SUDOERS_TMP}" /etc/sudoers.d/scientific-researchers
rm -f "${SUDOERS_TMP}"
visudo -cf /etc/sudoers.d/scientific-researchers
install -m 0755 "${REPO_ROOT}/infra/deploy/refresh-caddy.sh" /usr/local/sbin/sr-refresh-caddy
if [[ "${DEPLOY_ROOT}" != "/opt/scientific-researchers" ]]; then
  sed -i "s|/opt/scientific-researchers|${DEPLOY_ROOT}|g" /usr/local/sbin/sr-refresh-caddy
fi
install -m 0644 "${REPO_ROOT}/infra/systemd/caddy-override.conf" \
  /etc/systemd/system/caddy.service.d/override.conf
if [[ ! -f /etc/scientific-researchers/caddy.env ]]; then
  sed \
    -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=${SITE_DOMAIN}|" \
    -e "s|^ACME_EMAIL=.*|ACME_EMAIL=${ACME_EMAIL}|" \
    -e "s|^SITE_ROOT=.*|SITE_ROOT=${DEPLOY_ROOT}/current/www|" \
    "${REPO_ROOT}/infra/systemd/caddy.env.example" \
    > /etc/scientific-researchers/caddy.env
  chmod 0644 /etc/scientific-researchers/caddy.env
fi

if [[ ! -f /etc/scientific-researchers/env ]]; then
  sed \
    -e "s|^DJANGO_ALLOWED_HOSTS=.*|DJANGO_ALLOWED_HOSTS=${SITE_DOMAIN}|" \
    -e "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://${SITE_DOMAIN}|" \
    -e "s|^CSRF_TRUSTED_ORIGINS=.*|CSRF_TRUSTED_ORIGINS=https://${SITE_DOMAIN}|" \
    -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=${SITE_DOMAIN}|" \
    -e "s|^ACME_EMAIL=.*|ACME_EMAIL=${ACME_EMAIL}|" \
    -e "s|^SITE_ROOT=.*|SITE_ROOT=${DEPLOY_ROOT}/current/www|" \
    "${REPO_ROOT}/infra/env.production.example" \
    > /etc/scientific-researchers/env
  chmod 0640 /etc/scientific-researchers/env
  echo "Wrote /etc/scientific-researchers/env from the example. Edit DJANGO_SECRET_KEY and DATABASE_URL before serving traffic."
fi

install -d -m 0755 -o "${APP_USER}" -g "${APP_USER}" \
  "${DEPLOY_ROOT}" \
  "${DEPLOY_ROOT}/releases" \
  "${DEPLOY_ROOT}/shared" \
  "${DEPLOY_ROOT}/shared/media" \
  "${DEPLOY_ROOT}/scripts"
chown -R "${APP_USER}:${APP_USER}" "${DEPLOY_ROOT}"
chgrp "${APP_USER}" /etc/scientific-researchers/env
chmod 0640 /etc/scientific-researchers/env

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

systemctl daemon-reload
systemctl enable caddy
# API unit is enabled but not started until the first release symlink exists.
systemctl enable scientific-researchers-api || true

echo
echo "Bootstrap complete."
echo "  1. Edit /etc/scientific-researchers/env (DJANGO_SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS)."
echo "  2. Add an SSH public key for ${APP_USER} (GitHub secret VPS_SSH_KEY is the matching private key)."
echo "  3. Point ${SITE_DOMAIN} A/AAAA at this VPS, then run the deploy workflow."
echo "  4. Caddy will obtain a Let's Encrypt certificate on the first successful reload."
