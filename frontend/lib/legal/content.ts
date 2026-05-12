/**
 * Páginas legales — Términos y Condiciones y Política de Privacidad.
 *
 * ⚠️ TEXTO PROVISIONAL. Las secciones de abajo tienen la ESTRUCTURA y
 * los puntos que la propuesta exige cubrir, pero el texto es un borrador
 * de trabajo. La versión definitiva debe ser revisada/redactada por el
 * equipo legal del cliente (ProjectApp) — sobre todo lo relativo a la
 * Ley 1581 de 2012 (protección de datos en Colombia), edad mínima y los
 * términos comerciales. NO usar como texto legal autoritativo.
 */
export type LegalSection = {
  heading: string;
  body: string[];
};

export const LEGAL_DRAFT_NOTICE =
  'Borrador de trabajo — pendiente de revisión legal del cliente. Este texto describe la estructura y el alcance de los términos, no constituye asesoría legal ni la versión definitiva.';

export const LEGAL_LAST_UPDATED = '2026-05-12';

// PENDIENTE: revisar/redactar con asesoría legal antes del lanzamiento.
export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: '1. Qué es Albunmanía',
    body: [
      'Albunmanía es una plataforma comunitaria (web instalable / PWA) para que coleccionistas marquen su inventario de cromos del álbum del Mundial 26 e intercambien entre sí, ya sea por proximidad geográfica (swipe) o de forma presencial (escaneo de QR).',
      'Albunmanía NO está afiliada oficialmente con la FIFA, con Panini ni con ninguna entidad organizadora del Mundial. Las marcas y nombres de productos mencionados pertenecen a sus respectivos titulares.',
    ],
  },
  {
    heading: '2. Cuenta y elegibilidad',
    body: [
      'El registro se realiza con una cuenta de Google verificada con más de 30 días de antigüedad, más un captcha anti-bots. Esta restricción busca reducir perfiles falsos y multicuentas.',
      'Edad mínima: para crear una cuenta debes tener la edad mínima requerida por la ley colombiana para consentir el tratamiento de tus datos personales. PENDIENTE: el cliente debe fijar la edad exacta (p. ej. 14 años con autorización de representante, o 18) y los términos para menores.',
      'Eres responsable de la actividad de tu cuenta y de mantener tus credenciales seguras.',
    ],
  },
  {
    heading: '3. Cómo funcionan los intercambios',
    body: [
      'Albunmanía facilita el descubrimiento de coleccionistas con los que un intercambio tiene sentido y, tras un match mutuo, permite compartir el WhatsApp de cada parte SÓLO si ambos lo aceptan para ese intercambio en concreto.',
      'Albunmanía NO participa en los intercambios físicos de cromos, no los garantiza, no custodia bienes y no media en disputas más allá de la moderación de reportes y reseñas. Los intercambios se realizan bajo la responsabilidad de los coleccionistas involucrados. Recomendamos hacerlos en lugares públicos.',
      'El sistema de reseñas (estrellas, tags y comentarios) y de reportes (no-show, acoso, perfil falso, contenido inapropiado) existe para dar contexto de confianza a la comunidad; las reseñas son editables durante 24 horas y luego quedan fijas.',
    ],
  },
  {
    heading: '4. Conducta del usuario',
    body: [
      'No está permitido: suplantar a otra persona, acosar o amenazar a otros usuarios, publicar contenido ilegal/ofensivo, manipular el inventario o las reseñas de forma fraudulenta, hacer scraping o uso automatizado no autorizado, ni usar la plataforma para fines distintos al intercambio de cromos.',
      'Albunmanía puede ocultar reseñas, suspender o desactivar cuentas que incumplan estas reglas, a través del proceso de moderación.',
    ],
  },
  {
    heading: '5. Modelo de monetización y publicidad',
    body: [
      'Para los coleccionistas el uso de Albunmanía es gratuito. La plataforma se sostiene con: (a) un patrocinador principal (Presenting Sponsor) cuya marca aparece en el splash y en una banda discreta del encabezado; (b) el listado geolocalizado de comerciantes (papelerías, kioscos y distribuidores) mediante una suscripción mensual; y (c) banners publicitarios con cobro por cada 1.000 impresiones, con segmentación geográfica y frecuencia controlada (máximo uno cada cinco swipes en el feed).',
      'Los espacios publicitarios y el listado de comerciantes no implican respaldo de Albunmanía a los anunciantes ni a los comerciantes.',
    ],
  },
  {
    heading: '6. Propiedad intelectual',
    body: [
      'El software, el diseño y la marca "Albunmanía" pertenecen a ProjectApp / a quien corresponda. Los contenidos que subas (avatar, datos de tu negocio si eres comerciante) son tuyos; al subirlos otorgas a Albunmanía una licencia limitada para mostrarlos dentro de la plataforma con el fin de prestar el servicio.',
    ],
  },
  {
    heading: '7. Limitación de responsabilidad',
    body: [
      'Albunmanía se ofrece "tal cual". En la medida que la ley lo permita, no nos hacemos responsables de: el resultado de los intercambios entre usuarios, la veracidad del inventario declarado por terceros, la conducta de otros usuarios, ni de interrupciones del servicio. PENDIENTE: el cliente y su asesoría legal deben definir el alcance preciso de esta cláusula conforme a la ley colombiana.',
    ],
  },
  {
    heading: '8. Cambios y terminación',
    body: [
      'Podemos actualizar estos términos; los cambios relevantes se comunicarán dentro de la plataforma. El uso continuado tras un cambio implica su aceptación.',
      'Puedes dejar de usar Albunmanía y solicitar la eliminación de tu cuenta en cualquier momento. Albunmanía puede dar de baja cuentas que incumplan estos términos.',
    ],
  },
  {
    heading: '9. Ley aplicable y contacto',
    body: [
      'Estos términos se rigen por las leyes de la República de Colombia. PENDIENTE: jurisdicción y mecanismo de resolución de disputas a definir por el cliente.',
      'Contacto: PENDIENTE — el cliente debe indicar el correo/canal oficial de atención.',
    ],
  },
];

