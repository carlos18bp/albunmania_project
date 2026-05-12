# User Flow Map — Albunmanía

**Single source of truth for all user flows in the application.**

Use this document to understand each flow's steps, branching conditions, role restrictions, and API contracts before writing or reviewing E2E tests. It is paired with `frontend/e2e/flow-definitions.json` (machine-readable registry) and `frontend/e2e/helpers/flow-tags.ts` (`@flow:` tag constants).

**Version:** 2.4.0
**Last Updated:** 2026-05-12
**Scope:** Release 01 — 14 épicas (Auth & Onboarding, Catálogo + Inventario, Match swipe + QR, WhatsApp opt-in, Comerciantes, Presenting Sponsor, Banners CPM, Panel Admin, PWA Push, Dark mode, Reseñas, Stats, Analítica, Manual) + "Bloque D" (cierre de los 4 GAPS P2 de la auditoría 2026-05-12: páginas legales/FAQ, perfil `/profile/[id]`, centro de notificaciones in-app, reportes de usuarios/intercambios + cola admin).

> Roles: `guest` (sin login), `collector` (coleccionista, rol por defecto), `merchant` (comerciante), `web-manager` / `admin` (panel administrativo). JWT en cookies (`access_token` / `refresh_token`). Backend bajo `/api/` (sin prefijo `/v1/`).

---

## Module Index

| Flow ID | Name | Module | Priority | Roles | Frontend Route |
|---------|------|--------|----------|-------|----------------|
| `public-home-loads` | Landing page loads | public | P1 | guest | `/` |
| `auth-google-signin` | Sign in with Google | auth | P1 | guest | `/sign-in` |
| `auth-google-signup` | Sign up with Google | auth | P1 | guest | `/sign-up` |
| `auth-hcaptcha-gate` | hCaptcha gate on auth pages | auth | P1 | guest | `/sign-in`, `/sign-up` |
| `auth-onboarding-wizard` | 3-step onboarding wizard | auth | P1 | collector | `/onboarding` |
| `auth-guest-browse` | Browse as guest (no login) | auth | P2 | guest | `/`, `/catalog/[slug]`, `/merchants`, `/manual` |
| `auth-protected-redirect` | Protected route redirect | auth | P1 | all | `/dashboard`, `/admin`, `/merchants/me` |
| `auth-session-persistence` | Session persistence (cookies) | auth | P2 | collector | any protected route |
| `auth-sign-out` | Sign out | auth | P2 | all (authed) | Header / `/dashboard` |
| `catalog-grid-filters` | Browse catalog + filters/search | catalog | P1 | collector | `/catalog/[slug]` |
| `catalog-inventory-tap` | Inventory 0/1/2+ tap + sync | catalog | P1 | collector | `/catalog/[slug]` |
| `catalog-special-edition` | Special-edition badge + filter | catalog | P2 | collector | `/catalog/[slug]` |
| `match-swipe-feed` | Match swipe feed renders | match | P1 | collector | `/match` |
| `match-like-mutual` | Like → mutual match | match | P1 | collector | `/match` |
| `match-list-mine` | My matches list | match | P2 | collector | `/match` |
| `match-qr-mine` | My QR code (share lists) | match | P1 | collector | `/match/qr` |
| `match-qr-scan-confirm` | Scan QR → cross lists offline → confirm | match | P1 | collector | `/match/qr` |
| `match-detail-trade` | Match/trade detail view | match | P1 | collector | `/match/[matchId]` |
| `match-shared-list-view` | View a shared QR list | match | P2 | guest | `/share/[token]` |
| `whatsapp-optin-per-trade` | Per-trade WhatsApp opt-in → wa.me link | whatsapp | P1 | collector | `/match/[matchId]` |
| `merchant-public-list-map` | Merchant public list + Leaflet map | merchant | P1 | guest | `/merchants` |
| `merchant-dashboard-edit` | Merchant self-service dashboard | merchant | P1 | merchant | `/merchants/me` |
| `merchant-admin-promote-pay` | Admin promotes merchant + registers payment | merchant | P2 | web-manager / admin | `/admin` |
| `sponsor-splash-header` | Presenting Sponsor splash + header band | sponsor | P2 | guest | all pages |
| `theme-dark-toggle` | Dark mode toggle | theme | P2 | guest | all pages |
| `ads-banner-serve-click` | Banner CPM served + click redirect | ads | P1 | collector | `/`, feed |
| `ads-frequency-cap` | Banner frequency cap (1 / 5 swipes) | ads | P2 | collector | `/match` |
| `review-post-trade-create` | Post-trade review (stars + tags + comment) | reviews | P1 | collector | `/match/[matchId]` |
| `review-reply` | Reviewee public reply | reviews | P2 | collector | profile / trade detail |
| `profile-view` | Collector profile page | profile | P2 | guest | `/profile/[id]` |
| `notifications-center` | In-app notification center | notifications | P2 | all (authed) | `/notificaciones` + Header bell |
| `review-profile-summary` | Review tab + rating summary on profile | reviews | P2 | guest | `/profile/[id]` |
| `review-drawer` | Review drawer on Match / trade detail | reviews | P2 | collector | `/match`, `/match/[matchId]` |
| `review-moderation` | Admin review-report moderation queue | reviews | P2 | web-manager / admin | `/admin/moderation` |
| `stats-dashboard-tiles` | Dashboard stat tiles (streak + ETA) | stats | P1 | collector | `/dashboard` |
| `stats-city-ranking` | City ranking leaderboard | stats | P2 | collector | `/dashboard` |
| `push-subscribe` | Web Push opt-in / unsubscribe | push | P2 | collector | `/dashboard` |
| `push-match-mutual-delivery` | Push delivered on mutual match | push | P2 | collector | (Service Worker) |
| `admin-landing-gated` | Admin landing role-gated | admin | P1 | web-manager / admin | `/admin` |
| `admin-users-roles` | Admin users — roles + active toggle | admin | P1 | web-manager / admin | `/admin/users` |
| `admin-moderation-queue` | Admin moderation queue (review reports + user/trade reports) | admin | P2 | web-manager / admin | `/admin/moderation` |
| `admin-analytics-overview` | Admin analytics + KPIs + CSV export | admin | P1 | web-manager / admin | `/admin/analytics` |
| `report-user-or-trade` | Report a user or a trade (e.g. no-show) | moderation | P2 | all (authed) | `/profile/[id]`, `/match/[matchId]` |
| `manual-search-browse` | Interactive manual: sections + search | manual | P2 | guest | `/manual` |
| `legal-terms` | Terms & Conditions page | legal | P2 | guest | `/terminos` |
| `legal-privacy` | Privacy Policy page | legal | P2 | guest | `/privacidad` |
| `help-faq` | Help center / FAQ | help | P2 | guest | `/ayuda` |

