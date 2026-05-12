/**
 * Flow tag constants for consistent E2E test tagging.
 *
 * Each constant bundles @flow:, @module:, and @priority: tags. Use spread
 * syntax to compose tags in tests:
 *
 *   import { AUTH_GOOGLE_SIGNIN } from '../helpers/flow-tags';
 *   test('...', { tag: [...AUTH_GOOGLE_SIGNIN] }, async ({ page }) => { ... });
 *
 * The flow IDs here MUST match `e2e/flow-definitions.json` and the
 * `### <flow-id>` headings in `docs/USER_FLOW_MAP.md`. See the
 * "Maintenance Rules" section there before adding/removing a flow.
 */

// ── Public ──
export const PUBLIC_HOME_LOADS = ['@flow:public-home-loads', '@module:public', '@priority:P1'];

// ── Auth ──
export const AUTH_GOOGLE_SIGNIN = ['@flow:auth-google-signin', '@module:auth', '@priority:P1'];
export const AUTH_GOOGLE_SIGNUP = ['@flow:auth-google-signup', '@module:auth', '@priority:P1'];
export const AUTH_HCAPTCHA_GATE = ['@flow:auth-hcaptcha-gate', '@module:auth', '@priority:P1'];
export const AUTH_ONBOARDING_WIZARD = ['@flow:auth-onboarding-wizard', '@module:auth', '@priority:P1'];
export const AUTH_GUEST_BROWSE = ['@flow:auth-guest-browse', '@module:auth', '@priority:P2'];
export const AUTH_PROTECTED_REDIRECT = ['@flow:auth-protected-redirect', '@module:auth', '@priority:P1'];
export const AUTH_SESSION_PERSISTENCE = ['@flow:auth-session-persistence', '@module:auth', '@priority:P2'];
export const AUTH_SIGN_OUT = ['@flow:auth-sign-out', '@module:auth', '@priority:P2'];

// ── Catalog ──
export const CATALOG_GRID_FILTERS = ['@flow:catalog-grid-filters', '@module:catalog', '@priority:P1'];
export const CATALOG_INVENTORY_TAP = ['@flow:catalog-inventory-tap', '@module:catalog', '@priority:P1'];
export const CATALOG_SPECIAL_EDITION = ['@flow:catalog-special-edition', '@module:catalog', '@priority:P2'];
export const CATALOG_PREDICTIVE_SEARCH = ['@flow:catalog-predictive-search', '@module:catalog', '@priority:P3'];
export const CATALOG_AVAILABILITY_PROXIMITY = ['@flow:catalog-availability-proximity', '@module:catalog', '@priority:P3'];

// ── Match ──
export const MATCH_SWIPE_FEED = ['@flow:match-swipe-feed', '@module:match', '@priority:P1'];
export const MATCH_LIKE_MUTUAL = ['@flow:match-like-mutual', '@module:match', '@priority:P1'];
export const MATCH_LIST_MINE = ['@flow:match-list-mine', '@module:match', '@priority:P2'];
export const MATCH_QR_MINE = ['@flow:match-qr-mine', '@module:match', '@priority:P1'];
export const MATCH_QR_SCAN_CONFIRM = ['@flow:match-qr-scan-confirm', '@module:match', '@priority:P1'];
export const MATCH_DETAIL_TRADE = ['@flow:match-detail-trade', '@module:match', '@priority:P1'];
export const MATCH_SHARED_LIST_VIEW = ['@flow:match-shared-list-view', '@module:match', '@priority:P2'];

// ── WhatsApp ──
export const WHATSAPP_OPTIN_PER_TRADE = ['@flow:whatsapp-optin-per-trade', '@module:whatsapp', '@priority:P1'];

