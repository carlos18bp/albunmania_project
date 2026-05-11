# Propuesta de Plataforma Mundialista (Fase 1) — Albunmanía
> Cliente: ProjectApp · Estado: accepted · Idioma: es

---

## 🎯 Objetivo

Faltan menos de seis semanas para el inicio del <b>Mundial 26</b>, y la fiebre del álbum ya está movilizando a millones de coleccionistas en Latinoamérica que hoy intercambian sus cromos en <b>grupos caóticos de WhatsApp</b> y publicaciones dispersas en Marketplace. <b>Albunmanía</b> nace para capturar esta energía con una plataforma comunitaria diseñada desde Colombia, donde cada intercambio se siente fluido, seguro y profesional.

Esta propuesta para <b>ProjectApp</b> contempla el diseño y desarrollo de una <b>PWA instalable + web responsive</b> con autenticación Google verificada, sistema de match por proximidad, catálogo del álbum precargado y panel administrativo con roles para gestionar campañas publicitarias. La tesis comercial es clara: <b>tres motores de ingreso</b> que combinan un <b>Presenting Sponsor anchor</b> (alianza estratégica con una marca grande), <b>Listing de Comerciantes</b> (suscripción mensual de papelerías y distribuidores), y <b>Banner Home + Feed CPM</b> (espacios publicitarios escalables) — pensados para escalar también a otros álbumes y coleccionables a lo largo del año.

El álbum del Mundial es un <b>fenómeno cultural masivo</b> en Colombia y Latinoamérica. Para el Mundial 2018, Panini reportó que <b>5 millones de personas</b> usaron su álbum digital, y para el de 2010 vendió <b>10 millones de paquetes solo en EE.UU.</b> (Panini Group, 2024). Plataformas internacionales de intercambio como Stickermanager acumulan más de <b>291.000 usuarios activos diarios</b> intercambiando cromos en tiempo real (Stickermanager.com, 2026).

Sin embargo, en Colombia y la región el intercambio sigue ocurriendo de forma fragmentada en grupos de WhatsApp con cientos de mensajes desordenados, sin geolocalización, sin reputación y sin filtros. <b>Albunmanía aprovecha esta brecha</b> para capturar el mercado local con una experiencia que combina la <b>mecánica viral del swipe</b> con la facilidad del WhatsApp para cerrar el intercambio.

**Oportunidad:** Construir la <b>primera comunidad colombiana</b> de intercambio de cromos antes del kickoff del Mundial 26.

**Incluye:**

- PWA instalable + web responsive multi-idioma con dark mode

- Match dual: por proximidad (swipe) y por QR presencial en cambiatones

- Catálogo del Mundial 26 con ediciones especiales destacadas

- 4 roles: Coleccionista, Comerciante, Web Manager y Admin

- <b>Tres motores de monetización</b>: Presenting Sponsor, Listing Comerciantes y Banner CPM

- Inventario publicitario gestionado desde panel administrativo propio

---

## 🧩 Componentes y funcionalidades

### Vistas

Cada vista es una pantalla o sección de Albunmanía. Su propósito es guiar al coleccionista por toda la experiencia: desde el descubrimiento hasta el match y el intercambio.

- [ ] **Inicio (Landing)** — Hero claro con la propuesta de valor de Albunmanía, llamado a la acción para registrarse y vista previa del catálogo del álbum sin necesidad de login.

- [x] **Login con Google + Captcha** — Autenticación vía Google OAuth con captcha integrado. Solo se permiten cuentas Google verificadas con más de 30 días de antigüedad.

- [x] **Onboarding** — Flujo guiado para configurar el álbum activo, permisos de geolocalización (con explicación clara) y preferencias de notificación.

- [ ] **Dashboard del Coleccionista** — Vista principal del usuario con resumen de cromos pegados, faltantes, repetidos y matches sugeridos por proximidad.

- [ ] **Mis Cromos (los que tengo)** — Módulo donde el usuario marca los cromos que ya pegó y los repetidos disponibles para intercambiar.

- [ ] **Faltantes (los que necesito)** — Lista de cromos que el usuario aún no tiene, con sugerencias automáticas de matches cercanos disponibles.

- [ ] **Buscador General con Filtros** — Catálogo completo del álbum con filtros por equipo, número, jugador, disponibilidad y radio de proximidad. Incluye paginación y vista de tarjetas.

- [ ] **Match (Swipe)** — Vista estilo Tinder donde el usuario ve cromos disponibles cerca y desliza para indicar interés. Cada card de coleccionista muestra un preview compacto de reputación (★ 4.8 (23)) para reducir no-shows. Cuando hay match mutuo, se habilita el intercambio.

- [ ] **Mapa de Coleccionistas** — Vista de mapa con coleccionistas activos cerca del usuario (ubicación aproximada por privacidad), útil para encontrar parches de intercambio.

- [ ] **Perfil del Usuario** — Página personal del coleccionista con estadísticas (% del álbum completo, intercambios realizados), datos de contacto opt-in, configuración de cuenta y una pestaña dedicada de Reseñas: rating promedio (★ 1–5), distribución por estrellas, tags más recibidos, listado paginado con filtro por estrellas y respuesta pública del calificado cuando aplica.

- [ ] **Notificaciones** — Centro de notificaciones con matches nuevos, mensajes y alertas de actividad. Sincronizado con notificaciones push de la PWA.

- [ ] **Términos y Condiciones** — Documento legal que explica el modelo de monetización por anuncios, política de datos, edad mínima y aclaración de NO afiliación oficial con FIFA o Panini.

- [ ] **Política de Privacidad** — Detalle del tratamiento de datos personales conforme a la Ley 1581 de 2012, incluyendo geolocalización, datos de Google y compartición de WhatsApp.

- [ ] **Centro de Ayuda / FAQ** — Preguntas frecuentes sobre cómo intercambiar, cómo funciona la verificación, qué hacer ante un 'no-show' y cómo reportar contenido inapropiado.

- [ ] **Match QR Presencial** — En cambiatones físicos (Unicentro, El Tesoro, calle 19), los coleccionistas escanean el QR del otro y la app cruza listas en segundos para identificar intercambios posibles. Funciona offline.

- [ ] **Mis QRs para Compartir** — Genera dos QRs distintos: uno con tus cromos disponibles para intercambiar y otro con tu lista de faltantes. Compartibles directamente por WhatsApp, Instagram Stories o cualquier red.

- [ ] **Dashboard del Comerciante** — Vista exclusiva para papelerías, kioscos, librerías y distribuidores oficiales del álbum: gestión de stock, listing en mapa de '¿Dónde comprar sobres cerca?', y promoción de cambiatones in-store.

- [ ] **Ranking de Coleccionistas por Ciudad** — Leaderboard local: top coleccionistas en Bogotá, Medellín, Cali, Barranquilla. Gamifica la experiencia y revela influencers naturales para alianzas con marcas.

- [ ] **Detalle de Intercambio (Trade)** — Vista dedicada del intercambio confirmado entre dos coleccionistas. Lista los cromos que aporta cada parte, datos de contacto vía WhatsApp con opt-in y, en una zona lateral no invasiva, un mini-bloque de reseñas por participante (★ promedio + número de reseñas) que abre un drawer al hacer clic. Tras marcar el trade como completado se habilita el CTA 'Calificar al coleccionista'.

### Componentes

Componentes visuales y funcionales reutilizados en toda la plataforma para mantener coherencia y optimizar el desarrollo.

- [ ] **Encabezado (Header)** — Logo de Albunmanía, navegación principal, indicador de notificaciones, avatar del usuario y selector de álbum activo.

- [ ] **Pie de página (Footer)** — Enlaces a términos, privacidad, ayuda, redes sociales y aclaración de NO afiliación con FIFA o Panini.

- [ ] **Tarjeta de Cromo (Sticker Card)** — Componente visual reutilizable que muestra cromo, número, equipo y estado (poseído / faltante / repetido).

- [ ] **Tarjeta de Match (Swipe Card)** — Tarjeta interactiva con animación de swipe, datos del coleccionista y cromos involucrados en el potencial intercambio.

