import {
  BarChart3,
  BookOpen,
  Coins,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  Star,
  Store,
  Users,
} from 'lucide-react';

import type { ManualSection } from './types';

/**
 * Manual interactivo de Albunmanía (Epic 14).
 *
 * Contenido organizado por sección. Cada sección agrupa los procesos paso
 * a paso visibles en /manual con búsqueda client-side. La autoridad sobre
 * el rol que ejecuta cada proceso queda explícita en `keywords` para que
 * el buscador encuentre por rol además de por verbo.
 */
export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'getting-started',
    title: { es: 'Primeros pasos', en: 'Getting started' },
    icon: BookOpen,
    processes: [
      {
        id: 'home-page',
        title: { es: 'Conoce la página de inicio', en: 'Tour the home page' },
        summary: {
          es: 'Descubre qué encontrarás al abrir Albunmanía por primera vez.',
          en: 'Find out what you will see when you first open Albunmanía.',
        },
        why: {
          es: 'La página de inicio te orienta hacia el registro y el manual.',
          en: 'The home page guides you to sign-up and the manual.',
        },
        steps: {
          es: [
            'Abre la URL raíz del sitio en tu navegador.',
            'Lee el resumen de Albunmanía y la propuesta de valor.',
            'Toca "Registrarme con Google" para iniciar tu cuenta verificada.',
            'O toca "¿Cómo funciona?" para abrir este manual.',
          ],
          en: [
            'Open the site root URL in your browser.',
            'Read the Albunmanía summary and value proposition.',
            'Tap "Sign up with Google" to start a verified account.',
            'Or tap "How does it work?" to open this manual.',
          ],
        },
        route: '/',
        tips: {
          es: [
            'Si la página no carga, revisa tu conexión a internet.',
            'El registro requiere una cuenta de Google con más de 30 días de antigüedad.',
          ],
          en: [
            'If the page does not load, check your internet connection.',
            'Sign-up requires a Google account at least 30 days old.',
          ],
        },
        keywords: ['home', 'inicio', 'landing', 'registro'],
      },
      {
        id: 'onboarding',
        title: { es: 'Completa tu onboarding', en: 'Complete onboarding' },
        summary: {
          es: 'Tres pasos: álbum activo, geolocalización y permisos.',
          en: 'Three steps: active album, geolocation and permissions.',
        },
        why: {
          es: 'Sin álbum activo no puedes hacer match ni recibir KPIs.',
          en: 'Without an active album you cannot match or receive KPIs.',
        },
        steps: {
          es: [
            'Tras el primer login serás redirigido a /onboarding.',
            'Selecciona el álbum activo (Mundial 26 por defecto).',
            'Otorga permiso de geolocalización para activar match por proximidad.',
            'Activa opt-ins de notificaciones push y WhatsApp si quieres cierre directo.',
          ],
          en: [
            'After your first login you will land on /onboarding.',
            'Pick your active album (Mundial 26 by default).',
            'Allow geolocation to enable proximity matching.',
            'Toggle push and WhatsApp opt-ins if you want direct closure.',
          ],
        },
        route: '/onboarding',
        keywords: ['onboarding', 'permisos', 'geolocalizacion', 'whatsapp', 'push'],
      },
    ],
  },
  {
    id: 'collector',
    title: { es: 'Coleccionista', en: 'Collector' },
    icon: Star,
    processes: [
      {
        id: 'mark-stickers',
        title: { es: 'Marca tus cromos (0/1/2+)', en: 'Mark your stickers (0/1/2+)' },
        summary: {
          es: 'Toca un cromo para marcarlo y mantén presionado para borrar.',
          en: 'Tap a sticker to mark it; long-press to clear.',
        },
        why: {
          es: 'El backend usa el conteo para encontrar matches complementarios.',
          en: 'The backend uses the count to find complementary matches.',
        },
        steps: {
          es: [
            'Ve a /catalog/<slug-del-album>.',
            'Toca un cromo: 1 ✓ = lo tienes pegado.',
            'Toca de nuevo: 2× = repetido (disponible para intercambiar).',
            'Mantén presionado: vuelve a 0 (faltante).',
          ],
          en: [
            'Open /catalog/<album-slug>.',
            'Tap a sticker: 1 ✓ = you have it pasted.',
            'Tap again: 2× = repeated (available to trade away).',
            'Long-press: back to 0 (missing).',
          ],
        },
        route: '/catalog/mundial-26',
        tips: {
          es: ['Los cambios se sincronizan automáticamente cada 2 segundos.'],
          en: ['Changes sync automatically every 2 seconds.'],
        },
        keywords: ['cromo', 'sticker', 'inventario', 'tap', '0/1/2'],
      },
      {
        id: 'swipe-match',
        title: { es: 'Hace match por swipe', en: 'Find a swipe match' },
        summary: {
          es: 'Desliza candidatos cercanos con cromos compatibles.',
          en: 'Swipe nearby candidates with compatible stickers.',
        },
        why: {
          es: 'Match mutuo crea un Trade y desbloquea WhatsApp.',
          en: 'A mutual match creates a Trade and unlocks WhatsApp.',
        },
        steps: {
          es: [
            'Abre /match.',
            'Pasa o da Like a cada candidato según te interese.',
            'Si la otra persona también te dio Like, verás el modal "¡Match!".',
            'Abre el match para coordinar el intercambio.',
          ],
          en: [
            'Open /match.',
            'Pass or Like each candidate.',
            'If they also Like you back, the "It’s a match!" modal appears.',
            'Open the match to coordinate the trade.',
          ],
        },
        route: '/match',
        keywords: ['match', 'swipe', 'tinder', 'proximidad'],
      },
      {
        id: 'qr-presencial',
        title: { es: 'Match presencial por QR', en: 'In-person QR match' },
        summary: {
          es: 'Cara a cara: muestra tu QR o escanea el del otro.',
          en: 'Face-to-face: show your QR or scan the other person’s.',
        },
        why: {
          es: 'Funciona offline en cambiatones — el cruce se hace en el cliente.',
          en: 'Works offline at meet-ups — the cross runs on the client.',
        },
        steps: {
          es: [
            'Abre /match/qr.',
            'En "Mi QR" muestra el código al otro coleccionista.',
            'En "Escanear" apunta la cámara al QR de la otra persona.',
            'Si hay cromos compatibles, confirma el trade.',
          ],
          en: [
            'Open /match/qr.',
            'On "My QR" show the code to the other collector.',
            'On "Scan" point the camera at the other person’s QR.',
            'If there are compatible stickers, confirm the trade.',
          ],
        },
        route: '/match/qr',
        tips: {
          es: ['El cruce se valida server-side antes de crear el trade.'],
          en: ['The cross is validated server-side before creating the trade.'],
        },
        keywords: ['qr', 'presencial', 'cambiaton', 'offline', 'escaneo'],
      },
      {
        id: 'rate-trade',
        title: { es: 'Califica un trade', en: 'Rate a trade' },
        summary: {
          es: 'Tras un trade confirmado calificas a la contraparte.',
          en: 'After a confirmed trade you rate the other party.',
        },
        why: {
          es: 'Las reseñas alimentan la reputación pública (★ + tags).',
          en: 'Reviews feed public reputation (★ + tags).',
        },
        steps: {
          es: [
            'Abre el detalle del match.',
            'Despliega "Calificar al coleccionista".',
            'Selecciona estrellas, marca tags y escribe un comentario opcional.',
            'Envía. Tienes 24 horas para editar.',
          ],
          en: [
            'Open the match detail.',
            'Expand "Rate the collector".',
            'Pick stars, choose tags and add an optional comment.',
            'Submit. You have 24 hours to edit.',
          ],
        },
        keywords: ['reseña', 'review', 'rating', 'estrellas', 'reputacion'],
      },
    ],
  },
  {
    id: 'merchant',
    title: { es: 'Comerciante', en: 'Merchant' },
    icon: Store,
    processes: [
      {
        id: 'merchant-dashboard',
        title: { es: 'Actualiza tu negocio', en: 'Update your business' },
        summary: {
          es: 'Desde tu dashboard editas dirección, horarios y stock.',
          en: 'From your dashboard you edit address, hours and stock.',
        },
        why: {
          es: 'Los coleccionistas te encuentran en el mapa público con esta info.',
          en: 'Collectors find you on the public map with this info.',
        },
        steps: {
          es: [
            'Abre /merchants/me.',
            'Edita nombre del negocio, tipo, dirección y stock declarado.',
            'Guarda cambios.',
            'Verifica que tu badge de suscripción aparezca como "Activa".',
          ],
          en: [
            'Open /merchants/me.',
            'Edit business name, type, address and declared stock.',
            'Save.',
            'Check that your subscription badge shows "Active".',
          ],
        },
        route: '/merchants/me',
        keywords: ['comerciante', 'merchant', 'papeleria', 'kiosco', 'mapa'],
      },
    ],
  },
  {
    id: 'web-manager',
    title: { es: 'Web Manager', en: 'Web Manager' },
    icon: Megaphone,
    processes: [
      {
        id: 'create-ad-campaign',
        title: { es: 'Crea una campaña CPM', en: 'Create a CPM campaign' },
        summary: {
          es: 'Configura presupuesto, vigencia y geo-targeting.',
          en: 'Set budget, date window and geo targeting.',
        },
        why: {
          es: 'Cada campaña sirve banners en home + feed según peso y geo.',
          en: 'Each campaign serves banners on home + feed by weight and geo.',
        },
        steps: {
          es: [
            'Llama POST /api/ads/admin/campaigns/ con advertiser_name, presupuesto, fechas, ciudades.',
            'Sube creativas con POST /api/ads/admin/campaigns/{id}/creatives/ (vendrá UI completa en V2).',
            'Activa la campaña pasando status=active vía PATCH.',
            'Verifica desde /admin/analytics que las impresiones empiezan a contar.',
          ],
          en: [
            'POST /api/ads/admin/campaigns/ with advertiser_name, budget, dates, cities.',
            'Upload creatives via POST /api/ads/admin/campaigns/{id}/creatives/ (full UI in V2).',
            'Activate by PATCHing status=active.',
            'Check /admin/analytics to confirm impressions start counting.',
          ],
        },
        keywords: ['campana', 'cpm', 'banner', 'anuncio', 'web manager'],
      },
      {
        id: 'register-merchant-payment',
        title: { es: 'Registra un pago de comerciante', en: 'Register a merchant payment' },
        summary: {
          es: 'Anota el pago manual y extiende la suscripción.',
          en: 'Record the manual payment and extend the subscription.',
        },
        why: {
          es: 'V1 acepta nequi/transferencia — la pasarela automática llega en V2.',
          en: 'V1 accepts nequi/transfer — automatic gateway lands in V2.',
        },
        steps: {
          es: [
            'POST /api/merchants/admin/{user_id}/payment/ con amount_cop, period_months, method.',
            'La suscripción se extiende desde max(now, expiry actual).',
            'El listing del merchant queda visible en el mapa.',
          ],
          en: [
            'POST /api/merchants/admin/{user_id}/payment/ with amount_cop, period_months, method.',
            'Subscription extends from max(now, current expiry).',
            'The merchant listing becomes visible on the map.',
          ],
        },
        keywords: ['pago', 'suscripcion', 'merchant', 'comerciante', 'payment'],
      },
    ],
  },
  {
    id: 'admin',
    title: { es: 'Administrador', en: 'Admin' },
    icon: ShieldCheck,
    processes: [
      {
        id: 'moderate-reviews',
        title: { es: 'Modera reseñas reportadas', en: 'Moderate reported reviews' },
        summary: {
          es: 'Revisa la cola y oculta o mantén la reseña.',
          en: 'Review the queue and hide or keep each review.',
        },
        why: {
          es: 'Hidden ≠ deleted — los rows quedan en BD para auditoría.',
          en: 'Hidden ≠ deleted — rows stay in DB for audit.',
        },
        steps: {
          es: [
            'Abre /admin/moderation.',
            'Filtra por "pending" para ver reportes pendientes.',
            'Toca "Ocultar reseña" o "Mantener visible" según el caso.',
            'El toggle is_visible recalcula los agregados de Profile en tiempo real.',
          ],
          en: [
            'Open /admin/moderation.',
            'Filter by "pending" to see pending reports.',
            'Tap "Hide review" or "Keep visible".',
            'The is_visible toggle recomputes Profile aggregates in real time.',
          ],
        },
        route: '/admin/moderation',
        keywords: ['moderacion', 'admin', 'reseña', 'review', 'reporte'],
      },
      {
        id: 'manage-users',
        title: { es: 'Gestiona usuarios y roles', en: 'Manage users and roles' },
        summary: {
          es: 'Asigna roles y bloquea/desbloquea cuentas.',
          en: 'Assign roles and block/unblock accounts.',
        },
        why: {
          es: 'Los 4 roles definen permisos en todo el sistema.',
          en: 'The 4 roles define permissions across the system.',
        },
        steps: {
          es: [
            'Abre /admin/users.',
            'Busca por email o filtra por rol.',
            'Cambia el rol con el selector inline.',
            'Toca "Bloquear" para desactivar la cuenta.',
          ],
          en: [
            'Open /admin/users.',
            'Search by email or filter by role.',
            'Change role with the inline selector.',
            'Tap "Block" to deactivate the account.',
          ],
        },
        route: '/admin/users',
        keywords: ['usuarios', 'roles', 'admin', 'block', 'permisos'],
      },
    ],
  },
  {
    id: 'roles-and-rules',
    title: { es: 'Roles y reglas de negocio', en: 'Roles and business rules' },
    icon: Users,
    processes: [
      {
        id: 'roles-overview',
        title: { es: 'Los 4 roles del sistema', en: 'The 4 roles' },
        summary: {
          es: 'Coleccionista, Comerciante, Web Manager, Admin.',
          en: 'Collector, Merchant, Web Manager, Admin.',
        },
        why: {
          es: 'Cada acción del sistema valida el rol del usuario que la ejecuta.',
          en: 'Each system action validates the user’s role.',
        },
        steps: {
          es: [
            'Coleccionista: usuario final, marca cromos y hace match.',
            'Comerciante: vende sobres, aparece en el mapa público.',
            'Web Manager: crea campañas CPM y registra pagos de comerciantes.',
            'Admin: hereda Web Manager + modera reseñas + gestiona roles.',
          ],
          en: [
            'Collector: end user, marks stickers and matches.',
            'Merchant: sells packs, appears on the public map.',
            'Web Manager: creates CPM campaigns and registers merchant payments.',
            'Admin: inherits Web Manager + moderates reviews + manages roles.',
          ],
        },
        keywords: ['rol', 'permisos', 'coleccionista', 'merchant', 'admin', 'web manager'],
      },
      {
        id: 'rules-of-thumb',
        title: { es: 'Reglas de negocio críticas', en: 'Critical business rules' },
        summary: {
          es: 'Restricciones que no se pueden saltar.',
          en: 'Restrictions that cannot be bypassed.',
        },
        why: {
          es: 'Mantienen la integridad del trust loop y el modelo de monetización.',
          en: 'They keep the trust loop and monetisation model intact.',
        },
        steps: {
          es: [
            'Cuentas de Google con menos de 30 días son rechazadas en el login.',
            'Match canónico: una pareja no puede tener dos rows del mismo canal.',
            'WhatsApp opt-in es por trade (revocable, nunca global).',
            'Suscripción de comerciante caduca → el listing desaparece del mapa.',
            'Reviews tienen 24h de edición; luego inmutables.',
            'Banner CPM máximo 1 cada 5 swipes (frequency cap client-side).',
          ],
          en: [
            'Google accounts under 30 days old are rejected at login.',
            'Canonical match: a pair cannot have two rows of the same channel.',
            'WhatsApp opt-in is per trade (revocable, never global).',
            'Merchant subscription lapses → listing disappears from the map.',
            'Reviews have a 24h edit window; immutable thereafter.',
            'CPM banner max 1 every 5 swipes (frequency cap on client).',
          ],
        },
        keywords: ['reglas', 'reglas de negocio', 'restricciones', 'invariantes'],
      },
    ],
  },
  {
    id: 'monetisation',
    title: { es: 'Motores de monetización', en: 'Monetisation engines' },
    icon: Coins,
    processes: [
      {
        id: 'three-engines',
        title: { es: 'Los tres motores', en: 'The three engines' },
        summary: {
          es: 'Presenting Sponsor, Listing Comerciantes, Banner CPM.',
          en: 'Presenting Sponsor, Merchant Listing, CPM Banner.',
        },
        why: {
          es: 'Cada motor sostiene una vertical de ingresos independiente.',
          en: 'Each engine sustains an independent revenue vertical.',
        },
        steps: {
          es: [
            'Presenting Sponsor: una marca anchor con splash + header band.',
            'Listing Comerciantes: $150-250K COP/mes por papelería visible en el mapa.',
            'Banner CPM: subasta interna con peso y geo, cobra por mil impresiones.',
          ],
          en: [
            'Presenting Sponsor: anchor brand with splash + header band.',
            'Merchant Listing: COP 150-250K/month per stationery visible on map.',
            'CPM Banner: weighted+geo internal auction, billed per 1k impressions.',
          ],
        },
        keywords: ['monetizacion', 'sponsor', 'cpm', 'merchant', 'ingresos'],
      },
    ],
  },
  {
    id: 'analytics',
    title: { es: 'Analítica y KPIs', en: 'Analytics and KPIs' },
    icon: BarChart3,
    processes: [
      {
        id: 'kpis-tour',
        title: { es: 'Recorrido por los KPIs', en: 'KPI tour' },
        summary: {
          es: 'Qué muestra /admin/analytics.',
          en: 'What /admin/analytics shows.',
        },
        why: {
          es: 'Decisiones de producto y comerciales basadas en datos.',
          en: 'Product and commercial decisions based on data.',
        },
        steps: {
          es: [
            'Abre /admin/analytics.',
            'Lee KPIs comunitarios: usuarios activos, nuevos, matches, trades.',
            'Lee KPIs publicitarios: impresiones, clics, CTR, top ciudades.',
            'Descarga CSV con el botón superior derecho.',
          ],
          en: [
            'Open /admin/analytics.',
            'Read community KPIs: active users, new users, matches, trades.',
            'Read ad KPIs: impressions, clicks, CTR, top cities.',
            'Download CSV with the top-right button.',
          ],
        },
        route: '/admin/analytics',
        keywords: ['kpi', 'analitica', 'analytics', 'reporte', 'csv'],
      },
    ],
  },
  {
    id: 'support',
    title: { es: 'Soporte y comunicación', en: 'Support and communication' },
    icon: HeartHandshake,
    processes: [
      {
        id: 'whatsapp-closure',
        title: { es: 'Cierra un trade por WhatsApp', en: 'Close a trade over WhatsApp' },
        summary: {
          es: 'Opt-in mutuo + deep link wa.me con plantilla.',
          en: 'Mutual opt-in + wa.me deep link with template.',
        },
        why: {
          es: 'Mantiene la coordinación fuera de la app, donde la gente ya está.',
          en: 'Keeps coordination off-app, where people already are.',
        },
        steps: {
          es: [
            'Abre el detalle del match.',
            'Activa "Compartir mi WhatsApp para este intercambio".',
            'Espera a que la otra persona también lo active.',
            'Toca "Coordinar por WhatsApp" — abre wa.me con la plantilla pre-llenada.',
          ],
          en: [
            'Open the match detail.',
            'Toggle "Share my WhatsApp for this trade".',
            'Wait for the other person to toggle theirs.',
            'Tap "Coordinate over WhatsApp" — opens wa.me with the prefilled template.',
          ],
        },
        keywords: ['whatsapp', 'wa.me', 'opt-in', 'cierre', 'trade'],
      },
    ],
  },
];
