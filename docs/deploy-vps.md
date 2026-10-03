# Deploy to a single VPS (Caddy + Astro + Django)

This is the production path. One cheap VPS runs everything:

- **Caddy** — automatic HTTPS (Let’s Encrypt), the public hostname, and reverse proxy
- **Astro** — `npm run build` output served from disk (`file_server`)
- **Django + DRF** — gunicorn on `127.0.0.1:8007`, reached only through Caddy at `/api/*` (plus `/admin*` and `/static/*`)

The stack is provider-agnostic. A 1 vCPU / 1 GB Ubuntu 24.04 droplet, Hetzner CX22, or Lightsail `$5` instance is enough. **Do not** stand up AWS Lambda, API Gateway, S3, CloudFront, ECR, or a SAM/CDK Lambda stack for this site.

Local development is unchanged: SQLite when `DATABASE_URL` is empty, `npm run dev` on port `43147`, `manage.py runserver` on port `8007`.

## Architecture

```
GitHub Actions (build)
        │ rsync over SSH
        ▼
 /opt/scientific-researchers/releases/<git-sha>/{www,backend,Caddyfile}
        │ symlink current
        ▼
 Caddy :80/:443  ──►  Astro files in current/www
                 ──►  gunicorn 127.0.0.1:8007  ──►  Neon Postgres
```

Node.js is **not** required on the VPS. CI builds the frontend and ships `frontend/dist`. The VPS needs Caddy, Python 3.12+, and the shared virtualenv.

## Prerequisites

1. A VPS with a public IPv4 (IPv6 optional) and Ubuntu 22.04/24.04 or Debian 12.
2. A DNS **A** record (and **AAAA** if you have IPv6) for `SITE_DOMAIN` pointing at that VPS. Port **80** must be reachable for Let’s Encrypt.
3. A Neon `DATABASE_URL` (recommended). SQLite on the VPS works for a smoke test but is not a production database.
4. A GitHub repository admin who can add Actions variables/secrets.
5. An SSH key pair used only for deploys. The **private** key is the GitHub secret `VPS_SSH_KEY`. Never commit it.

## 1. Provision the VPS

Create the smallest regular instance you are comfortable with (1 vCPU, 1 GB RAM, 20 GB disk). Use the vendor’s Ubuntu image. Open inbound **22**, **80**, and **443** only.

SSH in as `root` (or a sudo user) and clone or copy this repository once so the installer can read `infra/`:

```bash
apt-get update && apt-get install -y git
git clone https://github.com/sreeramachand/scientific-researchers-grok.git /tmp/sr
cd /tmp/sr
sudo SITE_DOMAIN=scientificresearchers.org ACME_EMAIL=you@scientificresearchers.org \
  bash infra/deploy/install.sh
```

The installer:

- Adds the official Caddy apt repo and installs Caddy
- Installs Python 3, `venv`, `rsync`, and `ufw`
- Creates system user `sr` (override with `APP_USER`)
- Creates `/opt/scientific-researchers/{releases,shared,scripts}` (override with `DEPLOY_ROOT`)
- Writes `/etc/scientific-researchers/env` **only if it does not already exist**
- Installs the gunicorn systemd unit, a Caddy `EnvironmentFile` drop-in, and a locked-down sudoers file
- Allows SSH / 80 / 443 in `ufw`

On non-Debian images, install those packages yourself and copy the same unit files from `infra/systemd/` and `infra/deploy/sudoers`.

## 2. Point DNS at the VPS

At your DNS host:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` (or `scientificresearchers.org`) | VPS IPv4 |
| AAAA | `@` | VPS IPv6 (optional) |

Wait until `dig +short scientificresearchers.org` returns the VPS address before the first Caddy reload. The sample `infra/Caddyfile` does **not** request a `www` certificate. Uncomment the `www` block only after a `www` record exists.

## 3. Secrets that live on the VPS

Edit `/etc/scientific-researchers/env` (mode `0640`, group `sr`). Start from `infra/env.production.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | **Yes** | Long random string. Generate with `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'` |
| `DJANGO_DEBUG` | **Yes** | `false` |
| `DJANGO_ALLOWED_HOSTS` | **Yes** | Public hostname, e.g. `scientificresearchers.org` |
| `DATABASE_URL` | Recommended | Neon Postgres URL |
| `CORS_ALLOWED_ORIGINS` | Recommended | `https://scientificresearchers.org` |
| `CSRF_TRUSTED_ORIGINS` | Recommended | `https://scientificresearchers.org` |
| `BEHIND_PROXY` | **Yes** | `true` so Django trusts `X-Forwarded-Proto` from Caddy |
| `NEON_AUTH_BASE_URL` | If using Neon Auth | Same Auth URL as the frontend |
| `SNIPCART_API_KEY` | To verify paid PDF orders | Snipcart **secret** API key, not `PUBLIC_SNIPCART_API_KEY`. Set it only in this server env file. Do not commit it. Until it is set, `POST /api/entitlements/snipcart/webhook/` refuses unverified orders. Browser checkout still uses the public key. |