- [ ] **Banner CPM (Home + Feed)** — Espacios publicitarios estándar en home y entre swipes del feed, con cobranza por cada 1.000 impresiones. Diseñados para ser elegantes y no romper la experiencia comunitaria. Frecuencia controlada (máximo 1 cada 5 swipes).

- [ ] **Espacio Presenting Sponsor** — Posición premium reservada para la marca anchor que financia el lanzamiento. Logo en splash al abrir la app, header persistente discreto, y branding sutil en notificaciones oficiales. Solo 1 marca activa a la vez.

- [ ] **Widget de Reseñas** — Componente compacto que muestra el rating promedio, número de reseñas y badges de confianza del usuario. Reutilizable en cabecera de perfil, cards de Match y bloques laterales de la vista de Intercambio.

- [ ] **Preguntas Frecuentes (FAQ)** — Acordeón con respuestas rápidas a dudas comunes de coleccionistas, comerciantes y anunciantes.

- [ ] **Indicador 'En Línea Ahora' (Live Badge)** — Punto verde visible en perfiles, matches y leaderboards que indica si el otro coleccionista está activo en este momento. Genera urgencia y acelera el cierre del intercambio.

- [ ] **Badge de Edición Especial** — Marca visual diferenciada con halo dorado para láminas premium (Mbappé, Cristiano, escudo metalizado de Argentina, lámina 00, ediciones Coca-Cola). Las hace destacar en el catálogo y los matches.

- [ ] **QR Compartible Animado** — Componente que genera el QR personal del usuario (de cromos disponibles o faltantes) con animación elegante, listo para compartir o escanear cara a cara.

- [ ] **Stat Card con Racha y ETA** — Tarjeta visual que muestra racha de días consecutivos, % del álbum completo, y fecha estimada de finalización. Refuerza la retención diaria de los coleccionistas.

- [ ] **Tarjeta de Reseña (Review Card)** — Componente que muestra una reseña individual: avatar y nombre del autor, fecha, estrellas, comentario, tags estructurados (puntual, cromos en buen estado, buena comunicación, no-show, etc.) y, cuando existe, la respuesta pública del calificado.

- [ ] **Formulario de Reseña Post-Trade** — Formulario de calificación que aparece tras un intercambio confirmado: selector de estrellas (1–5), multi-select de tags predefinidos, comentario opcional (≤500 caracteres) y validación de unicidad por (trade, reviewer). Permite editar la reseña dentro de una ventana de 24 horas.

- [ ] **Resumen de Reputación (Rating Summary)** — Bloque visual con promedio destacado, distribución de estrellas en barras 1–5, conteo total y los tags más recibidos por el usuario. Usado como encabezado de la pestaña Reseñas en el perfil.

- [ ] **Drawer de Reseñas** — Side-sheet lateral no invasivo que se abre al hacer clic en el rating de una contraparte (en Match o en Detalle de Intercambio). Lista paginada con filtro por estrellas. Nunca aparece como modal bloqueante ni preabierto.

### Funcionalidades Específicas

Comportamientos interactivos y reglas de negocio que dan vida a Albunmanía y la diferencian de soluciones genéricas.

- [ ] **PWA Instalable + Web Responsive** — La plataforma funciona como aplicación instalable en el celular del usuario y como sitio web responsive en cualquier dispositivo. Soporta modo offline parcial y notificaciones push.

- [ ] **Autenticación Google + Captcha + Cuenta Verificada** — Login exclusivo con Google OAuth, captcha anti-bots y validación de cuenta con más de 30 días de antigüedad para reducir falsos perfiles.

- [ ] **Geolocalización Dual (IP + Browser API)** — Detección automática por IP para ubicación aproximada, complementada con la API del navegador (con permisos explicados al usuario) para mayor precisión.

- [ ] **Motor de Match por Proximidad** — Algoritmo que cruza cromos disponibles vs. faltantes y prioriza matches dentro de un radio configurable. Soporta swipe, filtros y orden por relevancia.

- [ ] **Integración WhatsApp con Opt-in** — Al confirmarse un match, cada usuario decide si comparte su WhatsApp. Si ambos aceptan, se genera enlace pre-llenado con plantilla de intercambio.

- [ ] **Sistema de Roles y Permisos** — Cuatro roles diferenciados: Coleccionista (usuario final), Comerciante (papelerías, kioscos y distribuidores oficiales con dashboard propio), Web Manager (equipo de ProjectApp para subir anuncios y gestionar marcas), Administrador (gestión global de plataforma y álbumes).

- [ ] **Arquitectura Multi-Álbum** — Diseño preparado para gestionar múltiples álbumes simultáneamente: Mundial 26, Champions, Copa América, Pokémon, etc. Cada álbum con su propio catálogo y comunidad.

- [ ] **Sistema de Reseñas y Reputación** — Tras un intercambio confirmado, ambos usuarios pueden calificarse con estrellas (1–5), tags estructurados y un comentario opcional. Cada reseña es única por par (trade, reviewer) y editable durante 24 horas. El calificado puede dejar una respuesta pública. Los agregados (promedio, número total y porcentaje de reseñas positivas) se persisten cacheados en el perfil para preview rápido en cards de Match y en la vista de Intercambio. Incluye moderación con toggle de visibilidad y señalización anti no-show, reduciendo el riesgo percibido al intercambiar con alguien nuevo.

- [ ] **Reportes y Moderación** — Los usuarios pueden reportar perfiles, contenido inapropiado o intercambios fallidos. Cola de moderación accesible al rol Administrador.

- [ ] **Contador Rápido 0/1/2+ por Toque** — UX inspirada en las mejores apps de la categoría: tocá una lámina para marcarla como tenida (1), tocá de nuevo para indicar repetida (2+), mantén presionado para borrar. Velocidad sin selectores ni menús.

- [ ] **Estadísticas Avanzadas** — Racha de días consecutivos coleccionando, % de avance por selección, láminas añadidas en últimos 7 días, fecha estimada de finalización del álbum (ETA), y comparativa con coleccionistas de tu ciudad.

- [ ] **Match QR Presencial (Escaneo Cara a Cara)** — Complementa el match digital: en cambiatones presenciales un coleccionista muestra su QR y el otro escanea. La app cruza listas en segundos identificando todos los intercambios posibles. Funciona 100% offline.

- [ ] **Compartir Listas por QR + WhatsApp / Instagram** — Genera dos QRs distintos: cromos disponibles y cromos buscados. Cada uno se comparte con un toque por WhatsApp, Instagram Stories o cualquier red. Cada compartición es marketing orgánico para Albunmanía.

- [ ] **Onboarding como Invitado** — Los visitantes pueden explorar el catálogo del álbum, marcar progreso temporal y ver matches sugeridos sin registrarse. El login Google verificado se exige solo al iniciar un intercambio. Mejora la conversión visitante → usuario activo.

- [ ] **Búsqueda Predictiva con Autocompletado** — Mientras el usuario escribe, el buscador sugiere láminas, jugadores, equipos y coleccionistas con previsualización visual. UX inspirada en CambioCromos pero adaptada al contexto colombiano.

- [ ] **Indicador en Vivo de Usuarios Activos** — Muestra cuántos coleccionistas están activos ahora en tu ciudad y en el catálogo. En perfiles individuales, el badge verde de 'en línea' acelera matches. Crea sensación de comunidad viva.

- [ ] **Ediciones Especiales Destacadas** — Las láminas premium (Mbappé, Ronaldo, escudo metalizado de Argentina, Lámina 00, edición Coca-Cola) tienen UI diferenciada con halo dorado, valor estimado de mercado y filtro dedicado. Reflejan el comportamiento real de reventa colombiana.

### Módulo Administrativo

Panel administrativo para que el equipo de ProjectApp gestione contenido, los 3 motores de monetización (Presenting Sponsor, Comerciantes, Banners CPM), usuarios y moderación sin depender de desarrollo técnico.

- [ ] **Gestor de Álbumes** — Crear, editar y archivar álbumes (Mundial 26, futuras colecciones). Carga masiva del catálogo de cromos por álbum.

