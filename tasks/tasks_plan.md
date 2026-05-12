# Tasks Plan — Albunmanía

> Fuente de verdad del scope: `docs/release/01-release-checklist.md`.
> Este archivo agrega estado de ejecución, conteos verificados y deuda pendiente.

## Estado global

- **Bootstrap**: ✅ completado (commits `4170de8` → `fb51414`).
- **Bloque A — Cleanup post-bootstrap** (rename, purga demo, deps, PWA bootstrap, i18n bootstrap, Memory Bank): ✅ completado (commits `0d2d857` → `8084a4d`).
- **Bloque B — Implementación Release 01** (14 épicas): ✅ **las 14 épicas implementadas**. La **auditoría de completitud (2026-05-12)** reconcilió `docs/release/01-release-checklist.md` con el codebase real (53→133 ítems `[x]`, comentarios inline `<!-- ... -->` con trazabilidad): la mayoría del scope está hecho; quedan sub-items `<!-- V2 -->` (branding en notificaciones, reportes Sponsor/anunciantes, gestor de álbumes CSV, wiring next-intl). Los **8 GAPS** detectados ya están **todos cerrados**: "Bloque D" (P2 — centro de notificaciones + `Notification`, `Report` general + moderación de usuarios/trades, página `/profile`, T&C/privacidad/FAQ + componente FAQ) y "Bloque E" (P3 — presencia "en línea ahora"/Live Badge, mapa de coleccionistas, búsqueda predictiva con dropdown, GeoIP2 por IP). Ver §"GAPS de la auditoría de completitud" y los comentarios del checklist.
- **Auditoría new-feature-checklist** (en curso, por fases):
  - ✅ Fase 1 (docs E2E): `USER_FLOW_MAP.md` + `flow-definitions.json` reescritos para las 14 épicas; los 46 tests de validación tagueados con `@flow:`; eliminados los 12 `page.waitForTimeout()`; `auth.spec.ts` + `smoke.spec.ts` actualizados a la realidad post-rewrite de `/sign-in`.
  - ✅ Fase 2 (tests backend): `tests/services/test_push_notify.py` (10) (+ `test_email_service.py` (6) — luego eliminado en Bloque F junto con el `email_service.py` muerto del template).
  - ✅ Fase 3 (seeds): `create_fake_data` ahora seedea Review (×2, una con reply) + ReviewReport (×1) + MerchantSubscriptionPayment (×2) + AdImpression (×200) + AdClick (×10) + PushSubscription (1/colector) + Notification + Report + presencia. `TradeWhatsAppOptIn` se deja **sin seed a propósito** (los tests E2E session-03 necesitan que el trade #1 arranque con 0 opt-ins) y `create_fake_data` lo **limpia** del trade seedeado en cada corrida → re-seedear antes de la suite de validación reemplaza el `globalSetup` pendiente. El trade seedeado pasa a estado `completed`.
  - ✅ Fase 4 (tests de componentes frontend): backfilleados los ~20 componentes sin test (manual/×3, KpiTile, GoogleSignInButton, ReviewCard, ReviewSummary, SponsorHeaderBand, MutualMatchModal, RankingList, WhatsAppLinkButton, CatalogFilters, StickerGrid, QRDisplay, QRScanner, MatchFeed, MerchantDashboardForm, MerchantMap, MerchantMapInner, StepAlbumSelect, StepGeolocation, StepPermissions). Borrado `components/layout/Footer.tsx` (dead code con string del template). **Cobertura de componentes: ~90% statements/branches/lines, 79% functions** (umbral del estándar: ≥60%). Suite frontend completa: **321/321 verde** (era 221).
- **Bloque C — Validación E2E + deploy prep**: ✅ completado.
- **Bloque D / E / F**: D (4 GAPS P2) ✅, E (4 GAPS P3) ✅, F (limpieza + hardening) en curso — ver §"GAPS de la auditoría" y §"Bloque F".

## Bloque B — Estado por épica (todas ✅)

| Epic | Nombre | Commits clave | Notas |
|------|--------|---------------|-------|
| 1 | Auth & Onboarding | `f94434c`→`424a160`, refactor `c738634` | Google OAuth + hCaptcha + regla 30 días (People API). Onboarding 3 pasos. Sign-in/up reescritos sin form legacy. |
| 2 | Catálogo Multi-Álbum & Inventario | `3053345`, `5fada27` | Album/Sticker/UserSticker. Tap 0/1/2+ debounced 2s, badge edición especial, filtros (`?special=true` aceptado tras fix `8851201`). |
| 3 | Motor de Match (swipe + QR presencial) | `be9a4e9`→`4e59975` | Match/Like/Trade. Haversine inline + bbox prefilter, HMAC QR tokens, `compute_offline_cross` server+client, idb-keyval offline cache. |
| 4 | WhatsApp Opt-in | `8718fe0`, `45d5e81` | `TradeWhatsAppOptIn` per-trade, deep link wa.me server-side. |
| 5 | Comerciantes (listing + suscripción) | `a9cf6fc`, `630a7be` | Listing público con bbox geo, dashboard self-service, admin promote/payment, `MerchantSubscriptionPayment`. Mapa Leaflet `dynamic({ssr:false})`. |
| 6 | Presenting Sponsor | (Sprint 1 frontend) | Sponsor model + endpoint público + admin gated, splash 1800ms + header band + theming dinámico CSS vars. |
| 7 | Banners CPM | `13c2ca4`, `6dc5a87` | AdCampaign/AdCreative/AdImpression/AdClick. Rotación ponderada (creative × campaign weight), frequency cap 1/5 swipes client-side, click 302 redirect. PDFs → V2. |
| 8 | Panel Admin | `303ab46`, `91d6711` | `/admin` role-gated + `/admin/users` + `/admin/moderation`. Gestor de álbumes con CSV upload → V2. |
| 9 | PWA Push notifications real | `1630c1f`, `a8d9520`, `3f95ae3` | `PushSubscription` + `push_notify` + 3 endpoints + signal post_save Match. SW handlers en `sw-push.js` (importScripts vía next-pwa, fix `a934125`). VAPID dev keys committeadas; rotar para prod. |
| 10 | Dark mode + theming dinámico | (Sprint 1) | next-themes + capa Sponsor CSS vars. |
| 11 | Reseñas y Reputación | `382b24f`, `304b91b` | `Review` (unique trade+reviewer, stars 1-5, edit window 24h), `ReviewReport`. Agregados cacheados en Profile vía signal. Hidden ≠ deleted. |
| 12 | Stats avanzadas (racha + ETA + ranking) | `2bac403`, `6ca420d` | `stats_engine.compute_stats` (% completo, racha con grace day, weekly velocity, ETA) + `city_ranking`. On-demand (Huey nightly → V2). |
| 13 | Analítica + KPIs Dashboard | `72f5431`, `41314bf` | `analytics_engine` 7 funciones + composite `/admin/analytics/overview/` + CSV export. Fuentes de Tráfico + Alertas → V2. |
| 14 | Manual interactivo | `c7ab097` | `lib/manual/content.ts` — 9 secciones × 14 procesos (4 audiencias + transversales). Buscador y rendering eran del Bloque A. |

## Bloque C — Validación E2E + deploy prep

- **5 sesiones de validación E2E con Playwright** (`frontend/e2e/validation/session-01..05.spec.ts`) → **46/46 verde**:
  - S1 Auth & Onboarding · S2 Catálogo + Sponsor + Theming · S3 Match + QR + WhatsApp + Stats · S4 Merchants + Ads + Reviews + Admin · S5 Analytics + Manual + smoke regression.
  - **8 P0 cazados y arreglados inflight** (ver `docs/methodology/error-documentation.md` ERROR-006..013).
- **Paquete `deploy/staging/`**: RUNBOOK 9 pasos + 2 systemd units + nginx conf + projects.yml snippet + 2 env templates + 2 scripts (`render-systemd.sh`, `deploy.sh`).
- **Settings prod**: toggles `SECURE_*` cuando `DEBUG=false`, `SECURE_PROXY_SSL_HEADER`, HSTS opt-in (`DJANGO_SECURE_HSTS_SECONDS`).
- **Seeds dev**: `python manage.py create_fake_data --users 10` (Album Mundial 26 + 50 stickers, 4 especiales; inventarios cruzados deterministas; Sponsor Coca-Cola; AdCampaign Bavaria; MerchantProfile Papelería El Sol; Match mutual user↔user2). `scripts/dev-issue-jwt.py` para auth shortcut (JWT en cookies).

## Conteos verificados (`find` ejecutado tras Bloque F)

| Recurso | Conteo |
|---------|-------:|
| Backend models | 19 |
| Backend services | 14 |
| Backend views (módulos) | 21 |
| Backend URL modules | 21 (~66 `path()` totales) |
| Backend migrations | 12 (`0001_initial` → `0012_delete_passwordcode`) |
| Backend test files | 56 |
| Frontend components (.tsx, sin tests) | 54 |
| Frontend app pages (`page.tsx`) | 24 |
| Frontend Zustand stores (sin tests) | 21 |
| Frontend unit test files | 81 |
| E2E spec files | 15 (5 validation + auth + public/smoke + public/legal + profile + notifications + moderation + presence + collectors + catalog/predictive-search + geo) |

## Testing status

- Backend: **353/353 verde** (`source backend/venv/bin/activate && pytest --no-cov`; +16 de la auditoría).
- Frontend unit: **321/321 verde** (`cd frontend && npm test`). Cobertura de componentes ~90% statements/branches/lines.
- E2E: 46/46 specs de validación + 12/12 `auth/auth.spec.ts` + 1/1 `public/smoke.spec.ts` verde (`PLAYWRIGHT_BASE_URL=http://localhost:3000 PW_SKIP_WEBSERVER=1 npx playwright test`). Re-seedear `create_fake_data` antes de correr la suite de validación (limpia `TradeWhatsAppOptIn`).

## Known issues / pendientes

### Bloqueante para el deploy real (lo hace ProjectApp/ops)
- Ejecutar `deploy/staging/RUNBOOK.md` en el VPS (`/home/ryzepeck/webapps/albunmania_staging`).
- Generar **VAPID keypair nuevo** (`vapid --gen`) — las committeadas son de dev.
- Regenerar **Google OAuth Client ID + Secret** en GCP — el del template no sirve (ERROR-001).
- **hCaptcha keys reales** — hoy usa test keys.
- `DJANGO_SECRET_KEY` + password MySQL `albunmania_staging`.

### GAPS de la auditoría de completitud (2026-05-12)

**Bloque D — cierre de los GAPS P2: ✅ los 4 cerrados.**
- ✅ D1 (commit `3adaca7`): páginas `/terminos`, `/privacidad`, `/ayuda` + componente FAQ + enlaces en el footer. (Texto legal: borrador — lo redacta/revisa el equipo legal del cliente.)
- ✅ D2 (commit `b0e4b1d`): página `/profile/[id]` + endpoint `GET /api/users/<id>/public-profile/` (sin email/teléfono) + sección "Editar mi cuenta" (`PATCH /api/profile/me/`).
- ✅ D3 (commit `0deb9db`): modelo `Notification` (+ migración `0009`) + centro `/notificaciones` + campana con badge en el Header + endpoints `/api/notifications/*` + notificaciones creadas en el signal post_save Match (mutuo) y en las views de crear/responder reseña.
- ✅ D4 (commit `30eaf4f`): modelo `Report` general (+ migración `0010`; target user|trade, reason no_show/harassment/fake_profile/inappropriate/other, status pending/dismissed/actioned, resolved_by/at/notes, `CheckConstraint` target↔kind) + `ReportButton`/`ReportModal` en `/profile/[id]` (usuario) y `/match/[matchId]` (intercambio, p.ej. no-show) → `POST /api/reports/` + 2ª cola "Reportes de usuarios e intercambios" en `/admin/moderation` (`GET /api/admin/reports/?status=&kind=`, `PATCH .../<id>/` descartar/marcar atendido + notas + enlace a `/admin/users`). `create_fake_data` seedea 1 Report pendiente.

**Bloque E — cierre de los GAPS P3: ✅ los 4 cerrados.**
- ✅ E1 (commit `2488b14`): presencia "en línea ahora" / Live Badge — `Profile.last_seen` (+ migración `0011`) bumpeado throttled (cache) por `PresencePinger` (heartbeat `POST /api/presence/ping/` cada 120s + on focus) y `validate_token`; `is_online` = last_seen dentro de 5 min, expuesto en public-profile / swipe cards / city ranking; `LiveBadge` en ProfileHeader/SwipeCard/RankingList; `ActiveCollectorsBanner` en el dashboard vía `GET /api/presence/active-count/?city=`. `create_fake_data` seedea a los 2 colectores canónicos online.
- ✅ E2 (commit `7e68d30`): Mapa de Coleccionistas — `GET /api/collectors/map/?lat=&lng=&radius_km=&album_id=` (IsAuthenticated; sólo lat_approx/lng_approx, excluye al solicitante) + `/mapa` (Leaflet `CollectorMap`/`CollectorMapInner`, mismo patrón que el mapa de comerciantes) + lista con Live Badges + "Usar mi ubicación" (browser geo → 50 km) / "Ver todos" + enlace "Mapa" en el Header. (También `GET /api/collectors/search/?q=` — usado por E3.)
- ✅ E3 (commit `f2be293`): búsqueda predictiva con dropdown — `SearchAutocomplete` en `/catalog/[slug]` (debounced; sugerencias de cromos `GET /api/albums/<slug>/search/?q=` + coleccionistas `GET /api/collectors/search/?q=` con previsualización; elegir cromo → filtra la grilla a su número, elegir coleccionista → `/profile/[id]`). De paso se arregló `albumStore.searchStickers` (path equivocado `albums/<slug>/stickers/search/` → `albums/<slug>/search/`; antes 404aba — no tenía consumidor de UI).
- ✅ E4 (commit `695ac91`): GeoIP2 por IP — `services/geoip.py` (lazy `GeoLite2-City` reader desde `settings.GEOIP_PATH` / `DJANGO_GEOIP_PATH`; `client_ip` con cadena X-Forwarded-For, `locate_ip` salta IPs privadas/loopback) + `GET /api/geo/ip-locate/`; `StepGeolocation` lo llama al montar y ofrece "usar ubicación aproximada por IP" antes del prompt preciso (`onboardingStore.setGeoFromIp`). La `.mmdb` la provisiona ops (no está en el repo — licencia + tamaño; documentado en `deploy/staging/RUNBOOK.md` + `backend.env.example`); si falta, `available()=False` y degrada limpio.

### Bloque F — limpieza + hardening post-Bloque E (en curso)
Plan: `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`.
- ✅ F1 (commit `f117add`): deuda tsc cerrada — stubs de `next/image` tipados (`BannerSlot`, `SponsorSplash`) + cast en `http.test.ts`; `tsc --noEmit` limpio y `npm run build -- --webpack` verde.
- ✅ F2 (commit `e101db3`): podadas las rutas vestigiales del template y el auth email/password muerto. **Frontend**: borradas `app/backoffice/` y `app/forgot-password/` (+ tests); quitados `ROUTES.BACKOFFICE/FORGOT_PASSWORD` + 6 entradas de `API_ENDPOINTS`; quitada la clave i18n `forgotPassword`; `authStore` perdió `signIn`/`signUp`/`sendPasswordResetCode`/`resetPassword`; fix de un test de auth E2E ambiguo (`Manual` link → scoped a `site-header`). **Backend**: `views/auth.py` reducido a `google_login` + `validate_token`; eliminados `views/user_crud.py`, `serializers/user_{create_update,detail,list}.py`, `services/email_service.py`, `urls/user.py`, `models/password_code.py` (+ migración `0012_delete_passwordcode`); `auth_utils.py` reducido a `generate_auth_tokens`; `admin.py` y `services/__init__.py`/`models/__init__.py` limpiados; tests muertos eliminados. Conteos: views 22→21, urls 22→21, serializers 14→11, services 15→14, models 20→19, migrations 11→12, ~73→~66 paths.
- ✅ F3 (commit `df87ae8`): push de match → tarea Huey. `@db_task() deliver_match_push(user_id, payload)` en `albunmania_project/tasks.py` (re-busca el User, no-op si no existe; importa `push_notify.send_to` dentro del cuerpo); `signals.notify_on_mutual_match` lo encola en vez de llamar `send_to` síncrono — en dev/test Huey está en modo `immediate` así que sigue corriendo síncrono. Tests: `test_tasks.py` (3) + el test del signal en `test_push_endpoints.py` parchea `push_notify.send_to`. Suite: 370/370 backend.
- ✅ F4 (commit pendiente): filtros "disponibilidad" + "radio de proximidad" en `/catalog/[slug]`. **Backend**: `sticker_list` añade `availability=mine|missing|repeated` (estado del inventario del solicitante; anónimo → 400) y `nearby=true&lat&lng&radius_km` (cromos que algún colector dentro del radio tiene disponible — `UserSticker.count≥2`, excluye al solicitante; fallback a la location del `Profile`; 400 si no hay geo) — helper `_nearby_offerer_user_ids` (bbox + haversine sobre `Profile`, reusa `match_engine`). **Frontend**: `StickerFilters` ampliado; `CatalogFilters` con `<select>` de disponibilidad + checkbox "Disponibles cerca" (+ radio 10/25/50/100 km, deshabilitado si no hay location, con hint); `/catalog/[slug]` pasa `userLocation` (de `useAuthStore.profile`, hace `refreshProfile()` al montar) + muestra `catalog-error` si un filtro requiere auth. Flow `catalog-availability-proximity` (flow-definitions v2.9.0, USER_FLOW_MAP v2.9.0, flow-tags). Tests: backend `test_sticker_filters.py` (11), frontend `CatalogFilters` (8) + `albumStore` (+1), e2e `availability-proximity.spec.ts` (2).
- ⬜ F5: subir cobertura backend (2 tandas siguiendo el skill `backend-test-coverage`).

### V2 (no bloqueantes, ya conocidos)
- "Fuentes de Tráfico" (analytics) — instrumentación UTM + tabla `TrafficSource`.
- "Alertas de Rendimiento" (KPIs) — Huey nightly + email/push cuando un KPI cae bajo umbral.
- "Reportes PDF de Sponsor" + "Reportes para anunciantes" — pipeline Huey + storage + descarga firmada.
- Wiring real de `next-intl` — `messages/{es,en,pt}.json` existen y están poblados, pero las páginas usan copy hardcoded en español.
- "Branding sutil en notificaciones oficiales" (emails/push con pie de Sponsor).
- Admin: gestor de álbumes con CSV upload, gestor de comerciantes (UI de aprobación/pagos), gestor de creativas con UI — hoy todo eso vía Django Admin.
- ~~`globalSetup` Playwright que limpie `TradeWhatsAppOptIn`~~ — resuelto: `create_fake_data` ahora resetea las opt-ins del trade seedeado, así que re-seedear antes de la suite de validación deja el estado limpio.

> Detalle completo y trazabilidad por ítem: ver los comentarios inline `<!-- ... -->` en `docs/release/01-release-checklist.md` (reconciliado el 2026-05-12).

## Política de testing (heredada de CLAUDE.md)

- Backend: nunca correr suite completa en CI manual, max 20 tests/batch, 3 comandos/ciclo. Activar venv siempre.
- Frontend unit: `cd frontend && npm test -- <path>`.
- E2E: max 2 archivos por invocación. `--webpack` obligatorio (next-pwa vs Turbopack). `PW_SKIP_WEBSERVER=1` si los dev servers ya corren.
- Coverage objetivo por épica: ≥80% módulo nuevo, 100% en módulos críticos (auth, match, ads).
