# Active Context — Albunmanía

> Este archivo se actualiza al inicio y cierre de cada sesión de trabajo.

## Sesión actual

**Fecha:** 2026-05-11
**Foco:** Bloque B Sprint 4 — Epics 11 (Reseñas) + 8 (Panel Admin) completadas.
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado al cierre de la sesión

- **Bloque A** (cleanup post-bootstrap): completo, **pusheado a `origin/master`**.
- **Bloque B Sprint 1**: ✅ **completo** — Epics 1 / 2 / 6 / 10 cerradas.
- **Bloque B Sprint 2**: ✅ Epics 3 + 4 + 12 cerradas.
- **Bloque B Sprint 3**: ✅ Epics 5 + 7 cerradas.
- **Bloque B Sprint 4**: ✅ Epics 11 + 8 cerradas en esta sesión.
  - Epic 11 — Reseñas y Reputación (commits `382b24f` backend · `304b91b` frontend).
  - Epic 8 — Panel Admin (users + moderación) (commits `303ab46` backend · `91d6711` frontend).
  - Backend **319/319 verde** (+26). Frontend **209/209 verde** (+16).

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

## Sprint 3 — Cierre

### Backend (Epic 5 + Epic 7)

| Área | Archivo | Estado |
|------|---------|--------|
| Model | `models/merchant_subscription_payment.py` | Audit trail por pago (Web Manager). |
| Models | `models/{ad_campaign,ad_creative,ad_impression}.py` | AdCampaign + AdCreative + AdImpression + AdClick (en mismo archivo). |
| Migración | `0006_merchant_payment_and_ads.py` | Aplicada. |
| Services | `services/merchant_subscription.py` | `register_payment` extiende `subscription_expires_at` desde `max(now, current_expiry)`. |
| Services | `services/ad_engine.py` | `serve_banner` weighted random + sanity (status, vigencia, geo, presupuesto) en transacción atómica. |
| Endpoints | `views/merchant.py` | Public list (city/geo bbox), GET/PATCH dashboard (no self-extend), admin promote, admin payment. |
| Endpoints | `views/ad.py` | Public serve (204 si nada), click 302, admin CRUD campañas, stats CTR. |
| Tests | 4 archivos | 27 tests, suite total **293/293 verde**. |

