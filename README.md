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
- Auth UI for Google and email/password, wired to Neon Auth when `PUBLIC_NEON_AUTH_URL` is set, with a local demo session otherwise
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
| `PUBLIC_SNIPCART_API_KEY` | Frontend | Paywall checkout and subscriptions |
| `PUBLIC_BUYMEACOFFEE_URL` | Frontend | Donate buttons |
| `PUBLIC_NEON_AUTH_URL` | Frontend | Neon Managed Better Auth base URL |
| `PUBLIC_API_URL` | Frontend | Django API origin |
| `NEON_AUTH_BASE_URL` | Backend / Auth | Same Auth URL from the Neon Console |
| `NEON_AUTH_COOKIE_SECRET` | Neon Auth (Next-style hosts) | Cookie signing; unused by this Astro demo client |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Neon Console | Production Google OAuth (set in Neon, not in the app) |
| `DATABASE_URL` | Django | Neon Postgres. Empty → SQLite at `backend/db.sqlite3` |
| `DJANGO_SECRET_KEY` | Django | Required in production |
| `CORS_ALLOWED_ORIGINS` | Django | Frontend origins allowed to call the API |

Google OAuth redirect URI in Google Cloud must be `{NEON_AUTH_BASE_URL}/callback/google`, not the Astro site origin. Add the Astro origin to Neon Auth trusted domains.

When keys are missing, the UI still works: contact stores a local confirmation, checkout grants a browser entitlement, and auth uses `localStorage`.

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

## Upload paper PDFs

Place production PDFs in `frontend/public/papers/` using the file names in `frontend/public/papers/README.md`. Placeholder PDFs ship so the paywall preview has something to open after unlock.

## Deploy

1. Build the frontend (`npm run build` in `frontend/`) and host `frontend/dist` on any static host (Netlify, Cloudflare Pages, S3+CDN, nginx).
2. Set the `PUBLIC_*` variables at build time so Astro inlines them.
3. Run Django with gunicorn behind TLS, with `DATABASE_URL` pointed at Neon and `DJANGO_DEBUG=false`.
4. Configure Snipcart allowed domains, Web3Forms domain, Buy Me A Coffee URL, and Neon Auth trusted domains to the production origin.
5. Point `PUBLIC_API_URL` and `CORS_ALLOWED_ORIGINS` at those production hosts.

Example gunicorn command:

```bash
cd backend
gunicorn config.wsgi:application --bind 0.0.0.0:8007
```
