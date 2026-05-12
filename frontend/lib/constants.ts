export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  MANUAL: '/manual',
  TERMS: '/terminos',
  PRIVACY: '/privacidad',
  HELP: '/ayuda',
  PROFILE: '/profile',
  PROFILE_ME: '/profile/me',
  NOTIFICATIONS: '/notificaciones',
  COLLECTORS_MAP: '/mapa',
} as const;

export const API_ENDPOINTS = {
  GOOGLE_LOGIN: '/google_login/',
  VALIDATE_TOKEN: '/validate_token/',
} as const;

export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
} as const;
