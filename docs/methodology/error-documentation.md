---
trigger: manual
description: Error documentation and known issues tracking. Reference when debugging, fixing bugs, or encountering recurring issues.
---

# Error Documentation — Albunmanía

Catálogo de errores conocidos, su contexto y resolución. Se alimenta al cerrar épicas y al detectar problemas recurrentes. Última actualización: 2026-05-12 (post Release-01 + validación E2E con Playwright).

---

## Format

```
### [ERROR-NNN] Short description
- **Status**: OPEN | RESOLVED
- **Date**: YYYY-MM-DD
- **Context**: Where/when this error occurs
- **Root Cause**: Why it happens
- **Resolution**: How to fix it
- **Files Affected**: List of files
- **Prevention**: How to avoid regression (lint, test, CI check)
```

---

## Open Issues — bloqueantes para el deploy real (los resuelve ProjectApp/ops)

### [ERROR-001] Google OAuth Client ID heredado del template
- **Status**: OPEN — requiere acción manual en GCP por ProjectApp.
- **Date**: 2026-05-11
- **Context**: `backend/.env.example` y `frontend/.env.example` traen `931303546385-777cpce87b2ro3lsgvdua25rfqjfgktg.apps.googleusercontent.com`, que pertenece al proyecto OAuth del template `base_django_react_next_feature`.
- **Root Cause**: `/new-project-setup` deja explícitamente fuera de scope la regeneración de credenciales (acción manual humana en GCP).
- **Resolution**: ProjectApp debe (1) crear/reutilizar un proyecto OAuth propio en Google Cloud Console, (2) generar Client ID + Secret tipo "Web application", (3) registrar redirect URIs reales (`http://localhost:3000/...` dev; `https://albunmania.projectapp.co/...` staging), (4) actualizar `DJANGO_GOOGLE_CLIENT_ID`, `DJANGO_GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` por entorno.
- **Files Affected**: `backend/.env.example`, `frontend/.env.example`, `deploy/staging/env-templates/*`.
- **Prevention**: `/sign-in` y `/sign-up` renderizan `data-testid="missing-google-client-id"` (fallback visible) cuando el client id falta. Documentado en `deploy/staging/RUNBOOK.md` paso 1.

### [ERROR-004] `BACKUP_STORAGE_PATH` con slug del template
- **Status**: OPEN — verificar en el VPS antes del primer backup.
- **Date**: 2026-05-11
- **Context**: `backend/.env.example` tenía `BACKUP_STORAGE_PATH=/var/backups/base_feature_project`. Si se copia tal cual y el directorio no existe (o pertenece al usuario equivocado), `django-dbbackup` falla silenciosamente.
- **Root Cause**: Path heredado del template.
- **Resolution**: Usar `/var/backups/albunmania_project`. En el VPS: `sudo mkdir -p /var/backups/albunmania_project && sudo chown ryzepeck:ryzepeck /var/backups/albunmania_project` antes del primer backup.
- **Files Affected**: `backend/.env.example`, `deploy/staging/RUNBOOK.md`.
- **Prevention**: `RUNBOOK.md` incluye el comando de creación del directorio.

### [ERROR-009] hCaptcha usando test keys
- **Status**: OPEN — requiere keys reales de hCaptcha por ProjectApp.
- **Date**: 2026-05-12
- **Context**: `backend/.env` y `frontend/.env.local` (dev) y los templates de deploy usan las hCaptcha test keys (sitekey `10000000-ffff-ffff-ffff-000000000001`, secret `0x0000...0000`). Con esas keys `captcha_service.verify_hcaptcha` valida cualquier token (o se salta cuando el secret está vacío).
- **Root Cause**: No hay cuenta hCaptcha del cliente todavía.
- **Resolution**: ProjectApp registra un sitio en hCaptcha, obtiene sitekey + secret reales y los pone en `DJANGO_HCAPTCHA_SITEKEY` / `DJANGO_HCAPTCHA_SECRET` (backend) y `NEXT_PUBLIC_HCAPTCHA_SITEKEY` (frontend) del entorno productivo.
- **Files Affected**: `deploy/staging/env-templates/backend.env.example`, `deploy/staging/env-templates/frontend.env.production.example`.
- **Prevention**: Tests usan el fixture autouse `_bypass_hcaptcha` en `conftest.py` para no depender de la red; nunca commitear keys reales.

