# Active Context — Albunmanía

> Snapshot del estado actual. Se reescribe (no se acumula) al cierre de cada sesión.
> El changelog detallado por épica vive en `git log` y en `tasks/tasks_plan.md`.

## Sesión actual

**Fecha:** 2026-05-12
**Foco:** "Bloque F" — limpieza + hardening post-Bloque E (los 8 GAPS de la auditoría ya estaban cerrados; Bloques D+E). Plan: `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`. 5 fases:
- ✅ **F1** (`f117add`): deuda tsc cerrada — stubs de `next/image` tipados (`BannerSlot`, `SponsorSplash`) + cast en `http.test.ts`; `tsc --noEmit` limpio, `npm run build -- --webpack` verde.
- ✅ **F2** (commit pendiente): podadas las rutas vestigiales del template + el auth email/password muerto. **Frontend**: borradas `app/backoffice/` + `app/forgot-password/` (+ tests); quitados `ROUTES.BACKOFFICE/FORGOT_PASSWORD` + 6 de `API_ENDPOINTS` + la clave i18n `forgotPassword`; `authStore` perdió `signIn`/`signUp`/`sendPasswordResetCode`/`resetPassword`; fix de un test de auth E2E ambiguo (`Manual` link → scoped a `site-header`). **Backend**: `views/auth.py` ahora solo `google_login` + `validate_token`; eliminados `views/user_crud.py`, `serializers/user_{create_update,detail,list}.py`, `services/email_service.py`, `urls/user.py`, `models/password_code.py` (+ migración `0012_delete_passwordcode`); `auth_utils.py` → solo `generate_auth_tokens`; `admin.py`/`services/__init__.py`/`models/__init__.py` limpiados; tests muertos eliminados. Conteos: views 22→21, urls 22→21, serializers 14→11, services 15→14, models 20→19, migrations 11→12, ~73→~66 paths.
- ⬜ **F3**: mover el push de match a una tarea Huey (`@db_task() deliver_match_push`).
- ⬜ **F4**: filtros "disponibilidad" + "radio de proximidad" en `/catalog/[slug]`.
- ⬜ **F5**: subir cobertura backend (2 tandas, skill `backend-test-coverage`).

---
### "Bloque E" (anterior — cierre de los 4 GAPS P3, ✅ commiteado y pusheado)
- **E1** (`2488b14`): presencia "en línea ahora" / Live Badge. `Profile.last_seen` (+ migración `0011`) bumpeado throttled (1 write/60s/usuario, vía cache) por `PresencePinger` (heartbeat `POST /api/presence/ping/` cada 120s + on focus) y `validate_token`; `is_online` = last_seen dentro de 5 min (`services/presence.py`), expuesto en `public-profile`, swipe cards y city ranking; `LiveBadge` (punto verde, no renderiza nada si offline) en `ProfileHeader`/`SwipeCard`/`RankingList` y en los pines del `/mapa`; `ActiveCollectorsBanner` en el dashboard ("N coleccionistas en línea ahora [en {ciudad}]") vía `GET /api/presence/active-count/?city=`. `create_fake_data` seedea a los 2 colectores canónicos online.
- **E2** (`7e68d30`): Mapa de Coleccionistas. `GET /api/collectors/map/?lat=&lng=&radius_km=&album_id=` (IsAuthenticated; sólo `lat_approx`/`lng_approx`, excluye al solicitante) + `/mapa` (Leaflet `CollectorMap`/`CollectorMapInner`, calco del mapa de comerciantes) + lista con Live Badges + "Usar mi ubicación" (browser geo → 50 km) / "Ver todos" + enlace "Mapa" en el Header. También `GET /api/collectors/search/?q=` (≤5, usado por E3).
- **E3** (`f2be293`): búsqueda predictiva con dropdown. `SearchAutocomplete` en `/catalog/[slug]` (debounced; sugerencias de cromos `GET /api/albums/<slug>/search/?q=` con miniatura/número/equipo + coleccionistas `GET /api/collectors/search/?q=`; elegir cromo → filtra la grilla a su número, elegir coleccionista → `/profile/[id]`). De paso: arreglado `albumStore.searchStickers` (path equivocado `albums/<slug>/stickers/search/` → `albums/<slug>/search/` — 404aba; no tenía consumidor de UI antes).
- **E4** (`695ac91`): GeoIP2 por IP — completa la "geolocalización dual". `services/geoip.py` (lazy `GeoLite2-City` reader desde `settings.GEOIP_PATH` / `DJANGO_GEOIP_PATH`; `client_ip` con cadena X-Forwarded-For, `locate_ip` salta IPs privadas/loopback) + `GET /api/geo/ip-locate/`; `StepGeolocation` lo llama al montar y ofrece "usar ubicación aproximada por IP" antes del prompt preciso (`onboardingStore.setGeoFromIp`, no pone `browser_geo_optin`). La `.mmdb` la provisiona ops (no está en el repo — licencia + tamaño; documentado en `deploy/staging/RUNBOOK.md` + `backend.env.example`); si falta, `available()=False` y degrada limpio.

