# Tasks Plan — Albunmanía

> Fuente de verdad: `docs/release/01-release-checklist.md`. Este archivo agrega estado de ejecución y prioridad por épica.

## Estado global

- **Bootstrap**: ✅ completado (commits `4170de8` → `fb51414`).
- **Cleanup pre-desarrollo (Bloque A)**: ✅ completado (commits `0d2d857` → `8084a4d`), pusheado a `origin/master`.
- **Implementación Release 01 (Bloque B)**: 🟡 en curso.
  - Sprint 1: ✅ **completo** — Epic 1 (commits `f94434c`→`424a160`), Epic 2 backend (`3053345`), tests backend (`5fada27`), Epic 2/6/10 frontend (esta sesión).

## Bloque A — Cleanup pre-desarrollo (8 fases)

| Fase | Descripción | Estado | Commit |
|------|-------------|--------|--------|
| **A1** | `/methodology-setup` — Memory Bank | 🟡 in_progress | _pendiente_ |
| **A2** | Rename `base_feature_app/_project` → `albunmania_app/_project` (sed batch atómico) | ⚪ pending | — |
| **A3** | Purga demo (Blog, Product, Sale, StagingPhaseBanner) + reset migraciones | ⚪ pending | — |
| **A4** | Env placeholders (OAuth, hCaptcha, VAPID, WhatsApp) | ⚪ pending | — |
| **A5** | Systemd + frontend `package.json` metadata | ⚪ pending | — |
| **A6** | Nuevas deps: django-allauth, pywebpush, qrcode, haversine, geoip2, next-pwa, leaflet, qrcode.react, hcaptcha | ⚪ pending | — |
| **A7** | PWA bootstrap: manifest + next-pwa + Service Worker stub | ⚪ pending | — |
| **A8** | i18n bootstrap: messages/{es,en,pt}.json + middleware | ⚪ pending | — |

## Bloque B — Épicas Release 01 (14 épicas, slicing por dependencia)

### Sprint 1 — Foundation auth + catálogo + sponsor base

| Epic | Nombre | Estado | Dependencias | Notas |
|------|--------|--------|--------------|-------|
| **1** | Auth & Onboarding | ✅ done | A6 (allauth, hcaptcha) | Commits f94434c→424a160. Cobertura módulos nuevos ≥89%. Suite backend 152/152, frontend 124/124 verde. |
| **2** | Catálogo Multi-Álbum & Inventario | ✅ done | Epic 1 | Backend + frontend + tests. Inventory tap debounced 2s, badge edición especial, filtros. |
| **6** | Presenting Sponsor | ✅ done | Epic 1 | Sponsor model + endpoint público + admin gated, splash + header band + theming dinámico. |
| **10** | Dark mode + theming dinámico | ✅ done | Epic 1 | next-themes (preexistente) + capa Sponsor CSS vars en `SponsorThemeProvider`. |

### Sprint 2 — Match + comunicación

| Epic | Nombre | Estado | Dependencias | Notas |
|------|--------|--------|--------------|-------|
| **3** | Motor de Match (swipe + QR presencial) | ✅ done | Epic 2 | Commits be9a4e9→4e59975. Backend 245/245, frontend 169/169. Haversine inline, HMAC tokens, idb-keyval offline cache. |
| **4** | WhatsApp Opt-in + Push básico | ✅ done (opt-in + wa.me) | Epic 3 | Commits 8718fe0 + 45d5e81. Push real difiere a Epic 9. |
| **9** | PWA Push notifications real | ⚪ pending | A7 + Epic 3 | BATCH paralelo a Epic 4 |
| **12** | Stats avanzadas (racha + ETA + ranking) | ✅ done | Epic 2 | Commits 2bac403 + 6ca420d. Cálculo on-demand (Huey nightly difiere a V2). |

### Sprint 3 — Monetización (BATCH 2 épicas paralelas)

| Epic | Nombre | Estado | Dependencias |
|------|--------|--------|--------------|
| **5** | Comerciantes (listing + suscripción + mapa) | ✅ done | Epic 1 (rol) |
| **7** | Banners CPM (campañas + creativas + tracking) | ✅ done (sin reportes PDF) | Epic 1 |

### Sprint 4 — Trust loop + admin

| Epic | Nombre | Estado | Dependencias |
|------|--------|--------|--------------|
| **11** | Reseñas y Reputación | ✅ done | Epic 4 (Trade cerrado) |
| **8** | Panel Admin (gestión + cola moderación + manual stub) | ✅ done (sin manual) | Epics 2, 5, 6, 7 |

