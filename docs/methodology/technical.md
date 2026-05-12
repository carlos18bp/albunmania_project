# Technical Documentation — Albunmanía

> Verificado contra `backend/requirements.txt`, `frontend/package.json` y el árbol del repo a 2026-05-12.

## 1. Stack

### Backend
| Componente | Versión | Notas |
|------------|--------:|-------|
| Python | 3.12+ | Requerido por Django 6 |
| Django | 6.0.4 | `CheckConstraint` usa `condition=` (no `check=`) |
| DRF | 3.17.1 | Function-based views (`@api_view`) |
| simple-jwt | 5.5.1 | JWT auth; tokens en **cookies** (`access_token`/`refresh_token` vía `lib/services/tokens.ts`) |
| mysqlclient | 2.2 | Producción / staging |
| SQLite | builtin | Desarrollo (`settings_dev.py`) |
| Redis | 4.0+ | Broker Huey + cache |
| Huey | 2.5.0 | Task queue async |
| Pillow / easy-thumbnails | 12.2 / 2.10 | Imágenes |
| django-cleanup | 9.0 | Archivos huérfanos |
| django-cors-headers | 4.9 | CORS |
| django-dbbackup / django-silk | 4.0+ / 5.0+ | Backups DB / profiling dev |
| django-allauth[socialaccount] | 65 | Google provider (la regla 30 días la hace `services/google_account_age.py` vía People API) |
| **pywebpush + py-vapid** | 2.0 / 1.9 | **Web Push (Epic 9)** |
| qrcode[pil] | 8.0 | (disponible; el QR de Match usa HMAC propio, no genera imagen server-side) |
| haversine | 2.9 | (disponible; `match_engine` usa haversine inline para poder pre-filtrar por bbox en SQL) |
| geoip2 | 4.8 | (disponible; IP geolocation aún no instrumentada) |
| gunicorn | 23 | WSGI prod |
| Faker / factory-boy | 40 / 3.3 | Fake data |
| pytest + pytest-django + pytest-cov + freezegun | — | Testing |
| requests | 2.33 | Google tokeninfo + hCaptcha siteverify |
| ruff | 0.15 | Lint |

### Frontend
| Componente | Versión | Notas |
|------------|--------:|-------|
| Node | LTS | |
| Next.js | 16.2.4 | App Router. **`dev` y `build` con `--webpack`** (next-pwa incompatible con Turbopack default) |
| React / react-dom | 19.2.5 | |
| TypeScript | 5+ | Strict mode |
| Zustand | 5.0.12 | Estado global. ⚠ v5+React19: selectores que devuelven `x ?? []` rompen `useSyncExternalStore` — cachear ref vacía fuera del componente |
| next-pwa | 5.6 | Genera `public/sw.js` (Workbox) en build; `importScripts: ['/sw-push.js']` mete los handlers de push |
| next-themes | 0.4 | Light/Dark switcher |
| next-intl | 4.11 | `messages/{es,en,pt}.json` poblados; **wiring real pendiente (V2)** — hoy las páginas usan copy hardcoded en español |
| @react-oauth/google | 0.13 | `<GoogleLogin>` (id_token flow) |
| @hcaptcha/react-hcaptcha | 1.11 | Widget anti-bot |
| jwt-decode / js-cookie | 4.0 / 3.0 | Decodificar id_token Google · leer/escribir cookies de auth |
| axios | 1.15 | HTTP client (interceptor `Authorization: Bearer` desde cookie) |
| leaflet + react-leaflet | 1.9 / 5.0 | Mapa de comerciantes (montado vía `dynamic({ssr:false})`) |
| @zxing/browser | 0.1 | Scanner QR (cámara) |
| qrcode.react | 4.2 | Render del QR propio |
| idb-keyval | 6.2 | Cache offline-first del inventario para Match QR |
| web-push | 3.6 | Helpers (browser-side) |
| fuse.js | 7.3 | Búsqueda fuzzy (manual interactivo) |
| lucide-react | 1.14 | Iconos |
| zod | 3.23 | Validación de forms |
| Jest + Playwright | — | Unit + E2E |