Flujos E2E nuevos en `flow-definitions.json` (v2.8.0) / `USER_FLOW_MAP.md` (v2.8.0) / `flow-tags.ts`: `presence-live-badge`, `collectors-map`, `catalog-predictive-search`, `geo-ip-locate`. Memory Bank (`architecture.md` / `technical.md` / `lessons-learned.md` §16 / `tasks_plan.md` / este archivo) y `01-release-checklist.md` actualizados en el cierre del bloque.

**Antes de Bloque E:** "Bloque D" (4 GAPS P2 — `3adaca7` D1 legal/FAQ, `b0e4b1d` D2 `/profile`, `0deb9db` D3 notificaciones in-app, `30eaf4f` D4 reportes/moderación) + close-out `f6a844f`. Antes: auditoría de completitud (`0f05467`), `/new-feature-checklist` (`9f99425`→`51588d2`), `/e2e-user-flows-check`, Memory Bank refresh (`30479fd`).
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md` (el bloque D; el bloque E se ejecutó directamente por instrucción "Cierra los gaps P3").

## Estado del producto

**Release 01 (14 épicas) + Bloque D (4 GAPS P2) + Bloque E (4 GAPS P3) implementados + validado E2E + paquete de deploy listo. Los 8 GAPS de la auditoría están cerrados; quedan sólo items `<!-- V2 -->` conocidos.**

- **Bloque A** (cleanup post-bootstrap): ✅ `0d2d857`→`8084a4d`.
- **Bloque B** (14 épicas Release 01): ✅ Auth & Onboarding · Catálogo + Inventario · Sponsor · Dark mode/theming · Match swipe + QR presencial · WhatsApp opt-in · Push real · Stats avanzadas · Comerciantes · Banners CPM · Reseñas y Reputación · Panel Admin · Analítica + KPIs · Manual interactivo.
- **Bloque C** (validación E2E + deploy prep): ✅ 5 sesiones de validación Playwright (8 P0 cazados inflight, ver `error-documentation.md` ERROR-006..013); paquete `deploy/staging/` (RUNBOOK + systemd + nginx + projects.yml + env templates + scripts).
- **Bloque D** (4 GAPS P2): ✅ D1 legal/FAQ · D2 `/profile` · D3 notificaciones in-app · D4 reportes de usuarios/intercambios.
- **Bloque E** (4 GAPS P3): ✅ E1 presencia/Live Badge · E2 Mapa de Coleccionistas · E3 búsqueda predictiva con dropdown · E4 GeoIP2 por IP.

## Tests

- Backend: **367/367 verde** (`pytest --no-cov`; tras Bloque F: −~39 tests del auth email/password + email_service + user CRUD serializer + PasswordCode model, eliminados). 56 archivos `test_*.py`.
- Frontend unit: **371/371 verde** (`npm test`, 81 suites; tras Bloque F: −backoffice/forgot-password page tests + 6 authStore tests).
- E2E: **15 specs, ~72 tests** — `validation/session-01..05` (39) + `auth/` (11) + `public/` (smoke 1 + legal 4) + `profile/` (3) + `notifications/` (4) + `moderation/` (2) + `presence/` (3) + `collectors/` (2) + `catalog/predictive-search` (2) + `geo/` (1). Todos `@flow:` tagueados, sin `waitForTimeout`. Correr con `PLAYWRIGHT_BASE_URL=http://localhost:3000 PW_SKIP_WEBSERVER=1 E2E_REUSE_SERVER=1`.
- ✅ `tsc --noEmit` limpio y `npm run build -- --webpack` verde (F1, Bloque F) — la deuda de los stubs `<img {...(props as never)} />` se barrió por completo (`SwipeCard`, `StickerCard`, `BannerSlot`, `SponsorSplash` + el cast de `http.test.ts`).

## Últimos commits relevantes (mayo 2026)