### Sprint 5 — Observabilidad y manual (BATCH paralelo)

| Epic | Nombre | Estado | Dependencias |
|------|--------|--------|--------------|
| **13** | Analítica + KPIs Dashboard | ✅ done (sin Fuentes de Tráfico ni Alertas) | Datos reales de Sprints 1-4 | Commits 72f5431 + 41314bf. 7 funciones agregadas + composite endpoint + CSV export. |
| **14** | Manual interactivo | ✅ done | Features cerradas | Commit c7ab097. 9 secciones × 14 procesos. Buscador y rendering ya estaban del Bloque A. |

## Inventario actual del template (a purgar en A3)

**Backend** (`backend/base_feature_app/`):
- Models: User ✅ keep, PasswordCode ✅ keep, **Blog ❌ purge**, **Product ❌ purge**, **Sale ❌ purge**, **StagingPhaseBanner ❌ purge**.
- Views: 10 archivos (4 archivos blog/product/sale/staging_phase_banner ❌, mantener auth/captcha/user_crud).
- Serializers: 15 archivos (subset blog/product/sale/staging ❌).
- URLs: 7 archivos (blog/product/sale/staging_phase_banner ❌).
- Forms: 5 archivos (blog/product ❌, mantener user).
- Tests: 25 archivos test_*.py (subset relevante a demo ❌).
- Migrations: 5 archivos (todas ❌, regenerar `0001_initial` con solo User + PasswordCode).
- Management commands: `create_blogs`, `create_products`, `create_sales` ❌; `create_users` ✅ keep; `delete_fake_data` ✅ keep (extender).

**Frontend** (`frontend/`):
- Pages a purgar: `app/blogs/`, `app/blogs/[blogId]/`, `app/catalog/`, `app/checkout/`, `app/products/[productId]/`.
- Pages a mantener: `app/page.tsx`, `app/sign-in/`, `app/sign-up/`, `app/forgot-password/`, `app/admin-login/`, `app/dashboard/`, `app/backoffice/`, `app/manual/` (todas serán reescritas/redirigidas durante épicas).
- Stores a purgar: `blogStore.ts`, `productStore.ts`, `cartStore.ts`, `stagingBannerStore.ts` (+ sus tests).
- Stores a mantener: `authStore.ts`, `localeStore.ts`.
- Components: 19 archivos — auditar uno a uno durante A3.

## Conteos verificados (`find` ejecutado contra el repo el 2026-05-11)

| Recurso | Conteo actual |
|---------|--------------:|
| Backend models | 6 (todos demo del template) |
| Backend views | 10 |
| Backend serializers | 15 |
| Backend URL modules | 7 |
| Backend test files | 25 |
| Backend migrations | 5 |
| Frontend components | 19 |
| Frontend app pages | 13 (incluye 4 demo a purgar) |
| Frontend Zustand stores | 6 (4 demo a purgar) |
| Frontend store tests | 5 |
| Frontend unit tests totales | 38 |
| E2E specs | 9 |

## Known issues / bloqueadores

- **Google OAuth Client ID `931303546385-...`** es del template, hard-coded en `backend/.env.example` y `frontend/.env.example`. Bloquea cualquier test real de Google OAuth hasta que ProjectApp regenere uno nuevo en Google Cloud Console. Documentado en `error-documentation.md`.
- **Sin VAPID keys** generadas todavía → Web Push impostible hasta A4.
- **Sin DB MaxMind GeoIP2** descargada → IP geolocation depende de licencia (A6 documentación).
- **next-intl instalado pero sin `messages/`** → cualquier intento de usar `useTranslations` antes de A8 fallará.
- **Sin Service Worker** → PWA install + offline catalog no funcionarán hasta A7.

## Política de testing por épica (heredada de CLAUDE.md)

- Backend: nunca correr suite completa, max 20 tests/batch, 3 comandos/ciclo.
- Activar venv siempre: `source backend/venv/bin/activate && pytest <path> -v`.
- Frontend unit: `cd frontend && npm test -- <path>`.
- E2E: max 2 archivos por invocación de `playwright test`. Usar `E2E_REUSE_SERVER=1` si dev server ya corriendo.
- Coverage objetivo por épica: ≥80% módulo nuevo, 100% en módulos críticos (auth, match, ads).