## 2. Estructura de directorios (actual)

```
backend/
├── albunmania_app/                  # Django app principal (single-app)
│   ├── models/         (19 archivos) # user, profile, merchant_profile,
│   │                                 # album, sticker, user_sticker, sponsor,
│   │                                 # match, like, trade, trade_whatsapp_optin,
│   │                                 # merchant_subscription_payment,
│   │                                 # ad_campaign, ad_creative, ad_impression (+ AdClick),
│   │                                 # review (+ ReviewReport), push_subscription,
│   │                                 # notification, report
│   ├── views/          (21 módulos)  # auth (google_login + validate_token), profile, captcha,
│   │                                 # album, inventory, sponsor, match, trade, trade_whatsapp,
│   │                                 # stats, merchant, ad, review, admin_users, analytics, push,
│   │                                 # notification, report, presence, collectors, geo
│   ├── serializers/    (11 archivos) # split por dominio (ad, album, collectors, inventory, match,
│   │                                 # merchant, notification, profile, report, review, sponsor)
│   ├── urls/           (21 módulos)  # ver §4
│   ├── services/       (14 archivos) # google_account_age, captcha_service,
│   │                                 # match_engine, qr_token, qr_cross, whatsapp_link,
│   │                                 # stats_engine, merchant_subscription, ad_engine,
│   │                                 # review_aggregates, analytics_engine, push_notify, presence, geoip
│   ├── signals.py                    # post_save User → Profile/MerchantProfile;
│   │                                 # post_save/post_delete Review → recompute aggregates;
│   │                                 # post_save Match(status=mutual, created) → Notification a ambos + enqueue deliver_match_push (Huey)
│   ├── utils/auth_utils.py           # generate_auth_tokens (JWT)
│   ├── forms/, admin.py, apps.py
│   ├── tests/          (56 test_*.py) # {models,serializers,views,services,utils,commands}/
│   ├── migrations/     (12: 0001_initial → 0012_delete_passwordcode)
│   └── management/commands/          # create_users (4 cuentas canónicas + extras),
│                                     # create_fake_data (Album+50 stickers+inventarios+
│                                     #   Sponsor+AdCampaign+MerchantProfile+Match mutual+
│                                     #   Review×2+ReviewReport+payments+ads+PushSubscription+
│                                     #   Notification×3+Report×1),
│                                     # delete_fake_data
├── albunmania_project/
│   ├── settings.py       # base + JWT + CORS + hCaptcha + VAPID + Huey; toggles SECURE_* si DEBUG=false
│   ├── settings_dev.py   # SQLite + DEBUG=True
│   ├── settings_prod.py  # MySQL + headers prod
│   ├── urls.py           # health + admin + JWT + include albunmania_app.urls
│   ├── tasks.py          # Huey: deliver_match_push (on-demand) + periodic backups/silk
│   ├── asgi.py / wsgi.py
├── django_attachments/   # app custom (file uploads + cleanup)
├── .env                  # local dev (gitignored): hCaptcha test keys + VAPID dev keys + SECRET_KEY
├── conftest.py / pytest.ini / requirements.txt
└── manage.py

frontend/
├── app/                  # Next.js App Router — 24 page.tsx
│   ├── page.tsx, layout.tsx (footer con enlaces legales + PresencePinger), providers.tsx
│   ├── sign-in/, sign-up/, admin-login/ (OAuth callback), onboarding/
│   ├── dashboard/, manual/, notificaciones/, mapa/
│   ├── terminos/, privacidad/, ayuda/
│   ├── catalog/[slug]/
│   ├── match/, match/qr/, match/[matchId]/
│   ├── merchants/, merchants/me/
│   ├── profile/[id]/
│   ├── share/[token]/
│   └── admin/, admin/users/, admin/moderation/, admin/analytics/
├── components/           # 54 .tsx — auth/, onboarding/, sponsor/, catalog/ (+SearchAutocomplete), match/,
│                         # whatsapp/, stats/, merchant/, ads/, reviews/, push/, manual/,
│                         # layout/, legal/, faq/, profile/, notifications/, moderation/, presence/, collectors/
├── lib/
│   ├── stores/           # 21 Zustand: auth, locale, onboarding, sponsor, album, inventory,
│   │                     # match, qr, tradeWhatsApp, stats, merchant, ad, review, admin,
│   │                     # analytics, push, profile, notification, report, presence, collectorMap  (+ __tests__/)
│   ├── services/         # http.ts (axios + cookie interceptor), tokens.ts (cookies)
│   ├── hooks/useRequireAuth.ts
│   ├── i18n/config.ts, manual/content.ts, legal/content.ts, faq/content.ts, utils.ts (cn helper)
├── e2e/                  # 15 specs: auth/, public/ (smoke + legal), moderation/, presence/,
│                         # collectors/, catalog/ (predictive-search), geo/, profile/, notifications/,
│                         # validation/session-01..05.spec.ts  (+ helpers/fixtures/reporters)
├── messages/{es,en,pt}.json
├── public/               # manifest.webmanifest, icons/, sw-push.js (tracked);
│                         # sw.js + workbox-*.js (build artifacts, gitignored)
├── proxy.ts              # locale resolution (Next.js 16 reemplazo de middleware.ts)
├── next.config.ts        # withPWA({ importScripts:['/sw-push.js'], runtimeCaching }), rewrites /api → backend
├── .env.local            # local dev (gitignored): hCaptcha test sitekey + VAPID public key + backend origin
└── package.json
```