Caddy-only values in `/etc/scientific-researchers/caddy.env`:

| Variable | Purpose |
| --- | --- |
| `SITE_DOMAIN` | Hostname in the `Caddyfile` |
| `ACME_EMAIL` | Let’s Encrypt account email |
| `SITE_ROOT` | `/opt/scientific-researchers/current/www` |

These Django/Caddy secrets are **not** required in GitHub Actions. The deploy job only ships code and already-built frontend files.

## 4. SSH deploy user

`install.sh` creates `sr` with a home directory. Install the **public** half of the deploy key:

```bash
sudo -u sr mkdir -p /home/sr/.ssh
sudo -u sr chmod 700 /home/sr/.ssh
echo 'ssh-ed25519 AAAA… deploy@github' | sudo -u sr tee -a /home/sr/.ssh/authorized_keys
sudo -u sr chmod 600 /home/sr/.ssh/authorized_keys
```

Generate the pair on a trusted machine (not the VPS, not the repo):

```bash
ssh-keygen -t ed25519 -f ./sr-deploy -C "github-actions-sr" -N ""
```

`sr-deploy` (private) → GitHub secret `VPS_SSH_KEY`.  
`sr-deploy.pub` → `authorized_keys` as above.

Record the host key for Actions (preferred over live `ssh-keyscan`):

```bash
ssh-keyscan -t ed25519,rsa YOUR.VPS.IP
```

Paste the output into secret `VPS_SSH_KNOWN_HOSTS`.

## 5. GitHub Variables and Secrets

Create a GitHub **Environment** named `production` (Settings → Environments). Put deploy credentials there or at repository level. Do not commit real values.

### Variables (Settings → Secrets and variables → Actions → Variables, or the `production` environment)

| Name | Required | Example | Used by |
| --- | --- | --- | --- |
| `VPS_HOST` | **Yes** (or as a secret) | `203.0.113.10` or `scientificresearchers.org` | `deploy.yml` SSH target |
| `VPS_USER` | **Yes** (or as a secret) | `sr` | SSH user |
| `VPS_PORT` | No (default `22`) | `22` | SSH port |
| `VPS_DEPLOY_ROOT` | No (default `/opt/scientific-researchers`) | `/opt/scientific-researchers` | Remote app root |
| `SITE_DOMAIN` | Recommended | `scientificresearchers.org` | Frontend `PUBLIC_API_URL` fallback + public health check |
| `PUBLIC_API_URL` | Recommended | `https://scientificresearchers.org` | Inlined into the Astro build (same-origin `/api` through Caddy) |
| `PUBLIC_WEB3FORMS_ACCESS_KEY` | If using contact form | — | Astro build |
| `PUBLIC_SNIPCART_API_KEY` | If using checkout | public test/live key | Astro build |
| `PUBLIC_BUYMEACOFFEE_URL` | If using donate | `https://www.buymeacoffee.com/…` | Astro build |
| `PUBLIC_NEON_AUTH_URL` | If using Neon Auth | `https://….neonauth.dev` | Astro build |

`PUBLIC_*` values may also be stored as secrets if you prefer them hidden. The deploy workflow reads `vars.* || secrets.*`.

### Secrets

| Name | Required | Purpose |
| --- | --- | --- |
| `VPS_SSH_KEY` | **Yes** | Full private key PEM / OpenSSH key, including header and footer |
| `VPS_HOST` | If not a variable | Hostname or IP |
| `VPS_USER` | If not a variable | SSH user (`sr`) |
| `VPS_SSH_KNOWN_HOSTS` | Recommended | Output of `ssh-keyscan` |

No AWS keys, OIDC role, or `AWS_ROLE_ARN` are used.

## 6. First deploy

