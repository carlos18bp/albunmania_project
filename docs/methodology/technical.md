# Technical Documentation — Albunmanía

## 1. Stack actual (verificado contra `backend/requirements.txt` y `frontend/package.json`)

### Backend
| Componente | Versión | Notas |
|------------|--------:|-------|
| Python | 3.12+ | Requerido por Django 6 |
| Django | 6.0.4 | LTS path |
| DRF | 3.17.1 | Function-based views |
| simple-jwt | 5.5.1 | JWT auth |
| MySQL client | 2.2 | Producción |
| SQLite | builtin | Desarrollo (`settings_dev.py`) |
| Redis | 4.0+ | Backend Huey + cache |
| Huey | 2.5.0 | Task queue async |
| Pillow | 12.2.0 | Image processing |
| easy-thumbnails | 2.10.1 | Resize automático |
| django-cleanup | 9.0.0 | Borrado de archivos huérfanos |
| django-cors-headers | 4.9.0 | CORS |
| django-dbbackup | 4.0+ | Backups DB |
| django-silk | 5.0+ | Profiling dev |
| Gunicorn | 23 | WSGI prod |
| factory-boy + faker | 3.3.3 | Fake data factories |
| pytest + pytest-django + pytest-cov | 9.0.3 / 4.12 / 7.1 | Testing |
| requests | 2.33.1 | HTTP client (Google OAuth verify) |

### Frontend
| Componente | Versión | Notas |
|------------|--------:|-------|
| Node | LTS | |
| Next.js | 16.2.4 | App Router |
| React | 19.2.5 | |
| TypeScript | 5+ | Strict mode |
| Zustand | 5.0.12 | Estado global |
| next-intl | 4.11.0 | **Instalado, sin `messages/` aún** |
| react-google-recaptcha | 3.1.0 | **Será reemplazado por hCaptcha en A4** |
| @react-oauth/google | 0.13.5 | Google OAuth client |
| axios | — | HTTP client |
| fuse.js | — | Búsqueda fuzzy cliente |
| lucide-react | — | Iconos |
| Jest + Playwright | — | Unit + E2E |

### Faltantes para release 01 (a añadir en fase A6)
**Backend:** `django-allauth` (Google OAuth + reglas de cuenta verificada), `pywebpush` (Web Push), `qrcode[pil]` (QR firmados), `haversine` (proximidad), `geoip2` (geolocalización IP), `python-hCaptcha` o equivalente.
**Frontend:** `next-pwa` (Service Worker), `qrcode.react` o `react-qr-code` (render), `@zxing/browser` o `html5-qrcode` (scan), `leaflet` + `react-leaflet` (mapa), `web-push` (helpers), `zod`, `@hcaptcha/react-hcaptcha`.

## 2. Estructura de directorios (estado actual — pre-rename A2)

```
backend/
├── base_feature_app/           # Django app principal — RENAME → albunmania_app en A2
│   ├── models/         (6 archivos)   # ⚠ TODOS DEMO excepto user.py + password_code.py
│   ├── views/          (10 archivos)
│   ├── serializers/    (15 archivos)
│   ├── urls/           (7 archivos)
│   ├── services/       (email_service.py)
│   ├── utils/          (auth_utils.py)
│   ├── forms/          (5 archivos)
│   ├── tests/          (25 archivos test_*.py)
│   ├── migrations/     (5 migraciones — reset en A3)
│   ├── management/commands/ (factories: create_users/blogs/products/sales)
│   ├── admin.py
│   └── apps.py
├── base_feature_project/        # Django project — RENAME → albunmania_project en A2
│   ├── settings.py             # Base + JWT + CORS + reCAPTCHA (→hCaptcha) + Huey
│   ├── settings_dev.py         # SQLite + DEBUG=True
│   ├── settings_prod.py        # MySQL + HSTS + SSL redirect
│   ├── urls.py                 # health + admin + JWT + app routes
│   ├── asgi.py / wsgi.py
│   └── tasks.py                # Huey task definitions
├── django_attachments/         # App custom (file uploads + cleanup) — KEEP
├── conftest.py                 # pytest fixtures globales
├── manage.py
├── pytest.ini
└── requirements.txt

frontend/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing
│   ├── layout.tsx, providers.tsx
│   ├── sign-in/, sign-up/, forgot-password/, admin-login/
│   ├── dashboard/, backoffice/, manual/
│   ├── blogs/, catalog/, checkout/, products/  # ⚠ DEMO — purgar en A3
├── components/                 (19 componentes)
├── lib/
│   ├── stores/                 # Zustand
│   │   ├── authStore.ts        # KEEP
│   │   ├── localeStore.ts      # KEEP
│   │   ├── blogStore.ts, productStore.ts, cartStore.ts, stagingBannerStore.ts  # ⚠ DEMO — purgar
│   │   └── __tests__/          (5 tests)
│   └── i18n/config.ts          # Stub — completar en A8
├── e2e/                        (9 specs + helpers + fixtures + reporters)
├── public/                     # ⚠ Sin manifest.webmanifest — añadir en A7
└── package.json
```

