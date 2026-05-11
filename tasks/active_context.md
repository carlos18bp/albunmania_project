# Active Context — Albunmanía

> Este archivo se actualiza al inicio y cierre de cada sesión de trabajo.

## Sesión actual

**Fecha:** 2026-05-11
**Foco:** Bloque B Sprint 1 — Epics 2 + 6 + 10 cierre BATCH paralelo.
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado al cierre de la sesión

- **Bloque A** (cleanup post-bootstrap): completo, **pusheado a `origin/master`**.
- **Bloque B Sprint 1**: ✅ **completo** — Epics 1 / 2 / 6 / 10 cerradas.
  - ✅ Epic 1 — Auth & Onboarding (5 commits aislados, sesión previa).
  - ✅ Epic 2 — Catálogo + Inventario (backend + frontend + tests).
  - ✅ Epic 6 — Presenting Sponsor (backend + theming + splash + header band).
  - ✅ Epic 10 — Dark mode + theming dinámico (next-themes + sponsor CSS vars).

## Epic 1 — Cierre

### Backend

| Área | Archivo | Estado |
|------|---------|--------|
| Roles | `backend/albunmania_app/models/user.py` | Extendido a 4 roles + `assign_role()` helper |
| Profile | `backend/albunmania_app/models/profile.py` | Nuevo, autoprovisión vía signal |
| MerchantProfile | `backend/albunmania_app/models/merchant_profile.py` | Nuevo, role-gated, `is_listing_visible` |
| Signals | `backend/albunmania_app/signals.py` | Nuevo, registrado en `apps.py.ready()` |
| Migration | `0002_role_extend_profile_merchant.py` | Aplicada y verificada |
| hCaptcha | `backend/albunmania_app/services/captcha_service.py` | Reemplaza reCAPTCHA |
| Captcha views | `backend/albunmania_app/views/captcha_views.py` | Reescrito + shim `verify_recaptcha` para compat |
| Account age | `backend/albunmania_app/services/google_account_age.py` | People API + DEBUG bypass |
| google_login | `backend/albunmania_app/views/auth.py` | hCaptcha + 30-day rule integrados |
| Profile endpoints | `backend/albunmania_app/views/profile.py` + `serializers/profile.py` + `urls/profile.py` | `GET /me/`, `PATCH /me/onboarding/` |
| URLs root | `backend/albunmania_app/urls/__init__.py` | `/captcha/` (nuevo) + `/google-captcha/` (alias) + `/profile/` |
| Tests | `tests/{models,services,views}/test_*.py` | 8 archivos nuevos, +47 tests |

**Cobertura módulos nuevos**: `profile.py` 100%, `merchant_profile.py` 96%, `serializers/profile.py` 100%, `services/captcha_service.py` 100%, `services/google_account_age.py` 89%, `views/profile.py` 100%. Suite total: **152/152 verde**.