- [ ] **Gestor de Presenting Sponsor** — Configuración de la marca anchor: logo en splash y header, colores, mensajes en comunicaciones oficiales, branding en eventos. Vigencia configurable y métricas de exposición para reportar al sponsor.

- [ ] **Gestor de Comerciantes** — Panel para invitar, aprobar y gestionar papelerías, kioscos y distribuidores oficiales. Asignación del rol Comerciante, validación de credenciales, monitoreo de actividad y publicación del listing geolocalizado en el mapa. Control de suscripciones y pagos mensuales.

- [ ] **Gestor de Banners CPM** — Subida manual de creatividades publicitarias por parte del Web Manager: imagen, texto, enlace, segmentación geográfica, vigencia y presupuesto de impresiones contratadas. Control de rotación entre marcas activas.

- [ ] **Gestor de Usuarios y Roles** — Administración de cuentas, asignación de roles (Coleccionista, Comerciante, Web Manager, Administrador) y bloqueo/desbloqueo manual.

- [ ] **Cola de Moderación** — Gestión de reportes de usuarios, intercambios fallidos y contenido inapropiado, con acciones rápidas (advertir, suspender, banear).

- [ ] **Reportes para Sponsor y Anunciantes** — Generación de reportes descargables (PDF/CSV) con impresiones, clics, alcance geográfico y métricas de exposición del Presenting Sponsor. Vital para renovar contratos y vender nuevas marcas.

- [ ] **Moderación de Reseñas** — Cola de reseñas reportadas accesible al rol Administrador. Permite ocultar reseñas sin borrarlas mediante el toggle is_visible, registrar la razón moderada y dejar trazabilidad en el log de auditoría. Las reseñas ocultas siguen contabilizadas para integridad histórica pero no afectan agregados públicos.

### Módulo de Analítica

Dashboard de métricas comunitarias y publicitarias en tiempo real para entender el comportamiento de Albunmanía y tomar decisiones basadas en datos.

- [x] **Cromos Más Buscados y Más Ofertados** — Identifica cuáles son los cromos con mayor demanda y oferta. Útil para medir 'rareza' percibida y planear campañas.

- [x] **Visitantes Nuevos vs. Recurrentes** — Mide la fidelización de la comunidad y evalúa el impacto de notificaciones push sobre el retorno a la plataforma.

- [x] **Dispositivos de la Audiencia** — Cuántos usuarios entran desde móvil, tablet o escritorio. Importante para priorizar la experiencia de la PWA.

- [x] **Mapa de Calor de Actividad** — Visualiza dónde se concentran los coleccionistas activos. Insumo clave para vender publicidad a marcas con presencia local.

- [ ] **Fuentes de Tráfico** — De dónde llegan los usuarios: orgánico, redes sociales, enlaces directos o campañas. Permite invertir mejor en marketing.

- [x] **Tendencia de Matches e Intercambios** — Evolución de matches generados e intercambios completados en el tiempo. Indicador clave de salud de la comunidad.

### Dashboard de KPIs y Métricas

Panel de control complementario al módulo de analítica, con indicadores clave para monitorear la salud de la comunidad y la rentabilidad publicitaria de Albunmanía.

- [x] **KPIs Comunitarios en Tiempo Real** — Usuarios activos, matches generados, intercambios completados, % de álbumes completos, retención por cohorte.

- [x] **KPIs Publicitarios** — Impresiones, CTR, alcance geográfico y rendimiento por campaña. Métricas vendibles a anunciantes.

- [ ] **Alertas de Rendimiento** — Notificaciones automáticas cuando una campaña cae bajo umbral o un KPI comunitario muestra anomalía.

- [x] **Exportación de Reportes** — Descarga de reportes en CSV/PDF para compartir con anunciantes, inversionistas o el equipo de ProjectApp.

### Manual de Usuario Interactivo

Wiki interactivo no técnico, con índice navegable y buscador, que describe los procesos, flujos, roles y reglas de Albunmanía. Pensado para que cualquier persona del equipo de ProjectApp entienda el sistema sin pedir ayuda al desarrollador.

- [x] **Buscador y Navegación por Índice** — Encuentra cualquier proceso, vista o rol de Albunmanía en segundos.

- [x] **Procesos y Flujos Paso a Paso** — Cómo subir un anuncio, cómo agregar un álbum nuevo, cómo gestionar reportes — documentado sin tecnicismos.

- [x] **Roles y Responsabilidades** — Qué hace el Coleccionista, el Web Manager y el Administrador, y qué permisos tiene cada uno.

- [x] **Dependencias y Reglas de Negocio** — Cómo se relacionan los álbumes con cromos, anuncios con segmentación geográfica, y reputación con intercambios.

---

## ➕ Módulos adicionales

### Integración y Automatización con IA

Potencia Albunmanía con inteligencia artificial: matching inteligente que aprende de los patrones de intercambio, moderación automática de contenido y asistente conversacional para usuarios y anunciantes.

- [ ] **Automatizaciones** — Flujos de trabajo inteligentes que ejecutan tareas repetitivas de forma autónoma, liberando tiempo para lo que realmente importa.

- [ ] **Análisis de datos con lenguaje natural** — Consulta tus datos usando preguntas en español o inglés y obtén respuestas claras, gráficos y reportes sin necesidad de conocimientos técnicos.

- [ ] **Generación de contenido** — Creación asistida de textos, descripciones de productos, artículos de blog y comunicaciones, manteniendo el tono y estilo de tu marca.

- [ ] **Comunicación inteligente** — Chatbots y asistentes virtuales que atienden a tus clientes 24/7, responden preguntas frecuentes y escalan conversaciones cuando es necesario.

- [ ] **Procesamiento de documentos** — Extracción y clasificación automática de información desde facturas, contratos y formularios, reduciendo el trabajo manual y los errores.

- [ ] **Búsqueda e investigación** — Motor de búsqueda semántico que entiende la intención del usuario y devuelve resultados relevantes, no solo coincidencias de texto.

- [ ] **Seguridad y moderación** — Detección automática de contenido inapropiado, spam y actividad sospechosa para mantener tu plataforma segura y confiable.

- [ ] **Optimización de procesos** — Análisis inteligente de tus operaciones para identificar cuellos de botella, sugerir mejoras y automatizar decisiones rutinarias.

- [ ] **Aprendizaje y capacitación** — Sistemas adaptativos que personalizan la experiencia de aprendizaje según el ritmo y nivel de cada usuario.

- [ ] **Predicción y forecasting** — Modelos predictivos que anticipan tendencias, demanda y comportamiento de clientes para tomar decisiones más informadas.

- [ ] **Integración y orquestación** — Conexión inteligente entre tus herramientas y servicios existentes, coordinando flujos de datos y acciones entre múltiples plataformas.

### Conversiones Inteligentes (Meta & Google Ads) (Integración API)

Maximiza el retorno de campañas pagas para captar más coleccionistas y anunciantes. Tracking server-side que reporta cada acción valiosa directamente a Meta y Google sin depender de cookies.

- [ ] **Conexión directa con Meta Conversions API** — Cada conversión se envía desde tu servidor directamente a Meta, permitiendo que Facebook e Instagram identifiquen qué anuncios generaron resultados reales, incluso con bloqueadores de anuncios.

- [ ] **Conexión directa con Google Enhanced Conversions** — Las conversiones se reportan desde el servidor con datos encriptados del cliente. Google asocia cada conversión con el clic original del anuncio y optimiza las pujas automáticas con información real.

- [ ] **Inmune a bloqueadores y restricciones de cookies** — A diferencia del tracking tradicional, este módulo funciona desde tu servidor. No lo afectan los bloqueadores de anuncios, las restricciones de iOS 14+ ni la eliminación de cookies de terceros.

- [ ] **Deduplicación automática de eventos** — El sistema mantiene el tracking del navegador como respaldo y sincroniza ambas fuentes con un identificador único. Meta y Google eliminan duplicados automáticamente.

- [ ] **Eventos de conversión personalizados** — Se configuran los eventos que importan para tu negocio: formulario enviado, clic en WhatsApp, llamada agendada, propuesta vista, propuesta aceptada. Cada uno con su valor monetario para calcular ROAS real.