## 3. Configuración de entornos

### Variables clave (`backend/.env.example`)
- `DJANGO_ENV` (development | production)
- `DJANGO_SECRET_KEY` (≥50 chars)
- `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_LOG_LEVEL`
- `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_DB_*` (engine + name + user/password/host/port)
- `DJANGO_JWT_ACCESS_MINUTES=15`, `DJANGO_JWT_REFRESH_DAYS=7`
- `DJANGO_EMAIL_*` (SMTP)
- `DJANGO_GOOGLE_CLIENT_ID` ⚠ **placeholder del template — regenerar en A4**
- `REDIS_URL=redis://localhost:6379/1`
- `BACKUP_STORAGE_PATH` ⚠ **hardcoded `/var/backups/base_feature_project` — actualizar en A2**

### Variables a añadir en A4
- `DJANGO_HCAPTCHA_SITEKEY`, `DJANGO_HCAPTCHA_SECRET`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (Web Push)
- `WHATSAPP_DEEP_LINK_BASE=https://wa.me/`
- `MAXMIND_GEOIP2_DB_PATH` (cuando se descargue la DB)

## 4. Patrones de diseño establecidos (heredados del template, reutilizables)

- **Service layer** en `services/` para lógica de negocio (`email_service.py` como referencia).
- **Serializers split por operación**: `<model>_list.py`, `<model>_detail.py`, `<model>_create_update.py`.
- **URLs split por dominio** en `urls/` (no monolítico).
- **Function-based views** + decoradores `@api_view` y `@permission_classes`.
- **Management commands** para fake data: `create_<entity>.py` + `delete_fake_data.py` (protege superusers).
- **Test helpers** en `conftest.py` global + `tests/helpers.py` por app.
- **Coverage report custom** con focus files (top-N coverage gaps).
- **JWT tokens helpers** en `utils/auth_utils.py` (`generate_auth_tokens`).

## 5. Estrategia de testing

- **Backend**: pytest + pytest-django, organizado en `tests/{models,serializers,views,services,utils,commands}/`. Coverage mínimo objetivo: **80% por módulo**, **100% en módulos críticos** (auth, match engine, ad serving).
- **Frontend unit**: Jest, organizado por colocación (`__tests__/` junto a stores y components).
- **E2E**: Playwright con perfiles Desktop Chrome / Mobile Chrome / Tablet. Scripts `e2e:modules`, `e2e:module`, `e2e:coverage` para ejecución selectiva.
- **Reglas duras** (de `CLAUDE.md`):
  - Nunca correr suite completa → siempre archivos específicos.
  - Máximo 20 tests por batch, 3 comandos por ciclo.
  - Cada test verifica UNA conducta observable.
  - Mock solo en boundaries (APIs externas, clock, email).

## 6. Async tasks (Huey)

Backend: `backend/base_feature_project/tasks.py`. Para release 01 procesará:
- Envío de Web Push notifications de match.
- Cálculo nocturno de racha y ETA por usuario (cache en Profile).
- Generación on-demand de reportes para sponsor/anunciantes.
- Sincronización con Siigo/Alegra (facturación).
- Limpieza de matches expirados.
- Particionamiento mensual de `AdImpression`.

## 7. Seguridad (heredado de `CLAUDE.md` + adiciones release 01)

- JWT con refresh corto (15 min access / 7 días refresh).
- CSRF activo (no desactivar globalmente).
- Validación dual servidor + cliente con DRF serializers + Zod.
- ORM siempre (no raw SQL con user input).
- React JSX auto-escape; evitar inyección de HTML cliente con user input (sanitizar con DOMPurify si es estrictamente necesario).
- Headers prod: HSTS, X-Frame DENY, content-type nosniff, secure cookies.
- File upload: validación de extensión + tamaño (5MB max).
- **Adiciones Albunmanía:**
  - hCaptcha previo a OAuth callback.
  - Validación claim `created_at` Google ≥ 30 días en backend.
  - QR firmado con HMAC (ver `qrcode[pil]` + `hashlib.hmac`).
  - Rate-limit en swipe endpoint (anti-bot match flooding).
  - Moderación: toggle `is_visible` en Review (sin borrar) + log auditoría.

## 8. Deployment (objetivo staging)

- Server: VPS 4 vCPU / 8 GB RAM (escalable verticalmente a 8/16 antes de separar workers).
- Path: `/home/ryzepeck/webapps/albunmania_staging`.
- Servicios systemd: `albunmania_staging` (Gunicorn), `albunmania-staging-huey`.
- Reverse proxy: Nginx con caché agresivo de assets, gzip + brotli.
- DB: MySQL 8 con índices compuestos en queries críticas (`UserSticker(user_id, sticker_id)`, `Profile(lat, lng, city)`).