### Frontend (Epic 5 + Epic 7)

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/merchantStore.ts` | publicList + dashboard + updateDashboard. |
| Stores | `lib/stores/adStore.ts` | fetchBanner, noteSwipe (1/5 frequency cap), clickUrl. |
| Components | `components/merchant/{MerchantList,MerchantMap,MerchantMapInner,MerchantDashboardForm}.tsx` | Map dinámico (SSR-safe), formulario con badge de suscripción. |
| Components | `components/ads/BannerSlot.tsx` | Anchor → click endpoint, sin leak de impression_id a ad-blockers. |
| Pages | `app/merchants/page.tsx` (público) + `app/merchants/me/page.tsx` (auth) | |
| Integration | `app/page.tsx` (banner home) + `components/match/MatchFeed.tsx` (banner feed gated por noteSwipe) | |
| i18n | `messages/{es,en,pt}.json` | Secciones `merchants.*` y `ads.*`. |
| Tests | 4 archivos | 13 tests, suite **193/193 verde**. |

### Decisiones técnicas (esta sesión)

1. **Frequency cap en cliente** — el counter `swipesSinceLastBanner` vive en `adStore` (Zustand). El backend solo decide *cuál* creative servir; el ritmo lo controla el cliente para no romper el UX con un round-trip por swipe.
2. **Click via 302 redirect server-side** — el `<a>` apunta a `/api/ads/click/{id}/`, no directo al sitio del anunciante. Permite registrar el click incluso si el cliente cierra la pestaña justo al hacer clic, y mantiene el impression_id fuera del `Referer` enviado al sitio destino.
3. **Listing solo si suscripción al día** — query default filtra `subscription_status='active' AND subscription_expires_at > now()`. La property `is_listing_visible` queda como guardia secundaria para callers que no usan el endpoint público.
4. **`register_payment` extiende desde `max(now, current_expiry)`** — pre-pagos consecutivos se acumulan; pagos tras vencimiento parten desde hoy. Comportamiento documentado y testeado.
5. **Mapa Leaflet con `dynamic(..., {ssr:false})`** — leaflet rompe en SSR (toca `window`). El wrapper `MerchantMap` import dinámico evita el error sin sumar dep.
6. **AdCreative weight × Campaign weight** — la ponderación combina ambos. Permite al Web Manager priorizar una campaña entera o solo una creative específica dentro de ella.

## Sprint 4 — Cierre

### Backend (Epic 11 + Epic 8)

| Área | Archivo | Estado |
|------|---------|--------|
| Models | `models/review.py` | `Review` (uniqueness por (trade, reviewer), check stars 1-5, `is_editable` 24h) + `ReviewReport`. |
| Migración | `0007_reviews.py` | Aplicada. |
| Services | `services/review_aggregates.py` | `recompute_for(user_id)` actualiza `Profile.{rating_avg,rating_count,positive_pct}` desde reviews visibles. |
| Signals | `signals.py` | post_save / post_delete on Review → recompute. |
| Endpoints reviews | `views/review.py` | 7 endpoints (create, edit, reply, list, summary, report, admin moderate). |
| Endpoints admin users | `views/admin_users.py` | List paginada + role assignment + block toggle. |
| Tests | 4 archivos | 26 tests, suite total **319/319 verde**. |

### Frontend (Epic 11 + Epic 8)

| Área | Archivo | Estado |
|------|---------|--------|
| Stores | `lib/stores/reviewStore.ts` | createReview, edit, reply, fetchUserReviews, fetchUserSummary, reportReview. |
| Stores | `lib/stores/adminStore.ts` | fetchUsers, assignRole, setActive, fetchReviewReports, toggleReviewVisibility. |
| Reviews UI | `components/reviews/{StarRating,ReviewWidget,ReviewCard,ReviewForm,ReviewSummary,ReviewDrawer}.tsx` | 6 componentes con tests. |
| Match integration | `components/match/SwipeCard.tsx` (preview ★) + `app/match/[matchId]/page.tsx` (drawer + form CTA) | |
| Admin pages | `app/admin/{page,users,moderation}/page.tsx` | Role-gated, redirige a /dashboard si no es admin/web_manager. |
| Tests | 5 archivos | 16 tests, suite total **209/209 verde**. |

### Decisiones técnicas (esta sesión)

1. **Edit window 24h enforzada en view, no en DB** — `Review.is_editable` es property que compara `created_at + 24h` con `now()`. Más simple que un trigger; el endpoint `PATCH /reviews/{id}/` la consulta antes de aceptar cambios. Cron diario para "cerrar formalmente" se difiere — la lógica en lectura ya basta.
2. **Aggregates cacheados en Profile via signal** — la alternativa (computar en cada lectura) generaba N+1 al renderizar feeds de Match con preview de reputación. El signal idempotente recomputa desde reviews visibles → modificar `is_visible` actualiza inmediatamente los agregados, sin job nocturno.
3. **Hidden ≠ deleted** — `is_visible=False` esconde la reseña del público y la excluye de agregados, pero el row sigue en BD con audit trail (`ReviewReport` referencia). Critical para defensas legales y para revertir decisiones de moderación.
4. **Reply una sola vez** — el endpoint `POST /reviews/{id}/reply/` rechaza con 409 si `review.reply` ya existe. La propuesta del cliente especifica una sola respuesta pública para evitar argumentos públicos.
5. **`assign_role` espera enum, no string** — bug encontrado en test: la view pasaba string raw, el método del modelo hace `role.value`. Fix: convertir string → enum vía `valid_roles[role]` lookup. Lección documentada.
6. **Admin gating client-side + server-side** — las páginas `/admin/*` redirigen client-side si `user.role` no es admin/web_manager (UX), pero el endpoint hace el check real (`_is_admin_or_wm`). Defense in depth — un atacante que bypassa el JS aún recibe 403.
7. **`details/summary` HTML para CTA "Calificar"** — más simple que un modal, accesible nativamente, no rompe scroll. Aparece collapsed por default y el usuario lo expande cuando quiere calificar.

## Pendientes / TODOs heredados (siguen activos)

- ProjectApp debe regenerar **Google OAuth Client ID + Secret** en GCP (ERROR-001 en `error-documentation.md`). Tests pasan con mocks; el flujo real requiere credenciales válidas.
- Generar **VAPID keys** con `vapid --gen` antes de Epic 9 (Push real).
- Diseñar **4 PWA icons** (`frontend/public/icons/`).
- Migración a `app/[locale]/...` se difiere a Epic 14.

## Bloqueadores actualmente

Ninguno para arrancar Sprint 2 (Match) o BATCH paralelo de Epics 2/6/10.

## Próximos pasos sugeridos para la siguiente sesión

**Quedan 3 épicas para cerrar Release 01**:

- Epic 9 — Push real con VAPID + pywebpush + Service Worker handler. Requiere generar VAPID keys una sola vez con `vapid --gen` y configurarlas en `.env`.
- Epic 13 — Analítica + KPIs Dashboard (cromos más buscados/ofertados, mapa de calor de actividad, fuentes de tráfico, dispositivos). Lectura agregada de impressions/clicks/inventory/match.
- Epic 14 — Manual interactivo (wiki dentro del panel admin). Depende de tener todas las features cerradas para documentar.

Recomendado: **Epic 13 primero** — sin VAPID keys aún disponibles del equipo, Epic 13 puede ejecutarse en paralelo. Epic 9 cuando llegue el secret. Epic 14 al final.