- [ ] **Panel de estado de conversiones** — Visualiza desde tu panel administrativo el estado de cada evento enviado: confirmado, pendiente o fallido. Incluye diagnóstico de calidad de matching.

### Gift Cards y Vouchers Digitales

Creación, venta y canje de tarjetas de regalo digitales con saldo configurable, diseño de marca y código único verificable en checkout. Genera ingresos anticipados y captura nuevos clientes a través de los compradores existentes.

- [ ] **Creación y venta de gift cards** — Los clientes pueden comprar tarjetas de regalo digitales con saldo configurable directamente desde tu sitio web, con proceso de pago integrado.

- [ ] **Canje en checkout con código único** — Cada gift card genera un código único verificable que el destinatario puede aplicar durante el proceso de compra como método de pago parcial o total.

- [ ] **Historial de saldo y movimientos** — Tanto el comprador como el destinatario pueden consultar el saldo disponible, movimientos realizados y fecha de vencimiento de cada tarjeta.

- [ ] **Diseño de marca personalizado** — Las gift cards se generan con la identidad visual de tu marca, incluyendo logo, colores y mensaje personalizable del comprador para el destinatario.

- [ ] **Vencimiento configurable** — Define políticas de vencimiento por tipo de tarjeta: sin vencimiento, 6 meses, 1 año, o personalizado. Incluye notificaciones automáticas antes de la expiración.

---

## 🎁 Incluidos sin costo extra
- [ ] **Admin Module** — Para que el Web Manager pueda subir anuncios, gestionar roles y administrar álbumes sin depender del equipo de desarrollo.
- [ ] **Analytics Dashboard** — Para entender el comportamiento de la comunidad: qué cromos son más buscados, dónde se concentra la actividad y cómo crece la base de usuarios.
- [ ] **Kpi Dashboard Module** — Para tomar decisiones sobre campañas publicitarias y crecimiento de comunidad con datos en tiempo real.
- [ ] **Manual Module** — Para que cualquier persona del equipo de ProjectApp entienda los flujos de Albunmanía sin sesiones de capacitación.

---

## 💰 Costes adicionales (módulos opcionales)
- [ ] **Aplicación Móvil Instalable (PWA)** (+40%) — Convierte Albunmanía en una aplicación instalable que funciona incluso sin conexión y envía notificaciones push. Experiencia nativa directamente desde el navegador, sin necesidad de tiendas de aplicaciones.
  - [ ] Instalación en Dispositivo — Los coleccionistas pueden instalar Albunmanía como app desde el navegador, con acceso directo desde la pantalla de inicio del celular.
  - [ ] Notificaciones Push de Matches — Alertas instantáneas cuando aparece un match nuevo, un mensaje de WhatsApp confirmado o se publica un cromo buscado cerca.
  - [ ] Funcionamiento Offline Parcial — El catálogo del álbum y la lista de cromos del usuario siguen accesibles sin conexión. Sincronización al reconectarse.
  - [ ] Pantalla de Carga con Identidad de Albunmanía — Splash screen con la marca de Albunmanía al abrir la app, generando experiencia premium desde el primer instante.
  - [ ] Sincronización en Segundo Plano — Datos de cromos, matches y mensajes se sincronizan automáticamente cuando el dispositivo recupera la conexión.
  - [ ] Actualización Automática — La app se actualiza de forma transparente sin que el usuario tenga que hacer nada, siempre con la versión más reciente.
- [ ] **Identidad Visual e Imagen Corporativa** (+35%) — Aplicamos tu identidad visual de forma consistente en cada punto de contacto del sistema — correos, documentos, redes sociales y pantallas internas — para que tu marca se perciba profesional y coherente en todo lugar donde tus clientes interactúan.
  - [ ] Correos transaccionales con identidad corporativa — Plantillas HTML con logo, colores, tipografía y firma de marca aplicadas en todos los correos del sistema — bienvenida, confirmaciones, alertas, recuperación de contraseña y notificaciones — en lugar de correos en texto plano o genéricos.
  - [ ] PDFs y exportables con branding — Facturas, reportes, certificados, recibos y descargas Excel/CSV generados desde el sistema con encabezado con logo, paleta corporativa y pie de marca. Cada documento que sale de la plataforma refuerza la imagen profesional del negocio.
  - [ ] Tarjetas de previsualización en redes (Open Graph) — Cuando alguien comparte un link del sitio o una propuesta en WhatsApp, Facebook, LinkedIn o X, aparece una tarjeta con logo, imagen y colores de marca — no un link plano. Impacto directo en percepción y CTR.
  - [ ] Pantallas del sistema con identidad de marca — Páginas de error (404, 500), mantenimiento, login y estados de carga (loading, skeletons) con identidad visual y mensajes en la voz de la marca, en vez de las pantallas genéricas del framework.
  - [ ] Metadatos estructurados para buscadores e IA — JSON-LD Organization con logo, colores, redes sociales y datos de contacto — para que Google, Bing y asistentes como ChatGPT o Perplexity muestren correctamente la marca en panel de conocimiento, resultados enriquecidos y citaciones.
- [ ] **Facturación Electrónica e Integración DIAN (Integración API)** (+60%) — Conexión con Siigo o Alegra para facturar electrónicamente a los anunciantes que pauten en Albunmanía. Genera comprobantes válidos ante la DIAN directamente desde el panel del Web Manager, con trazabilidad fiscal y automatización del flujo al cerrar campañas.
  - [ ] Facturación electrónica a anunciantes — Generación automática de facturas DIAN-compliant para los restaurantes, inmobiliarias y marcas que pauten en Albunmanía, desde el panel del Web Manager.
  - [ ] Sincronización con Siigo o Alegra — Sincronización bidireccional de clientes (anunciantes), productos (espacios publicitarios) y comprobantes con el sistema contable.
  - [ ] Trazabilidad del estado fiscal — Consulta y seguimiento del estado de cada factura ante la DIAN: emitida, aceptada, rechazada o en proceso.
  - [ ] Notas crédito y débito automatizadas — Generación de notas crédito por cancelaciones de campañas y notas débito por ajustes, todo desde el flujo administrativo.
  - [ ] Automatización al cerrar campañas — Cuando una campaña publicitaria termina, se dispara automáticamente la facturación al anunciante con el detalle de impresiones y alcance.
- [ ] **Pasarela de Pago Internacional (Integración API)** (+20%) — Integración con pasarelas de pago internacionales para facilitar transacciones globales con tarjeta de crédito/débito y cuentas internacionales.
  - [ ] Stripe — Ideal para recibir pagos con tarjeta de crédito/débito, muy usada a nivel mundial. Soporta suscripciones, pagos únicos y múltiples divisas.
  - [ ] PayPal — Plataforma reconocida globalmente, permite pagos con saldo PayPal, tarjeta y cuentas internacionales.
- [ ] **Pasarela de Pago Regional (Colombia) (Integración API)** (+20%) — Integración con pasarelas de pago con presencia en el mercado colombiano para facilitar transacciones locales con múltiples métodos de pago.
  - [ ] PayU — Una de las más usadas en Colombia, permite pagos con tarjeta, PSE, Efecty, Baloto, Nequi, Daviplata.
  - [ ] Wompi (Bancolombia) — Excelente opción local con soporte para PSE, tarjetas, Nequi y botón Bancolombia.
  - [ ] ePayco — Alternativa colombiana fácil de integrar, soporta múltiples métodos de pago como PSE, tarjetas y recaudos físicos.
- [ ] **Integración de Email Marketing** (+10%) — Conecta tu sitio web con plataformas de email marketing para automatizar campañas, segmentar audiencias y aumentar la conversión de visitantes en clientes.
  - [ ] Captura de leads — Formularios optimizados y pop-ups inteligentes para capturar emails de visitantes interesados en tu contenido o productos.
  - [ ] Automatizaciones de email — Secuencias automáticas de bienvenida, carritos abandonados, seguimiento post-compra y re-engagement de usuarios inactivos.
  - [ ] Segmentación de audiencia — Clasifica a tus suscriptores por comportamiento, intereses y datos demográficos para enviar mensajes relevantes y personalizados.
  - [ ] Analítica de campañas — Métricas detalladas de apertura, clics, conversiones y ROI de cada campaña para optimizar tu estrategia de comunicación.
  - [ ] Integración con plataformas — Conexión nativa con Mailchimp, SendGrid, Brevo u otras plataformas líderes de email marketing según tus necesidades.
