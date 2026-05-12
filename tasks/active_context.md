# Active Context — Albunmanía

> Snapshot del estado actual. Se reescribe (no se acumula) al cierre de cada sesión.
> El changelog detallado por épica vive en `git log` y en `tasks/tasks_plan.md`.

## Sesión actual

**Fecha:** 2026-05-12
**Foco:** "Bloque D" — cierre de los **4 GAPS P2** detectados por la auditoría de completitud del Release 01 (`docs/release/01-release-checklist.md`). Las 4 fases hechas + commiteadas + pusheadas:
- **D1** (`3adaca7`): páginas `/terminos`, `/privacidad`, `/ayuda` + componente FAQ (`FAQAccordion`, 18 Q&As) + `LegalPage` + enlaces en el footer (`app/layout.tsx`). Texto legal **scaffold** con marcadores `PENDIENTE-LEGAL` — la versión definitiva la redacta/revisa el equipo legal del cliente (ProjectApp); el contenido vive en `frontend/lib/legal/content.ts` / `frontend/lib/faq/content.ts`.
- **D2** (`b0e4b1d`): página `/profile/[id]` (`ProfileHeader` + pestaña Reseñas con filtro por estrellas + sección "Editar mi cuenta" si es uno mismo) + endpoint `GET /api/users/<id>/public-profile/` (`AllowAny`, **sin email/teléfono**) + `PATCH /api/profile/me/` (`AccountSettingsSerializer`) + `profileStore`.
- **D3** (`0deb9db`): modelo `Notification` (+ migración `0009`) + centro `/notificaciones` + campana con badge `unreadCount` en el `Header` + endpoints `/api/notifications/*` (list, unread-count, read, read-all) + `notificationStore`. Las `Notification` se crean en el signal `post_save Match(mutual, created)` (a ambos, junto al push) y en las views `trade_review_create` / `review_reply`.
- **D4** (`30eaf4f`): modelo `Report` general (+ migración `0010`; `target_kind` user|trade, `reason` no_show/harassment/fake_profile/inappropriate/other, `status` pending/dismissed/actioned + `resolved_by/at/notes`, `CheckConstraint` target↔kind) + `ReportButton`/`ReportModal` en `/profile/[id]` (usuario) y `/match/[matchId]` (intercambio, p.ej. no-show) → `POST /api/reports/` + 2ª cola "Reportes de usuarios e intercambios" en `/admin/moderation` (`GET /api/admin/reports/?status=&kind=`, `PATCH .../<id>/`, enlace a `/admin/users`) + `reportStore`. `create_fake_data` ahora seedea 1 `Report` pendiente.

Flujos E2E nuevos registrados en `flow-definitions.json` (v2.4.0) / `USER_FLOW_MAP.md` (v2.4.0) / `flow-tags.ts`: `legal-terms`, `legal-privacy`, `help-faq`, `profile-view`, `notifications-center`, `report-user-or-trade` (+ desc actualizada de `admin-moderation-queue`, `review-profile-summary`). Memory Bank (`architecture.md` / `technical.md` / `lessons-learned.md` / `tasks_plan.md` / este archivo) actualizado en el cierre del bloque.

**Antes de esta sesión:** auditoría de completitud (`0f05467`, 53→133 `[x]`), `/new-feature-checklist` audit (4 fases, `9f99425`→`51588d2`), `/e2e-user-flows-check`, Memory Bank refresh (`30479fd`).
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado del producto

**Release 01 (14 épicas) implementado + validado E2E + paquete de deploy listo. "Bloque D" cerró los 4 GAPS P2 de la auditoría. Quedan 4 GAPS P3 (V2) + items V2 conocidos.**

- **Bloque A** (cleanup post-bootstrap): ✅ `0d2d857`→`8084a4d`.
- **Bloque B** (14 épicas Release 01): ✅ Auth & Onboarding · Catálogo + Inventario · Sponsor · Dark mode/theming · Match swipe + QR presencial · WhatsApp opt-in · Push real · Stats avanzadas · Comerciantes · Banners CPM · Reseñas y Reputación · Panel Admin · Analítica + KPIs · Manual interactivo.
- **Bloque C** (validación E2E + deploy prep): ✅ 5 sesiones de validación Playwright (8 P0 cazados inflight, ver `error-documentation.md` ERROR-006..013); paquete `deploy/staging/` (RUNBOOK + systemd + nginx + projects.yml + env templates + scripts).
- **Bloque D** (cierre de los 4 GAPS P2): ✅ D1 legal/FAQ · D2 `/profile` · D3 notificaciones in-app · D4 reportes de usuarios/intercambios. Ver arriba.

**GAPS P3 que siguen abiertos (decisión: V2 o fuera de alcance):** presencia "en línea ahora"/Live Badge/"X coleccionistas activos ahora", Mapa de Coleccionistas (`/mapa`), GeoIP2 (geolocalización por IP — sólo existe la rama browser), dropdown de búsqueda predictiva con previsualización (el endpoint y el debounce ya existen; falta la UI del dropdown).

## Tests

