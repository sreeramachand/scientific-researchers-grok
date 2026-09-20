#!/bin/sh
# Installed as /usr/local/sbin/sr-refresh-caddy (root-owned).
# Copies the active release Caddyfile into place. Invoked via sudo from deploy scripts.
set -eu
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/scientific-researchers}"
src="${DEPLOY_ROOT}/current/Caddyfile"
if [ ! -f "$src" ]; then
  echo "Missing $src" >&2
  exit 1
fi
cp "$src" /etc/caddy/Caddyfile
