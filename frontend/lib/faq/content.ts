/**
 * Centro de Ayuda / FAQ — contenido.
 *
 * Lista plana de preguntas frecuentes. `audience` permite filtrar el
 * acordeón por tipo de usuario; 'general' aplica a todos.
 */
export type FaqAudience = 'general' | 'coleccionista' | 'comerciante' | 'anunciante';

export type FaqItem = {
  id: string;
  q: string;
  a: string;
  audience: FaqAudience;
};

export const FAQ_AUDIENCE_LABELS: Record<FaqAudience, string> = {
  general: 'General',
  coleccionista: 'Coleccionista',
  comerciante: 'Comerciante',
  anunciante: 'Anunciante',
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'que-es',
    q: '¿Qué es Albunmanía?',
    a: 'Albunmanía es una comunidad colombiana para intercambiar cromos del álbum del Mundial 26. Marcas qué cromos tienes y cuáles te faltan, y la app te conecta con coleccionistas cercanos con los que el intercambio tiene sentido — por proximidad (swipe) o en persona (escaneo de QR en cambiatones). El cierre del intercambio se coordina por WhatsApp, sólo si ambos aceptan compartir su número para ese trade.',
    audience: 'general',
  },
  {
    id: 'cuesta',
    q: '¿Cuánto cuesta usar Albunmanía?',
    a: 'Para los coleccionistas, Albunmanía es gratis. La plataforma se sostiene con tres motores: un patrocinador principal (Presenting Sponsor), el listado de comerciantes (papelerías, kioscos y distribuidores con suscripción mensual) y banners publicitarios. Los anuncios están diseñados para no romper la experiencia (máximo uno cada cinco swipes en el feed).',
    audience: 'general',
  },
  {
    id: 'registro',
    q: '¿Cómo me registro? ¿Por qué piden una cuenta de Google con más de 30 días?',
    a: 'El registro es con tu cuenta de Google (más un captcha anti-bots). Sólo aceptamos cuentas creadas hace más de 30 días para reducir perfiles falsos y multicuentas — es la primera línea de defensa de la comunidad. Si tu cuenta es muy nueva, podrás explorar el catálogo igual, pero tendrás que esperar a que tenga la antigüedad mínima para iniciar un intercambio.',
    audience: 'coleccionista',
  },
  {
    id: 'invitado',
    q: '¿Puedo ver el catálogo sin registrarme?',
    a: 'Sí. Como invitado puedes navegar el catálogo del álbum, ver el manual y el listado de comerciantes, y abrir los QR/links que alguien comparta. El registro con Google verificado sólo se exige cuando vas a iniciar un intercambio.',
    audience: 'coleccionista',
  },
  {
    id: 'marcar-cromos',
    q: '¿Cómo marco mis cromos?',
    a: 'En el catálogo, tocá una lámina para marcarla como pegada (1), tocá de nuevo para indicar que tienes repetidas (2+), y mantené presionado para volver a "me falta" (0). No hay menús ni selectores: es un solo toque. Tu inventario se sincroniza solo cada par de segundos.',
    audience: 'coleccionista',
  },
  {
    id: 'como-match',
    q: '¿Cómo funciona el match por proximidad (swipe)?',
    a: 'En "Match" ves tarjetas de coleccionistas cercanos con los que el intercambio cuadra (lo que a vos te falta, ellos lo tienen repetido, y viceversa). Deslizás a la derecha para mostrar interés. Si la otra persona también te dio interés, se crea un match mutuo: recibís una notificación y se habilita el intercambio.',
    audience: 'coleccionista',
  },
  {
    id: 'match-qr',
    q: '¿Qué es el "Match QR presencial"?',
    a: 'Para cambiatones físicos (centros comerciales, calles de coleccionistas): una persona muestra su QR personal y la otra lo escanea con la cámara desde la app. En segundos la app cruza las dos listas y muestra todos los intercambios posibles, ordenados por valor. Funciona 100% sin conexión una vez cargado tu inventario.',
    audience: 'coleccionista',
  },
  {
    id: 'compartir-qr',
    q: '¿Qué son los dos QR para compartir?',
    a: 'Generás dos QR/links distintos: uno con tu lista de cromos disponibles para intercambiar y otro con tu lista de faltantes. Los compartís con un toque por WhatsApp, Instagram Stories o cualquier red. Quien abre el link ve tu lista sin necesidad de tener cuenta.',
    audience: 'coleccionista',
  },
  {
    id: 'whatsapp',
    q: '¿Cuándo se comparte mi número de WhatsApp?',
    a: 'Nunca de forma automática. Después de un match mutuo, cada parte decide — por ese intercambio en concreto — si comparte su WhatsApp. Sólo si ambos aceptan se genera un enlace wa.me con un mensaje pre-llenado con los cromos del intercambio. Tu número no se comparte a nivel global; el opt-in es trade por trade y reversible.',
    audience: 'coleccionista',
  },
  {
    id: 'resenas',
    q: '¿Cómo funcionan las reseñas?',
    a: 'Tras un intercambio confirmado, cada parte puede calificar a la otra con estrellas (1–5), tags ("puntual", "cromos en buen estado", "buena comunicación", "no-show"…) y un comentario opcional. Tenés 24 horas para editar tu reseña; luego queda fija. El calificado puede dejar una respuesta pública. El promedio de cada persona aparece como vista previa en las tarjetas de match para que sepas con quién estás tratando.',
    audience: 'coleccionista',
  },
  {
    id: 'no-show',
    q: 'Quedamos en intercambiar y la otra persona no apareció ("no-show"). ¿Qué hago?',
    a: 'Podés dejar una reseña con el tag "no-show" en la vista del intercambio, y reportar el incidente (también puedes reportar el perfil de la persona). Los reportes entran a una cola de moderación que revisa el equipo de Albunmanía. La señalización de no-shows ayuda a que la comunidad sepa con quién es más confiable intercambiar.',
    audience: 'coleccionista',
  },
  {
    id: 'reportar',
    q: '¿Cómo reporto un perfil o un comportamiento inapropiado?',
    a: 'Desde el perfil de la persona o desde la vista del intercambio hay una opción para reportar (no-show, acoso, perfil falso, contenido inapropiado u otro motivo, con una nota). El reporte lo revisa el equipo de moderación de Albunmanía.',
    audience: 'general',
  },
  {
    id: 'notificaciones',
    q: '¿Cómo recibo notificaciones de matches nuevos?',
    a: 'Si activás las notificaciones push (en el dashboard o en el onboarding), te avisamos al instante cuando aparece un match mutuo. Además, todas las notificaciones quedan en tu centro de notificaciones dentro de la app. Podés activar o desactivar el push cuando quieras.',
    audience: 'coleccionista',
  },
  {
    id: 'ediciones-especiales',
    q: '¿Qué son las ediciones especiales?',
    a: 'Las láminas premium (estrellas como Mbappé o Ronaldo, escudos metalizados, la lámina 00, ediciones de patrocinadores) tienen un halo dorado, un valor estimado de mercado y un filtro dedicado en el catálogo. Reflejan el comportamiento real de reventa.',
    audience: 'coleccionista',
  },
  {
    id: 'comerciante-alta',
    q: 'Soy una papelería / kiosco / distribuidor. ¿Cómo aparezco en el mapa "¿dónde comprar sobres cerca?"',
    a: 'El equipo de Albunmanía da de alta a los comerciantes (con una suscripción mensual). Una vez aprobado, tendrás un dashboard propio para mantener tu dirección, horarios y stock declarado, y aparecerás en el mapa filtrable por ciudad — siempre que la suscripción esté al día.',
    audience: 'comerciante',
  },
  {
    id: 'anunciante',
    q: 'Soy una marca y quiero pautar en Albunmanía. ¿Cómo funciona?',
    a: 'Albunmanía ofrece banners (con cobro por cada 1.000 impresiones) con segmentación geográfica y vigencia configurable, y la posición premium de Presenting Sponsor (logo en el splash y en una banda discreta del header). El equipo gestiona las campañas y comparte reportes de impresiones, clics y alcance.',
    audience: 'anunciante',
  },
  {
    id: 'afiliacion',
    q: '¿Albunmanía está afiliado a la FIFA o a Panini?',
    a: 'No. Albunmanía es una plataforma comunitaria independiente para intercambiar cromos. No tiene afiliación oficial con la FIFA ni con Panini ni con ninguna entidad organizadora del Mundial.',
    audience: 'general',
  },
  {
    id: 'datos',
    q: '¿Qué datos míos guarda Albunmanía?',
    a: 'Tu email y nombre de Google, tu avatar, tu ciudad y ubicación aproximada (para sugerirte intercambios cercanos — nunca tu ubicación exacta), tu inventario de cromos, tus matches/intercambios/reseñas, y tus preferencias de notificación. Tu número de WhatsApp sólo se guarda si lo agregas, y sólo se comparte con la contraparte cuando ambos aceptan en un intercambio concreto. Más detalle en la Política de Privacidad.',
    audience: 'general',
  },
];
