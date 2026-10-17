# Deploying Harizeon to your domain

This is the turnkey path to serve the full product (console + API + scanner) at
`harizeon.com`. Everything is one `docker compose` command once two things exist:
a host and a DNS record.

## Prerequisites

- A Linux host with Docker and Docker Compose — a $5/mo VPS (DigitalOcean,
  Hetzner, Linode) or any always-on machine with a public IP.
- Access to `harizeon.com`'s DNS records (wherever you bought the domain).

## 1. Point the domain at the host

In your DNS registrar, create an **A record**:

```
harizeon.com  ->  <your server's public IP>
```

(If you use Cloudflare, turn the proxy off first so Caddy can issue a cert, then
you can turn it back on.)

If you don't have a public IP (e.g. a home machine behind NAT), use a
[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
instead of an A record — `cloudflared tunnel` forwards `harizeon.com` to
`localhost` with TLS handled by Cloudflare.

## 2. Configure secrets

```bash
git clone https://github.com/HarizuAru/Harizeon.git
cd Harizeon
cp .env.example .env
# edit .env: set HARIZEON_MASTER_KEY (32+ chars) and HARIZEON_APP_PASSWORD
```

## 3. Bring the stack up

```bash
DOMAIN=harizeon.com docker compose up -d --build
```

This starts db, redis, worker, migrate (migrations + app role), api, web, and
**caddy** (TLS). After ~30 seconds Caddy issues the `harizeon.com` certificate
and the site is live at `https://harizeon.com`.

## 4. Remove GitHub Pages (if you were using it)

Delete the `CNAME` file and disable Pages in the repo settings, otherwise
`harizeon.com` will keep resolving to the static README page instead of your
server.

## What you get

| URL | Service |
|---|---|
| https://harizeon.com | Console (login, dashboard, scans, findings, reports) |
| https://harizeon.com/api/v1/* | Control-plane API (proxied through the console) |

Postgres has no public port; Redis is bound to `127.0.0.1`; the worker has no
database credentials. Backups: `infra/db/backup.sh`, restore: `infra/db/restore.sh`.

## Updating

```bash
git pull
docker compose up -d --build
```
