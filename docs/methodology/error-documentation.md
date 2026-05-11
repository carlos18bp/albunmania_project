---
trigger: manual
description: Error documentation and known issues tracking. Reference when debugging, fixing bugs, or encountering recurring issues.
---

# Error Documentation — Albunmanía

Catálogo de errores conocidos, su contexto y resolución. Se alimenta progresivamente al cerrar cada épica del Bloque B y al detectar problemas recurrentes.

---

## Format

```
### [ERROR-NNN] Short description
- **Date**: YYYY-MM-DD
- **Context**: Where/when this error occurs
- **Root Cause**: Why it happens
- **Resolution**: How to fix it
- **Files Affected**: List of files
- **Prevention**: How to avoid regression (lint, test, CI check)
```

---

## Known Issues — heredados del bootstrap

### [ERROR-001] Google OAuth Client ID heredado del template
- **Date**: 2026-05-11
- **Context**: `backend/.env.example` y `frontend/.env.example` traen `931303546385-777cpce87b2ro3lsgvdua25rfqjfgktg.apps.googleusercontent.com`, que pertenece al proyecto OAuth del template `base_django_react_next_feature` en Google Cloud Console.
- **Root Cause**: El skill `/new-project-setup` deja explícitamente fuera de scope la regeneración de credenciales (acción manual humana en GCP).
- **Resolution**: ProjectApp debe (1) crear nuevo proyecto OAuth o reutilizar uno propio en Google Cloud Console, (2) generar Client ID + Secret tipo "Web application", (3) registrar redirect URIs reales (`http://localhost:3000/api/auth/callback/google` dev; `https://staging.albunmania.co/...` staging; etc.), (4) actualizar variables `DJANGO_GOOGLE_CLIENT_ID`, `DJANGO_GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en cada entorno.
- **Files Affected**: `backend/.env.example`, `frontend/.env.example`.
- **Prevention**: Fase A4 reemplaza placeholder por `<TODO: regenerate in GCP>` para evitar uso accidental. Documentar en README de deploy.

### [ERROR-002] VAPID keys ausentes → Web Push deshabilitado
- **Date**: 2026-05-11
- **Context**: Web Push Protocol exige par de claves VAPID (público/privado) para autenticar el origen del push hacia los push services del navegador.
- **Root Cause**: VAPID nunca generado (no existe el campo en `.env.example` aún).
- **Resolution**: Generar par con `vapid --gen` (paquete `py-vapid`) o equivalente. Persistir `VAPID_PUBLIC_KEY` (base64-url) en backend y frontend; `VAPID_PRIVATE_KEY` solo en backend. Pasar `applicationServerKey` al `pushManager.subscribe()` en Service Worker.
- **Files Affected**: `backend/.env.example`, `frontend/.env.example`, `backend/albunmania_app/services/push_service.py` (cuando exista en Epic 9).
- **Prevention**: A4 añade los placeholders. Epic 9 valida configuración al iniciar Huey worker.

### [ERROR-003] `next-intl` instalado sin `messages/` → fallo en build
- **Date**: 2026-05-11
- **Context**: `frontend/package.json` declara `next-intl@4.11.0` pero no existe `frontend/messages/` ni `i18n/request.ts`.
- **Root Cause**: Dep heredada del template sin bootstrap completo.
- **Resolution**: Ejecutar fase A8 (crear `messages/{es,en,pt}.json` + `i18n/request.ts` + `middleware.ts`).
- **Files Affected**: `frontend/messages/`, `frontend/i18n/`, `frontend/middleware.ts`.
- **Prevention**: A8 incluye smoke test `next dev` para asegurar que el middleware resuelve locales.

### [ERROR-004] `BACKUP_STORAGE_PATH` con slug del template
- **Date**: 2026-05-11
- **Context**: `backend/.env.example` tiene `BACKUP_STORAGE_PATH=/var/backups/base_feature_project`. Si se copia tal cual a staging y el directorio no existe (o existe pero pertenece al usuario equivocado), `django-dbbackup` falla silenciosamente o escribe en path inesperado.
- **Resolution**: Fase A2 actualiza el path a `/var/backups/albunmania_project`. En el VPS hay que `sudo mkdir -p /var/backups/albunmania_project && sudo chown <gunicorn-user>:<group> /var/backups/albunmania_project` antes del primer backup.
- **Files Affected**: `backend/.env.example`.
- **Prevention**: A4 documenta el comando shell de creación del directorio en el README de deploy.

### [ERROR-005] Service Worker ausente → PWA no instalable
- **Date**: 2026-05-11
- **Context**: `frontend/public/` no contiene `manifest.webmanifest` ni `sw.ts` ni archivos workbox. Sin Service Worker no hay prompt de "instalar app", no hay caché offline (rompe match QR presencial offline) y no hay Web Push.
- **Resolution**: Fase A7 instala `next-pwa`, configura manifest + workbox y registra Service Worker en `app/layout.tsx`.
- **Files Affected**: `frontend/public/manifest.webmanifest`, `frontend/next.config.*`, `frontend/app/layout.tsx`.
- **Prevention**: Smoke test post-A7 — verificar Lighthouse PWA score ≥ 90.

---

## Resolved Issues

_(Se irán moviendo aquí los Known Issues conforme se resuelvan en sus fases respectivas.)_
