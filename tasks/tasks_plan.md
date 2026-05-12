# Tasks Plan — Albunmanía

> Fuente de verdad del scope: `docs/release/01-release-checklist.md`.
> Este archivo agrega estado de ejecución, conteos verificados y deuda pendiente.

## Estado global

- **Bootstrap**: ✅ completado (commits `4170de8` → `fb51414`).
- **Bloque A — Cleanup post-bootstrap** (rename, purga demo, deps, PWA bootstrap, i18n bootstrap, Memory Bank): ✅ completado (commits `0d2d857` → `8084a4d`).
- **Bloque B — Implementación Release 01** (14 épicas): ✅ **las 14 épicas implementadas**. La **auditoría de completitud (2026-05-12)** reconcilió `docs/release/01-release-checklist.md` con el codebase real (53→133 ítems `[x]`, comentarios inline `<!-- ... -->` con trazabilidad): la mayoría del scope está hecho; quedan sub-items `<!-- V2 -->` (branding en notificaciones, reportes Sponsor/anunciantes, gestor de álbumes CSV, wiring next-intl). De los **8 GAPS** detectados, los **4 P2 ya están cerrados** ("Bloque D": centro de notificaciones + modelo `Notification`, modelo `Report` general + moderación de usuarios/trades, página `/profile`, páginas T&C/privacidad/FAQ + componente FAQ); siguen abiertos los **4 P3** (presencia "en línea ahora"/Live Badge, mapa de coleccionistas, GeoIP2 por IP, dropdown de búsqueda predictiva). Ver §"GAPS de la auditoría de completitud" y los comentarios del checklist.
- **Auditoría new-feature-checklist** (en curso, por fases):
  - ✅ Fase 1 (docs E2E): `USER_FLOW_MAP.md` + `flow-definitions.json` reescritos para las 14 épicas; los 46 tests de validación tagueados con `@flow:`; eliminados los 12 `page.waitForTimeout()`; `auth.spec.ts` + `smoke.spec.ts` actualizados a la realidad post-rewrite de `/sign-in`.
  - ✅ Fase 2 (tests backend): `tests/services/test_email_service.py` (6) + `tests/services/test_push_notify.py` (10).
  - ✅ Fase 3 (seeds): `create_fake_data` ahora seedea Review (×2, una con reply) + ReviewReport (×1) + MerchantSubscriptionPayment (×2) + AdImpression (×200) + AdClick (×10) + PushSubscription (1/colector). `TradeWhatsAppOptIn` se deja **sin seed a propósito** (los tests E2E session-03 necesitan que el trade #1 arranque con 0 opt-ins) y `create_fake_data` lo **limpia** del trade seedeado en cada corrida → re-seedear antes de la suite de validación reemplaza el `globalSetup` pendiente. `PasswordCode` se salta (legacy del template). El trade seedeado pasa a estado `completed`.
  - ✅ Fase 4 (tests de componentes frontend): backfilleados los ~20 componentes sin test (manual/×3, KpiTile, GoogleSignInButton, ReviewCard, ReviewSummary, SponsorHeaderBand, MutualMatchModal, RankingList, WhatsAppLinkButton, CatalogFilters, StickerGrid, QRDisplay, QRScanner, MatchFeed, MerchantDashboardForm, MerchantMap, MerchantMapInner, StepAlbumSelect, StepGeolocation, StepPermissions). Borrado `components/layout/Footer.tsx` (dead code con string del template). **Cobertura de componentes: ~90% statements/branches/lines, 79% functions** (umbral del estándar: ≥60%). Suite frontend completa: **321/321 verde** (era 221).
- **Bloque C — Validación E2E + deploy prep**: ✅ completado.

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

## Conteos verificados (`find` ejecutado 2026-05-12)

| Recurso | Conteo |
|---------|-------:|
| Backend models | 18 |
| Backend services | 13 |
| Backend views (módulos) | 17 |
| Backend URL modules | 17 (60 `path()` totales) |
| Backend migrations | 8 (`0001_initial` → `0008_push_subscription`) |
| Backend test files | 51 (+ `test_email_service.py`, `test_push_notify.py`) |
| Frontend components (.tsx, sin tests) | 42 (`Footer.tsx` borrado por dead code; **cada subdir cubierto**) |
| Frontend app pages (`page.tsx`) | 20 |
| Frontend Zustand stores (sin tests) | 16 |
| Frontend unit test files | 69 (+ ~20 nuevos de componentes en la auditoría) |
| E2E spec files | 7 (5 validation + auth + smoke) |

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
- ✅ D4 (commit pendiente): modelo `Report` general (+ migración `0010`; target user|trade, reason no_show/harassment/fake_profile/inappropriate/other, status pending/dismissed/actioned, resolved_by/at/notes, `CheckConstraint` target↔kind) + `ReportButton`/`ReportModal` en `/profile/[id]` (usuario) y `/match/[matchId]` (intercambio, p.ej. no-show) → `POST /api/reports/` + 2ª cola "Reportes de usuarios e intercambios" en `/admin/moderation` (`GET /api/admin/reports/?status=&kind=`, `PATCH .../<id>/` descartar/marcar atendido + notas + enlace a `/admin/users`). `create_fake_data` seedea 1 Report pendiente.

**GAPS P3 (siguen abiertos — decisión: ¿V2 o fuera de alcance?):**
- **Presencia / "en línea ahora" / Live Badge / "X coleccionistas activos ahora"** — no hay `last_seen`/`is_online`, ni WebSocket/SSE, ni componente Live Badge. (Bloquea también el "Mapa de Coleccionistas".)
- **Mapa de Coleccionistas** (`/mapa`) — existe el mapa de *comerciantes*, no de coleccionistas.
- **GeoIP2 (geolocalización por IP)** — sólo la rama browser; sin la DB `.mmdb` ni lookup por IP → la feature "Geolocalización Dual" queda parcial.
- **Búsqueda predictiva con dropdown de autocompletado** — el endpoint `albums/<slug>/search/` y `searchStickers()` existen + debounce 250ms, pero la UI del catálogo sólo filtra la grilla; falta el dropdown de sugerencias con previsualización (y la sugerencia de coleccionistas).

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