---

## Public Module

### public-home-loads

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | guest |
| **Frontend route** | `/` |
| **API endpoints** | `GET /api/sponsor/active/`, `GET /api/ads/serve/?slot=home` |

**Preconditions:** None.

**Steps:**
1. User navigates to `/`.
2. Hero renders heading `Albunmanía — la comunidad colombiana …` with CTAs **Registrarme con Google** (→ `/sign-up`) and **¿Cómo funciona?** (→ `/manual`).
3. Header renders **Manual**, **Entrar**, **Registrarse** for guests (and the auth slot only after `mounted` to avoid hydration mismatch — `data-testid="header-auth-placeholder"` until then).
4. `SponsorSplash` mounts client-side (auto-dismisses after ~1800ms); `sponsor-header-band` renders `Presentado por …` if a Sponsor is active.
5. `BannerSlot` (`banner-slot-home`) renders the served creative as a click-through link.
6. Footer renders the disclaimer `No afiliado oficialmente con FIFA o Panini`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No active Sponsor | Splash skipped; header band not rendered |
| No eligible ad creative | `banner-slot-home` not rendered (or empty) |
| Theme = dark | All elements use `dark:` variants |

---

## Auth Module

> `/sign-in` and `/sign-up` were rewritten to **Google OAuth + hCaptcha only** — there is no email/password form. Spanish copy throughout.

### auth-google-signin

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | guest |
| **Frontend route** | `/sign-in` |
| **API endpoints** | `GET /api/captcha/site-key/`, `POST /api/google_login/` |

**Preconditions:** User not authenticated. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set (else fallback). hCaptcha solved (see `auth-hcaptcha-gate`).

**Steps:**
1. User navigates to `/sign-in`.
2. Page renders heading **Entrar a Albunmanía**, the Google sign-in button (`@react-oauth/google`, `useGoogleLogin({ flow: 'implicit' })`), the hCaptcha widget, and a link **Crear cuenta** (→ `/sign-up`).
3. User solves the captcha, clicks the Google button, completes OAuth consent → frontend receives an `access_token`.
4. Frontend sends `POST /api/google_login/` with `{ access_token, captcha_token }`.
5. Backend validates the captcha, fetches Google People API `metadata.sources[].createTime`, checks the account is ≥ 30 days old, gets-or-creates `User` + `Profile`, returns `{ access, refresh, created }` (HTTP 200).
6. Frontend stores tokens in cookies; redirects to `/dashboard` (or `/onboarding` if not yet onboarded).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` missing | `data-testid="missing-google-client-id"` shown instead of the button |
| Account < 30 days old | `403 { error: "account_too_young" }` → message "tu cuenta de Google es muy nueva" |
| Captcha failed | `403 { error: "captcha_failed" }` → message + captcha resets |
| `access_token` missing (DEBUG) | Backend bypasses age check with a log warning; in prod → 403 |
| New user | `created: true` → redirect to `/onboarding` |
| Existing onboarded user | redirect to `/dashboard` |

---

### auth-google-signup

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | guest |
| **Frontend route** | `/sign-up` |
| **API endpoints** | `GET /api/captcha/site-key/`, `POST /api/google_login/` |

**Preconditions:** User not authenticated.

**Steps:**
1. User navigates to `/sign-up`.
2. Page renders the Albunmanía sign-up copy, the Google button + hCaptcha widget, and a link back to `/sign-in`.
3. Same `POST /api/google_login/` exchange as `auth-google-signin` (the endpoint is get-or-create).
4. On success → redirect to `/onboarding`.

**Branching conditions:** Same as `auth-google-signin` (this page differs only in copy and post-success redirect target).

---

### auth-hcaptcha-gate

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | guest |
| **Frontend route** | `/sign-in`, `/sign-up` |
| **API endpoints** | `GET /api/captcha/site-key/` (alias `GET /api/google-captcha/site-key/`) |

**Preconditions:** None.

**Steps:**
1. Auth page mounts; `HCaptchaWidget` fetches the sitekey from `/api/captcha/site-key/`.
2. Once the sitekey arrives, the hCaptcha iframe(s) mount (`iframe[src*="hcaptcha"]`).
3. The captcha token is required before the Google button submission proceeds.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Sitekey env empty (dev test key) | hCaptcha test key `10000000-ffff-…-0001` used; any token accepted server-side when the secret is also the test value/empty |
| Sitekey endpoint fails | Widget shows nothing; Google submission is blocked |

---

### auth-onboarding-wizard

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/onboarding` |
| **API endpoints** | `GET /api/albums/`, `PATCH /api/profile/` (active album, geo opt-in, push/whatsapp prefs) |

**Preconditions:** Authenticated. `Profile.active_album_id` may be null (not yet onboarded).

**Steps:**
1. After login (`created: true`) → user lands on `/onboarding`.
2. **Step 1 — Elige tu álbum activo** (`Pick your active album`): list of albums; user picks Mundial 26.
3. **Step 2 — Geolocalización**: explanation copy + browser geolocation permission prompt; coords saved to `Profile`.
4. **Step 3 — Notificaciones / WhatsApp**: push opt-in toggle + per-future-match WhatsApp opt-in preference.
5. Profile saved → redirect to `/dashboard`.
6. If an already-onboarded user navigates to `/onboarding`, the page still renders without crashing (shows step 1).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Geolocation denied | Onboarding continues; match feed falls back to IP-derived city |
| User skips a step / navigates back | Wizard preserves prior selections |
| No albums seeded | Step 1 shows empty state |

---