1. Finish `/etc/scientific-researchers/env` (`DJANGO_SECRET_KEY`, `DATABASE_URL`, `DJANGO_ALLOWED_HOSTS`).
2. Confirm DNS for `SITE_DOMAIN` points at the VPS.
3. Push to `main` or run **Actions → Deploy VPS → Run workflow**.
4. The workflow:
   - Runs Django `check`, migration completeness, SQLite migrate, and tests
   - Builds the Astro site with `PUBLIC_*` from variables/secrets
   - Rsyncs `backend/`, `frontend/dist` → `www/`, and `infra/Caddyfile` into `releases/<git-sha>/`
   - SSHs `remote-release.sh`, which installs Python deps into the **shared** venv, runs `migrate` + `collectstatic`, flips the `current` symlink, restarts gunicorn, and reloads Caddy
5. On the VPS: `curl -fsS http://127.0.0.1:8007/api/health/`
6. From your laptop: `curl -fsS https://scientificresearchers.org/api/health/`

Optional first-time data: `sudo -u sr /opt/scientific-researchers/shared/venv/bin/python /opt/scientific-researchers/current/backend/manage.py seed_papers`

Configure Snipcart allowed domains, Web3Forms, Buy Me A Coffee, and Neon Auth trusted domains to `https://scientificresearchers.org`. Point the Snipcart webhook at `https://scientificresearchers.org/api/entitlements/snipcart/webhook/`. Google OAuth redirect stays `{NEON_AUTH_BASE_URL}/callback/google`.

## 7. CI vs deploy

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Pull requests and `main` | `npm ci` + `astro build`; Django `check`, `makemigrations --check --dry-run`, SQLite `migrate`, `test` |
| `.github/workflows/deploy.yml` | Push to `main` and `workflow_dispatch` | Same checks, production Astro build, SSH rsync, remote migrate/restart/reload |

There are no lint/typecheck npm scripts in this repo; CI does not invent extra linters.

## 8. Rollback

Each successful deploy keeps the previous release path in `/opt/scientific-researchers/shared/previous-release`. On the VPS as `sr`:

```bash
/opt/scientific-researchers/scripts/rollback.sh
# or an explicit git sha that still exists under releases/
/opt/scientific-researchers/scripts/rollback.sh abcdef1234…
```

That retargets `current`, recopies that release’s `Caddyfile`, restarts gunicorn, and reloads Caddy. Database migrations are **not** automatically reversed — roll forward with a fix, or restore Neon from a backup if a migration must be undone.

To redeploy an older commit from GitHub, revert on `main` (or re-run the workflow from that commit if you add a checkout input later). The simplest code rollback is `git revert` + push.

## 9. Manual / emergency deploy

From a trusted machine that already has the deploy key:

```bash
export VPS_HOST=scientificresearchers.org VPS_USER=sr DEPLOY_ROOT=/opt/scientific-researchers
RELEASE="$(git rev-parse HEAD)"
rsync -az --delete --exclude-from=infra/deploy/rsync-backend.exclude \
  backend/ "${VPS_USER}@${VPS_HOST}:${DEPLOY_ROOT}/releases/${RELEASE}/backend/"
# after npm run build
rsync -az --delete frontend/dist/ "${VPS_USER}@${VPS_HOST}:${DEPLOY_ROOT}/releases/${RELEASE}/www/"
scp infra/Caddyfile "${VPS_USER}@${VPS_HOST}:${DEPLOY_ROOT}/releases/${RELEASE}/Caddyfile"
ssh "${VPS_USER}@${VPS_HOST}" "DEPLOY_ROOT=${DEPLOY_ROOT} ${DEPLOY_ROOT}/scripts/remote-release.sh ${RELEASE}"
```

## 10. Local Caddy (optional)

To mimic the production path on a laptop (HTTP only, no certificates):

```bash
# terminal 1
cd backend && python manage.py runserver 127.0.0.1:8007
# terminal 2
cd frontend && npm run dev
# terminal 3
caddy run --config infra/Caddyfile.local
```

Open [http://127.0.0.1:2080](http://127.0.0.1:2080).

## 11. Operations cheat sheet

```bash
sudo systemctl status scientific-researchers-api
sudo systemctl status caddy
sudo journalctl -u scientific-researchers-api -f
sudo journalctl -u caddy -f
curl -fsS http://127.0.0.1:8007/api/health/
sudo -u sr /opt/scientific-researchers/shared/venv/bin/python \
  /opt/scientific-researchers/current/backend/manage.py check --deploy
```

Gunicorn binds **only** to loopback. Do not open port `8007` on the firewall.

## 12. What this repo does not deploy

AWS Lambda, Function URLs, API Gateway, S3 static hosting, CloudFront, ECR, SAM, and CDK are out of scope. If you later add a CDN in front of Caddy, keep Caddy as the origin that holds the certificate **or** terminate TLS at the CDN and talk HTTP to Caddy — that is an optional extra, not the default.