- [ ] **Reportes y Alertas vía Correo o Telegram** (+20%) — Mantén al equipo de ProjectApp informado con reportes automáticos sobre la salud de Albunmanía y alertas operativas directamente en correo o Telegram.
  - [ ] Reportes automáticos para el Web Manager — Resúmenes diarios y semanales con métricas clave de Albunmanía (usuarios activos, matches, intercambios, ingresos publicitarios) directamente al correo del equipo.
  - [ ] Alertas operativas — Notificaciones cuando una campaña publicitaria está por vencer, cuando se reciben reportes de moderación, o cuando hay anomalías en tráfico.
  - [ ] Programación de envíos — Frecuencia configurable: diaria, semanal, mensual o en tiempo real, según la prioridad del reporte o la alerta.
  - [ ] Resumen ejecutivo periódico — Informe consolidado con KPIs comunitarios y publicitarios para reuniones de equipo y reportes a stakeholders.
- [ ] **Multi-idioma y Localización Regional** (+15%) — Albunmanía servida en español, inglés y portugués para escalar a toda Latinoamérica y comunidad expat. Selector de idioma persistente, detección automática del navegador, y formatos regionales de fecha y moneda según país.
  - [ ] Soporte multi-idioma nativo — Estructura preparada para servir todo el contenido del sitio en dos o más idiomas, con selector de idioma visible y persistencia de preferencia del usuario.
  - [ ] Flujo de traducción integrado — Panel administrativo para gestionar las traducciones de cada sección sin necesidad de intervención técnica, con indicador de contenido pendiente por traducir.
  - [ ] Detección automática de idioma — El sitio detecta el idioma preferido del navegador del visitante y lo redirige automáticamente a la versión correspondiente, mejorando la experiencia desde el primer momento.
- [x] **Motor de Tematización Dinámica (Dark Mode)** (+20%) — Albunmanía con modo claro y oscuro automático según la preferencia del sistema operativo del usuario. Estándar absoluto en apps de coleccionistas (Album Master, Control Álbum) — reduce la fatiga visual durante sesiones largas de match y refuerza la percepción de marca premium.
  - [x] Paleta de colores dual — Diseño de dos sistemas de color completos (claro y oscuro) con variables CSS que se alternan de forma instantánea, manteniendo coherencia visual en ambos modos.
  - [x] Detección automática de preferencia del sistema — El sitio detecta la preferencia de tema del sistema operativo del usuario (prefers-color-scheme) y aplica el modo correspondiente desde la primera visita.
  - [x] Persistencia de elección del usuario — La preferencia manual del usuario se almacena y respeta en futuras visitas, prevaleciendo sobre la configuración del sistema operativo.
  - [ ] Transición fluida entre modos — Animación suave y elegante al alternar entre modo claro y oscuro, sin parpadeos ni saltos visuales que interrumpan la experiencia de navegación.
  - [ ] Adaptación de imágenes y multimedia — Las imágenes, íconos y elementos gráficos se ajustan automáticamente al modo activo, optimizando contraste y legibilidad en cada contexto.
- [ ] **Chat en Vivo First-Party** (+40%) — Sistema de chat en tiempo real completamente alojado en la infraestructura del cliente — sin Intercom, Drift ni LiveChat — donde los agentes atienden desde el mismo panel administrativo. Los datos son 100% propios, sin costos de suscripción crecientes ni riesgo de que la herramienta muestre anuncios de competidores.
  - [ ] Widget de chat embebido — Componente flotante integrado en el sitio web que permite al visitante iniciar una conversación en tiempo real sin salir de la página que está navegando.
  - [ ] Panel de agente en el admin — Los agentes atienden las conversaciones directamente desde el panel administrativo del sitio, sin necesidad de aplicaciones externas ni cuentas adicionales.
  - [ ] Comunicación en tiempo real (WebSocket) — Mensajes instantáneos bidireccionales entre visitante y agente mediante conexión persistente, sin retrasos ni necesidad de recargar la página.
  - [ ] Historial de conversaciones propio — Todas las conversaciones se almacenan en la base de datos del cliente, con búsqueda, filtros por fecha y exportación. Los datos son 100% propiedad del cliente.
  - [ ] Respuestas automáticas configurables — Mensajes de bienvenida, respuestas fuera de horario y FAQ automatizadas que mantienen la atención activa incluso cuando no hay agentes disponibles.
  - [ ] Notificaciones de nuevos chats — Alertas en tiempo real al agente cuando un visitante inicia una conversación o envía un mensaje nuevo, garantizando tiempos de respuesta mínimos.

---

## 🗄️ Modelos de datos
- [ ] **User** — Usuario base del sistema (extiende django.contrib.auth.User). Cada usuario tiene un rol asignado vía grupos Django y un Profile asociado con datos públicos. _(campos clave: id, email (Google), google_account_age_days, role (group), date_joined, is_active, last_login)_
- [ ] **Profile** — Datos públicos y privados del coleccionista: ubicación aproximada (ciudad), avatar, biografía corta, configuración de notificaciones, consentimientos (geolocalización browser, compartir WhatsApp) y agregados cacheados de reputación (promedio, conteo, % positivas) recalculados tras cada Review. _(campos clave: user_id, city, lat_approx, lng_approx, avatar_url, whatsapp_optin, push_optin, browser_geo_optin, rating_avg, rating_count, positive_pct)_
- [ ] **MerchantProfile** — Perfil extendido para usuarios con rol Comerciante: papelería, kiosco, librería o distribuidor. Incluye datos del negocio para listing en mapa. _(campos clave: user_id, business_name, business_type, address, lat, lng, opening_hours, declared_stock, subscription_status, subscription_expires_at)_
- [ ] **Album** — Coleccionable raíz. Funciona como tenant lógico: cada álbum tiene su propio catálogo, inventarios y matches. Permite escalar a Champions, Copa América, Pokémon, etc. _(campos clave: id, name, slug, edition_year, total_stickers, is_active, launch_date, end_date, cover_image)_
- [ ] **Sticker** — Cromo individual dentro de un álbum. Incluye número, nombre del jugador o elemento, equipo, y flags de edición especial. _(campos clave: id, album_id, number, name, team, image_url, is_special_edition, special_tier, market_value_estimate)_
- [ ] **UserSticker** — Inventario por usuario y cromo: cuántas tiene (0 = falta, 1 = pegada, 2+ = repetidas). Es la entidad más consultada del sistema; índice compuesto crítico. _(campos clave: user_id, sticker_id, count, updated_at)_
- [ ] **Match** — Match potencial entre dos usuarios. Se crea cuando uno hace swipe positivo sobre el inventario del otro. Si hay match mutuo, pasa a estado matched y habilita compartir WhatsApp. _(campos clave: id, user_a_id, user_b_id, status, matched_at, expires_at, channel (digital_swipe | qr_presencial))_
- [ ] **Trade** — Intercambio confirmado tras un match. Lista los stickers que cada parte aporta. Permite calificar al otro usuario al completarse. _(campos clave: id, match_id, stickers_from_a, stickers_from_b, completed_at, status)_
- [ ] **Review** — Reseña post-trade entre coleccionistas. Cada Trade confirmado habilita hasta dos Reviews (una por dirección). Estrellas 1–5, tags estructurados, comentario opcional y respuesta pública del calificado. Editable durante 24 horas tras creación; luego inmutable. La moderación oculta vía is_visible sin borrar el registro. _(campos clave: id, trade_id (FK Trade), reviewer_id (FK User), reviewee_id (FK User), stars (1-5), comment, tags (json), reply, is_visible, created_at, updated_at; unique(trade_id, reviewer_id))_
- [ ] **Sponsor** — Marca actual del Presenting Sponsor. Solo un registro activo a la vez. Define branding aplicado en splash, header, eventos. _(campos clave: id, brand_name, logo_url, primary_color, secondary_color, message_text, active_from, active_until, contract_amount)_
- [ ] **MerchantSubscription** — Suscripción mensual del comerciante al listing. Permite trazar pagos, vencimientos y renovaciones. _(campos clave: id, merchant_id, amount, billing_cycle, paid_at, period_start, period_end, status, invoice_id)_
- [ ] **AdCampaign** — Campaña publicitaria de Banner CPM. Cada campaña tiene presupuesto en impresiones, vigencia y segmentación geográfica. _(campos clave: id, advertiser_name, impressions_purchased, impressions_served, cpm_rate, geo_targeting, start_date, end_date, status)_
- [ ] **AdCreative** — Creatividad subida por el Web Manager para una campaña. Imagen, texto y enlace. _(campos clave: id, campaign_id, image_url, headline, body_text, click_url, weight)_
- [ ] **AdImpression** — Registro de cada impresión servida. Crítico para reportes a anunciantes y sponsor. Particionable por mes para evitar tabla gigante. _(campos clave: id, creative_id, user_id, served_at, slot (home_top | feed_inline | sponsor_splash), city)_
- [ ] **Report** — Reporte de moderación: usuarios, contenido inapropiado, no-shows. Procesados por rol Admin. _(campos clave: id, reporter_id, target_user_id, target_trade_id, reason, status, resolved_by, resolved_at)_
- [ ] **Notification** — Notificación enviada al usuario (push y/o in-app). Trazabilidad de delivery y aperturas. _(campos clave: id, user_id, type, title, body, deep_link, sent_at, opened_at)_

