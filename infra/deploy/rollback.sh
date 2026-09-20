#!/usr/bin/env bash
# Flip `current` back to the previous release and reload services.
# Run on the VPS as the deploy user:
#   /opt/scientific-researchers/scripts/rollback.sh
# Or pass an explicit release directory / id:
#   /opt/scientific-researchers/scripts/rollback.sh <release_id>

set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/scientific-researchers}"
TARGET="${1:-}"

if [[ -n "${TARGET}" ]]; then
  if [[ -d "${DEPLOY_ROOT}/releases/${TARGET}" ]]; then
    RELEASE_DIR="${DEPLOY_ROOT}/releases/${TARGET}"
  elif [[ -d "${TARGET}" ]]; then
    RELEASE_DIR="${TARGET}"
  else
    echo "Release not found: ${TARGET}" >&2
    exit 1
  fi
else
  if [[ ! -f "${DEPLOY_ROOT}/shared/previous-release" ]]; then
    echo "No previous-release pointer. Pass a release id from ${DEPLOY_ROOT}/releases/." >&2
    exit 1
  fi
  RELEASE_DIR="$(cat "${DEPLOY_ROOT}/shared/previous-release")"
fi

if [[ ! -d "${RELEASE_DIR}/backend" || ! -d "${RELEASE_DIR}/www" ]]; then
  echo "Cannot roll back; ${RELEASE_DIR} is incomplete." >&2
  exit 1
fi

ln -sfn "${RELEASE_DIR}" "${DEPLOY_ROOT}/current"

if [[ -f "${RELEASE_DIR}/Caddyfile" ]]; then
  sudo /usr/local/sbin/sr-refresh-caddy
fi

sudo /bin/systemctl restart scientific-researchers-api
sudo /bin/systemctl reload caddy

curl -fsS "http://127.0.0.1:8007/api/health/" >/dev/null
echo "${RELEASE_DIR}" > "${DEPLOY_ROOT}/shared/current-release"
echo "Rolled back to ${RELEASE_DIR}"
