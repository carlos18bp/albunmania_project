# Active Context — Albunmanía

> Este archivo se actualiza al inicio y cierre de cada sesión de trabajo.

## Sesión actual

**Fecha:** 2026-05-11
**Foco:** Bloque B Sprint 2 — Epics 3 + 4 + 12 completadas.
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado al cierre de la sesión

- **Bloque A** (cleanup post-bootstrap): completo, **pusheado a `origin/master`**.
- **Bloque B Sprint 1**: ✅ **completo** — Epics 1 / 2 / 6 / 10 cerradas.
- **Bloque B Sprint 2**: ✅ Epics 3 + 4 + 12 cerradas.
  - Epic 3 — Match (commits `be9a4e9`→`448266a`).
  - Epic 4 — WhatsApp opt-in por trade (commits `8718fe0` backend · `45d5e81` frontend).
  - Epic 12 — Stats avanzadas (commits `2bac403` backend · `6ca420d` frontend).
  - Backend **266/266 verde** (+21). Frontend **180/180 verde** (+11).

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

## Epic 3 — Cierre

### Backend (16 archivos)

| Área | Archivo | Estado |
|------|---------|--------|
| Models | `models/{match,like,trade}.py` + `__init__.py` | Match con check constraint `user_a < user_b` + unique por `(pair, channel)`. Like con `find_mirror()`. Trade snapshot vía JSONField `items`. |
| Migration | `0004_match_like_trade.py` | Aplicada. **Nota Django 5.1+**: `CheckConstraint` ahora usa `condition=` (no `check=`). |
| Services | `services/match_engine.py` | Haversine inline + bounding-box prefilter. Sin nueva dep. Ranking `(matches_count desc, distance_km asc)`. |
| Services | `services/qr_token.py` | HMAC-SHA256 con `SECRET_KEY`, payload `<user_id>\|<exp>`, base64url. Constant-time verify. |
| Services | `services/qr_cross.py` | Función pura `compute_offline_cross()` reusada server-side como sanity check y portada a TS para offline. |
| Views | `views/match.py` | 6 endpoints: feed, like (mutual detection + Trade auto-create), mine, detail, qr/me, qr/scan, qr/confirm. |
| Views | `views/trade.py` | Public `trade/share/<token>/` con `?kind=available\|wanted`. |
| Serializers | `serializers/match.py` | 8 serializers (incluye `ProfilePreviewSerializer`). |
| URLs | `urls/{match,trade}.py` + `__init__.py` | Prefijos `/api/match/` y `/api/trade/`. |
| Tests | 10 archivos nuevos | 52 tests, suite total **245/245 verde**. |

### Frontend (15 archivos)

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/matchStore.ts` | feed/like/swipe/mine + lastMutual. |
| Stores | `lib/stores/qrStore.ts` | Persistencia con `idb-keyval` (myInventory + lastCross). Incluye `computeOfflineCross()` mirror exacto del server. |
| Components | `components/match/{SwipeCard,MatchFeed,MutualMatchModal,QRDisplay,QRScanner,QRCrossResults}.tsx` | Swipe estilo card + scanner zxing + cruce offline + modal mutual. |
| Pages | `app/match/page.tsx` (tabs swipe/mine), `app/match/qr/page.tsx`, `app/match/[matchId]/page.tsx`, `app/share/[token]/page.tsx` (pública) | |
| Header | `components/layout/Header.tsx` | Link "Match" para autenticados. |
| i18n | `messages/{es,en,pt}.json` | Sección `match.*` (24 keys × 3 idiomas). |
| Tests | 4 nuevos test modules | 20 tests, suite total **169/169 verde**. |

### Decisiones técnicas (esta sesión)

1. **Haversine inline** en `match_engine` — sin nueva dep, y permite el bounding-box prefilter en SQL antes del cálculo trigonométrico Python.
2. **`compute_offline_cross` duplicado server/client** — la función es la fuente de verdad: el cliente la usa offline, el server la corre como sanity check antes de persistir cualquier `qr_presencial` Match. Si el cliente miente, el endpoint rechaza con 400 `invalid_item`.
3. **HMAC-SHA256 propio** (sin PyJWT) — payload + base64url + `hmac.compare_digest`. Cubre el caso simple sin sumar dep.
4. **Match canonical pair**: `user_a < user_b` enforzado vía CheckConstraint para garantizar unicidad por par. El helper `Match.canonical_pair()` resuelve el orden en la view.
5. **Django 5.1+**: `models.CheckConstraint(condition=...)` (no `check=`). Documentado en lessons-learned.
6. **idb-keyval** para offline-first QR: 4kB minified, API trivial. La snapshot de inventario se persiste tras cada cambio de `inventoryStore.entries` desde la página `/match/qr`.

## Epic 4 + Epic 12 — Cierre

### Backend

| Área | Archivo | Estado |
|------|---------|--------|
| Model | `models/trade_whatsapp_optin.py` | OneToOne (trade, user) con `opted_in`. |
| Migración | `0005_trade_whatsapp_optin.py` | Aplicada. |
| Service | `services/whatsapp_link.py` | `build_whatsapp_link(trade, viewer_id)` — plantilla viewer-centric, número del peer (digits-only). |
| Service | `services/stats_engine.py` | `compute_stats(user)` (% completo, racha, ETA, weekly velocity) + `city_ranking(album_id, city)`. |
| Views | `views/trade_whatsapp.py` + `views/stats.py` | `POST /trade/{id}/whatsapp-optin/`, `GET /trade/{id}/whatsapp-link/` (403 si no hay opt-in mutuo), `GET /stats/me/`, `GET /stats/ranking/`. |
| URLs | `urls/{trade_whatsapp,stats}.py` + `__init__.py` | Bajo `/api/`. |
| Tests | 4 archivos | 21 tests, suite **266/266 verde**. |

### Frontend

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/tradeWhatsAppStore.ts` | `setOptIn`/`fetchLink` con cache por tradeId. |
| Stores | `lib/stores/statsStore.ts` | `fetchMe` + `fetchRanking`. |
| WhatsApp UI | `components/whatsapp/WhatsAppOptInToggle.tsx` + `WhatsAppLinkButton.tsx` | Toggle opt-in + botón wa.me condicional al estado mutuo. |
| Stats UI | `components/stats/StatCard.tsx` + `RankingList.tsx` | 6 bloques (% completo, pegadas, repetidas, semana, racha, ETA) + ranking ciudad. |
| Match detail | `app/match/[matchId]/page.tsx` | Reemplaza placeholder con WhatsApp toggle + link button. |
| Dashboard | `app/dashboard/page.tsx` | "Mi álbum" + StatCard + RankingList. Test actualizado a labels nuevas. |
| i18n | `messages/{es,en,pt}.json` | Secciones `whatsapp.*` y `stats.*`. |
| Tests | 4 archivos | 11 tests, suite **180/180 verde**. |