---

## 🏗️ Épicas y requerimientos

### Autenticación y Onboarding

Flujo de ingreso restringido a cuentas Google verificadas con más de 30 días de antigüedad, con captcha anti-bot y onboarding guiado de permisos.

- [x] **Login con Google OAuth** — El usuario inicia sesión con su cuenta de Google. El sistema valida la antigüedad de la cuenta (>30 días) antes de permitir el registro. Cuentas más nuevas reciben mensaje explicativo.

  - Configuración: Google Client ID/Secret en variables de entorno. Scope: profile, email. Claim de fecha de creación validado server-side.

  - Flujo: Usuario toca 'Entrar con Google' → popup OAuth → backend valida token y antigüedad → si OK, crea User + Profile y emite JWT → frontend redirige a onboarding o dashboard.

- [x] **Captcha anti-bot en primer ingreso** — hCaptcha integrado en la pantalla previa al OAuth para reducir bots y multicuentas.

  - Configuración: hCaptcha sitekey en frontend, secret en backend. Validación server-side antes de procesar el callback OAuth.

- [x] **Onboarding de permisos** — Flujo de tres pasos: selección de álbum activo, permiso de geolocalización del navegador (con explicación clara), opt-in de notificaciones push y compartición de WhatsApp en futuros matches.

  - Flujo: Tras login exitoso → paso 1: seleccionar álbum → paso 2: solicitar geo del navegador con explicación → paso 3: pedir permiso de push y configurar opt-in de WhatsApp → guardar Profile → al dashboard.

### Catálogo Multi-Álbum e Inventario

Catálogo del álbum precargado con búsqueda predictiva, ediciones especiales destacadas y registro de inventario por toque rápido (0 / 1 / 2+).

- [x] **Catálogo del álbum con filtros** — Vista del catálogo completo con filtros por equipo, número, jugador, disponibilidad y radio de proximidad. Paginación y vista de tarjetas con badge de edición especial.

  - Configuración: Filtros aplicados via query params. Lazy load de imágenes de cromos. Cacheable en Service Worker para acceso offline.

- [x] **Contador rápido 0/1/2+ por toque** — El usuario marca su inventario tocando cada cromo. Un toque = pegada (1), segundo toque = repetida (2+), pulsación larga = borra. UX inspirada en Album Master, optimizada para velocidad.

  - Configuración: Estado local optimista en cliente con sincronización debounced al backend cada 2 segundos. Conflictos last-write-wins.

- [x] **Ediciones especiales destacadas** — Láminas premium (Mbappé, escudo metalizado, lámina 00, edición Coca-Cola) con halo dorado, valor estimado de mercado y filtro dedicado.

  - Configuración: Campos is_special_edition, special_tier y market_value_estimate en Sticker. UI diferencia visualmente con animación dorada.

- [ ] **Búsqueda con autocompletado** — Búsqueda predictiva sobre nombre de jugador, equipo, número y coleccionistas. Sugerencias visuales con previsualización.

  - Configuración: Endpoint dedicado con índices full-text en MySQL. Debounce de 300ms en frontend.

- [x] **Estadísticas avanzadas con racha y ETA** — Dashboard del coleccionista con racha de días consecutivos, % completo del álbum, láminas añadidas en últimos 7 días, ETA de finalización y comparativa con coleccionistas de la ciudad.

  - Configuración: Cálculo nocturno por Huey y caché en Profile. ETA calculada por regresión simple sobre velocidad reciente.

### Motor de Match (Digital + QR Presencial)

Sistema dual de matching: por proximidad geográfica con mecánica swipe estilo Tinder, y por escaneo QR cara a cara en cambiatones físicos.

- [x] **Match por swipe con proximidad** — Algoritmo que cruza cromos disponibles del usuario A vs faltantes del usuario B (y viceversa) priorizando cercanía geográfica. UI de swipe estilo Tinder.

  - Configuración: Query con haversine en MySQL (o cálculo en aplicación). Radio configurable por usuario (5/10/25/50 km). Match mutuo dispara notificación push.

  - Flujo: Usuario abre Match → backend devuelve top N candidatos cercanos con cromos compatibles → swipe right = like → si hay like mutuo se crea Match → notificación push → habilita compartir WhatsApp.

- [x] **Match QR presencial offline** — En cambiatones físicos, los coleccionistas escanean el QR del otro. La app cruza inventarios y muestra todos los intercambios posibles. Funciona 100% offline una vez cargado el inventario.

  - Configuración: QR contiene user_id firmado con HMAC. Inventario completo cacheado en Service Worker. Cruce ejecutado en cliente sin llamada al servidor.

  - Flujo: Usuario A muestra su QR personal → usuario B escanea con cámara → app local cruza inventarios → muestra lista de intercambios posibles ordenados por valor → ambos confirman → se crea Match con channel='qr_presencial'.

- [x] **QRs compartibles de cromos disponibles y faltantes** — El usuario genera dos QRs distintos: uno con su lista de cromos disponibles para intercambiar, otro con su lista de faltantes. Ambos compartibles por WhatsApp e Instagram con un toque.

  - Configuración: QR contiene URL pública firmada con expiración. Página pública mostrando la lista, sin requerir login del visitante.

### Comunicación vía WhatsApp con Opt-in

Cierre de matches a través de WhatsApp deep links con consentimiento explícito de ambas partes y plantilla pre-llenada del intercambio.

- [x] **Opt-in explícito de WhatsApp** — Tras un match mutuo, cada usuario decide si comparte su WhatsApp con el otro. Solo si ambos aceptan se genera el deep link.

  - Configuración: Campo whatsapp_optin en Profile. Bandera por-match para que el opt-in sea explícito en cada caso, no global.

- [x] **Deep link de WhatsApp con plantilla pre-llenada** — Al confirmar el opt-in mutuo, la app abre WhatsApp con un mensaje pre-llenado que lista los cromos a intercambiar y datos básicos del trade.

  - Configuración: URL wa.me con query string text= y plantilla generada server-side. Idioma según preferencia del usuario.

- [ ] **Push notification de match nuevo** — Notificación push al usuario cuando aparece un match mutuo o un mensaje nuevo en un match abierto.

  - Configuración: Web Push API con VAPID keys. Worker en Service Worker recibe payload y muestra notificación con deep link al match.

### Sistema de Comerciantes (Motor Listing)

