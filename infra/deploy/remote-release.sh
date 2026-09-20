#!/usr/bin/env bash
# Activate a staged release on the VPS. Called over SSH from GitHub Actions.
#
# Usage:
#   remote-release.sh <release_id>
#
# Expects:
#   $DEPLOY_ROOT/releases/<release_id>/{backend,www,Caddyfile}
#   shared venv at $DEPLOY_ROOT/shared/venv
#   EnvironmentFile at /etc/scientific-researchers/env

set -euo pipefail

RELEASE_ID="${1:-}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/scientific-researchers}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

if [[ -z "${RELEASE_ID}" ]]; then
  echo "Usage: remote-release.sh <release_id>" >&2
  exit 1
fi

RELEASE_DIR="${DEPLOY_ROOT}/releases/${RELEASE_ID}"
CURRENT_LINK="${DEPLOY_ROOT}/current"
VENV="${DEPLOY_ROOT}/shared/venv"
ENV_FILE="/etc/scientific-researchers/env"

if [[ ! -d "${RELEASE_DIR}/backend" || ! -d "${RELEASE_DIR}/www" ]]; then
  echo "Release ${RELEASE_ID} is incomplete (need backend/ and www/)." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy infra/env.production.example on the VPS first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ ! -x "${VENV}/bin/pip" ]]; then
  python3 -m venv "${VENV}"
fi

"${VENV}/bin/pip" install --upgrade pip
"${VENV}/bin/pip" install -r "${RELEASE_DIR}/backend/requirements.txt"

ln -sfn "${DEPLOY_ROOT}/shared/media" "${RELEASE_DIR}/backend/media"

PREVIOUS=""
if [[ -L "${CURRENT_LINK}" ]]; then
  PREVIOUS="$(readlink -f "${CURRENT_LINK}" || true)"
fi

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

(
  cd "${CURRENT_LINK}/backend"
  "${VENV}/bin/python" manage.py migrate --noinput
  "${VENV}/bin/python" manage.py collectstatic --noinput
  "${VENV}/bin/python" manage.py check
)

if [[ -f "${CURRENT_LINK}/Caddyfile" ]]; then
  sudo /usr/local/sbin/sr-refresh-caddy
fi

sudo /bin/systemctl restart scientific-researchers-api
sudo /bin/systemctl reload caddy

# Loopback health check — does not depend on public DNS or certificates.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:8007/api/health/" >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS "http://127.0.0.1:8007/api/health/" >/dev/null

if [[ -n "${PREVIOUS}" ]]; then
  echo "${PREVIOUS}" > "${DEPLOY_ROOT}/shared/previous-release"
fi
echo "${RELEASE_DIR}" > "${DEPLOY_ROOT}/shared/current-release"

# Prune old releases, keeping the current + previous + KEEP_RELEASES newest.
mapfile -t ALL_RELEASES < <(ls -1dt "${DEPLOY_ROOT}/releases/"* 2>/dev/null || true)
KEEP=()
KEEP+=("${RELEASE_DIR}")
if [[ -n "${PREVIOUS}" ]]; then
  KEEP+=("${PREVIOUS}")
fi
count=0
for dir in "${ALL_RELEASES[@]}"; do
  skip=false
  for kept in "${KEEP[@]}"; do
    if [[ "${dir}" == "${kept}" ]]; then
      skip=true
      break
    fi
  done
  if $skip; then
    continue
  fi
  count=$((count + 1))
  if [[ "${count}" -gt "${KEEP_RELEASES}" ]]; then
    rm -rf "${dir}"
  fi
done

echo "Activated release ${RELEASE_ID}"