### [ERROR-013] VAPID keypair de dev committeado
- **Status**: OPEN — rotar antes de producción.
- **Date**: 2026-05-12
- **Context**: El par VAPID de dev (`VAPID_PUBLIC_KEY=BAkjp1UQ...`, `VAPID_PRIVATE_KEY=QAR52QDu...`) quedó en `backend/.env` (gitignored) y el público en `frontend/.env.local` (gitignored). Si se reutilizara en prod, cualquiera que vea el repo de despliegue podría enviar push como Albunmanía.
- **Root Cause**: Se generó un par de dev para poder validar Epic 9 en local sin las creds del cliente.
- **Resolution**: En el VPS generar uno nuevo (`vapid --gen` → `private_key.pem` / `public_key.pem`, derivar base64-url) y ponerlo en `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CLAIMS_EMAIL` del entorno productivo + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en el frontend build.
- **Files Affected**: `backend/.env` (dev, gitignored), `frontend/.env.local` (dev, gitignored), `deploy/staging/env-templates/*`, `deploy/staging/RUNBOOK.md` paso 1.
- **Prevention**: `RUNBOOK.md` paso 1 lista la rotación como pre-requisito; los `.env` reales están en `.gitignore`.

---

## Resolved Issues

### [ERROR-002] VAPID keys ausentes → Web Push deshabilitado — RESOLVED
- **Status**: RESOLVED (Epic 9, commits `1630c1f` / `a8d9520` / `a934125`).
- **Date resuelto**: 2026-05-12
- **Resolution**: Se generó un par VAPID de dev, se añadieron `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CLAIMS_EMAIL` a `settings.py` (leídas de env), `push_notify.send_to` usa `pywebpush.webpush(..., vapid_private_key=, vapid_claims=)`, y `pushStore.subscribe()` pasa `applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer` al `pushManager.subscribe()`. Templates de prod en `deploy/staging/env-templates/`. **Pendiente sólo la rotación del par para prod → ver [ERROR-013].**
- **Files Affected**: `backend/albunmania_app/services/push_notify.py`, `backend/albunmania_app/views/push.py`, `backend/albunmania_project/settings.py`, `frontend/lib/stores/pushStore.ts`, `frontend/public/sw-push.js`.

### [ERROR-003] `next-intl` instalado sin `messages/` → fallo en build — RESOLVED
- **Status**: RESOLVED (Bloque A, fase A8).
- **Date resuelto**: 2026-05-11
- **Resolution**: Existen `frontend/messages/{es,en,pt}.json` poblados + `i18n/request.ts`. La locale logic vive en `proxy.ts` (Next.js 16 deprecó `middleware.ts` → ver [ERROR-006]). **Nota:** el wiring real de `next-intl` en las páginas queda para V2; hoy las páginas usan copy hardcoded en español pero el build no falla.
- **Files Affected**: `frontend/messages/`, `frontend/i18n/request.ts`, `frontend/proxy.ts`.

### [ERROR-005] Service Worker ausente → PWA no instalable — RESOLVED
- **Status**: RESOLVED (Bloque A fase A7 + Epic 9 + fix `a934125`).
- **Date resuelto**: 2026-05-12
- **Resolution**: `next-pwa` configurado en `next.config.ts` (genera `public/sw.js` Workbox en `npm run build --webpack`), manifest en `public/`, SW registrado vía `next-pwa`. Los handlers de push (`push` / `notificationclick`) viven en `public/sw-push.js` (tracked) e ingresan al `sw.js` vía `importScripts: ['/sw-push.js']`. `sw.js` / `workbox-*.js` / `fallback-*.js` están en `.gitignore` (build artifacts). **Nota:** `npm run dev` y `npm run build` requieren `--webpack` → ver [ERROR-007].
- **Files Affected**: `frontend/next.config.ts`, `frontend/public/sw-push.js`, `frontend/public/manifest.webmanifest`, `frontend/.gitignore`.