### Decisiones técnicas (esta sesión)

1. **Per-trade opt-in (no global)** — `Profile.whatsapp_optin` queda como preferencia general, pero el deep link solo se genera si ambos participantes activaron `TradeWhatsAppOptIn` para ese trade específico. Cumple con el principio de consentimiento explícito por caso descrito en la propuesta.
2. **Plantilla wa.me server-side** — el mensaje pre-llenado se construye en `services/whatsapp_link.py` (no en el cliente), bloqueando edición arbitraria del template y permitiendo a futuro respetar `Profile.locale`.
3. **Número en formato digits-only** — `wa.me/<digits>` no acepta el `+` ni separadores. La extracción es `''.join(c for c in e164 if c.isdigit())`.
4. **Stats on-demand (no Huey nightly aún)** — V1 calcula `compute_stats` en cada GET. La propuesta menciona caché nocturno pero todavía no hay carga real; agregar Huey cuando los volúmenes lo justifiquen (decisión documentada).
5. **Streak con grace day** — la racha cuenta días consecutivos hacia atrás desde hoy. Si el usuario no pegó hoy pero sí ayer, la racha sigue contando ayer y anteriores (un día de gracia evita que se pierda toda la racha por una mala notificación).
6. **ETA = remaining / (weekly_velocity / 7)** — regresión simple sin smoothing. `None` si `velocity == 0`, `0` si el álbum está completo.

## Pendientes / TODOs heredados (siguen activos)

- ProjectApp debe regenerar **Google OAuth Client ID + Secret** en GCP (ERROR-001 en `error-documentation.md`). Tests pasan con mocks; el flujo real requiere credenciales válidas.
- Generar **VAPID keys** con `vapid --gen` antes de Epic 9 (Push real).
- Diseñar **4 PWA icons** (`frontend/public/icons/`).
- Migración a `app/[locale]/...` se difiere a Epic 14.

## Bloqueadores actualmente

Ninguno para arrancar Sprint 2 (Match) o BATCH paralelo de Epics 2/6/10.

## Próximos pasos sugeridos para la siguiente sesión

**Sprint 3 — Monetización (BATCH 2 épicas paralelas)**:

- Epic 5 — Comerciantes (listing geolocalizado + suscripción + dashboard comerciante). Reusa MerchantProfile creado en Epic 1.
- Epic 7 — Banners CPM (campañas + creativas + tracking de impresiones).

**Sprint 2 pendiente única — Epic 9** (Push real, requiere generar VAPID keys + Service Worker handler).

Recomendado: **Sprint 3 BATCH paralelo** — Epic 5 y Epic 7 son independientes y desbloquean los dos motores de monetización adicionales. Epic 9 puede ir luego como sesión propia.