## 3. Configuración de entornos

### Local dev (validación)
- `backend/.env` (gitignored): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=true`, `DJANGO_HCAPTCHA_SITEKEY/SECRET` (test keys `10000000-…` / `0x000…`), `VAPID_PUBLIC_KEY/PRIVATE_KEY/CLAIMS_EMAIL` (dev keys).
- `frontend/.env.local` (gitignored): `NEXT_PUBLIC_HCAPTCHA_SITEKEY` (test key), `NEXT_PUBLIC_API_BASE_URL=/api`, `NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8000`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Google client ID intencionalmente vacío (la página muestra el fallback "config pendiente").
- Levantar: `cd backend && source venv/bin/activate && python manage.py migrate && python manage.py create_fake_data && python manage.py runserver` + `cd frontend && npm run dev`.
- Auth shortcut para E2E: `python scripts/dev-issue-jwt.py <email> > .playwright_local/sessions/<email>.json` emite un storage-state con cookies `access_token`/`refresh_token` (los JWT caducan en ~5 min → regenerar).

### Producción / staging
- `settings.py` activa cuando `DEBUG=false`: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_BROWSER_XSS_FILTER`, `X_FRAME_OPTIONS=DENY`, `SECURE_PROXY_SSL_HEADER` (confía en `X-Forwarded-Proto` de nginx), `CSRF_TRUSTED_ORIGINS` desde `DJANGO_CSRF_TRUSTED_ORIGINS`. HSTS opt-in vía `DJANGO_SECURE_HSTS_SECONDS` (default 0).
- Vars que ProjectApp debe generar para prod (templates en `deploy/staging/env-templates/`): `DJANGO_SECRET_KEY`, `GOOGLE_OAUTH_CLIENT_ID/SECRET` (nuevo, el del template no sirve), `DJANGO_HCAPTCHA_SITEKEY/SECRET` (reales), `VAPID_PUBLIC_KEY/PRIVATE_KEY` (`vapid --gen`, rotar las de dev), `DATABASE_URL` (MySQL), `REDIS_URL`, SMTP. Opcional: `DJANGO_GEOIP_PATH` → ruta a un `GeoLite2-City.mmdb` (MaxMind; no se versiona); si no se pone, la geolocalización por IP queda desactivada y degrada limpio.