### auth-guest-browse

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/`, `/catalog/[slug]`, `/merchants`, `/manual` |
| **API endpoints** | public catalog / sponsor / ads / merchant / manual endpoints |

**Preconditions:** None.

**Steps:**
1. Guest browses the landing, the album catalog (`/catalog/[slug]`), the merchant map (`/merchants`), and the manual (`/manual`) without logging in.
2. Inventory taps and "Iniciar intercambio" actions prompt login (Google verified required only when starting a trade).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Guest taps a sticker | Local optimistic state may show, but persisting / trading requires login → redirect to `/sign-in` |
| Guest opens a protected route | See `auth-protected-redirect` |

---

### auth-protected-redirect

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | all |
| **Frontend route** | `/dashboard`, `/admin`, `/admin/*`, `/merchants/me` |
| **API endpoints** | `GET /api/validate_token/` |

**Preconditions:** None.

**Steps:**
1. Unauthenticated user navigates to a protected route.
2. The auth guard reads the (absent) `access_token` cookie → `router.replace('/sign-in')`.
3. For role-gated routes (`/admin/*`, `/merchants/me`), an authenticated user lacking the role is redirected: `/admin` collector → `/dashboard`; `/merchants/me` non-merchant → `/dashboard`. Server endpoints also return 403 (defense in depth).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No tokens | Redirect to `/sign-in` |
| Authenticated collector → `/admin` | `router.replace('/dashboard')` after the user object loads |
| Authenticated non-merchant → `/merchants/me` | Redirect to `/dashboard`; `GET /api/merchants/me/` → 403 |

---

### auth-session-persistence

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | any protected route |
| **API endpoints** | `GET /api/validate_token/`, `POST /api/token/refresh/` |

**Preconditions:** Valid tokens in cookies.

**Steps:**
1. User navigates to a protected route; the auth store reads `access_token` from cookies and validates it.
2. On reload, the session survives because the tokens live in cookies (not localStorage).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Access token expired | Frontend calls `POST /api/token/refresh/` with the refresh token |
| Refresh token expired | Redirect to `/sign-in` |
| SSR vs client | Auth UI renders a `mounted` placeholder until hydration to avoid mismatch |

---

### auth-sign-out

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | all (authenticated) |
| **Frontend route** | Header (any page) and `/dashboard` |
| **API endpoints** | None (client-side `authStore.signOut()`) |

**Preconditions:** User is authenticated.

**Steps:**
1. The Header (authenticated slot) and `/dashboard` both render a **Cerrar sesión** control (`data-testid="header-signout"` in the Header).
2. User clicks it → `authStore.signOut()` clears `access_token` / `refresh_token` from cookies.
3. The auth guard (`useRequireAuth`) on the next protected navigation redirects to `/sign-in`; the Header switches back to the guest slot.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Already on a public page | Header just flips to the guest slot; no redirect |
| On a protected page | Redirect to `/sign-in` |

---

## Catalog Module

### catalog-grid-filters

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/catalog/[slug]` (e.g. `/catalog/mundial-26`) |
| **API endpoints** | `GET /api/albums/<slug>/`, `GET /api/albums/<slug>/stickers/?team=&number=&q=&special=` |

**Preconditions:** Album `<slug>` exists with stickers seeded.

**Steps:**
1. User navigates to `/catalog/mundial-26`.
2. Grid renders one `[data-testid="sticker-card-<n>"]` per sticker (seed = 50).
3. Filters: team / number / player; `catalog-search` (`?q=`) filters server-side (debounced ~300ms); `catalog-filter-special` checkbox → `?special=true` (debounced ~250ms).
4. Each card shows image, number, team, and the inventory state badge.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| `?special=true` | Grid narrows to the 4 special stickers |
| `?q=Argentina` | Grid narrows to the 5 stickers of that team (seed cycles 10 teams over 50) |
| API loading | Skeleton grid |
| No stickers / album not found | Empty state |

---

### catalog-inventory-tap

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/catalog/[slug]` |
| **API endpoints** | `POST /api/inventory/bulk/` (debounced ~2s), `POST /api/inventory/tap/` (optional single) |

**Preconditions:** Authenticated; album active.

**Steps:**
1. User taps a `sticker-card` once → `data-count` +1, `data-state` `missing`→`owned` (count 1).
2. Second tap → count 2, `data-state` `repeated`. Further taps keep incrementing.
3. Long-press (pointer down ≥ ~600ms) → resets `data-count` to 0, `data-state` `missing`.
4. After ~2s of inactivity the client POSTs `/api/inventory/bulk/` with `{ items: [{ sticker, count }, …] }` (last-write-wins).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Seeded inventory non-zero | Taps assert the delta from the baseline `data-count`, not absolute |
| Rapid taps within the debounce window | Coalesced into a single bulk POST |
| Guest | Optimistic local state only; no bulk POST until login |
| Network error on bulk sync | State retained client-side; retried on next change |

---

### catalog-special-edition

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/catalog/[slug]` |
| **API endpoints** | `GET /api/albums/<slug>/stickers/?special=true` |

**Preconditions:** Album has stickers flagged `is_special_edition` (seed: numbers 01/15/32/50).

**Steps:**
1. User checks `catalog-filter-special` → grid shows only special stickers.
2. Each special card renders `[data-testid="special-badge"]` (golden halo) and, when present, the estimated market value.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No special stickers | Empty grid after filtering |
| Filter unchecked | Full grid restored |

---

## Match Module

### match-swipe-feed

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match` |
| **API endpoints** | `GET /api/match/feed/?radius_km=` |

**Preconditions:** Authenticated; geo set; nearby collectors with complementary inventory exist.

**Steps:**
1. User navigates to `/match`; heading **Match**, tabs `tab-swipe` and `tab-mine` render.
2. Backend `GET /api/match/feed/` returns top-N nearby candidates (bounding-box prefilter + haversine, complementary stickers); each card includes a compact review preview (★ avg + count, cached on `Profile`).
3. The first `[data-testid="swipe-card-<userId>"]` renders. A banner CPM (`ads-frequency-cap`) appears at most once per 5 swipes.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No candidates | Empty state ("no hay coleccionistas cerca") |
| Radius changed | Feed re-fetched with the new `radius_km` |
| Guest | Redirect to `/sign-in` |

---

### match-like-mutual

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match` |
| **API endpoints** | `POST /api/match/like/` |

**Preconditions:** A swipe card is displayed.

**Steps:**
1. User clicks **Like** (`swipe-like`).
2. Frontend POSTs `/api/match/like/` with `{ to_user, sticker_offered, sticker_wanted }`.
3. Backend `get_or_create` Like; looks up the mirror Like; if found → `Match.status = MUTUAL`, the `post_save` signal pushes both participants; response `{ mutual: true, match_id }`.
4. On `mutual: true` the UI shows the mutual modal → CTA "¿compartir WhatsApp?" (per-trade opt-in).
5. On `mutual: false` the feed advances to the next card.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Mirror Like exists | `mutual: true` (201), modal shown |
| No mirror Like | `mutual: false` (201), card advances |
| Same pair already matched | Existing `Match` returned, no duplicate row (canonical `user_a < user_b`) |
| Swipe left (pass) | No API call (or a no-op pass), card advances |

---

### match-list-mine

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/match` |
| **API endpoints** | `GET /api/match/mine/` |

**Preconditions:** Authenticated; at least one mutual match (seed: user ↔ user2).

**Steps:**
1. User clicks `tab-mine` → `my-matches` list loads.
2. Each entry shows `Match #<id>` and links to `/match/<id>`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No mutual matches | Empty state |

---

### match-qr-mine

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match/qr` |
| **API endpoints** | `GET /api/match/qr/me/` (HMAC-SHA256 token, TTL 24h) |

**Preconditions:** Authenticated.

**Steps:**
1. User navigates to `/match/qr`; heading **Match presencial**; tabs "Mi QR" (`qr-display`) and "Escanear" (`tab-scan`).
2. The "Mi QR" tab fetches a signed token and renders the QR (`qrcode.react` → `<svg>`).
3. Two shareable QRs are available: cromos disponibles and cromos faltantes (shareable to WhatsApp / Instagram via a public signed `GET /api/trade/share/<token>/` page).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Token expired (>24h) | A fresh token is issued on revisit |

---

### match-qr-scan-confirm

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match/qr` (Escanear) |
| **API endpoints** | `POST /api/match/qr/scan/` (constant-time verify), `POST /api/match/qr/confirm/` |

**Preconditions:** Catalog + own inventory cached in IndexedDB (`idb-keyval`). Counterpart's QR available.

**Steps:**
1. User switches to `tab-scan`; `@zxing/browser` mounts (`scanner-video`) or shows `scanner-error` in headless / no-camera contexts.
2. User scans the counterpart's QR → frontend `POST /api/match/qr/scan/ { token }` → server returns the counterpart's inventory payload (token verified constant-time).
3. Frontend runs `computeOfflineCross(me, other)` **in the client** (pure function shared with the backend) → list of possible trades, sorted by value.
4. Both confirm → `POST /api/match/qr/confirm/`; the server re-runs `compute_offline_cross` with the real DB inventories as a sanity check → creates `Match(channel='qr_presencial')` + `Trade`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Camera unavailable (headless) | `scanner-error` fallback; scan endpoint still exercisable via `qrStore` directly |
| Token invalid / expired | `400` from `/qr/scan/` |
| Server cross != client cross | `400` on `/qr/confirm/` for any item not derivable from real inventory |
| Offline | Steps 1–3 work without network; only `/qr/confirm/` needs connectivity |

---

### match-detail-trade

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match/[matchId]` |
| **API endpoints** | `GET /api/match/<id>/`, plus `whatsapp-optin` and review endpoints (see related flows) |

**Preconditions:** Authenticated; the requesting user is a participant of the match.

**Steps:**
1. User navigates to `/match/1`; heading `Match #1`.
2. `trade-items` renders the stickers each party contributes.
3. `whatsapp-optin-toggle` renders (see `whatsapp-optin-per-trade`).
4. A non-invasive review mini-block per participant (★ avg + count) renders; clicking it opens the `ReviewDrawer` (see `review-drawer`).
5. After the trade is marked completed, the CTA "Calificar al coleccionista" (`<details>/<summary>`) is enabled (see `review-post-trade-create`).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Not a participant | `403`; the page does not render the trade |
| Trade not yet completed | The "Calificar" CTA is hidden / disabled |

---

### match-shared-list-view

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/share/[token]?kind=available\|wanted` |
| **API endpoints** | `GET /api/trade/share/<token>/?kind=available\|wanted` |

**Preconditions:** A collector shared one of their two QR/links from `/match/qr` (signed token, `kind` = the available or the wanted list).

**Steps:**
1. The recipient (no login) opens `/share/<token>` (e.g. from WhatsApp / Instagram Stories). `?kind` defaults to `available`.
2. Frontend `GET /api/trade/share/<token>/?kind=...` → returns `{ kind, collector: {city, avatar_url}, items: [{sticker_id, number, name, team, image_url, is_special_edition}], count }`.
3. The page renders the title ("Cromos para intercambiar" / "Cromos buscados"), the collector's city + count, the cromos grid (special editions get a golden ring), and a **"Únete a Albunmanía y haz match"** CTA → `/sign-up`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Token expired / invalid | "El enlace expiró o no es válido." |
| `?kind=wanted` | Title becomes "Cromos buscados" |
| Loading | "Cargando…" |
| Guest clicks the CTA | Navigates to `/sign-up` |

---

## WhatsApp Module

### whatsapp-optin-per-trade

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match/[matchId]` |
| **API endpoints** | `POST /api/trade/<trade_id>/whatsapp-optin/`, `GET /api/trade/<trade_id>/whatsapp-link/` |

**Preconditions:** A confirmed trade exists; both users have `whatsapp_e164` set on their profile.

**Steps:**
1. User opens `/match/1`; `whatsapp-optin-checkbox` unchecked → `whatsapp-link-disabled` placeholder shown.
2. User toggles the checkbox → `POST /api/trade/1/whatsapp-optin/` records their side on the (single) `TradeWhatsAppOptIn` row.
3. If only one side has opted in → the link stays disabled ("esperando al otro").
4. Once both sides opted in → the toggle's callback fetches `GET /api/trade/1/whatsapp-link/` → `whatsapp-link` anchor with `href` `https://wa.me/<digits>?text=<encoded server-side template>`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Only user opted in | `whatsapp-link-disabled` still shown |
| Both opted in | `whatsapp-link` enabled with `https://wa.me/\d+…` |
| Peer has no `whatsapp_e164` | `400 { error: "peer_has_no_whatsapp_number" }` |
| User revokes opt-in | Link reverts to the disabled placeholder for both |

---

## Merchant Module

### merchant-public-list-map

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | guest |
| **Frontend route** | `/merchants` |
| **API endpoints** | `GET /api/merchants/?city=` |

**Preconditions:** At least one merchant with a current subscription (seed: Papelería El Sol, Bogotá).

**Steps:**
1. User navigates to `/merchants`; heading `¿Dónde comprar sobres …`.
2. The list renders the seeded merchant (name, address, hours, declared stock).
3. `merchant-city-filter` narrows the list by city (`?city=…`); the Leaflet map (`merchant-map`, `dynamic({ ssr: false })`) mounts a `.leaflet-container` with marker icons.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| `?city=Medellín` (no merchant there) | `merchant-list-empty` state |
| Merchant subscription expired | Excluded from the list and the map (server filters `subscription_status='active' AND expires_at > now()`) |
| Headless OSM tiles missing | Leaflet container/panes still present; marker layer may be empty |

---

### merchant-dashboard-edit

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | merchant |
| **Frontend route** | `/merchants/me` |
| **API endpoints** | `GET /api/merchants/me/`, `PATCH /api/merchants/me/` |

**Preconditions:** Authenticated with `role=merchant` and a `MerchantProfile`.

**Steps:**
1. User navigates to `/merchants/me`; heading **Mi negocio**; `merchant-dashboard-form` pre-populated with the business data; `merchant-subscription-badge` shows `activa` (or `vencida`).
2. User edits a field (e.g. `merchant-declared-stock`), clicks `merchant-submit` → `PATCH /api/merchants/me/` (200) → `merchant-saved` confirmation.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Subscription expired | Badge shows `vencida`; the public listing hides this merchant |
| Non-merchant | `403` from `GET /api/merchants/me/`; route redirects to `/dashboard` |
| Validation error (zod) | Field-level errors; no PATCH |

---

### merchant-admin-promote-pay

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin` (merchant management section) |
| **API endpoints** | merchant-admin endpoints (`/api/merchants/admin/...` — promote role, register `MerchantSubscriptionPayment`) |

**Preconditions:** Authenticated as web-manager / admin.

**Steps:**
1. Admin approves/invites a user → assigns `role=merchant`, creating `MerchantProfile`.
2. Admin registers a monthly payment → `MerchantSubscriptionPayment`; the listing becomes visible while the period is current. `register_payment` extends from `max(now, current_expiry)` so pre-paid months accumulate.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Payment registered after expiry | Period starts from today (lost time not recovered) |
| Consecutive pre-payments | Periods accumulate |

---

## Sponsor / Theme Module

### sponsor-splash-header

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | all pages |
| **API endpoints** | `GET /api/sponsor/active/` |

**Preconditions:** None.

**Steps:**
1. App mounts; the sponsor store fetches the active Sponsor.
2. If one exists: `SponsorSplash` (`sponsor-splash`) shows briefly (~1800ms then auto-dismiss) with the sponsor palette; `sponsor-header-band` renders `Presentado por <Marca>` on every page; CSS variables apply the sponsor colours.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No active Sponsor | Splash skipped (`sponsor-splash` never visible); header band absent — both states valid |
| Multiple sponsors in DB | Only the one with `active_from <= now() <= active_until` is used (constraint: at most one) |

---

### theme-dark-toggle

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | all pages |
| **API endpoints** | None (client-side, `next-themes`) |

**Preconditions:** None.

**Steps:**
1. `ThemeToggle` button (`aria-label="Toggle theme"`) opens a `role="menu"` with `menuitemradio` items **Light / Dark / System**.
2. Selecting **Dark** adds the `dark` class to `document.documentElement`; the choice persists; first visit follows `prefers-color-scheme`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Sponsor active | Sponsor CSS variables layer on top of the dark/light palette |
| SSR | The toggle renders a `mounted` placeholder until hydration to avoid mismatch |

---

## Ads Module

### ads-banner-serve-click

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector (or guest on `/`) |
| **Frontend route** | `/` and the match feed |
| **API endpoints** | `GET /api/ads/serve/?slot=`, `GET /api/ads/click/<impression_id>/` (302) |

**Preconditions:** An eligible `AdCreative` exists (seed: Bavaria campaign).

**Steps:**
1. `BannerSlot` calls `GET /api/ads/serve/?slot=home` (or `feed`) → server picks a creative via weighted rotation (`creative.weight × campaign.weight`), geo segmentation, remaining budget → records an `AdImpression`, returns `{ impression_id, image, headline, body, click_url }`.
2. `banner-slot-home` renders the creative as an `<a href="/api/ads/click/<impression_id>/">`.
3. On click → server records `AdClick`, returns a 302 to the advertiser's `click_url`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No eligible creative | `serve` returns empty; the slot is not rendered |
| Budget exhausted | Creative excluded from rotation |
| Click | `AdClick` recorded even if the user closes the tab; the advertiser's `Referer` does not leak the `impression_id` |

---

### ads-frequency-cap

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/match` |
| **API endpoints** | `GET /api/ads/serve/?slot=feed` (only every Nth swipe) |

**Preconditions:** On the match feed.

**Steps:**
1. `adStore.noteSwipe()` counts swipes; every 5th swipe it returns `true` → a feed banner is requested and shown.
2. Between caps, no `serve` call is made.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Page refreshed | Swipe counter resets (acceptable — slot is best-effort) |
| Fewer than 5 swipes | No feed banner shown |

---

## Profile Module

### profile-view

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest (public profile); collector for the self-edit form |
| **Frontend route** | `/profile/[id]` — `/profile/me` resolves to the logged-in user |
| **API endpoints** | `GET /api/users/<id>/public-profile/`, `GET /api/users/<id>/rating-summary/`, `GET /api/users/<id>/reviews/?stars=`; for `/profile/me`: `GET`/`PATCH /api/profile/me/` |

**Preconditions:** None for a public profile. `/profile/me` requires being logged in (else redirect to `/sign-in`).

**Steps:**
1. User opens `/profile/<id>` (e.g. from the Header "Mi perfil" link → `/profile/me`).
2. `ProfileHeader` renders: avatar (or initials fallback), display name, city, bio, metrics (`% del álbum`, `Intercambios`, `Reseñas`) and the `ReviewSummary` block — from `GET /api/users/<id>/public-profile/` (no email/phone exposed).
3. The "Reseñas" section lists `ReviewCard`s with star-filter chips (see `review-profile-summary`).
4. If the profile is the logged-in user's own (`/profile/me` or `/profile/<myId>`), an "Editar mi cuenta" form renders (city, bio corta, push opt-in, WhatsApp opt-in + número) → `PATCH /api/profile/me/`. The name is not editable (comes from Google).
5. If it's another user's profile and you're logged in, a "pronto podrás reportarlo" note shows (the report button lands in the Report module — Bloque D4).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| `/profile/me` and not logged in | Redirect to `/sign-in` |
| Unknown user id | `GET /public-profile/` → 404; the page shows "Cargando perfil…" (no profile data) |
| Saving with an invalid WhatsApp number | `PATCH` 400; `account-error` message |

---

## Reviews Module

### review-post-trade-create

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/match/[matchId]` (Detalle de Intercambio) |
| **API endpoints** | `POST /api/trades/<trade_id>/reviews/`, `PATCH /api/reviews/<id>/` |

**Preconditions:** The trade is confirmed/completed; the user has not already reviewed it.

**Steps:**
1. After the trade completes, the CTA "Calificar al coleccionista" expands the `ReviewForm`.
2. User picks ★ 1–5, multi-selects tags ("puntual", "cromos en buen estado", "buena comunicación", "no-show", …), optional comment ≤ 500 chars.
3. `POST /api/trades/<trade_id>/reviews/` → validates uniqueness `(trade_id, reviewer_id)`; on success the `post_save` signal recomputes `Profile.{rating_avg, rating_count, positive_pct}`.
4. Within 24h the user can `PATCH /api/reviews/<id>/` to edit; after 24h → `403`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Comment > 500 chars | Client-side validation blocks submit |
| Already reviewed this trade | `400` / `409` — duplicate blocked by the unique constraint |
| Edit after 24h | `403` (not editable) |
| Trade not completed | The CTA is unavailable |

---

### review-reply

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector (the reviewee) |
| **Frontend route** | profile / trade detail |
| **API endpoints** | `POST /api/reviews/<id>/reply/` |

**Preconditions:** A review exists about the user; no reply yet.

**Steps:**
1. The reviewee opens the review and writes a single public reply.
2. `POST /api/reviews/<id>/reply/` attaches the reply; it renders below the review.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Reply already exists | `409 Conflict` |
| Not the reviewee | `403` |

---

### review-profile-summary

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/profile/[id]` (the "Reseñas" section) |
| **API endpoints** | `GET /api/users/<id>/rating-summary/`, `GET /api/users/<id>/reviews/?stars=` |

**Preconditions:** The user has at least one visible review (otherwise the empty state shows).

**Steps:**
1. On `/profile/[id]`, the **Reseñas** section renders `ReviewSummary` (avg, 1–5 distribution bars, total count, top tags) from the cached `Profile` aggregates.
2. Below it, the `ReviewCard` list with star-filter chips (`profile-reviews-filter-<n>` → `?stars=`).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No visible reviews | `profile-reviews-empty` state |
| Hidden reviews | Excluded from the summary and the list (still counted in the DB for audit) |

---

### review-drawer

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/match` (Swipe Card) and `/match/[matchId]` |
| **API endpoints** | `GET /api/users/<id>/reviews/` |

**Preconditions:** A counterpart with at least one review.

**Steps:**
1. On a Swipe Card or the trade detail, the compact ★ avg (count) preview is clickable.
2. Clicking opens the `ReviewDrawer` side-sheet (never a blocking modal, never pre-opened) — paginated list with a star filter.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Zustand selector returns the empty fallback | Must use a cached `Object.freeze([])` (no `?? []`) to avoid the `useSyncExternalStore` infinite loop (regression fixed in `2e19919`) |
| Counterpart has no reviews | Drawer shows an empty state |

---

### review-moderation

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin/moderation` |
| **API endpoints** | `POST /api/reviews/<id>/report/`, `GET /api/admin/reviews/reports/`, hide/restore endpoint (`PATCH ...` with `is_visible` + reason) |

**Preconditions:** Authenticated as web-manager / admin.

**Steps:**
1. Any user can report a review → `POST /api/reviews/<id>/report/` creates a `ReviewReport`.
2. The admin opens `/admin/moderation`; `moderation-list` shows pending reports (or `moderation-empty` when none).
3. The admin hides the review (`is_visible=False` + reason) → it disappears from public surfaces and aggregates immediately, but the row + report stay in the DB for audit. The action is reversible.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No pending reports | `moderation-empty` state |
| Review hidden then restored | Aggregates recompute on the `is_visible` change (signal) |

---

## Stats Module

### stats-dashboard-tiles

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | collector |
| **Frontend route** | `/dashboard` |
| **API endpoints** | `GET /api/stats/me/` |

**Preconditions:** Authenticated; album active.

**Steps:**
1. User navigates to `/dashboard`; heading **Mi álbum**.
2. `StatCard` (`stat-card`) renders six tiles: **% completo**, **Pegadas**, **Repetidas**, **Última semana**, **Racha**, **ETA finalización** — computed on demand by `stats_engine.compute_stats` (streak with a 1-day grace; ETA = `remaining / (weekly_velocity / 7)`).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| `weekly_velocity == 0` | ETA = `None` ("sin datos") |
| `completion == 100%` | ETA = `0` |
| No active album | Stats section shows an empty/setup state |

---

### stats-city-ranking

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/dashboard` |
| **API endpoints** | `GET /api/stats/ranking/?city=` |

**Preconditions:** Authenticated; `Profile.city` and `active_album_id` set (seed user = Bogotá).

**Steps:**
1. The dashboard renders `RankingList` (`ranking-list`) — top collectors in the user's city for the active album.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Ranking empty | `ranking-empty` state |
| City / album not set | `ranking-empty-config` state |

---

## Notifications Module

### notifications-center

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector / merchant / web-manager / admin (authenticated) |
| **Frontend route** | `/notificaciones` (+ the Header bell) |
| **API endpoints** | `GET /api/notifications/?unread=&page=&page_size=`, `GET /api/notifications/unread-count/`, `POST /api/notifications/<id>/read/`, `POST /api/notifications/read-all/` |

**Preconditions:** Authenticated (the route uses `useRequireAuth` → redirect to `/sign-in` otherwise).

**Steps:**
1. The Header (authed) shows a bell (`header-notifications` → `/notificaciones`) with a badge (`header-notifications-badge`) of the unread count (`GET /api/notifications/unread-count/`, capped at "9+").
2. On `/notificaciones`, `NotificationItem` rows render newest-first (`notification-<id>`, `data-read=true|false`, an unread dot when unread). Each item links to `notification.url` and, on click, is marked read (`POST /api/notifications/<id>/read/`) before navigating.
3. The "Sólo no leídas" checkbox (`notifications-unread-only`) re-fetches with `?unread=true`. "Marcar todas como leídas" (`notifications-mark-all`) → `POST /api/notifications/read-all/`.
4. Notifications are **created** server-side: on a new mutual `Match` (`post_save Match` signal — one per participant, `kind=match_mutual`, url `/match/<id>`); on creating a review (`trade_review_create` view — for the reviewee, `kind=review_received`, url `/profile/me`); on replying to a review (`review_reply` view — for the reviewer, `kind=review_reply`, url `/profile/<reviewee>`). (This is in-app only — the Web Push for the match is sent in parallel; see `push-match-mutual-delivery`.)

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Not authenticated | Redirect to `/sign-in` |
| No notifications | `notifications-empty` state (text differs for the "sólo no leídas" filter) |
| Unread count == 0 | The bell renders without a badge |

---

## Push Module

### push-subscribe

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | `/dashboard` (Notificaciones section) |
| **API endpoints** | `GET /api/push/public-key/`, `POST /api/push/subscribe/`, `POST /api/push/unsubscribe/` |

**Preconditions:** Browser supports `Notification` + `PushManager` + Service Worker; the SW is registered.

**Steps:**
1. The dashboard's **Notificaciones** section renders `PushOptInButton` (or nothing if the browser is unsupported).
2. User clicks "Activar notificaciones" → `Notification.requestPermission()` → on `granted`, fetch `GET /api/push/public-key/` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `POST /api/push/subscribe/ { endpoint, keys: { p256dh, auth } }` → `PushSubscription.objects.update_or_create(endpoint)`.
3. "Desactivar" → `POST /api/push/unsubscribe/ { endpoint }` and `subscription.unsubscribe()`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Permission denied | The button shows a "permiso denegado" message |
| Browser unsupported | The component renders nothing |
| Endpoint already registered | `update_or_create` refreshes `last_used_at` |

---

### push-match-mutual-delivery

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | collector |
| **Frontend route** | Service Worker (`sw.js` + `sw-push.js`) |
| **API endpoints** | `webpush(...)` from `signals.py` → push service |

**Preconditions:** The recipient has at least one `PushSubscription`.

**Steps:**
1. A mutual `Match` is created → the `post_save` signal calls `push_notify.send_to(user, build_match_mutual_payload(match_id, other_email))` for both participants.
2. `webpush` delivers `{ title, body, icon, badge, data: { url } }` → the Service Worker `push` event → `sw-push.js` calls `showNotification`.
3. The user clicks the notification → `notificationclick` → focus an existing tab on `data.url` or `openWindow(data.url)`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Subscription returns 404/410 | `push_notify` deletes that `PushSubscription` and continues |
| Other webpush error | Swallowed; counted as `dropped` |
| No subscriptions | `send_to` returns `(0, 0)` — no-op |

---

## Admin Module

### admin-landing-gated

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin` |
| **API endpoints** | `GET /api/validate_token/` (role used for gating) |

**Preconditions:** None.

**Steps:**
1. User navigates to `/admin`.
2. If `role ∈ {web_manager, admin}` → heading **Panel administrativo** with `admin-tiles` (Usuarios y roles, Moderación de reseñas, Analítica + KPIs, gestores de Sponsor / Comerciantes / Banners, Manual…).
3. Otherwise → `router.replace('/dashboard')` once the user object loads; server endpoints also return 403.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Collector | Redirected to `/dashboard` |
| Unauthenticated | Redirected to `/sign-in` |

---

### admin-users-roles

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin/users` |
| **API endpoints** | `GET /api/admin/users/?q=`, `PATCH /api/admin/users/<id>/role/`, `PATCH /api/admin/users/<id>/active/` |

**Preconditions:** Authenticated as web-manager / admin.

**Steps:**
1. Heading **Usuarios y roles**; `admin-users-table` lists the seed accounts (`user@example.com`, etc.); search filters by `?q=`.
2. Inline editing: change a user's role (`/role/` — the view converts the string to the `User.Role` enum and mirrors the Django Group); toggle active (`/active/`).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Invalid role string | `400` (server validates against `User.Role`) |
| Self-block attempt on `/active/` | `400 { error: "cannot_block_self" }` |
| Not admin/web-manager | `403` |

---

### admin-moderation-queue

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin/moderation` |
| **API endpoints** | `GET /api/admin/reviews/reports/` (+ hide/restore); `GET /api/admin/reports/?status=&kind=`, `PATCH /api/admin/reports/<id>/` |

**Preconditions:** Authenticated as web-manager / admin.

**Steps:** `/admin/moderation` has two queues:
1. **Review reports** — see `review-moderation` (`moderation-list` / `moderation-empty`, `hide-*` / `dismiss-*`, status filter chips).
2. **User & trade reports** (`reports-section`) — `GET /api/admin/reports/` lists `Report` rows (`report-<id>`) with reporter / target / reason / detail; status filter chips (`reports-filter-*`); per-row `report-action-<id>` (mark **actioned** + notes) / `report-dismiss-<id>` (dismiss + notes) → `PATCH /api/admin/reports/<id>/`; for user reports, a link to `/admin/users` to apply a sanction (`is_active` toggle). See `report-user-or-trade` for the reporter side.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| No pending review reports | `moderation-empty` |
| No reports in the selected status | `reports-empty` |
| Not admin/web-manager | `GET /api/admin/reports/` → `403` |

---

### admin-analytics-overview

| Field | Value |
|-------|-------|
| **Priority** | P1 · **Roles** | web-manager / admin |
| **Frontend route** | `/admin/analytics` |
| **API endpoints** | `GET /api/admin/analytics/overview/`, `GET /api/admin/analytics/export.csv` |

**Preconditions:** Authenticated as web-manager / admin.

**Steps:**
1. Heading **Analítica + KPIs**; one composite `GET /api/admin/analytics/overview/` returns 7 blocks: `community-kpis` (Usuarios activos, Trades completados, …), `ad-kpis` (Impresiones, CTR, …), matches/trades trend chart, cromos más ofertados, cromos más buscados, dispositivos (placeholder marked with `*` until UA tracking lands), top ciudades por impresiones.
2. `export-csv` is an `<a href="/api/admin/analytics/export.csv">`.

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Empty data (no impressions/trades seeded) | Blocks render with zeros |
| "Fuentes de Tráfico" / "Alertas de Rendimiento" | Not in Release 01 — V2 (UTM tracking + Huey nightly) |

---

## Moderation Module

### report-user-or-trade

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | all (authed) |
| **Frontend route** | `/profile/[id]` (report a user) · `/match/[matchId]` (report a trade, e.g. no-show) |
| **API endpoints** | `POST /api/reports/` `{ target_kind: "user"|"trade", target_id, reason, detail? }` → `201` |

**Preconditions:** Authenticated. For a trade report, the reporter must be a participant of the trade. A user cannot report themselves.

**Steps:**
1. On `/profile/[id]` (when `id` is not the logged-in user) a `report-button` ("Reportar a este coleccionista") opens the `report-modal`; on `/match/[matchId]` the `report-button` ("Reportar este intercambio") does the same with `target_kind=trade`.
2. The modal has a reason `<select>` (`report-reason` — `no_show` / `harassment` / `fake_profile` / `inappropriate` / `other`; defaults to `no_show` for trades, `fake_profile` for users) and an optional detail `<textarea>` (`report-detail`, ≤500 chars).
3. `report-submit` → `POST /api/reports/`; on success shows `report-submitted`; on failure shows `report-error`. Backdrop click closes the modal.
4. The new `Report` lands `pending` in the admin queue — see `admin-moderation-queue` (second queue).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Target is the reporter (user) | `403` (validated server-side) |
| Trade report, reporter not a participant | `403` |
| Unknown target / kind mismatch | `400` |
| Not authenticated | `401` |

---

## Manual Module

### manual-search-browse

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/manual` |
| **API endpoints** | None (content is static in `frontend/lib/manual/content.ts`) |

**Preconditions:** None.

**Steps:**
1. User navigates to `/manual`; heading **Manual interactivo**.
2. The sidebar renders each section as a collapsible `<button>` (audiences: Coleccionista, Comerciante, Web Manager, Administrador, plus transversal sections — 9 sections × 14 processes).
3. The search input (placeholder "Buscar"/"Search") filters processes client-side over `keywords + title + summary`.
4. Selecting a section/process renders the step-by-step `ProcessCard` (bilingual `{es, en}`).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Search with no matches | Empty results state |
| Section collapsed/expanded | Toggles its processes' visibility |

---

## Legal / Help Module

### legal-terms

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/terminos` |
| **API endpoints** | None (content static in `frontend/lib/legal/content.ts`) |

**Preconditions:** None.

**Steps:**
1. User navigates to `/terminos` (linked from the footer); heading **Términos y Condiciones** (`data-testid="terms-page"`).
2. A draft-notice banner (`legal-draft-notice`) renders at the top — the text is a working draft pending the client's legal review.
3. The document renders as `### heading` sections + paragraphs from `TERMS_SECTIONS` (qué es Albunmanía, cuenta/elegibilidad/edad, cómo funcionan los intercambios, conducta, monetización/publicidad, propiedad intelectual, limitación de responsabilidad, cambios/terminación, ley aplicable/contacto).

**Branching conditions:** None — static page.

---

### legal-privacy

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/privacidad` |
| **API endpoints** | None (content static in `frontend/lib/legal/content.ts`) |

**Preconditions:** None.

**Steps:**
1. User navigates to `/privacidad` (linked from the footer); heading **Política de Privacidad** (`data-testid="privacy-page"`).
2. Draft-notice banner at the top.
3. Sections from `PRIVACY_SECTIONS` (responsable del tratamiento, qué datos, para qué, con quién se comparten, conservación, derechos del titular Ley 1581/2012, seguridad, menores/cambios).

**Branching conditions:** None — static page.

---

### help-faq

| Field | Value |
|-------|-------|
| **Priority** | P2 · **Roles** | guest |
| **Frontend route** | `/ayuda` |
| **API endpoints** | None (content static in `frontend/lib/faq/content.ts`) |

**Preconditions:** None.

**Steps:**
1. User navigates to `/ayuda` (linked from the footer); heading **Centro de Ayuda** (`data-testid="help-page"`).
2. `FAQAccordion` renders the audience filter chips (Todos / General / Coleccionista / Comerciante / Anunciante) and the list of questions as collapsible `<button>` headers (`faq-question-<id>` / `faq-answer-<id>`).
3. Clicking a question toggles its answer; clicking an audience chip filters the list (general items show under "General"; others only under their own audience).

**Branching conditions:**
| Condition | Behavior |
|-----------|----------|
| Audience filter with no items | `faq-empty` state |
| Open question + click another | Only one answer open at a time |

---

## Cross-Reference

| Artifact | Path | Purpose |
|----------|------|---------|
| Flow Definitions (JSON) | `frontend/e2e/flow-definitions.json` | Machine-readable flow registry for the E2E reporter |
| Flow Tag Constants | `frontend/e2e/helpers/flow-tags.ts` | Reusable `@flow:` / `@module:` / `@priority:` tag arrays for Playwright tests |
| E2E Spec Files | `frontend/e2e/<module>/*.spec.ts`, `frontend/e2e/validation/session-*.spec.ts` | Playwright test implementations |
| Flow Coverage Report | `e2e-results/flow-coverage.json` | Auto-generated coverage status per flow |
| E2E Flow Coverage Standard | `docs/E2E_FLOW_COVERAGE_REPORT_STANDARD.md` | Reporter implementation and JSON schema |
| Release scope | `docs/release/01-release-checklist.md` | The 14 épicas of Release 01 |
| Architecture | `docs/methodology/architecture.md` | Request flows + ER + deployment |

### Maintenance Rules

- **Adding a new flow:** Add a `### <flow-id>` entry here with full Steps + Branches, add it to `frontend/e2e/flow-definitions.json`, add a tag constant to `frontend/e2e/helpers/flow-tags.ts`, then create/tag E2E tests.
- **Modifying a flow:** Update Steps and Branches here first, then the tests.
- **Removing a flow:** Remove it from this document, `flow-definitions.json`, the tag constant, and every `@flow:` tag in specs.
- **Bump `Version` and `Last Updated`** on every change.