### Frontend

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/authStore.ts` | Extendido (`googleLogin` con access_token + captcha + `GoogleLoginError` typed union, `profile`, `refreshProfile`) |
| Stores | `lib/stores/onboardingStore.ts` | Nuevo, state machine 3 pasos + submit |
| Components | `components/auth/HCaptchaWidget.tsx` | Nuevo |
| Components | `components/auth/GoogleSignInButton.tsx` | Nuevo (implicit flow → access_token) |
| Components | `components/onboarding/Step{AlbumSelect,Geolocation,Permissions}.tsx` + `OnboardingWizard.tsx` | Nuevos |
| Pages | `app/sign-in/page.tsx`, `app/sign-up/page.tsx` | Migrados a hCaptcha |
| Pages | `app/onboarding/page.tsx` | Nueva |
| i18n | `messages/{es,en,pt}.json` | Sección `onboarding` + `auth.{googleAccountAgeError,captchaError}` |
| Tests | 4 nuevos test modules | jest 124/124 verde |
| jest.setup.ts | matchMedia polyfill para next-themes | |

### Decisiones técnicas

1. **People API para account age** — el id_token de Google no expone `created_at`. La única vía confiable es People API `metadata.sources[].createTime` con scope `profile`. El frontend usa `useGoogleLogin({ flow: 'implicit' })` para obtener `access_token` y lo manda al backend.
2. **DEBUG bypass** del age check cuando falta access_token — para no romper dev local con clientes legacy.
3. **Captcha** `verify_recaptcha` mantenido como shim en `views/captcha_views.py` y `views/auth.py` durante una sesión de transición. Lo elimina la siguiente épica.
4. **react-leaflet 5** (no 4) — react 19 compatibility.
5. **next-pwa requerido dinámicamente** en `next.config.ts` — no rompe `next dev` cuando el package no está instalado.

## Epics 2 + 6 + 10 — Cierre

### Backend (Epic 2 + Epic 6)

| Área | Archivo | Estado |
|------|---------|--------|
| Album / Sticker | `backend/albunmania_app/models/{album,sticker,user_sticker}.py` | Nuevos, índices compuestos críticos |
| Sponsor | `backend/albunmania_app/models/sponsor.py` | Nuevo, `Sponsor.active()` con orden por -active_from |
| Migración | `0003_catalog_inventory_sponsor.py` | Aplicada |
| Endpoints catálogo | `views/album.py` + `serializers/album.py` + `urls/album.py` | List, detail, sticker list filtrable, search top-10 |
| Endpoints inventario | `views/inventory.py` + `serializers/inventory.py` + `urls/inventory.py` | List, bulk_sync (max 500, atomic), tap (select_for_update) |
| Endpoints sponsor | `views/sponsor.py` + `serializers/sponsor.py` + `urls/sponsor.py` | `/sponsor/active/` público + admin gated |
| Tests | `tests/{models,views}/test_*.py` | 6 archivos nuevos, **193/193 verde** |

### Frontend (Epic 2 + Epic 6 + Epic 10)

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/sponsorStore.ts` | Nuevo, `fetchActive`, tipo `Sponsor` |
| Stores | `lib/stores/albumStore.ts` | Nuevo, list/detail/stickers/search |
| Stores | `lib/stores/inventoryStore.ts` | Nuevo, tap optimista + flush debounced 2s + long-press reset |
| Sponsor UI | `components/sponsor/SponsorThemeProvider.tsx` | Inyecta `--sponsor-{primary,secondary}` en `documentElement` |
| Sponsor UI | `components/sponsor/SponsorSplash.tsx` | Splash full-bleed, fallback Albunmanía nativo, dismiss 1800ms |
| Sponsor UI | `components/sponsor/SponsorHeaderBand.tsx` | Banda discreta "Presentado por <brand>" (oculta sin sponsor) |
| Catálogo UI | `components/catalog/{StickerCard,StickerGrid,CatalogFilters}.tsx` | Tap 0/1/2+, badge especial, long-press reset, filtros debounced |
| Catálogo página | `app/catalog/[slug]/page.tsx` | Carga álbum + inventario + stickers, filtros reactivos |
| Layout | `app/layout.tsx` + `app/providers.tsx` | Wired Sponsor providers + Splash + HeaderBand |
| Utilidad | `lib/utils.ts` | `cn()` minimal helper |
| i18n | `messages/{es,en,pt}.json` | Sección `catalog` añadida |
| Tests | 5 nuevos test modules | **149/149 verde** (sponsor, album, inventory stores + StickerCard + theme provider + splash) |

### Decisiones técnicas (esta sesión)

1. **Theming dinámico Sponsor vs Light/Dark** — capa ortogonal: next-themes maneja dark/light; `SponsorThemeProvider` inyecta `--sponsor-primary/secondary` en `documentElement`. Componentes premium leen ambos.
2. **Inventory tap optimista** — incremento local inmediato + flush debounced 2s al endpoint bulk. Long-press 600ms = reset a 0 (sin tap implícito al soltar).
3. **Splash auto-dismiss 1800ms** — visible solo después de `loaded` para no flashear el fallback antes de saber si hay sponsor.
4. **`lib/utils.cn`** — helper minimal sin clsx/tailwind-merge (no estaban en deps); evita pull adicional.

## Pendientes / TODOs heredados (siguen activos)

- ProjectApp debe regenerar **Google OAuth Client ID + Secret** en GCP (ERROR-001 en `error-documentation.md`). Tests pasan con mocks; el flujo real requiere credenciales válidas.
- Generar **VAPID keys** con `vapid --gen` antes de Epic 9 (Push real).
- Diseñar **4 PWA icons** (`frontend/public/icons/`).
- Migración a `app/[locale]/...` se difiere a Epic 14.

## Bloqueadores actualmente

Ninguno para arrancar Sprint 2 (Match) o BATCH paralelo de Epics 2/6/10.

## Próximos pasos sugeridos para la siguiente sesión

**Sprint 2 — Match** (la épica más dependiente de Sprint 1, ahora desbloqueable):

- `/feature-dev:feature-dev` Epic 3 — Match swipe (proximidad geográfica) + Match QR presencial offline. Necesita inventario + sticker catalog cerrados (ahora ✅) y profile geo-coordinates (✅ Epic 1).
- `/feature-dev:feature-dev` Epic 4 — Reseñas / Reputación post-trade.
- `/feature-dev:feature-dev` Epic 7 — Listing Comerciantes en mapa (depende de MerchantProfile ya creado en Epic 1).

Recomendado: **Epic 3 primero** — es el core del producto y desbloquea Epic 4 (reseñas) e Epic 8 (notificaciones de match).
