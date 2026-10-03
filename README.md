# Scientific Researchers

Publication and research company site: open community, professional-development, and awards pages; paywalled project papers; account and dashboard for members.

This is a two-folder monorepo.

- `frontend/` — Astro 5, Tailwind CSS 4, TypeScript
- `backend/` — Django 6, Django REST Framework, Neon Postgres via `DATABASE_URL` (SQLite if unset)

## Features

- Responsive header with the official logo and the specified navigation (Projects, Community Services, Professional Development, Awards anchors, Sign Up / Login → profile menu)
- Home page with company copy and Snipcart-ready pricing cards
- Project papers: free abstract + locked PDF until purchase or an active subscription
- Contact form through Web3Forms
- Donate through Buy Me A Coffee
- Auth UI for Google and email/password, wired to Neon Auth when `PUBLIC_NEON_AUTH_URL` is set, including forgot-password for email accounts. Google-only accounts stay on Google sign-in.
- Account page: username, password, change password, change email, billing, subscriptions
- Dashboard: Active Awards, Projects, Submissions, Completed Publications, Webinar links, Poster presentation links

## Requirements

- Node.js 22.12 or newer
- Python 3.12 or newer
- Optional: a Neon project (Postgres + Auth), Snipcart, Web3Forms, and a Buy Me A Coffee page

## Environment

Copy the example file and leave secrets empty until you have real values. **Do not commit `.env`.**

```bash
cp .env.example .env
cp .env.example frontend/.env
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PUBLIC_WEB3FORMS_ACCESS_KEY` | Frontend | Contact form (`https://api.web3forms.com/submit`) |
| `PUBLIC_SNIPCART_API_KEY` | Frontend | Public Snipcart key, inlined at build time, for project-PDF checkout only |
| `PUBLIC_BUYMEACOFFEE_URL` | Frontend | Donate buttons |
| `PUBLIC_NEON_AUTH_URL` | Frontend | Neon Managed Better Auth base URL |
| `PUBLIC_API_URL` | Frontend | Django API origin |
| `NEON_AUTH_BASE_URL` | Backend / Auth | Same Auth URL from the Neon Console |
| `NEON_AUTH_COOKIE_SECRET` | Neon Auth (Next-style hosts) | Cookie signing; unused by this Astro demo client |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Neon Console | Production Google OAuth (set in Neon, not in the app) |
| `DATABASE_URL` | Django | Neon Postgres. Empty → SQLite at `backend/db.sqlite3` |
| `DJANGO_SECRET_KEY` | Django | Required in production |
| `CORS_ALLOWED_ORIGINS` | Django | Frontend origins allowed to call the API |
| `SNIPCART_API_KEY` | Django | Snipcart **secret** API key for `POST /api/entitlements/snipcart/webhook/`. Not the public key, and not stored in this repository. |

Google OAuth redirect URI in Google Cloud must be `{NEON_AUTH_BASE_URL}/callback/google`, not the Astro site origin. Add the Astro origin to Neon Auth trusted domains.

Email password reset calls Neon Auth `POST /request-password-reset` and `POST /reset-password`. The reset link returns to `/reset-password`. Google-only accounts are sent back to Google sign-in instead of an email reset.

A completed Snipcart checkout for a project PDF unlocks that file in the browser using `PUBLIC_SNIPCART_API_KEY`. Recording the order on the server requires `SNIPCART_API_KEY` in the server environment. Until that secret is set, the webhook responds with HTTP 503 and does not grant an entitlement. Do not commit the secret.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server listens on [http://127.0.0.1:43147](http://127.0.0.1:43147).

```bash
npm run build
npm run preview
```

`astro build` must succeed before a release.

## Run the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_papers
python manage.py runserver 127.0.0.1:8007
```

Health check: `http://127.0.0.1:8007/api/health/`

API routes:

- `GET /api/papers/` and `GET /api/papers/<slug>/`
- `GET|PATCH /api/profile/me/` (authenticated)
- `GET /api/entitlements/`
- `GET /api/entitlements/access/?sku=`
- `GET /api/entitlements/subscription/`
- `POST /api/entitlements/snipcart/webhook/` (Snipcart `order.completed`; requires `SNIPCART_API_KEY`)

## Upload paper PDFs

Place production PDFs in `frontend/public/papers/` using the file names in `frontend/public/papers/README.md`. The glioblastoma manuscript is `gene-co-expression-networks-in-glioblastoma-multiforme.pdf`. Its on-site preview is the one-page file under `frontend/public/papers/previews/`.

## Deploy (single VPS)

Production is one VPS: **Caddy** (Let’s Encrypt + reverse proxy), **Astro** static files on disk, and **Django** under gunicorn on loopback. See **[docs/deploy-vps.md](docs/deploy-vps.md)** for provisioning, DNS, GitHub Actions SSH secrets, first deploy, and rollback.

```bash
# On a fresh Ubuntu/Debian VPS (as root), after cloning this repo:
SITE_DOMAIN=scientificresearchers.org ACME_EMAIL=you@scientificresearchers.org \
  bash infra/deploy/install.sh
```

GitHub Actions:

- `.github/workflows/ci.yml` — pull requests: `astro build` and Django `check` / migration / tests
- `.github/workflows/deploy.yml` — push to `main` or **Run workflow**: build artifacts and rsync over SSH

Required GitHub secrets: `VPS_SSH_KEY` (and usually `VPS_HOST` / `VPS_USER` if those are not variables). Django secrets (`DATABASE_URL`, `DJANGO_SECRET_KEY`) stay in `/etc/scientific-researchers/env` on the server.

Local gunicorn (dev machine, no Caddy):

```bash
cd backend
gunicorn config.wsgi:application --bind 127.0.0.1:8007
```
