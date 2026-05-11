# Active Context — Albunmanía

> Este archivo se actualiza al inicio y cierre de cada sesión de trabajo.

## Sesión actual

**Fecha:** 2026-05-11
**Foco:** Bloque B Sprint 1 — Epic 1 (Auth & Onboarding) **completada**.
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado al cierre de la sesión

- **Bloque A** (cleanup post-bootstrap): completo, **pusheado a `origin/master`**.
- **Bloque B Sprint 1**:
  - ✅ Epic 1 — Auth & Onboarding cerrada (5 commits aislados).
  - ⏳ Epics 2 / 6 / 10 paralelizables tras Epic 1 (próxima sesión).

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

## Pendientes / TODOs heredados (siguen activos)

- ProjectApp debe regenerar **Google OAuth Client ID + Secret** en GCP (ERROR-001 en `error-documentation.md`). Tests pasan con mocks; el flujo real requiere credenciales válidas.
- Generar **VAPID keys** con `vapid --gen` antes de Epic 9 (Push real).
- Diseñar **4 PWA icons** (`frontend/public/icons/`).
- Migración a `app/[locale]/...` se difiere a Epic 14.

## Bloqueadores actualmente

Ninguno para arrancar Sprint 2 (Match) o BATCH paralelo de Epics 2/6/10.

## Próximos pasos sugeridos para la siguiente sesión

**Opción A — BATCH paralelo (Sprint 1 cierre)**:
- `/feature-dev:feature-dev` Epic 2 (Catálogo Multi-Álbum + Inventario)
- `/feature-dev:feature-dev` Epic 6 (Presenting Sponsor — modelo + config + splash)
- `/feature-dev:feature-dev` Epic 10 (Dark mode + theming dinámico)

**Opción B — Sprint 2 secuencial**:
- `/feature-dev:feature-dev` Epic 3 (Match swipe + QR presencial) — necesita Epic 2 primero, así que esto implica Sprint 1 + Sprint 2 en una sesión grande.

Recomendado: **Opción A** — agrega valor en 3 frentes paralelos sin dependencia entre ellos.