Gestión completa del rol Comerciante: alta, perfil, listing en mapa, suscripción mensual y dashboard propio.

- [x] **Alta de comerciante por Web Manager** — El Web Manager invita o aprueba comerciantes desde el panel admin. Asigna rol Comerciante al usuario y le habilita el dashboard propio.

  - Configuración: Solicitudes de alta también vía formulario público con aprobación manual.

- [x] **Dashboard del comerciante** — Vista exclusiva donde el comerciante actualiza dirección, horarios, stock declarado y ve métricas básicas (visitas a su listing, intercambios cerca de su local).

- [x] **Listing geolocalizado en mapa** — Los comerciantes activos aparecen en un mapa filtrable por ciudad cuando un coleccionista busca '¿Dónde comprar sobres cerca?'. Solo se muestran comerciantes con suscripción al día.

  - Configuración: Mapa Leaflet con clusters. Query optimizada por bounding box + filtro de status='active'.

- [x] **Suscripción mensual de comerciante** — Cada comerciante paga $150-250K COP/mes. Sistema registra pagos, vencimientos y desactiva listing si la suscripción expira sin renovar.

  - Configuración: Pagos manuales registrados por Web Manager en V1 (transferencia/Nequi). Pasarela de pago automática puede agregarse en V2.

### Presenting Sponsor (Motor Anchor)

Configuración del branding del Presenting Sponsor: logo en splash, header persistente discreto, colores y mensajes en comunicaciones oficiales.

- [x] **Configuración del Presenting Sponsor** — El Web Manager configura la marca activa: logo, colores primario/secundario, texto del mensaje, vigencia. Solo un sponsor activo a la vez.

  - Configuración: Aplicación dinámica de colores via CSS variables. Logo servido como imagen optimizada con fallback. Vigencia controlada por active_from/active_until.

- [x] **Splash screen con logo del sponsor** — Al abrir la PWA, el splash screen muestra logo de Albunmanía + 'Presentado por [Marca]' con la paleta del sponsor.

- [x] **Header persistente discreto** — Banda inferior o lateral con 'Presentado por [Logo]' visible en todas las pantallas, sin invadir UX.

- [ ] **Branding sutil en notificaciones oficiales** — Emails y notificaciones push oficiales incluyen pie con 'Albunmanía + [Marca]'.

- [ ] **Reportes de exposición para el Sponsor** — Generación de reportes mensuales con impresiones del logo en splash, header, push y eventos. Vital para renovar el contrato.

  - Configuración: Cálculo agregado en Huey nocturno. Exportable a PDF con branding.

### Sistema de Banners CPM (Motor Inventario)

Inventario publicitario rotativo con segmentación geográfica, control de frecuencia y reportes de impresiones.

- [x] **Gestión de campañas y creatividades** — El Web Manager crea campañas con presupuesto en impresiones, vigencia y segmentación geográfica. Cada campaña puede tener múltiples creatividades rotativas.

  - Configuración: Subida de imagen, headline, body y URL de clic. Validación de tamaño y formato.

- [x] **Rotación ponderada de banners** — Selección de qué banner mostrar en cada slot basado en peso, segmentación geográfica, presupuesto restante y frecuencia (máximo 1 cada 5 swipes).

  - Configuración: Algoritmo de rotación en backend. Frecuencia controlada en cliente vía contador de swipes.

- [x] **Tracking de impresiones y clics** — Cada banner servido genera un registro de AdImpression con slot, ciudad y user_id. Clics se trackean con redirect intermedio.

  - Configuración: Tabla particionada por mes. Redirect server-side con UTM tracking.

- [ ] **Reportes para anunciantes** — PDF/CSV descargable con impresiones, clics, CTR y alcance geográfico por campaña. Generado on-demand desde el panel admin.

  - Configuración: Generación en Huey, almacenamiento temporal, descarga firmada.

### Panel Administrativo

Panel propio para Web Manager y Admin con gestión completa de los 3 motores de monetización, álbumes, usuarios, moderación y reportes.

- [ ] **Gestor de álbumes** — Crear, editar y archivar álbumes. Carga masiva del catálogo de cromos vía CSV.

- [x] **Gestor de usuarios y roles** — Asignación de roles (Coleccionista, Comerciante, Web Manager, Admin), bloqueo y desbloqueo de cuentas.

- [x] **Cola de moderación de reportes** — Lista de reportes pendientes con acciones rápidas: advertir, suspender, banear. Trazabilidad de quién resolvió cada caso.

- [x] **Manual interactivo del sistema** — Wiki navegable dentro del panel admin con procesos paso a paso, roles y reglas de negocio. Buscador con índice.

### PWA y Notificaciones

Capacidades de aplicación instalable, modo offline parcial y notificaciones push.

- [ ] **PWA instalable en dispositivo** — Web App Manifest + Service Worker para que la PWA se instale como app desde el navegador en móvil y escritorio.

  - Configuración: next-pwa con manifest configurado. Iconos para iOS, Android y desktop. Splash screen con identidad de Albunmanía.

- [ ] **Funcionamiento offline parcial** — Catálogo del álbum, inventario propio y matches recientes accesibles sin conexión. Sincronización al reconectarse.

  - Configuración: Estrategia stale-while-revalidate para catálogo. Cola de mutaciones pendientes en IndexedDB.

- [ ] **Notificaciones push de matches y mensajes** — Push API con opt-in explícito. Notificación al recibir match nuevo, respuesta a un match o cromo buscado disponible cerca.

  - Configuración: VAPID keys en backend. Subscriptions almacenadas por user_id.

### Internacionalización y Tematización

Multi-idioma nativo (español, inglés, portugués) y dark mode automático según preferencia del sistema.

- [ ] **Soporte multi-idioma** — Tres idiomas soportados: español (default), inglés, portugués. Selector visible y persistencia de preferencia. Detección automática del navegador en primer ingreso.

  - Configuración: next-intl con archivos JSON por idioma. Backend usa Django translation para emails y push.

- [ ] **Modo claro y oscuro automático** — Paleta dual con detección de prefers-color-scheme y persistencia de elección manual del usuario.

  - Configuración: Tailwind dark mode class strategy. Variables CSS para colores dinámicos del sponsor.

### Reseñas y Reputación

Sistema de reseñas post-trade entre coleccionistas: calificación con estrellas, tags estructurados, comentario, respuesta pública, agregados cacheados en perfil, visualización no invasiva en match y detalle de intercambio, y moderación con toggle de visibilidad.

- [x] **Habilitación post-trade** — Reglas de elegibilidad: Trade en estado confirmado/completado, una sola Review por par (trade, reviewer), ventana de edición de 24 horas tras creación; luego inmutable.

  - Configuración: Constraint único en BD (trade_id, reviewer_id). Job cron diario que cierra ventana de edición.

  - Flujo: Tras marcar el Trade como confirmado/completado, el sistema habilita por 24h el formulario de reseña para cada parte. La creación de la Review valida unicidad (trade_id, reviewer_id) y bloquea recalificaciones.

- [x] **UI de calificación** — Componente de input con selector de estrellas, multi-select de tags ('puntual', 'cromos en buen estado', 'buena comunicación', 'no-show', etc.), comentario opcional y campo de respuesta del calificado.

  - Flujo: El usuario abre el CTA 'Calificar al coleccionista' desde la vista de Detalle de Intercambio → escoge estrellas (1–5) → marca tags predefinidos → escribe comentario opcional ≤500 chars → envía. El calificado puede responder una sola vez de forma pública.

- [x] **Visualización pública** — Tres puntos de visualización: pestaña dedicada en Perfil, preview en card de Match para reducir no-shows, y drawer lateral en Detalle de Intercambio. Nunca modales bloqueantes.

  - Flujo: Perfil → pestaña Reseñas con resumen + listado paginado y filtro por estrellas. Match (Swipe) → preview compacto ★ promedio (conteo) en la card. Detalle de Intercambio → mini-bloque por participante con drawer lateral no invasivo (solo abre al clic).

