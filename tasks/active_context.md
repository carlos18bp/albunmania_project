# Active Context — Albunmanía

> Snapshot del estado actual. Se reescribe (no se acumula) al cierre de cada sesión.
> El changelog detallado por épica vive en `git log` y en `tasks/tasks_plan.md`.

## Sesión actual

**Fecha:** 2026-05-12
**Foco:** Auditoría de Release 01 contra el `/new-feature-checklist` — remediación por fases (Fase 1 ✅ docs E2E + flujos; pendientes: tests backend, seeds, tests de componentes). El Memory Bank refresh quedó cerrado en el commit `30479fd`.
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado del producto

**Release 01 = 100% implementado + validado E2E + paquete de deploy listo.**

- **Bloque A** (cleanup post-bootstrap): ✅ commits `0d2d857`→`8084a4d`.
- **Bloque B** (14 épicas Release 01): ✅ **completo**. Todas las épicas del checklist `[x]`.
  - Auth & Onboarding · Catálogo + Inventario · Sponsor · Dark mode/theming
  - Match swipe + QR presencial · WhatsApp opt-in · Push real · Stats avanzadas
  - Comerciantes · Banners CPM · Reseñas y Reputación · Panel Admin
  - Analítica + KPIs · Manual interactivo
- **Bloque C** (validación E2E + deploy prep): ✅
  - 5 sesiones de validación E2E con Playwright → **46/46 tests verde** (`frontend/e2e/validation/session-01..05.spec.ts`).
  - 8 P0 cazados y arreglados inflight durante la validación (ver `error-documentation.md` ERROR-006..013).
  - Paquete `deploy/staging/` listo (RUNBOOK + systemd + nginx + projects.yml + env templates + scripts).

## Tests

- Backend: **337/337 verde** (`pytest --no-cov`).
- Frontend unit: **221/221 verde** (`npm test`).
- E2E: 5 specs de validación + `auth/auth.spec.ts` + `public/smoke.spec.ts`.

## Últimos commits relevantes (mayo 2026)

| Commit | Qué |
|--------|-----|
| `1630c1f` / `a8d9520` / `3f95ae3` | Epic 9 Push real — backend (PushSubscription + push_notify + endpoints + signal) / frontend (sw.js handlers + pushStore + opt-in button) / docs |
| `c738634` | Rewrite `/sign-in` + `/sign-up` quitando el form email/password del template — solo Google OAuth + hCaptcha, copy en español |
| `2dccd2f` | Fix hydration mismatch en `Header` — patrón `mounted` (igual que ThemeToggle) |
| `0e3a197` | `themeColor` movido de `metadata` a `viewport` export (Next.js 16 deprecation) |
| `a934125` | Fix next-pwa+push: handlers de push en `public/sw-push.js`, importado vía `importScripts` en la config de next-pwa; `sw.js`/`workbox-*.js` gitignored |
| `b887fae` | Toggles de seguridad prod en `settings.py` cuando `DEBUG=false` |
| `d7f2ec3` | Paquete `deploy/staging/` |
| `1d4bb0d` | Pre-flight de validación: `create_fake_data` seeds + `scripts/dev-issue-jwt.py` + `.playwright_local/` |
| `8851201` | Fix `?special=` filter mismatch frontend/backend (P0 Sesión 2) |
| `2e19919` | Fix ReviewDrawer infinite loop — Zustand v5 selector `?? []` → `Object.freeze([])` (P0 Sesión 3) |
| `ac02d13` | Seed `whatsapp_e164` en usuarios canónicos |

## Decisiones activas

1. **El deploy real lo ejecuta ProjectApp/ops** siguiendo `deploy/staging/RUNBOOK.md` — no se hace desde el dev box (no hay acceso a `/home/ryzepeck/`).
2. **Rotar antes de producción**: VAPID keypair (las committeadas son de dev), Google OAuth Client ID (el del template no sirve — ERROR-001), hCaptcha keys (hoy test keys).
3. **Dev local**: `backend/.env` + `frontend/.env.local` con hCaptcha test keys + VAPID dev keys (gitignored). Auth shortcut para validación: `scripts/dev-issue-jwt.py` emite JWT en cookies (`access_token`/`refresh_token`, no localStorage). Seeds deterministas: `python manage.py create_fake_data --users 10`.
4. **`npm run dev` / `npm run build` requieren `--webpack`** — next-pwa incompatible con Turbopack (default en Next.js 16).
5. `.claude/skills/playwright-validation/` está untracked — pendiente de decidir si se trackea (las otras skills sí están en git).

## Bloqueadores

Ninguno técnico. El único pendiente es operacional: el deploy real al VPS necesita las creds reales (VAPID/OAuth/hCaptcha) que genera ProjectApp.

## Próximos pasos sugeridos

1. **Deploy a staging**: ejecutar `deploy/staging/RUNBOOK.md` en el VPS.
2. **Items V2** (no bloqueantes): Fuentes de Tráfico (UTM + tabla `TrafficSource`), Alertas de Rendimiento KPI (Huey nightly), Reportes PDF de Sponsor, wiring real de next-intl (hoy copy hardcoded en español), branding sutil en notificaciones oficiales, gestor admin de álbumes con CSV upload + gestor de creativas con UI.
3. **Tooling**: trackear `.claude/skills/playwright-validation/` si se decide; considerar `globalSetup` Playwright que limpie `TradeWhatsAppOptIn` antes de la suite de validación.
