# Albunmanía — Staging Deploy Runbook

> **Audience:** ops operator with `ssh ryzepeck@<vps>` access.
> **Scope:** first-time provisioning + subsequent deploys for the
> Albunmanía staging instance on the VPS fleet.
> **Server path:** `/home/ryzepeck/webapps/albunmania_staging`
> **Domain:** `albunmania.projectapp.co` (HTTPS via fleet nginx + certbot)
> **Services:** `albunmania_staging` (gunicorn), `albunmania-staging-huey`
> **DB:** MySQL on `localhost:3306`, schema `albunmania_staging`

---

## 0. Pre-deploy checklist (do once, off-server)

Before touching the VPS, gather these secrets and have them ready:

| Variable | How to obtain | Notes |
|----------|---------------|-------|
| `DJANGO_SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(64))"` | 64+ chars |
| `DJANGO_HCAPTCHA_SITEKEY` | hcaptcha.com dashboard → site for `albunmania.projectapp.co` | |
| `DJANGO_HCAPTCHA_SECRET` | same place | |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client (web). Authorized origins: `https://albunmania.projectapp.co`. Authorized redirect URIs: `https://albunmania.projectapp.co/sign-in`. | New client; the template's value MUST NOT be reused. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | same place | |
| `VAPID_PUBLIC_KEY` | `vapid --gen` (or `pip install py-vapid && vapid --gen`) | URL-safe b64 raw point |
| `VAPID_PRIVATE_KEY` | output of same command | URL-safe b64 32-byte scalar |
| `VAPID_CLAIMS_EMAIL` | operator decision (e.g. `admin@albunmania.co`) | mailto address |
| `MYSQL_PASSWORD` | `openssl rand -base64 24` | for the staging DB user |
| `DJANGO_GEOIP_PATH` | Optional. Download a free **GeoLite2-City** `.mmdb` from MaxMind (account required), place it on the server (e.g. `…/albunmania_staging/geoip/GeoLite2-City.mmdb`) and set this to its absolute path. Leave empty to disable IP geolocation — the app degrades gracefully (onboarding falls back to the browser geolocation prompt). | not a secret |

---

## 1. Provision the database (one-time)

SSH into the VPS, then:

```bash
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS albunmania_staging
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'albunmania_staging'@'localhost'
  IDENTIFIED BY '<<MYSQL_PASSWORD>>';
GRANT ALL PRIVILEGES ON albunmania_staging.*
  TO 'albunmania_staging'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Save the password in `config/credentials/mysql-users.env` per fleet
convention so `backup-mysql-and-media.sh` finds it:

```bash
echo 'MYSQL_PWD_albunmania_staging=<<MYSQL_PASSWORD>>' \
  >> /home/ryzepeck/webapps/ops/config/credentials/mysql-users.env
chmod 600 /home/ryzepeck/webapps/ops/config/credentials/mysql-users.env
```

---

## 2. Clone + provision the project

```bash
cd /home/ryzepeck/webapps
git clone https://github.com/carlos18bp/albunmania_project.git albunmania_staging
cd albunmania_staging
git checkout master  # staging tracks master
```

### 2.1 Backend venv + dependencies

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install gunicorn pywebpush  # if not already in requirements
```

### 2.2 Backend .env (production)

```bash
cp deploy/staging/env-templates/backend.env.example backend/.env
nano backend/.env  # fill the <<placeholders>> with the secrets gathered in §0
chmod 600 backend/.env
```

### 2.3 Frontend build

```bash
cd frontend
cp ../deploy/staging/env-templates/frontend.env.production.example .env.production
nano .env.production  # fill VAPID public key + Google client ID
npm ci
npm run build
cd ..
```

### 2.4 Initial Django setup

```bash
cd backend
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser  # answer the prompts
cd ..
```

---

## 3. systemd services

```bash
# Render the service files with the correct paths/user/group.
deploy/staging/scripts/render-systemd.sh \
  | sudo tee /etc/systemd/system/albunmania_staging.service > /dev/null
sudo cp deploy/staging/systemd/albunmania-staging-huey.service \
  /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now albunmania_staging
sudo systemctl enable --now albunmania-staging-huey

sudo systemctl status albunmania_staging
sudo systemctl status albunmania-staging-huey
```

If gunicorn fails to start, tail the logs:
```bash
journalctl -u albunmania_staging -n 100 --no-pager
```

---

## 4. nginx site

```bash
sudo cp deploy/staging/nginx/albunmania-staging.conf \
  /etc/nginx/sites-available/albunmania.projectapp.co
sudo ln -sf /etc/nginx/sites-available/albunmania.projectapp.co \
  /etc/nginx/sites-enabled/

# Issue HTTPS certificate (idempotent — skips if already present).
sudo certbot --nginx -d albunmania.projectapp.co --non-interactive --agree-tos \
  -m admin@projectapp.co

sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Register in projects.yml (fleet ops)

Append the snippet from `deploy/staging/projects.yml.snippet` to
`/home/ryzepeck/webapps/ops/vps/projects.yml` so the fleet helpers
(`server-alerts.sh`, `backup-mysql-and-media.sh`, the
`playwright-validation` skill) recognise this project.

```bash
cat deploy/staging/projects.yml.snippet \
  >> /home/ryzepeck/webapps/ops/vps/projects.yml
```

Verify:
```bash
cd /home/ryzepeck/webapps/ops/vps
source scripts/lib/bootstrap-common.sh
source scripts/lib/project-definitions.sh
is_staging albunmania_staging && echo OK
```

---

## 6. Smoke check

```bash
curl -sf -o /dev/null -w "api/health: %{http_code}\n" \
  https://albunmania.projectapp.co/api/health/
curl -sf -o /dev/null -w "frontend: %{http_code}\n" \
  https://albunmania.projectapp.co/
curl -sf https://albunmania.projectapp.co/api/sponsor/active/ | head -c 200
echo
```

Then create a real test account through the actual sign-in flow with
your verified Google account (must be older than 30 days).

---

## 7. Subsequent deploys

```bash
deploy/staging/scripts/deploy.sh
```

The script does:
1. `git fetch origin master && git reset --hard origin/master`
2. Backend: `pip install -r requirements.txt`, `migrate`, `collectstatic`
3. Frontend: `npm ci && npm run build`
4. Restart `albunmania_staging` + `albunmania-staging-huey`
5. Smoke `curl /api/health/`

---

## 8. Rollback

```bash
cd /home/ryzepeck/webapps/albunmania_staging
git log --oneline -10                # find the last good SHA
git reset --hard <SHA>
deploy/staging/scripts/deploy.sh     # re-runs build + restart
```

If the migration is the offender, also:
```bash
cd backend && source ../venv/bin/activate
python manage.py migrate albunmania_app <previous_migration_name>
```

---

## 9. Optional — seed sample data on staging

ONLY for a fresh staging that nobody is testing yet:

```bash
cd backend && source ../venv/bin/activate
python manage.py create_fake_data --users 10
```

This populates Coca-Cola sponsor, Bavaria CPM campaign, Papelería El
Sol merchant, and 10 collectors with cross-stocked inventories. Skip
when real users are already on staging.