### [ERROR-006] `middleware.ts` + `proxy.ts` coexistiendo → build roto — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 1).
- **Date resuelto**: 2026-05-12
- **Context**: `npm run build` aborta con "Both middleware file and proxy file are detected".
- **Root Cause**: Next.js 16 deprecó `middleware.ts` en favor de `proxy.ts`; tener ambos archivos rompe el build.
- **Resolution**: Mover la locale logic a `proxy.ts`, `git rm frontend/middleware.ts`. (El sandbox bloqueó el `rm` directo de un archivo trackeado; se usó `git rm` tras confirmación del usuario.)
- **Files Affected**: `frontend/proxy.ts` (nuevo), `frontend/middleware.ts` (borrado).
- **Prevention**: No volver a crear `middleware.ts` en este repo.

### [ERROR-007] `next dev` / `next build` con Turbopack → next-pwa falla — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 1).
- **Date resuelto**: 2026-05-12
- **Context**: `next dev` (Turbopack por default en Next.js 16) explota porque next-pwa engancha al pipeline de webpack.
- **Root Cause**: next-pwa todavía no soporta Turbopack.
- **Resolution**: Fijar `--webpack` en los scripts `dev` y `build` de `frontend/package.json`.
- **Files Affected**: `frontend/package.json`.
- **Prevention**: Documentado en `tasks/active_context.md`, `technical.md` y este archivo. Cualquier comando manual de Next.js debe llevar `--webpack`.