## 4. API surface (~66 `path()` en 21 módulos)

| Módulo | Paths | Notas |
|--------|------:|-------|
| review.py | 8 | trade_review_create, review_edit, review_reply, review_report, user_reviews_list, user_rating_summary, admin_review_reports, admin_review_visibility |
| match.py | 7 | feed (incluye is_online en las cards), like, mine, detail, qr/me, qr/scan, qr/confirm |
| ad.py | 5 | serve (público, 204 si nada), click (302 redirect), admin campaigns CRUD, admin stats |
| album.py | 4 | list, detail, sticker_list (filtros: team, special, special_tier, number, q, availability=mine\|missing\|repeated [auth], nearby=true&lat&lng&radius_km [auth+geo, vía bbox+haversine sobre Profile]), sticker_search (`albums/<slug>/search/`, top-10) |
| merchant.py | 4 | public_list (city/geo bbox), dashboard GET/PATCH, admin promote, admin payment |
| notification.py | 4 | list (?unread=&page=&page_size=), unread-count, <id>/read (POST), read-all (POST) |
| admin_users.py | 3 | list (search+role+page), assign_role, set_active |
| inventory.py | 3 | list, bulk_sync (max 500, atomic), tap (select_for_update) |
| push.py | 3 | public-key, subscribe, unsubscribe |
| sponsor.py | 3 | active (público), admin collection, admin detail |
| profile.py | 3 | me GET/PATCH (AccountSettings), me/onboarding PATCH, users/<id>/public-profile/ (público, sin email/teléfono, incluye is_online) |
| report.py | 3 | reports/ POST (self + trade-participant guards), admin/reports/?status=&kind=, admin/reports/<id>/ PATCH |
| auth.py | 2 | google_login (hCaptcha + 30-day rule), validate_token (bumpea last_seen). Es el único auth — no hay email/password. |
| captcha.py / google-captcha.py | 2 | site-key, verify (residuo reCAPTCHA del template; el captcha productivo es hCaptcha dentro de google_login) |
| stats.py | 2 | me, ranking (incluye is_online por colector) |
| analytics.py | 2 | overview (composite, 7 bloques), export.csv |
| trade_whatsapp.py | 2 | optin POST, link GET (403 si no hay opt-in mutuo) |
| presence.py | 2 | ping POST (heartbeat, throttled), active-count GET (?city=, público) |
| collectors.py | 2 | map GET (?lat=&lng=&radius_km=&album_id=; sólo lat_approx/lng_approx, excluye al solicitante), search GET (?q=, ≤5) |
| trade.py | 1 | share/<token>/ (público, ?kind=available|wanted) |
| geo.py | 1 | ip-locate GET (público; GeoIP2 — {available, located, lat, lng, city, country}) |

Todos bajo `/api/` (root urls.py). Frontend usa `NEXT_PUBLIC_API_BASE_URL=/api` con rewrite de Next.js → `${NEXT_PUBLIC_BACKEND_ORIGIN}/api/:path*/`.

## 5. Patrones de diseño

