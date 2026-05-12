#!/usr/bin/env bash
#
# Albunmanía staging — incremental deploy.
# Run on the VPS after the runbook's first-time provisioning is done.
#
# Steps:
#   1. Pull latest master (hard reset — staging follows master strictly).
#   2. Backend: install deps, migrate, collectstatic.
#   3. Frontend: install deps, production build.
#   4. Restart gunicorn + huey.
#   5. Smoke health check.
#
# Exits non-zero if any step fails so a CI runner can detect it.
#
set -euo pipefail

PROJ_PATH="${PROJ_PATH:-/home/ryzepeck/webapps/albunmania_staging}"
BRANCH="${BRANCH:-master}"
GUNICORN_SVC="${GUNICORN_SVC:-albunmania_staging}"
HUEY_SVC="${HUEY_SVC:-albunmania-staging-huey}"
DOMAIN="${DOMAIN:-albunmania.projectapp.co}"

cd "${PROJ_PATH}"

echo "==> 1/5  git fetch + reset to origin/${BRANCH}"
git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"
echo "    HEAD: $(git rev-parse --short HEAD)"

echo "==> 2/5  backend: pip install + migrate + collectstatic"
source venv/bin/activate
pip install -r backend/requirements.txt --quiet
cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd ..

echo "==> 3/5  frontend: npm ci + build"
cd frontend
npm ci --silent
npm run build
cd ..

echo "==> 4/5  restart services"
sudo systemctl restart "${GUNICORN_SVC}"
sudo systemctl restart "${HUEY_SVC}"
sleep 3
sudo systemctl is-active --quiet "${GUNICORN_SVC}" \
  || { echo "FATAL: ${GUNICORN_SVC} not active"; exit 2; }
sudo systemctl is-active --quiet "${HUEY_SVC}" \
  || { echo "FATAL: ${HUEY_SVC} not active"; exit 2; }
echo "    services up"

echo "==> 5/5  smoke check https://${DOMAIN}/api/health/"
HEALTH=$(curl -sf -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health/" || echo "000")
if [ "${HEALTH}" != "200" ]; then
  echo "FATAL: health check returned ${HEALTH}"
  exit 3
fi
echo "    health: 200"

echo "✅ Deploy complete."
