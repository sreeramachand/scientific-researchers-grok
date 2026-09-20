# Production topology (single VPS)

Caddy terminates HTTPS and serves the Astro static build. Gunicorn runs Django on loopback. There is no AWS Lambda, API Gateway, S3, CloudFront, or ECR in this path.

```
Internet
   │
   ▼
Caddy :443 (Let's Encrypt)
   ├─ /api/*, /admin*, /static/*  →  127.0.0.1:8007 (gunicorn + Django)
   └─ /*                          →  file_server (Astro `dist`)
```

| Path | Role |
| --- | --- |
| `Caddyfile` | Production site + reverse proxy |
| `Caddyfile.local` | Optional local Caddy in front of the two dev servers |
| `systemd/` | gunicorn unit + Caddy environment drop-in |
| `env.production.example` | VPS EnvironmentFile (secrets stay on the server) |
| `deploy/install.sh` | First-time Ubuntu/Debian bootstrap |
| `deploy/remote-release.sh` | Activate a release (called from GitHub Actions) |
| `deploy/rollback.sh` | Point `current` at a previous release |

Full runbook: [docs/deploy-vps.md](../docs/deploy-vps.md).