- [x] **Agregación y recálculo** — Tras cada Review nueva o cambio en is_visible se recalculan los agregados cacheados en Profile: rating_avg, rating_count y positive_pct (% de reseñas con stars >= 4). Se evita N+1 al renderizar listas de coleccionistas.

  - Configuración: Signal post_save/post_delete en Review que dispara update atómico sobre Profile. Idempotente.

- [x] **Moderación y reportes** — Cola de moderación accesible al rol Administrador con toggle is_visible sin borrado. Trazabilidad en AuditLog. Anti-fraude y anti no-show.

  - Flujo: Cualquier usuario puede reportar una reseña → entra a la cola de moderación → admin revisa y, si procede, baja el toggle is_visible con razón registrada. La reseña queda oculta del público pero sigue en BD para auditoría.

---

## 🔌 API endpoints
### /api/v1/auth
- [ ] Login con Google OAuth, refresh de JWT, validación de antigüedad de cuenta, captcha, logout. Endpoints públicos.
### /api/v1/profile
- [ ] Lectura y actualización del perfil del usuario autenticado: ciudad, opt-ins, configuración de notificaciones, estadísticas (racha, ETA, % álbum).
### /api/v1/albums
- [ ] Listado de álbumes activos, detalle de álbum, catálogo de stickers con filtros (equipo, número, edición especial), búsqueda predictiva.
### /api/v1/inventory
- [ ] CRUD del inventario del usuario autenticado: marcar cromo como pegado / repetido / faltante, sincronización debounced, listado consolidado por álbum.
### /api/v1/match
- [ ] Sugerencias de match por proximidad, swipe (like/pass), creación de match mutuo, validación QR presencial, listado de matches activos del usuario.
### /api/v1/trades
- [ ] Confirmación de intercambio post-match, cierre de trade, calificación post-trade (Reputation).
### /api/v1/merchants
- [ ] Listado público de comerciantes activos con filtros geográficos. Endpoints privados para perfil del comerciante (rol Comerciante) y gestión (rol Web Manager).
### /api/v1/sponsor
- [ ] Lectura pública del Presenting Sponsor activo (para renderizar splash y header). Gestión privada por Web Manager.
### /api/v1/ads
- [ ] Solicitud de banner para slot (con segmentación), tracking de impresión y de clic, gestión de campañas y creatividades por Web Manager.
### /api/v1/reports
- [ ] Crear reportes de moderación (todos los usuarios). Gestión de cola de reportes (rol Admin).
### /api/v1/notifications
- [ ] Suscripción y desuscripción de Web Push, listado in-app de notificaciones del usuario.
### /api/v1/admin
- [ ] Endpoints de administración: gestión de usuarios y roles, cola de moderación, generación de reportes para sponsor y anunciantes, exportaciones.

---

## 🔗 Integraciones (incluidas)
- [ ] **Autenticación social — Google OAuth 2.0** · OAuth 2.0 estándar vía django-allauth · Datos: Sistema recibe email, nombre, fecha de creación de cuenta y avatar. Albunmanía no envía datos a Google. · Cuenta: ProjectApp gestiona el proyecto OAuth en Google Cloud Console
- [ ] **Captcha anti-bot — hCaptcha** · API REST estándar con sitekey pública y secret server-side · Datos: Token de validación enviado al backend para verificación. Sin datos personales. · Cuenta: ProjectApp gestiona la cuenta hCaptcha
- [ ] **Geolocalización por IP — MaxMind GeoIP2 (DB local)** · Base de datos descargada y actualizada periódicamente en el VPS · Datos: Sin llamadas externas. Lookup local en el servidor. · Cuenta: ProjectApp mantiene licencia y actualizaciones
- [ ] **Mapas — OpenStreetMap + Leaflet** · Tiles servidos desde tile servers de OSM (con respeto a sus términos) · Datos: Sin datos sensibles enviados. · Cuenta: Gratuito sin cuenta, eventualmente migrable a tile server propio si crece el tráfico
- [ ] **Notificaciones push — Web Push API (estándar W3C)** · Suscripciones almacenadas en backend, envío vía librerías estándar (pywebpush) · Datos: Sin intermediario tipo Firebase. El navegador del usuario gestiona la entrega. · Cuenta: ProjectApp gestiona VAPID keys
- [ ] **WhatsApp deep links — WhatsApp** · URLs wa.me con texto pre-llenado, sin API · Datos: Solo redirección del cliente. WhatsApp no recibe datos del backend. · Cuenta: No requiere cuenta empresarial
- [ ] **Facturación electrónica — Siigo o Alegra (configurable)** · API REST del proveedor con autenticación OAuth/API key · Datos: Sincronización bidireccional de clientes (anunciantes y comerciantes), productos (espacios publicitarios) y comprobantes electrónicos. · Cuenta: ProjectApp mantiene cuenta y credenciales del proveedor

---

## 🌱 Preparación para el crecimiento (visión v2)
### Tráfico de usuarios
- [ ] Preparación: Nginx con caché agresivo de assets estáticos (imágenes de cromos, JS bundle, fuentes) y compresión gzip/brotli. Service Worker en cliente cachea catálogo del álbum reduciendo requests al servidor en sesiones repetidas. Gunicorn con workers configurables según métricas.
- [ ] Evolución: Si la carga supera capacidad del VPS de 4 vCPU / 8 GB RAM, primer paso es escalar verticalmente (8 vCPU / 16 GB). Segundo paso es separar workers de Huey en VPS dedicado. Tercer paso (mes 6+) es introducir CDN para estáticos.
### Volumen de datos
- [ ] Preparación: Índices compuestos en MySQL para queries frecuentes: (user_id, sticker_id) en UserSticker, (lat, lng, city) en Profile y MerchantProfile, (album_id, number) en Sticker. Particionamiento mensual de AdImpression desde el inicio para evitar tabla gigante.
- [ ] Evolución: MySQL puede soportar millones de filas de UserSticker sin problemas. Si el catálogo multi-álbum supera 10M de inventarios, considerar archivado de álbumes inactivos. Reportes históricos pueden moverse a tablas de agregación calculadas por Huey.
### Inventario publicitario
- [ ] Preparación: Sistema de banner CPM diseñado con rotación ponderada y segmentación geográfica desde el día uno. Soporta múltiples campañas simultáneas con prioridades configurables. AdImpression registra cada vista para reportes precisos.
- [ ] Evolución: El sistema admite agregar nuevos formatos publicitarios sin reescritura: match-up patrocinado, cromo de marca, skin del día. Cuando las métricas de inventario crezcan, se puede añadir un panel self-service para anunciantes (mes 6+).
### Expansión multi-álbum
- [ ] Preparación: La entidad Album actúa como tenant lógico. Cada álbum (Mundial 26, Champions, Copa América) opera con su propio catálogo, inventario y comunidad sin tocar el código core. El Web Manager puede crear un álbum nuevo desde el panel admin sin desarrollo.
- [ ] Evolución: Al lanzar un álbum nuevo solo hace falta cargar el catálogo de stickers (CSV o panel). La comunidad existente migra naturalmente. Si dos álbumes generan tráfico muy distinto, se puede crear sub-domains por álbum (champions.albunmania.co).
### Expansión geográfica
- [ ] Preparación: Stack multi-idioma desde el día uno (español, inglés, portugués). Detección automática por navegador. MerchantProfile y Profile guardan ciudad explícita, lo cual permite filtrar por país/región sin modificación.
- [ ] Evolución: Para escalar a México, Argentina o Brasil, se agrega un campo country a Profile y MerchantProfile, se carga el catálogo del álbum local (si difiere) y se ajustan las pasarelas de facturación. La arquitectura no requiere reescritura.
### Tareas asíncronas
- [ ] Preparación: Huey procesa todas las tareas no-críticas: envío de push, generación de reportes, sincronización con Siigo/Alegra, limpieza de matches expirados, cálculo de racha y ETA por usuario. Workers configurables por tipo de tarea.
- [ ] Evolución: Si el volumen de tareas crece (decenas de miles de push diarios durante el Mundial), Huey puede separarse en workers dedicados por tipo (notificaciones / reportes / billing). MySQL como backend de Huey es suficiente hasta volúmenes grandes.