- **Single Django app** (`albunmania_app`); models split en archivos individuales bajo `models/`.
- **Service layer** en `services/` — lógica de negocio fuera de las views (FBV thin wrappers).
- **Serializers split por operación** cuando aplica (`<model>_list/detail/create_update.py`).
- **URLs split por dominio** en `urls/` (no monolítico).
- **Signals** (`signals.py`, registrado en `apps.py.ready()`): autoprovisión de Profile/MerchantProfile, recompute de agregados de reputación, y en match mutuo → `Notification` a ambos participantes + Web Push. (Las `Notification` de reseña recibida/respondida se crean explícitamente en las views `trade_review_create`/`review_reply`, no en un signal.)
- **Management commands** para fake data: `create_users` (4 cuentas canónicas + extras geo-ubicadas en Bogotá), `create_fake_data` (idempotente, seeds completos), `delete_fake_data`.
- **Auth en cookies, no localStorage** — `lib/services/tokens.ts` usa `js-cookie`; el interceptor de `lib/services/http.ts` añade `Authorization: Bearer`. El gate de rutas protegidas es client-side (`useRequireAuth` + `<html>` mounted pattern para evitar hydration mismatch).
- **Theming**: next-themes (Light/Dark) + `SponsorThemeProvider` inyecta `--sponsor-{primary,secondary}` en `documentElement` (ortogonal).
- **PWA**: next-pwa genera `sw.js` (Workbox: precache + runtimeCaching para `/api/albums/` y assets de imagen) e `importScripts('/sw-push.js')` (handlers `push`/`notificationclick`).

## 6. Async tasks (Huey)

`backend/albunmania_project/tasks.py` (broker Redis; `HUEY = RedisHuey(..., immediate=not IS_PRODUCTION)` → en dev/test las tareas corren síncronas in-process). Tareas: `deliver_match_push(user_id, payload)` (`@db_task()` — el Web Push del match mutuo; lo encola `signals.notify_on_mutual_match` para sacar el HTTP del request path) + las periódicas `scheduled_backup`/`silk_garbage_collection`/`weekly_slow_queries_report`/`silk_reports_cleanup`. A futuro: cálculo nocturno de stats cacheados, generación de reportes PDF, particionamiento mensual de `AdImpression`, limpieza de matches expirados, cierre formal de la ventana de edición de Review.

## 7. Seguridad

- JWT en cookies (access 15 min / refresh 7 días); CSRF activo.
- Validación dual servidor (DRF serializers) + cliente (Zod).
- ORM siempre; JSX auto-escape; sin `dangerouslySetInnerHTML` con user input.
- Headers prod (ver §3): HSTS opt-in, X-Frame DENY, content-type nosniff, secure cookies, `SECURE_PROXY_SSL_HEADER`.
- File upload: validación extensión + tamaño.
- **Albunmanía-específico:**
  - hCaptcha verificado server-side (`captcha_service.verify_hcaptcha`; bypass cuando `HCAPTCHA_SECRET` vacío — dev). En tests, fixture autouse `_bypass_hcaptcha` en `conftest.py` lo fuerza off.
  - Regla cuenta Google ≥ 30 días via People API (`google_account_age.verify_account_age`); DEBUG bypass cuando falta access_token.
  - QR de Match firmado con HMAC-SHA256 (`qr_token`), TTL 24h, verificación constant-time.
  - `qr_confirm` re-corre `compute_offline_cross` server-side antes de persistir — un cliente malicioso no puede fabricar items.
  - WhatsApp opt-in **per-trade** (no global); el deep link wa.me se genera server-side, solo si ambos opt-in.
  - Click de banner CPM vía 302 redirect server-side (no expone `impression_id` en el `Referer` del anunciante).
  - Moderación de Review: `is_visible=False` esconde + excluye de agregados sin borrar (audit trail vía `ReviewReport`).
  - Perfil público (`users/<id>/public-profile/`, `AllowAny`): solo nombre/ciudad/avatar/rating/% álbum/# trades completados — **nunca** email ni teléfono (eso es opt-in per-trade).
  - Reportes de moderación (`Report`): `report_create` valida no-self (usuario) y participación-en-trade (trade) → `403`; listar/resolver solo admin/web-manager (`_is_admin`); las sanciones (suspender/banear) se aplican aparte en `/admin/users` (`is_active`), no se automatizan desde el reporte. `CheckConstraint` garantiza que `target_user`/`target_trade` concuerda con `target_kind`.
  - Notificaciones in-app: `notification_list` filtra siempre por `user=request.user` (un usuario no ve las de otro); `notification_mark_read` es idempotente.
  - Presencia (`Profile.last_seen`): `presence.touch` solo escribe para usuarios autenticados y throttled vía cache (1 write/60s/usuario); `presence_ping` requiere auth; `is_online` deriva (≤5 min) — no se expone `last_seen` en bruto.
  - Mapa de coleccionistas (`/api/collectors/map/`, `IsAuthenticated`): solo expone `lat_approx`/`lng_approx` (ya aproximados); excluye al solicitante; nunca una posición exacta del dispositivo.
  - GeoIP2 (`/api/geo/ip-locate/`, `AllowAny`): lookup **local** contra la `.mmdb` (sin llamadas externas); salta IPs privadas/loopback; si la DB no está provisionada, `available()=False` y degrada limpio (no rompe el onboarding). La `.mmdb` no se versiona (licencia + tamaño) — la provisiona ops vía `DJANGO_GEOIP_PATH`.
  - Admin gating defense-in-depth: redirect client-side + check real en endpoint.
  - `cannot_block_self` en `admin/users/{id}/active/`.