// ── Merchant ──
export const MERCHANT_PUBLIC_LIST_MAP = ['@flow:merchant-public-list-map', '@module:merchant', '@priority:P1'];
export const MERCHANT_DASHBOARD_EDIT = ['@flow:merchant-dashboard-edit', '@module:merchant', '@priority:P1'];
export const MERCHANT_ADMIN_PROMOTE_PAY = ['@flow:merchant-admin-promote-pay', '@module:merchant', '@priority:P2'];

// ── Sponsor / Theme ──
export const SPONSOR_SPLASH_HEADER = ['@flow:sponsor-splash-header', '@module:sponsor', '@priority:P2'];
export const THEME_DARK_TOGGLE = ['@flow:theme-dark-toggle', '@module:theme', '@priority:P2'];

// ── Ads ──
export const ADS_BANNER_SERVE_CLICK = ['@flow:ads-banner-serve-click', '@module:ads', '@priority:P1'];
export const ADS_FREQUENCY_CAP = ['@flow:ads-frequency-cap', '@module:ads', '@priority:P2'];

// ── Reviews ──
export const REVIEW_POST_TRADE_CREATE = ['@flow:review-post-trade-create', '@module:reviews', '@priority:P1'];
export const REVIEW_REPLY = ['@flow:review-reply', '@module:reviews', '@priority:P2'];
export const REVIEW_PROFILE_SUMMARY = ['@flow:review-profile-summary', '@module:reviews', '@priority:P2'];
export const REVIEW_DRAWER = ['@flow:review-drawer', '@module:reviews', '@priority:P2'];
export const REVIEW_MODERATION = ['@flow:review-moderation', '@module:reviews', '@priority:P2'];

// ── Stats ──
export const STATS_DASHBOARD_TILES = ['@flow:stats-dashboard-tiles', '@module:stats', '@priority:P1'];
export const STATS_CITY_RANKING = ['@flow:stats-city-ranking', '@module:stats', '@priority:P2'];

// ── Push ──
export const PUSH_SUBSCRIBE = ['@flow:push-subscribe', '@module:push', '@priority:P2'];
export const PUSH_MATCH_MUTUAL_DELIVERY = ['@flow:push-match-mutual-delivery', '@module:push', '@priority:P2'];

// ── Admin ──
export const ADMIN_LANDING_GATED = ['@flow:admin-landing-gated', '@module:admin', '@priority:P1'];
export const ADMIN_USERS_ROLES = ['@flow:admin-users-roles', '@module:admin', '@priority:P1'];
export const ADMIN_MODERATION_QUEUE = ['@flow:admin-moderation-queue', '@module:admin', '@priority:P2'];
export const ADMIN_ANALYTICS_OVERVIEW = ['@flow:admin-analytics-overview', '@module:admin', '@priority:P1'];

// ── Manual ──
export const MANUAL_SEARCH_BROWSE = ['@flow:manual-search-browse', '@module:manual', '@priority:P2'];

// ── Legal / Help ──
export const LEGAL_TERMS = ['@flow:legal-terms', '@module:legal', '@priority:P2'];
export const LEGAL_PRIVACY = ['@flow:legal-privacy', '@module:legal', '@priority:P2'];
export const HELP_FAQ = ['@flow:help-faq', '@module:help', '@priority:P2'];

// ── Profile ──
export const PROFILE_VIEW = ['@flow:profile-view', '@module:profile', '@priority:P2'];

// ── Notifications ──
export const NOTIFICATIONS_CENTER = ['@flow:notifications-center', '@module:notifications', '@priority:P2'];

// ── Moderation ──
export const REPORT_USER_OR_TRADE = ['@flow:report-user-or-trade', '@module:moderation', '@priority:P2'];

// ── Presence ──
export const PRESENCE_LIVE_BADGE = ['@flow:presence-live-badge', '@module:presence', '@priority:P3'];

// ── Collectors ──
export const COLLECTORS_MAP = ['@flow:collectors-map', '@module:collectors', '@priority:P3'];

// ── Geo ──
export const GEO_IP_LOCATE = ['@flow:geo-ip-locate', '@module:geo', '@priority:P3'];