// PENDIENTE: revisar/redactar con asesoría legal — alineación con la Ley 1581/2012 y el Decreto 1377/2013.
export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: '1. Responsable del tratamiento',
    body: [
      'El responsable del tratamiento de tus datos personales es ProjectApp / la entidad titular de Albunmanía. PENDIENTE: el cliente debe indicar razón social, NIT, domicilio y correo del responsable.',
      'Esta política se rige por la Ley 1581 de 2012 y normas reglamentarias (protección de datos personales en Colombia).',
    ],
  },
  {
    heading: '2. Qué datos recogemos',
    body: [
      'De tu cuenta de Google: email, nombre y avatar (foto de perfil). No enviamos datos tuyos a Google.',
      'Datos de perfil que tú indicas: ciudad, número de WhatsApp (opcional), preferencias de notificación.',
      'Ubicación aproximada: derivada de la API de geolocalización del navegador, sólo si la autorizas. Guardamos una ubicación aproximada (no exacta) para sugerirte intercambios cercanos; nunca compartimos tu ubicación exacta con otros usuarios.',
      'Actividad en la plataforma: tu inventario de cromos, matches, intercambios, reseñas, reportes y notificaciones.',
      'Datos técnicos: identificadores de sesión, datos básicos del dispositivo/navegador y, si activas las notificaciones, una suscripción push del navegador (endpoint y claves).',
    ],
  },
  {
    heading: '3. Para qué los usamos',
    body: [
      'Prestar el servicio: autenticarte, mostrar tu inventario, calcular matches por proximidad, habilitar el intercambio y las reseñas.',
      'Comunicaciones: notificaciones push (si las activas) y notificaciones in-app sobre matches y actividad.',
      'Compartición de WhatsApp: tu número sólo se comparte con la contraparte de un intercambio cuando AMBAS partes lo aceptan para ese intercambio en concreto. No es un consentimiento global y es reversible.',
      'Métricas agregadas y publicidad: estadísticas de la comunidad y de exposición publicitaria, en forma agregada/anonimizada; los anuncios usan segmentación geográfica, no perfiles individuales detallados.',
      'Seguridad y moderación: prevenir fraude, multicuentas y abuso; gestionar reportes.',
    ],
  },
  {
    heading: '4. Con quién los compartimos',
    body: [
      'Con otros usuarios: tu nombre, ciudad, avatar y reputación pública (promedio de reseñas, conteo); y tu inventario en la medida en que lo compartas (QR/links). Tu email no se muestra a otros usuarios. Tu WhatsApp sólo en intercambios con doble opt-in.',
      'Con proveedores de servicio necesarios para operar (p. ej. proveedor de captcha hCaptcha — recibe un token de validación, sin datos personales; servicios de mapas OpenStreetMap — sin datos sensibles; servicios de entrega de push del navegador). No vendemos tus datos.',
      'Con comerciantes/anunciantes: sólo datos agregados (impresiones, alcance geográfico), nunca tu identidad individual.',
      'Con autoridades, cuando la ley lo exija.',
    ],
  },
  {
    heading: '5. Conservación',
    body: [
      'Conservamos tus datos mientras tengas cuenta activa y por el tiempo adicional necesario para cumplir obligaciones legales, resolver disputas o atender reportes. Las reseñas ocultas por moderación se conservan para trazabilidad pero no se muestran al público. PENDIENTE: el cliente debe fijar los plazos concretos de retención.',
    ],
  },
  {
    heading: '6. Tus derechos',
    body: [
      'Como titular de los datos tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, y a revocar el consentimiento, conforme a la Ley 1581/2012.',
      'Puedes editar buena parte de tus datos desde tu perfil/configuración de cuenta, y solicitar la eliminación de tu cuenta. PENDIENTE: el cliente debe indicar el canal formal para ejercer estos derechos (correo del responsable / formulario) y los plazos de respuesta.',
    ],
  },
  {
    heading: '7. Seguridad',
    body: [
      'Aplicamos medidas razonables: autenticación con JWT en cookies, cabeceras de seguridad, HTTPS, validación de entrada, y control de acceso por rol. Ningún sistema es 100% infalible; te recomendamos cuidar tus credenciales.',
    ],
  },
  {
    heading: '8. Menores y cambios',
    body: [
      'Albunmanía no está dirigida a personas por debajo de la edad mínima definida en los Términos y Condiciones. PENDIENTE: condiciones para menores a definir por el cliente.',
      'Podemos actualizar esta política; los cambios relevantes se comunicarán dentro de la plataforma.',
    ],
  },
];
