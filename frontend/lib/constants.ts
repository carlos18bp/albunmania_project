export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  BACKOFFICE: '/backoffice',
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
  SIGN_IN: '/auth/sign-in/',
  SIGN_UP: '/auth/sign-up/',
  GOOGLE_LOGIN: '/auth/google-login/',
  SEND_PASSCODE: '/auth/send-passcode/',
  RESET_PASSWORD: '/auth/verify-passcode-and-reset-password/',
  UPDATE_PASSWORD: '/auth/update-password/',
  VALIDATE_TOKEN: '/auth/validate-token/',
  USERS: '/users/',
} as const;

export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
} as const;