- Backend: **386/386 verde** (`pytest --no-cov`; +`test_notification_model.py`, `test_notification_endpoints.py`, `test_public_profile_endpoint.py`, `test_report_model.py`, `test_report_endpoints.py`). 56 archivos `test_*.py`.
- Frontend unit: **365/365 verde** (`npm test`; + FAQAccordion, LegalPage, profileStore, ProfileHeader, notificationStore, NotificationItem, reportStore, ReportModal, Header badge). Cobertura de componentes ~90% statements/branches/lines.
- E2E: 11 specs, ~64 tests — `validation/session-01..05` (39) + `auth/auth.spec.ts` (11) + `public/smoke.spec.ts` (1) + `public/legal.spec.ts` (4) + `profile/profile.spec.ts` (3) + `notifications/notifications.spec.ts` (4) + `moderation/moderation.spec.ts` (2). Todos `@flow:` tagueados, sin `waitForTimeout`.
- ⚠️ Deuda tsc preexistente (NO introducida por Bloque D): 4-5 `*.test.tsx` (`BannerSlot`, `StickerCard`, `SwipeCard`, `SponsorSplash`, `lib/services/__tests__/http.test.ts`) usan `<img {...(props as never)} />` → `tsc --noEmit` (y por tanto `npm run build`) falla con `TS2698`. Conviene un pase de limpieza aparte.

## Últimos commits relevantes (mayo 2026)

| Commit | Qué |
|--------|-----|
| `30eaf4f` | **D4** — modelo `Report` general + reportar usuarios/intercambios + 2ª cola en `/admin/moderation` (cierra GAP P2 B) |
| `0deb9db` | **D3** — modelo `Notification` + centro `/notificaciones` + campana en el Header (cierra GAP P2 A) |
| `b0e4b1d` | **D2** — página `/profile/[id]` + endpoint public-profile + "Editar mi cuenta" (cierra GAP P2 C) |
| `3adaca7` | **D1** — páginas T&C/privacidad/ayuda (FAQ) + enlaces en el footer (cierra GAP P2 D) |
| `0f05467` | Reconciliación de `01-release-checklist.md` con el codebase real (53→133 `[x]`, 8 GAPS detectados) |
| `51588d2` | E2E user-flows check — registro de `auth-sign-out` + `match-shared-list-view` |
| `9f99425`→… | `/new-feature-checklist` audit (4 fases: docs E2E, tests backend, seeds, ~100 tests de componentes) |
| `30479fd` | Memory Bank refresh (`/methodology-setup`) |
| `1630c1f` / `a8d9520` / `3f95ae3` | Epic 9 Push real — backend / frontend / docs |

## Decisiones activas

1. **Texto legal (T&C / Privacidad)**: hoy es un **scaffold** con la estructura requerida (Ley 1581/2012, no afiliación FIFA/Panini, modelo de monetización, edad mínima, datos, derechos del titular, contacto) y copy provisional marcado `PENDIENTE-LEGAL`. **La versión definitiva la debe redactar/revisar el equipo legal de ProjectApp** — sustituir el contenido de `frontend/lib/legal/content.ts` cuando esté listo. El FAQ sí está redactado.
2. **Perfil público sin datos de contacto**: `users/<id>/public-profile/` expone nombre/ciudad/avatar/rating/% álbum/# trades; **nunca** email ni teléfono (eso es opt-in per-trade vía `TradeWhatsAppOptIn`).
3. **Moderación**: el admin descarta o marca como atendido + notas; las **sanciones** (suspender/banear) se aplican aparte en `/admin/users` (toggle `is_active`) — no se automatizan desde el reporte.
4. **El deploy real lo ejecuta ProjectApp/ops** siguiendo `deploy/staging/RUNBOOK.md` — no desde el dev box (sin acceso a `/home/ryzepeck/`).
5. **Rotar antes de producción**: VAPID keypair (las committeadas son de dev), Google OAuth Client ID (el del template no sirve — ERROR-001), hCaptcha keys (hoy test keys).
6. **`npm run dev` / `npm run build` requieren `--webpack`** — next-pwa incompatible con Turbopack (default en Next.js 16).
7. `.claude/skills/playwright-validation/` está untracked — pendiente de decidir si se trackea (las otras skills sí están en git).

## Bloqueadores

Ninguno técnico. El único pendiente es operacional: el deploy real al VPS necesita las creds reales (VAPID/OAuth/hCaptcha) que genera ProjectApp.

## Próximos pasos sugeridos

1. **Texto legal definitivo** de ProjectApp → reemplazar el scaffold de `frontend/lib/legal/content.ts`.
2. **Limpiar la deuda tsc** de los `*.test.tsx` con `<img {...(props as never)} />` para que `npm run build` quede limpio.
3. **GAPS P3** (si entran en alcance): presencia/Live Badge (necesita `last_seen` + SSE/WebSocket), mapa de coleccionistas (`/mapa`), GeoIP2 por IP, dropdown de búsqueda predictiva.
4. **Deploy a staging**: ejecutar `deploy/staging/RUNBOOK.md` en el VPS.
5. **Items V2** (no bloqueantes): Fuentes de Tráfico (UTM + `TrafficSource`), Alertas de Rendimiento KPI (Huey nightly), Reportes PDF de Sponsor, wiring real de next-intl (hoy copy hardcoded en español), branding sutil en notificaciones oficiales, gestor admin de álbumes con CSV upload + gestor de creativas con UI.
6. **Tooling**: trackear `.claude/skills/playwright-validation/` si se decide.