### [ERROR-008] `backend/.env` faltante → hCaptcha sitekey vacío / 500 en captcha views — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 1).
- **Date resuelto**: 2026-05-12
- **Context**: Sin `backend/.env`, `HCAPTCHA_SITEKEY` queda vacío y los endpoints de captcha responden inconsistente.
- **Root Cause**: Sólo existía `.env.example`, no el `.env` real para dev.
- **Resolution**: Crear `backend/.env` (gitignored) con `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=true`, hCaptcha test keys (`DJANGO_HCAPTCHA_SITEKEY` / `DJANGO_HCAPTCHA_SECRET`), VAPID dev keys (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CLAIMS_EMAIL`). **Efecto colateral:** al meter el `DJANGO_HCAPTCHA_SECRET` real-pero-test se activó la verificación real y 9 tests preexistentes empezaron a fallar (`test_google_login_age_check.py`, `test_auth_endpoints.py`, `test_captcha_views.py`) → se arregló con un fixture `@pytest.fixture(autouse=True) def _bypass_hcaptcha(monkeypatch): monkeypatch.setattr(settings, 'HCAPTCHA_SECRET', '')` en `conftest.py` + migrar `test_captcha_views` de `RECAPTCHA_SITE_KEY` a `HCAPTCHA_SITEKEY`.
- **Files Affected**: `backend/.env` (gitignored), `backend/albunmania_app/tests/conftest.py`, `backend/albunmania_app/tests/test_captcha_views.py`.
- **Prevention**: `RUNBOOK.md` y el `.env.example` documentan las variables requeridas; el fixture autouse aísla los tests de la red.

### [ERROR-010] `frontend/.env.local` faltante → API 404 / OAuth fallback — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 1).
- **Date resuelto**: 2026-05-12
- **Context**: Sin `.env.local`, `NEXT_PUBLIC_API_BASE_URL` y `NEXT_PUBLIC_BACKEND_ORIGIN` quedan en default y el rewrite a `/api/` apunta mal; el botón de Google cae al fallback "missing client id".
- **Root Cause**: Faltaba el archivo de env de dev en frontend.
- **Resolution**: Crear `frontend/.env.local` (gitignored) con `NEXT_PUBLIC_HCAPTCHA_SITEKEY=10000000-...`, `NEXT_PUBLIC_API_BASE_URL=/api`, `NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8000`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAkjp1UQ...`.
- **Files Affected**: `frontend/.env.local` (gitignored).
- **Prevention**: `RUNBOOK.md` + `deploy/staging/env-templates/frontend.env.production.example` documentan las variables.

### [ERROR-011] `scripts/dev-issue-jwt.py` emitía localStorage pero la app lee cookies — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 1).
- **Date resuelto**: 2026-05-12
- **Context**: El storage-state de Playwright generado por el helper no autenticaba: la app quedaba como invitado.
- **Root Cause**: `lib/tokens.ts` lee/escribe los JWT en cookies (`access_token` / `refresh_token`), no en localStorage; el helper escribía `localStorage`.
- **Resolution**: Reescribir `scripts/dev-issue-jwt.py` para emitir entradas `cookies` (`access_token`, `refresh_token`) en el JSON de storage-state. También se corrigió un comentario equivocado en `proxy.ts`.
- **Files Affected**: `scripts/dev-issue-jwt.py`, `frontend/proxy.ts`.
- **Prevention**: El helper documenta el formato; los specs de validación lo usan vía `storageState`.

### [ERROR-012] `?special=true|false` ignorado por el backend — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 2, commit `8851201`).
- **Date resuelto**: 2026-05-12
- **Context**: El filtro de ediciones especiales del catálogo no filtraba nada cuando el frontend mandaba `?special=true`.
- **Root Cause**: `views/album.py` esperaba literalmente `'1'`; ignoraba `'true'` / `'yes'`.
- **Resolution**: Aceptar `'1'|'true'|'yes'` (true) y `'0'|'false'|'no'` (false). + 2 tests de regresión en `test_album_endpoints.py`.
- **Files Affected**: `backend/albunmania_app/views/album.py`, `backend/albunmania_app/tests/test_album_endpoints.py`.
- **Prevention**: Tests de regresión cubren ambos valores.

### [ERROR-014] `ReviewDrawer` — "Maximum update depth exceeded" (Zustand v5 + React 19) — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 3, commit `2e19919`).
- **Date resuelto**: 2026-05-12
- **Context**: Abrir el drawer de reseñas crashea con "Maximum update depth exceeded" + warning "getSnapshot should be cached".
- **Root Cause**: `useReviewStore((s) => s.byUser[userId] ?? [])` — el `?? []` crea una nueva referencia de array en cada llamada del selector → `useSyncExternalStore` cree que el estado cambió → bucle infinito de renders.
- **Resolution**: Cachear la referencia vacía fuera del componente: `const EMPTY_REVIEWS: readonly Review[] = Object.freeze([]);` y luego `?? EMPTY_REVIEWS`.
- **Files Affected**: `frontend/components/reviews/ReviewDrawer.tsx` (y patrón aplicable a cualquier selector Zustand que devuelva fallback de objeto/array).
- **Prevention**: Regla en `lessons-learned.md` §14: nunca devolver `x ?? {}` / `x ?? []` desde un selector Zustand; cachear el fallback.

### [ERROR-015] Seed sin `whatsapp_e164` → `peer_has_no_whatsapp_number` — RESOLVED
- **Status**: RESOLVED (validación E2E Sesión 3, commit `ac02d13`).
- **Date resuelto**: 2026-05-12
- **Context**: `GET /api/trade/1/whatsapp-link/` devolvía `peer_has_no_whatsapp_number` aunque ambos usuarios habían opt-in.
- **Root Cause**: `create_users.py` no asignaba `whatsapp_e164` a las cuentas canónicas.
- **Resolution**: `create_users.py` setea `whatsapp_e164` (+573001112222 / +573002223333) + `whatsapp_optin=True` en `user` y `user2`.
- **Files Affected**: `backend/albunmania_app/management/commands/create_users.py`.
- **Prevention**: El comando crea cuentas deterministas con todos los campos requeridos para los flujos E2E.

### [ERROR-016] `npm run build` sobrescribía `public/sw.js` → handlers de push perdidos — RESOLVED
- **Status**: RESOLVED (commit `a934125`).
- **Date resuelto**: 2026-05-12
- **Context**: Tras añadir Epic 9, cada `npm run build` regeneraba `public/sw.js` con el SW de Workbox de next-pwa, borrando los listeners `push` / `notificationclick` que se habían escrito a mano ahí; además aparecía `public/workbox-*.js` sin trackear.
- **Root Cause**: `sw.js` es un build artifact de next-pwa, no un archivo fuente.
- **Resolution**: Mover los handlers a `public/sw-push.js` (tracked), añadir `importScripts: ['/sw-push.js']` a la config de next-pwa en `next.config.ts`, y gitignorar `public/sw.js` / `public/sw.js.map` / `public/workbox-*.js(.map)` / `public/fallback-*.js`.
- **Files Affected**: `frontend/public/sw-push.js`, `frontend/next.config.ts`, `frontend/.gitignore`.
- **Prevention**: `sw.js` ya no se commitea; la lógica custom de push vive en `sw-push.js`. Documentado en `architecture.md` §5.