## 8. Testing

- **Backend**: pytest + pytest-django. `tests/{models,serializers,views,services,utils,commands}/` + `tests/test_tasks.py` — 58 archivos `test_*.py`. **394/394 verde**, cobertura **~94%** (`pytest --cov`; reporter custom en `conftest.py` con barras Unicode + "Top-10 a enfocar"). Fixture autouse `_bypass_hcaptcha` en `conftest.py`. Coverage objetivo ≥80% por módulo, 100% en críticos (auth, match, ads).
- **Frontend unit**: Jest, colocación (`__tests__/` junto a stores y components). **375/375 verde** (81 suites).
- **E2E**: Playwright — 16 specs, ~74 tests: `validation/session-01..05.spec.ts` (5 sesiones) + `auth/auth.spec.ts` + `public/smoke.spec.ts` + `public/legal.spec.ts` + `profile/profile.spec.ts` + `notifications/notifications.spec.ts` + `moderation/moderation.spec.ts` + `presence/presence.spec.ts` + `collectors/collectors.spec.ts` + `catalog/predictive-search.spec.ts` + `catalog/availability-proximity.spec.ts` + `geo/geo.spec.ts`. Correr con `PLAYWRIGHT_BASE_URL=http://localhost:3000 PW_SKIP_WEBSERVER=1 E2E_REUSE_SERVER=1 npx playwright test e2e/validation/`. Re-seedear (`create_fake_data`) antes de la suite de validación deja `TradeWhatsAppOptIn` limpio (el comando lo resetea para el trade seedeado).
- **Reglas duras** (`CLAUDE.md`): nunca correr suite completa en ciclos manuales, max 20 tests/batch, 3 comandos/ciclo; cada test una conducta observable; mock solo en boundaries.

## 9. Deployment (staging)

Paquete completo en `deploy/staging/` — ver `deploy/staging/RUNBOOK.md`. Resumen:
- Server: VPS fleet, path `/home/ryzepeck/webapps/albunmania_staging`, dominio `albunmania.projectapp.co`.
- Servicios systemd: `albunmania_staging` (gunicorn, unix socket `/run/albunmania_staging.sock`), `albunmania-staging-huey`.
- nginx: `/api/` → gunicorn socket, `/static/` + `/media/` directos, `/sw.js` scope=/, `/` → Next.js `:3000` (proxy). Headers de seguridad. certbot para HTTPS.
- DB: MySQL `albunmania_staging` en `localhost:3306`.
- Frontend: `npm ci && npm run build` (con `--webpack`), Next.js en producción detrás de nginx.
- Deploys posteriores: `deploy/staging/scripts/deploy.sh` (git reset → pip → migrate → collectstatic → npm build → restart → smoke).
- Registrar en `projects.yml` del fleet (snippet en `deploy/staging/projects.yml.snippet`) para que los helpers (`server-alerts.sh`, `backup-mysql-and-media.sh`, skill `playwright-validation`) lo reconozcan.