| Commit | Qué |
|--------|-----|
| `695ac91` | **E4** — GeoIP2 por IP (services/geoip.py + /geo/ip-locate/ + onboarding prefill + deploy docs) |
| `7e68d30` | **E2** — Mapa de Coleccionistas /mapa (+ /collectors/map/ + /collectors/search/) |
| `2488b14` | **E1** — presencia "en línea ahora" / Live Badge (Profile.last_seen + /presence/* + LiveBadge + dashboard banner) |
| `f2be293` | **E3** — búsqueda predictiva con dropdown (SearchAutocomplete + arreglo de albumStore.searchStickers) |
| `f6a844f` | Bloque D close-out — Memory Bank refresh (Notification + Report) |
| `30eaf4f` | **D4** — modelo Report general + reportar usuarios/intercambios + 2ª cola en /admin/moderation |
| `0deb9db` | **D3** — modelo Notification + centro /notificaciones + campana en el Header |
| `b0e4b1d` | **D2** — página /profile/[id] + endpoint public-profile + "Editar mi cuenta" |
| `3adaca7` | **D1** — páginas T&C/privacidad/ayuda (FAQ) + enlaces en el footer |

## Decisiones activas

1. **GeoIP2 `.mmdb`**: no se versiona (licencia MaxMind + tamaño). Ops la baja (cuenta MaxMind, GeoLite2-City), la coloca en el VPS y setea `DJANGO_GEOIP_PATH` — ver `deploy/staging/RUNBOOK.md`. Mientras tanto la geolocalización por IP queda desactivada y degrada limpio (el onboarding usa solo `navigator.geolocation`).
2. **Presencia sin WebSocket**: `Profile.last_seen` + heartbeat del cliente (`PresencePinger`, 120s) + bump throttled vía cache (`cache.add`, 1 write/min/usuario). "en línea" = ≤5 min. Si se necesita presencia en tiempo real más fino (segundos), eso sí requeriría SSE/WS — fuera de alcance por ahora.
3. **Mapa de coleccionistas — privacidad**: sólo expone `lat_approx`/`lng_approx` (ya aproximados/jittered), nunca una posición exacta del dispositivo; excluye al solicitante.
4. **Texto legal (T&C / Privacidad)**: sigue siendo un **scaffold** con marcadores `PENDIENTE-LEGAL` — la versión definitiva la redacta/revisa el equipo legal de ProjectApp y reemplaza `frontend/lib/legal/content.ts`.
5. **Perfil público sin datos de contacto**: `users/<id>/public-profile/` no expone email ni teléfono (eso es opt-in per-trade vía `TradeWhatsAppOptIn`).
6. **El deploy real lo ejecuta ProjectApp/ops** siguiendo `deploy/staging/RUNBOOK.md`; rotar antes de prod: VAPID keypair, Google OAuth Client ID (el del template no sirve — ERROR-001), hCaptcha keys.
7. **`npm run dev` / `npm run build` requieren `--webpack`** — next-pwa incompatible con Turbopack (default en Next.js 16).
8. `.claude/skills/playwright-validation/` está untracked — pendiente de decidir si se trackea.

## Bloqueadores

Ninguno técnico. Pendientes operacionales: deploy real al VPS + creds reales (VAPID/OAuth/hCaptcha/SECRET_KEY/MySQL pwd) que genera ProjectApp; opcionalmente la `.mmdb` de MaxMind para activar la geolocalización por IP.

## Próximos pasos sugeridos

1. **(En curso — "Bloque F")** F1 ✅ (build verde) + F2 ✅ (rutas/backend vestigiales podados); falta F3 (push de match → tarea Huey), F4 (filtros disponibilidad/proximidad en el catálogo), F5 (subir cobertura backend). Ver `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`.
2. **Texto legal definitivo** de ProjectApp → reemplazar el scaffold de `frontend/lib/legal/content.ts`.
3. **Deploy a staging**: ejecutar `deploy/staging/RUNBOOK.md` en el VPS (+ opcionalmente provisionar la `.mmdb` y setear `DJANGO_GEOIP_PATH`).
4. **Items V2** (no bloqueantes): Fuentes de Tráfico (UTM + `TrafficSource`), Alertas de Rendimiento KPI (Huey nightly), Reportes PDF de Sponsor, wiring real de next-intl (hoy copy hardcoded en español), branding sutil en notificaciones oficiales, gestor admin de álbumes con CSV upload + gestor de creativas con UI, filtro "disponibilidad"/"radio de proximidad" en el catálogo, mover el push de match a Huey.
5. **Tooling**: trackear `.claude/skills/playwright-validation/` si se decide.
