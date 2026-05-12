# Tasks Plan — Albunmanía

> Fuente de verdad del scope: `docs/release/01-release-checklist.md`.
> Este archivo agrega estado de ejecución, conteos verificados y deuda pendiente.

## Estado global

- **Bootstrap**: ✅ completado (commits `4170de8` → `fb51414`).
- **Bloque A — Cleanup post-bootstrap** (rename, purga demo, deps, PWA bootstrap, i18n bootstrap, Memory Bank): ✅ completado (commits `0d2d857` → `8084a4d`).
- **Bloque B — Implementación Release 01** (14 épicas): ✅ **completo al 100%** — todas las épicas del checklist `[x]`.
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
| Backend test files | 49 |
| Frontend components (.tsx, sin tests) | 43 |
| Frontend app pages (`page.tsx`) | 20 |
| Frontend Zustand stores (sin tests) | 16 |
| Frontend unit test files | 47 |
| E2E spec files | 7 (5 validation + auth + smoke) |

## Testing status

- Backend: **337/337 verde** (`source backend/venv/bin/activate && pytest --no-cov`).
- Frontend unit: **221/221 verde** (`cd frontend && npm test`).
- E2E: 5 specs de validación verde (`PLAYWRIGHT_BASE_URL=http://localhost:3000 PW_SKIP_WEBSERVER=1 npx playwright test e2e/validation/`).

## Known issues / pendientes

### Bloqueante para el deploy real (lo hace ProjectApp/ops)
- Ejecutar `deploy/staging/RUNBOOK.md` en el VPS (`/home/ryzepeck/webapps/albunmania_staging`).
- Generar **VAPID keypair nuevo** (`vapid --gen`) — las committeadas son de dev.
- Regenerar **Google OAuth Client ID + Secret** en GCP — el del template no sirve (ERROR-001).
- **hCaptcha keys reales** — hoy usa test keys.
- `DJANGO_SECRET_KEY` + password MySQL `albunmania_staging`.

### V2 (no bloqueantes)
- "Fuentes de Tráfico" (analytics) — instrumentación UTM + tabla `TrafficSource`.
- "Alertas de Rendimiento" (KPIs) — Huey nightly + email/push cuando un KPI cae bajo umbral.
- "Reportes PDF de Sponsor" + "Reportes para anunciantes" — pipeline Huey + storage + descarga firmada.
- Wiring real de `next-intl` — `messages/{es,en,pt}.json` existen y están poblados, pero las páginas usan copy hardcoded en español.
- "Branding sutil en notificaciones oficiales" (emails/push con pie de Sponsor).
- Admin: gestor de álbumes con CSV upload, gestor de creativas con UI.
- `globalSetup` Playwright que limpie `TradeWhatsAppOptIn` antes de la suite de validación (hoy se limpia manual entre runs).

## Política de testing (heredada de CLAUDE.md)

- Backend: nunca correr suite completa en CI manual, max 20 tests/batch, 3 comandos/ciclo. Activar venv siempre.
- Frontend unit: `cd frontend && npm test -- <path>`.
- E2E: max 2 archivos por invocación. `--webpack` obligatorio (next-pwa vs Turbopack). `PW_SKIP_WEBSERVER=1` si los dev servers ya corren.
- Coverage objetivo por épica: ≥80% módulo nuevo, 100% en módulos críticos (auth, match, ads).
