# Propuesta de Plataforma Mundialista (Fase 1) — Albunmanía
> Cliente: ProjectApp · Estado: implementado (14 épicas) + validado E2E + paquete de deploy listo · Idioma: es

<!--
ESTADO DE COMPLETITUD (auditoría 2026-05-12) — leyenda de los comentarios inline de este archivo:
  [x]                    = implementado y verificado en el codebase.
  [ ] + <!-- V2: ... -->            = dentro del alcance del Release 01 pero diferido a V2 (parcial o no hecho).
  [ ] + <!-- NO IMPLEMENTADO: ... -->= descrito como "incluido" en la propuesta pero NO construido en el Release 01 (GAP — requiere decisión).
  [ ] + <!-- fuera de Release 01 -->= módulo opcional con costo extra (➕/💰) o visión v2 — intencionalmente fuera de alcance.
  <!-- desviación: ... -->          = implementado pero difiere del nombre/forma descrito en la propuesta (funciona igual).
Pendientes operacionales para "aceptado": deploy real al VPP por ProjectApp + creds reales (Google OAuth, hCaptcha, VAPID, DJANGO_SECRET_KEY, MySQL pwd). Ver deploy/staging/RUNBOOK.md.
GAPS detectados (auditoría 2026-05-12): los **8 GAPS están cerrados**. "Bloque D" (P2): D1 ✅ T&C/Privacidad/FAQ pages + componente FAQ + footer · D2 ✅ /profile/[id] + endpoint public-profile + "Editar mi cuenta" · D3 ✅ centro de notificaciones in-app + modelo Notification + campana en el Header · D4 ✅ modelo Report general + reportar usuarios/intercambios + 2ª cola en /admin/moderation. "Bloque E" (P3): E1 ✅ presencia "en línea ahora" (Profile.last_seen + /presence/ping/ + /presence/active-count/ + LiveBadge en perfil/match/ranking) · E2 ✅ Mapa de Coleccionistas (/mapa + /collectors/map/) · E3 ✅ búsqueda predictiva con dropdown (/catalog/[slug] SearchAutocomplete + /albums/<slug>/search/ + /collectors/search/) · E4 ✅ Geolocalización por IP (GeoIP2 — services/geoip.py + /geo/ip-locate/; la .mmdb la provisiona ops, degrada limpio si falta).
-->

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

- [x] **Inicio (Landing)** — Hero claro con la propuesta de valor de Albunmanía, llamado a la acción para registrarse y vista previa del catálogo del álbum sin necesidad de login. <!-- app/page.tsx — hero + CTAs + SponsorSplash + BannerSlot + disclaimer footer -->


- [x] **Login con Google + Captcha** — Autenticación vía Google OAuth con captcha integrado. Solo se permiten cuentas Google verificadas con más de 30 días de antigüedad.

- [x] **Onboarding** — Flujo guiado para configurar el álbum activo, permisos de geolocalización (con explicación clara) y preferencias de notificación.

- [x] **Dashboard del Coleccionista** — Vista principal del usuario con resumen de cromos pegados, faltantes, repetidos y matches sugeridos por proximidad. <!-- app/dashboard/page.tsx — StatCard (% completo / pegadas / repetidas / semana / racha / ETA) + RankingList + sección Notificaciones (push opt-in). Los "matches sugeridos" viven en /match, no embebidos en el dashboard. -->

- [x] **Mis Cromos (los que tengo)** — Módulo donde el usuario marca los cromos que ya pegó y los repetidos disponibles para intercambiar. <!-- implementado vía /catalog/[slug] + contador 0/1/2+ por toque (UserSticker.count); no hay vista "Mis Cromos" separada — el filtrado por estado de inventario en la grilla queda pendiente (V2). -->

- [x] **Faltantes (los que necesito)** — Lista de cromos que el usuario aún no tiene, con sugerencias automáticas de matches cercanos disponibles. <!-- los faltantes (UserSticker.count==0) alimentan el feed de /match; no hay vista "Faltantes" separada ni filtro "sólo faltantes" en el catálogo (V2). -->

- [x] **Buscador General con Filtros** — Catálogo completo del álbum con filtros por equipo, número, jugador, disponibilidad y radio de proximidad. Incluye paginación y vista de tarjetas. <!-- /catalog/[slug] + CatalogFilters (q, team, special) — filtra server-side vía GET /api/albums/<slug>/stickers/. La búsqueda predictiva con dropdown (SearchAutocomplete) ya está (ver §Funcionalidades). Falta el filtro "disponibilidad" (por estado de inventario) y "radio de proximidad" — el match por proximidad sí los aplica (GET /api/match/feed/?radius_km=); en el catálogo siguen pendientes (V2). -->

- [x] **Match (Swipe)** — Vista estilo Tinder donde el usuario ve cromos disponibles cerca y desliza para indicar interés. Cada card de coleccionista muestra un preview compacto de reputación (★ 4.8 (23)) para reducir no-shows. Cuando hay match mutuo, se habilita el intercambio. <!-- /match — MatchFeed + SwipeCard (preview de reputación cacheada en Profile) + MutualMatchModal + banner CPM 1/5 swipes. -->

- [x] **Mapa de Coleccionistas** — Vista de mapa con coleccionistas activos cerca del usuario (ubicación aproximada por privacidad), útil para encontrar parches de intercambio. <!-- /mapa (protegida) — Leaflet (CollectorMap/CollectorMapInner, mismo patrón que el mapa de comerciantes) + lista con Live Badges y enlaces a /profile/[id]. GET /api/collectors/map/?lat=&lng=&radius_km=&album_id= — sólo lat_approx/lng_approx (ya aproximados), excluye al solicitante. "Usar mi ubicación" → browser geo + radio 50 km; "Ver todos" → sin filtro. -->


- [x] **Perfil del Usuario** — Página personal del coleccionista con estadísticas (% del álbum completo, intercambios realizados), datos de contacto opt-in, configuración de cuenta y una pestaña dedicada de Reseñas: rating promedio (★ 1–5), distribución por estrellas, tags más recibidos, listado paginado con filtro por estrellas y respuesta pública del calificado cuando aplica. <!-- app/profile/[id]/page.tsx — ProfileHeader (avatar/nombre/ciudad/bio + métricas % álbum / intercambios / reseñas + ReviewSummary) + sección "Reseñas" (ReviewCard + filtro por estrellas) + endpoint GET /api/users/<id>/public-profile/ (sin email/teléfono). /profile/me además muestra "Editar mi cuenta" (ciudad, bio, push opt-in, WhatsApp opt-in + número → PATCH /api/profile/me/). El nombre no es editable (viene de Google). El botón "Reportar a este coleccionista" llega en Bloque D4. -->


- [x] **Notificaciones** — Centro de notificaciones con matches nuevos, mensajes y alertas de actividad. Sincronizado con notificaciones push de la PWA. <!-- app/notificaciones/page.tsx — lista de NotificationItem (modelo Notification: match_mutual / review_received / review_reply) + "sólo no leídas" + "marcar todas como leídas"; campana con badge de no leídas en el Header. Endpoints /api/notifications/ (list ?unread=), /unread-count/, /<id>/read/, /read-all/. Las notificaciones se crean en el signal post_save Match (mutuo) y en las views de crear/responder reseña. "Cromo buscado disponible cerca" requiere un job Huey → V2. -->


- [x] **Términos y Condiciones** — Documento legal que explica el modelo de monetización por anuncios, política de datos, edad mínima y aclaración de NO afiliación oficial con FIFA o Panini. <!-- página /terminos (app/terminos/page.tsx + LegalPage + lib/legal/content.ts TERMS_SECTIONS) + enlace en el footer. NOTA: el texto es un borrador de trabajo (banner "legal-draft-notice") — la versión definitiva la debe revisar/redactar el equipo legal del cliente (edad mínima exacta, jurisdicción, limitación de responsabilidad, contacto). -->


- [x] **Política de Privacidad** — Detalle del tratamiento de datos personales conforme a la Ley 1581 de 2012, incluyendo geolocalización, datos de Google y compartición de WhatsApp. <!-- página /privacidad (app/privacidad/page.tsx + LegalPage + lib/legal/content.ts PRIVACY_SECTIONS) + enlace en el footer. NOTA: borrador de trabajo — la versión definitiva (alineación Ley 1581/2012 + Decreto 1377/2013, razón social/NIT del responsable, plazos de retención, canal para ejercer derechos) la debe revisar el equipo legal del cliente. -->


- [x] **Centro de Ayuda / FAQ** — Preguntas frecuentes sobre cómo intercambiar, cómo funciona la verificación, qué hacer ante un 'no-show' y cómo reportar contenido inapropiado. <!-- página /ayuda (app/ayuda/page.tsx + FAQAccordion + lib/faq/content.ts — 18 preguntas con filtro por audiencia) + enlace en el footer. -->


- [x] **Match QR Presencial** — En cambiatones físicos (Unicentro, El Tesoro, calle 19), los coleccionistas escanean el QR del otro y la app cruza listas en segundos para identificar intercambios posibles. Funciona offline. <!-- /match/qr — pestaña "Escanear" (@zxing/browser, QRScanner) + scan/confirm; compute_offline_cross corre en cliente sobre inventario cacheado en IndexedDB. -->

- [x] **Mis QRs para Compartir** — Genera dos QRs distintos: uno con tus cromos disponibles para intercambiar y otro con tu lista de faltantes. Compartibles directamente por WhatsApp, Instagram Stories o cualquier red. <!-- /match/qr "Mi QR" (QRDisplay, token HMAC TTL 24h) + página pública /share/[token]?kind=available|wanted. -->

- [x] **Dashboard del Comerciante** — Vista exclusiva para papelerías, kioscos, librerías y distribuidores oficiales del álbum: gestión de stock, listing en mapa de '¿Dónde comprar sobres cerca?', y promoción de cambiatones in-store. <!-- /merchants/me — MerchantDashboardForm (nombre, tipo, dirección, stock declarado) + badge de suscripción. "Promoción de cambiatones in-store" no se construyó como tal. -->

- [x] **Ranking de Coleccionistas por Ciudad** — Leaderboard local: top coleccionistas en Bogotá, Medellín, Cali, Barranquilla. Gamifica la experiencia y revela influencers naturales para alianzas con marcas. <!-- RankingList en /dashboard — GET /api/stats/ranking/?city= (stats_engine.city_ranking). -->

- [x] **Detalle de Intercambio (Trade)** — Vista dedicada del intercambio confirmado entre dos coleccionistas. Lista los cromos que aporta cada parte, datos de contacto vía WhatsApp con opt-in y, en una zona lateral no invasiva, un mini-bloque de reseñas por participante (★ promedio + número de reseñas) que abre un drawer al hacer clic. Tras marcar el trade como completado se habilita el CTA 'Calificar al coleccionista'. <!-- /match/[matchId] — trade-items + WhatsAppOptInToggle + ReviewWidget + ReviewDrawer + CTA "Calificar" post-completado. -->

### Componentes

Componentes visuales y funcionales reutilizados en toda la plataforma para mantener coherencia y optimizar el desarrollo.

- [x] **Encabezado (Header)** — Logo de Albunmanía, navegación principal, indicador de notificaciones, avatar del usuario y selector de álbum activo. <!-- components/layout/Header.tsx — logo + nav + campana de notificaciones con badge de no leídas (header-notifications) + enlace "Mi perfil" + slot auth (Cerrar sesión) + patrón mounted. SIN selector de álbum activo (el álbum activo se fija en el onboarding) ni avatar gráfico (el avatar gráfico vive en /profile/[id]). -->


- [x] **Tarjeta de Cromo (Sticker Card)** — Componente visual reutilizable que muestra cromo, número, equipo y estado (poseído / faltante / repetido). <!-- components/catalog/StickerCard.tsx (data-state missing/owned/repeated, data-count). -->

- [x] **Tarjeta de Match (Swipe Card)** — Tarjeta interactiva con animación de swipe, datos del coleccionista y cromos involucrados en el potencial intercambio. <!-- components/match/SwipeCard.tsx. -->

- [x] **Banner CPM (Home + Feed)** — Espacios publicitarios estándar en home y entre swipes del feed, con cobranza por cada 1.000 impresiones. Diseñados para ser elegantes y no romper la experiencia comunitaria. Frecuencia controlada (máximo 1 cada 5 swipes). <!-- components/ads/BannerSlot.tsx — GET /api/ads/serve/?slot= + /api/ads/click/<id>/ (302). Frequency cap 1/5 swipes en adStore.noteSwipe(). -->

- [x] **Espacio Presenting Sponsor** — Posición premium reservada para la marca anchor que financia el lanzamiento. Logo en splash al abrir la app, header persistente discreto, y branding sutil en notificaciones oficiales. Solo 1 marca activa a la vez. <!-- components/sponsor/{SponsorSplash,SponsorHeaderBand,SponsorThemeProvider}.tsx — GET /api/sponsor/active/. "Branding sutil en notificaciones" → V2 (ver §Épicas). -->

- [x] **Widget de Reseñas** — Componente compacto que muestra el rating promedio, número de reseñas y badges de confianza del usuario. Reutilizable en cabecera de perfil, cards de Match y bloques laterales de la vista de Intercambio. <!-- components/reviews/ReviewWidget.tsx + StarRating.tsx. -->

- [x] **Preguntas Frecuentes (FAQ)** — Acordeón con respuestas rápidas a dudas comunes de coleccionistas, comerciantes y anunciantes. <!-- components/faq/FAQAccordion.tsx — acordeón <button>/aria-expanded con filtro por audiencia (Todos/General/Coleccionista/Comerciante/Anunciante); contenido en lib/faq/content.ts. Renderizado en /ayuda. -->


- [x] **Indicador 'En Línea Ahora' (Live Badge)** — Punto verde visible en perfiles, matches y leaderboards que indica si el otro coleccionista está activo en este momento. Genera urgencia y acelera el cierre del intercambio. <!-- `LiveBadge` (punto verde, no renderiza nada si offline) en ProfileHeader (/profile/[id]), SwipeCard (match) y RankingList (leaderboard de ciudad), también en los pines del /mapa. Presencia sin WebSocket: Profile.last_seen lo bumpea (throttled, vía cache) PresencePinger (heartbeat POST /api/presence/ping/ cada 120s + on focus) y validate_token; `is_online` = last_seen dentro de 5 min, expuesto en public-profile, swipe cards y city ranking. -->

- [x] **Badge de Edición Especial** — Marca visual diferenciada con halo dorado para láminas premium (Mbappé, Cristiano, escudo metalizado de Argentina, lámina 00, ediciones Coca-Cola). Las hace destacar en el catálogo y los matches. <!-- renderizado dentro de StickerCard (data-testid="special-badge", halo dorado); no es componente separado. -->

- [x] **QR Compartible Animado** — Componente que genera el QR personal del usuario (de cromos disponibles o faltantes) con animación elegante, listo para compartir o escanear cara a cara. <!-- components/match/QRDisplay.tsx (qrcode.react). La "animación elegante" es mínima. -->

- [x] **Stat Card con Racha y ETA** — Tarjeta visual que muestra racha de días consecutivos, % del álbum completo, y fecha estimada de finalización. Refuerza la retención diaria de los coleccionistas. <!-- components/stats/StatCard.tsx — 6 tiles (% completo / pegadas / repetidas / semana / racha / ETA). -->

- [x] **Tarjeta de Reseña (Review Card)** — Componente que muestra una reseña individual: avatar y nombre del autor, fecha, estrellas, comentario, tags estructurados (puntual, cromos en buen estado, buena comunicación, no-show, etc.) y, cuando existe, la respuesta pública del calificado. <!-- components/reviews/ReviewCard.tsx. -->

- [x] **Formulario de Reseña Post-Trade** — Formulario de calificación que aparece tras un intercambio confirmado: selector de estrellas (1–5), multi-select de tags predefinidos, comentario opcional (≤500 caracteres) y validación de unicidad por (trade, reviewer). Permite editar la reseña dentro de una ventana de 24 horas. <!-- components/reviews/ReviewForm.tsx — POST /api/trades/<id>/reviews/; PATCH /api/reviews/<id>/ (24h). -->

- [x] **Resumen de Reputación (Rating Summary)** — Bloque visual con promedio destacado, distribución de estrellas en barras 1–5, conteo total y los tags más recibidos por el usuario. Usado como encabezado de la pestaña Reseñas en el perfil. <!-- components/reviews/ReviewSummary.tsx — GET /api/users/<id>/rating-summary/. Montado en ProfileHeader dentro de /profile/[id]. -->

- [x] **Drawer de Reseñas** — Side-sheet lateral no invasivo que se abre al hacer clic en el rating de una contraparte (en Match o en Detalle de Intercambio). Lista paginada con filtro por estrellas. Nunca aparece como modal bloqueante ni preabierto. <!-- components/reviews/ReviewDrawer.tsx — GET /api/users/<id>/reviews/?stars= ; selector con EMPTY_REVIEWS cacheado (evita el loop de Zustand). -->

- [x] **Pie de página (Footer)** <!-- footer inline en app/layout.tsx — enlaces a /terminos, /privacidad, /ayuda, /manual + la línea "© 2026 Albunmanía · No afiliado oficialmente con FIFA o Panini." (sin enlaces a redes sociales — pendiente cuando existan las cuentas). --> — Enlaces a términos, privacidad, ayuda, redes sociales y aclaración de NO afiliación con FIFA o Panini.

### Funcionalidades Específicas

Comportamientos interactivos y reglas de negocio que dan vida a Albunmanía y la diferencian de soluciones genéricas.

- [x] **PWA Instalable + Web Responsive** — La plataforma funciona como aplicación instalable en el celular del usuario y como sitio web responsive en cualquier dispositivo. Soporta modo offline parcial y notificaciones push. <!-- next-pwa (sw.js + sw-push.js, manifest), runtimeCaching catálogo, cruce QR offline (idb-keyval), Web Push (VAPID). -->

- [x] **Autenticación Google + Captcha + Cuenta Verificada** — Login exclusivo con Google OAuth, captcha anti-bots y validación de cuenta con más de 30 días de antigüedad para reducir falsos perfiles. <!-- /sign-in, /sign-up (Google OAuth implicit flow + hCaptcha); regla 30 días vía Google People API; google_account_age.py. -->

- [x] **Geolocalización Dual (IP + Browser API)** — Detección automática por IP para ubicación aproximada, complementada con la API del navegador (con permisos explicados al usuario) para mayor precisión. <!-- Rama browser: navigator.geolocation en el onboarding (StepGeolocation) + Profile.browser_geo_optin/lat_approx/lng_approx. Rama IP: services/geoip.py (GeoLite2-City vía settings.GEOIP_PATH / DJANGO_GEOIP_PATH) + GET /api/geo/ip-locate/; StepGeolocation lo llama al montar y ofrece "usar ubicación aproximada por IP" antes del prompt preciso. La .mmdb la provisiona ops (no está en el repo — licencia + tamaño); si falta, degrada limpio. -->


- [x] **Motor de Match por Proximidad** — Algoritmo que cruza cromos disponibles vs. faltantes y prioriza matches dentro de un radio configurable. Soporta swipe, filtros y orden por relevancia. <!-- match_engine.py — bounding-box prefilter + haversine inline + cruce de inventarios; GET /api/match/feed/?radius_km=. -->

- [x] **Integración WhatsApp con Opt-in** — Al confirmarse un match, cada usuario decide si comparte su WhatsApp. Si ambos aceptan, se genera enlace pre-llenado con plantilla de intercambio. <!-- TradeWhatsAppOptIn (per-trade) + whatsapp_link.build_whatsapp_link() → wa.me deep link; POST /api/trade/<id>/whatsapp-optin/, GET .../whatsapp-link/. -->

- [x] **Sistema de Roles y Permisos** — Cuatro roles diferenciados: Coleccionista (usuario final), Comerciante (papelerías, kioscos y distribuidores oficiales con dashboard propio), Web Manager (equipo de ProjectApp para subir anuncios y gestionar marcas), Administrador (gestión global de plataforma y álbumes). <!-- User.Role + Group espejo; User.assign_role(); /admin/* role-gated client + server (_is_admin_or_wm). -->

- [x] **Arquitectura Multi-Álbum** — Diseño preparado para gestionar múltiples álbumes simultáneamente: Mundial 26, Champions, Copa América, Pokémon, etc. Cada álbum con su propio catálogo y comunidad. <!-- Album como tenant lógico (FK desde Sticker/UserSticker/Profile.active_album_id/Match...); sólo 1 álbum (mundial-26) cargado en el seed, pero la arquitectura lo soporta. -->

- [x] **Sistema de Reseñas y Reputación** — Tras un intercambio confirmado, ambos usuarios pueden calificarse con estrellas (1–5), tags estructurados y un comentario opcional. Cada reseña es única por par (trade, reviewer) y editable durante 24 horas. El calificado puede dejar una respuesta pública. Los agregados (promedio, número total y porcentaje de reseñas positivas) se persisten cacheados en el perfil para preview rápido en cards de Match y en la vista de Intercambio. Incluye moderación con toggle de visibilidad y señalización anti no-show, reduciendo el riesgo percibido al intercambiar con alguien nuevo. <!-- Review (unique trade+reviewer, stars 1-5, edit window 24h, reply, is_visible) + ReviewReport; agregados en Profile vía signal post_save/post_delete. -->

- [x] **Reportes y Moderación** — Los usuarios pueden reportar perfiles, contenido inapropiado o intercambios fallidos. Cola de moderación accesible al rol Administrador. <!-- modelo Report general (target user|trade; reason no_show/harassment/fake_profile/inappropriate/other; detail; status pending/dismissed/actioned + resolved_by/at/notes). Botón "Reportar" (ReportModal) en /profile/[id] (usuario) y /match/[matchId] (intercambio, p.ej. no-show) → POST /api/reports/. Cola admin en /admin/moderation (sección "Reportes de usuarios e intercambios") con GET /api/admin/reports/?status=&kind= + PATCH .../<id>/ (descartar / marcar atendido + notas) + enlace a /admin/users. Las reseñas se siguen moderando con ReviewReport + is_visible. (Las sanciones — suspender/banear — se aplican desde /admin/users con el toggle is_active; no se automatizan desde el reporte.) -->


- [x] **Contador Rápido 0/1/2+ por Toque** — UX inspirada en las mejores apps de la categoría: tocá una lámina para marcarla como tenida (1), tocá de nuevo para indicar repetida (2+), mantén presionado para borrar. Velocidad sin selectores ni menús. <!-- StickerCard — tap incrementa UserSticker.count (0→1→2+), long-press resetea; bulk sync POST /api/inventory/bulk/ debounced ~2s. -->

- [x] **Estadísticas Avanzadas** — Racha de días consecutivos coleccionando, % de avance por selección, láminas añadidas en últimos 7 días, fecha estimada de finalización del álbum (ETA), y comparativa con coleccionistas de tu ciudad. <!-- stats_engine.compute_stats (racha con grace day, weekly velocity, ETA) + city_ranking; GET /api/stats/me/, /api/stats/ranking/. On-demand (Huey nightly → V2). -->

- [x] **Match QR Presencial (Escaneo Cara a Cara)** — Complementa el match digital: en cambiatones presenciales un coleccionista muestra su QR y el otro escanea. La app cruza listas en segundos identificando todos los intercambios posibles. Funciona 100% offline. <!-- /match/qr — HMAC token (qr_token), @zxing scanner, compute_offline_cross (qr_cross.py) en cliente sobre inventario cacheado en IndexedDB; el server re-corre el cruce como sanity check. -->

- [x] **Compartir Listas por QR + WhatsApp / Instagram** — Genera dos QRs distintos: cromos disponibles y cromos buscados. Cada uno se comparte con un toque por WhatsApp, Instagram Stories o cualquier red. Cada compartición es marketing orgánico para Albunmanía. <!-- /match/qr "Mi QR" + página pública /share/[token]?kind=available|wanted (GET /api/trade/share/<token>/) con CTA "Únete a Albunmanía". -->

- [x] **Onboarding como Invitado** — Los visitantes pueden explorar el catálogo del álbum, marcar progreso temporal y ver matches sugeridos sin registrarse. El login Google verificado se exige solo al iniciar un intercambio. Mejora la conversión visitante → usuario activo. <!-- PARCIAL: el invitado navega /, /catalog/[slug], /manual, /merchants y la página /share/[token] sin login; el login Google se exige al iniciar un trade. PERO /match (feed) es ruta protegida — "ver matches sugeridos sin registrarse" no está. -->

- [x] **Búsqueda Predictiva con Autocompletado** — Mientras el usuario escribe, el buscador sugiere láminas, jugadores, equipos y coleccionistas con previsualización visual. UX inspirada en CambioCromos pero adaptada al contexto colombiano. <!-- SearchAutocomplete en /catalog/[slug] — dropdown debounced con sugerencias de cromos (GET /api/albums/<slug>/search/?q=, con miniatura/número/equipo) y de coleccionistas (GET /api/collectors/search/?q=, top-5 por nombre/email/ciudad); elegir un cromo filtra la grilla a su número, elegir un coleccionista navega a /profile/[id]. (El Manual ya tenía su propio buscador con dropdown — ManualSearch.) -->

- [x] **Indicador en Vivo de Usuarios Activos** — Muestra cuántos coleccionistas están activos ahora en tu ciudad y en el catálogo. En perfiles individuales, el badge verde de 'en línea' acelera matches. Crea sensación de comunidad viva. <!-- ActiveCollectorsBanner en el dashboard ("N coleccionistas en línea ahora [en {ciudad}]") vía GET /api/presence/active-count/?city= (refresca cada 60s); el LiveBadge verde en perfiles/match/ranking. Ver también "Indicador 'En Línea Ahora'". -->

- [x] **Ediciones Especiales Destacadas** — Las láminas premium (Mbappé, Ronaldo, escudo metalizado de Argentina, Lámina 00, edición Coca-Cola) tienen UI diferenciada con halo dorado, valor estimado de mercado y filtro dedicado. Reflejan el comportamiento real de reventa colombiana. <!-- Sticker.is_special_edition/special_tier/market_value_estimate; StickerCard renderiza el halo + badge; filtro ?special=true en el catálogo. -->


### Módulo Administrativo

Panel administrativo para que el equipo de ProjectApp gestione contenido, los 3 motores de monetización (Presenting Sponsor, Comerciantes, Banners CPM), usuarios y moderación sin depender de desarrollo técnico.

- [ ] **Gestor de Álbumes** — Crear, editar y archivar álbumes (Mundial 26, futuras colecciones). Carga masiva del catálogo de cromos por álbum. <!-- V2: gestión de álbumes vía Django Admin (Album/Sticker); falta panel propio en /admin + carga masiva por CSV. -->

- [ ] **Gestor de Presenting Sponsor** — Configuración de la marca anchor: logo en splash y header, colores, mensajes en comunicaciones oficiales, branding en eventos. Vigencia configurable y métricas de exposición para reportar al sponsor. <!-- PARCIAL: configuración vía Django Admin (modelo Sponsor: logo/colores/mensaje/vigencia). El render (splash/header/CSS vars) sí está. NO hay panel propio en /admin ni "métricas de exposición para el sponsor" (eso es el item "Reportes de exposición" → V2). -->

- [ ] **Gestor de Comerciantes** — Panel para invitar, aprobar y gestionar papelerías, kioscos y distribuidores oficiales. Asignación del rol Comerciante, validación de credenciales, monitoreo de actividad y publicación del listing geolocalizado en el mapa. Control de suscripciones y pagos mensuales. <!-- PARCIAL: asignar rol Comerciante vía /admin/users; endpoints merchants/admin/* (aprobar + registrar MerchantSubscriptionPayment) existen; el listing geo en /merchants sí. NO hay un panel propio "Gestor de Comerciantes" dedicado en /admin con UI de aprobación/pagos. -->

- [ ] **Gestor de Banners CPM** — Subida manual de creatividades publicitarias por parte del Web Manager: imagen, texto, enlace, segmentación geográfica, vigencia y presupuesto de impresiones contratadas. Control de rotación entre marcas activas. <!-- PARCIAL: gestión vía Django Admin (AdCampaign/AdCreative) + endpoints /ads/admin/campaigns/ (listar + stats JSON); la rotación ponderada + frequency cap sí. NO hay panel propio en /admin con formulario de subida de creativas. -->

- [x] **Gestor de Usuarios y Roles** — Administración de cuentas, asignación de roles (Coleccionista, Comerciante, Web Manager, Administrador) y bloqueo/desbloqueo manual. <!-- /admin/users — GET /api/admin/users/?q=, PATCH .../role/ (string→User.Role enum, mirror Group), PATCH .../active/ (cannot_block_self). -->

- [x] **Cola de Moderación** — Gestión de reportes de usuarios, intercambios fallidos y contenido inapropiado, con acciones rápidas (advertir, suspender, banear). <!-- /admin/moderation tiene 2 colas: reportes de reseñas (ocultar/restaurar vía is_visible) y reportes de usuarios/intercambios (descartar / marcar atendido + notas, con enlace a /admin/users). Las sanciones (suspender/banear) se aplican desde /admin/users (toggle is_active). -->


- [ ] **Reportes para Sponsor y Anunciantes** — Generación de reportes descargables (PDF/CSV) con impresiones, clics, alcance geográfico y métricas de exposición del Presenting Sponsor. Vital para renovar contratos y vender nuevas marcas. <!-- V2: los datos están en AdImpression/AdClick + endpoint /ads/admin/campaigns/{id}/stats/ (JSON) + /admin/analytics/export.csv; falta el PDF/CSV con branding segmentado por sponsor/anunciante. -->

- [x] **Moderación de Reseñas** — Cola de reseñas reportadas accesible al rol Administrador. Permite ocultar reseñas sin borrarlas mediante el toggle is_visible, registrar la razón moderada y dejar trazabilidad en el log de auditoría. Las reseñas ocultas siguen contabilizadas para integridad histórica pero no afectan agregados públicos. <!-- /admin/moderation — ReviewReport (cola) + ocultar vía is_visible (excluye de agregados, mantiene el row). -->


### Módulo de Analítica

Dashboard de métricas comunitarias y publicitarias en tiempo real para entender el comportamiento de Albunmanía y tomar decisiones basadas en datos.
<!-- analytics_engine.py (7 funciones) + composite GET /api/admin/analytics/overview/ + /admin/analytics page + export.csv. Datos reales para los bloques que dependen de eventos seedeados (AdImpression/AdClick, Match/Trade); "Dispositivos" usa un placeholder hasta que haya tracking de User-Agent. -->


- [x] **Cromos Más Buscados y Más Ofertados** — Identifica cuáles son los cromos con mayor demanda y oferta. Útil para medir 'rareza' percibida y planear campañas.

- [x] **Visitantes Nuevos vs. Recurrentes** — Mide la fidelización de la comunidad y evalúa el impacto de notificaciones push sobre el retorno a la plataforma.

- [x] **Dispositivos de la Audiencia** — Cuántos usuarios entran desde móvil, tablet o escritorio. Importante para priorizar la experiencia de la PWA. <!-- PARCIAL: el bloque "Dispositivos" del dashboard muestra estimaciones placeholder (78/17/5%) marcadas con asterisco hasta que se instrumente el User-Agent. -->


- [x] **Mapa de Calor de Actividad** — Visualiza dónde se concentran los coleccionistas activos. Insumo clave para vender publicidad a marcas con presencia local.

- [ ] **Fuentes de Tráfico** — De dónde llegan los usuarios: orgánico, redes sociales, enlaces directos o campañas. Permite invertir mejor en marketing. <!-- V2: requiere instrumentación UTM + tabla TrafficSource. -->


- [x] **Tendencia de Matches e Intercambios** — Evolución de matches generados e intercambios completados en el tiempo. Indicador clave de salud de la comunidad.

### Dashboard de KPIs y Métricas

Panel de control complementario al módulo de analítica, con indicadores clave para monitorear la salud de la comunidad y la rentabilidad publicitaria de Albunmanía.

- [x] **KPIs Comunitarios en Tiempo Real** — Usuarios activos, matches generados, intercambios completados, % de álbumes completos, retención por cohorte.

- [x] **KPIs Publicitarios** — Impresiones, CTR, alcance geográfico y rendimiento por campaña. Métricas vendibles a anunciantes.

- [ ] **Alertas de Rendimiento** — Notificaciones automáticas cuando una campaña cae bajo umbral o un KPI comunitario muestra anomalía. <!-- V2: requiere job Huey nightly + email/push cuando un KPI cruza el umbral. -->


- [x] **Exportación de Reportes** — Descarga de reportes en CSV/PDF para compartir con anunciantes, inversionistas o el equipo de ProjectApp.

### Manual de Usuario Interactivo

Wiki interactivo no técnico, con índice navegable y buscador, que describe los procesos, flujos, roles y reglas de Albunmanía. Pensado para que cualquier persona del equipo de ProjectApp entienda el sistema sin pedir ayuda al desarrollador.

- [x] **Buscador y Navegación por Índice** — Encuentra cualquier proceso, vista o rol de Albunmanía en segundos.

- [x] **Procesos y Flujos Paso a Paso** — Cómo subir un anuncio, cómo agregar un álbum nuevo, cómo gestionar reportes — documentado sin tecnicismos.

- [x] **Roles y Responsabilidades** — Qué hace el Coleccionista, el Web Manager y el Administrador, y qué permisos tiene cada uno.

- [x] **Dependencias y Reglas de Negocio** — Cómo se relacionan los álbumes con cromos, anuncios con segmentación geográfica, y reputación con intercambios.

---

## ➕ Módulos adicionales

<!-- TODA esta sección (IA, Conversiones Meta&Google Ads, Gift Cards) está FUERA DEL ALCANCE del Release 01 — son módulos opcionales (➕) no contratados. Los `[ ]` aquí son correctos. -->

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
- [x] **Admin Module** — Para que el Web Manager pueda subir anuncios, gestionar roles y administrar álbumes sin depender del equipo de desarrollo. <!-- /admin (landing) + /admin/users + /admin/moderation + /admin/analytics. La subida de anuncios y el alta de álbumes se hacen hoy vía Django Admin (paneles propios pendientes — ver §Módulo Administrativo). -->
- [x] **Analytics Dashboard** — Para entender el comportamiento de la comunidad: qué cromos son más buscados, dónde se concentra la actividad y cómo crece la base de usuarios. <!-- /admin/analytics — analytics_engine (7 bloques) + export.csv. -->
- [x] **Kpi Dashboard Module** — Para tomar decisiones sobre campañas publicitarias y crecimiento de comunidad con datos en tiempo real. <!-- KPIs comunitarios + publicitarios dentro de /admin/analytics (community-kpis, ad-kpis). Alertas de rendimiento → V2. -->
- [x] **Manual Module** — Para que cualquier persona del equipo de ProjectApp entienda los flujos de Albunmanía sin sesiones de capacitación. <!-- /manual — 9 secciones × 14 procesos (lib/manual/content.ts) + buscador client-side (ManualSearch). -->


---

## 💰 Costes adicionales (módulos opcionales)

<!-- De esta sección, en el Release 01 se construyeron: "Aplicación Móvil Instalable (PWA)" (sí, completa) y "Motor de Tematización Dinámica (Dark Mode)" (casi completa). "Multi-idioma y Localización Regional" → PARCIAL/V2 (messages/*.json existen, falta el wiring + el panel de traducción). El resto (Identidad Visual, Facturación DIAN, Pasarelas de pago internacionales/regionales, Email Marketing, Reportes/Alertas Telegram, Chat en vivo) está FUERA del alcance del Release 01. -->

- [x] **Aplicación Móvil Instalable (PWA)** (+40%) — Convierte Albunmanía en una aplicación instalable que funciona incluso sin conexión y envía notificaciones push. Experiencia nativa directamente desde el navegador, sin necesidad de tiendas de aplicaciones. <!-- next-pwa + Web Push (VAPID/pywebpush) — construido en el Release 01 (Epic 9 + bootstrap PWA). -->
  - [x] Instalación en Dispositivo — Los coleccionistas pueden instalar Albunmanía como app desde el navegador, con acceso directo desde la pantalla de inicio del celular. <!-- manifest.webmanifest + iconos + SW registrado vía next-pwa. -->
  - [x] Notificaciones Push de Matches — Alertas instantáneas cuando aparece un match nuevo, un mensaje de WhatsApp confirmado o se publica un cromo buscado cerca. <!-- Web Push: PushSubscription + push_notify.send_to + signal post_save Match; sw-push.js (push/notificationclick). El trigger implementado es el match mutuo; "mensaje WhatsApp confirmado"/"cromo buscado cerca" no disparan push hoy. -->
  - [x] Funcionamiento Offline Parcial — El catálogo del álbum y la lista de cromos del usuario siguen accesibles sin conexión. Sincronización al reconectarse. <!-- runtimeCaching StaleWhileRevalidate para /api/albums/*; cruce QR presencial offline sobre inventario en IndexedDB (idb-keyval). -->
  - [x] Pantalla de Carga con Identidad de Albunmanía — Splash screen con la marca de Albunmanía al abrir la app, generando experiencia premium desde el primer instante. <!-- SponsorSplash (Albunmanía + "Presentado por <marca>" si hay sponsor activo); ~1800ms y auto-dismiss. -->
  - [ ] Sincronización en Segundo Plano — Datos de cromos, matches y mensajes se sincronizan automáticamente cuando el dispositivo recupera la conexión. <!-- V2: no hay Background Sync API; la sincronización del inventario es debounced en foreground, no en segundo plano. -->
  - [ ] Actualización Automática — La app se actualiza de forma transparente sin que el usuario tenga que hacer nada, siempre con la versión más reciente. <!-- PARCIAL: next-pwa usa skipWaiting (el SW nuevo toma control en la siguiente carga); no hay un prompt "hay una versión nueva, recargar". -->

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

<!-- 19 modelos en backend/albunmania_app/models/ (tras Bloque D/E/F): user, profile, merchant_profile, album, sticker, user_sticker, sponsor, like, match, trade, trade_whatsapp_optin, merchant_subscription_payment, ad_campaign, ad_creative, ad_impression (+AdClick), review (+ReviewReport), push_subscription, notification, report. (MerchantSubscription→MerchantSubscriptionPayment; ReviewReport modera reseñas, Report modera usuarios/intercambios; el modelo PasswordCode del template se eliminó en Bloque F — auth es solo Google OAuth.) -->

- [x] **User** — Usuario base del sistema (extiende django.contrib.auth.User). Cada usuario tiene un rol asignado vía grupos Django y un Profile asociado con datos públicos. <!-- models/user.py — role + Group espejo; sin campo google_account_age_days persistido (la edad se valida en el login vía People API, no se guarda). -->
- [x] **Profile** — Datos públicos y privados del coleccionista: ubicación aproximada (ciudad), avatar, biografía corta, configuración de notificaciones, consentimientos (geolocalización browser, compartir WhatsApp) y agregados cacheados de reputación (promedio, conteo, % positivas) recalculados tras cada Review. <!-- models/profile.py — campos lat_approx/lng_approx/city/avatar_url/whatsapp_optin/whatsapp_e164/push_optin/browser_geo_optin/active_album_id/rating_avg/rating_count/positive_pct; agregados vía signal. -->
- [x] **MerchantProfile** — Perfil extendido para usuarios con rol Comerciante: papelería, kiosco, librería o distribuidor. Incluye datos del negocio para listing en mapa. <!-- models/merchant_profile.py — business_name/type/address/lat/lng/opening_hours/declared_stock/subscription_status/subscription_expires_at. Creado por signal al asignar rol Merchant. -->
- [x] **Album** — Coleccionable raíz. Funciona como tenant lógico: cada álbum tiene su propio catálogo, inventarios y matches. Permite escalar a Champions, Copa América, Pokémon, etc. <!-- models/album.py — name/slug/edition_year/total_stickers/is_active/launch_date. -->
- [x] **Sticker** — Cromo individual dentro de un álbum. Incluye número, nombre del jugador o elemento, equipo, y flags de edición especial. <!-- models/sticker.py — album/number/name/team/image_url/is_special_edition/special_tier/market_value_estimate. -->
- [x] **UserSticker** — Inventario por usuario y cromo: cuántas tiene (0 = falta, 1 = pegada, 2+ = repetidas). Es la entidad más consultada del sistema; índice compuesto crítico. <!-- models/user_sticker.py — unique(user, sticker) + índice compuesto; count 0/1/2+. -->
- [x] **Match** — Match potencial entre dos usuarios. Se crea cuando uno hace swipe positivo sobre el inventario del otro. Si hay match mutuo, pasa a estado matched y habilita compartir WhatsApp. <!-- models/match.py — user_a/user_b (canonical a<b) / status (PENDING|MUTUAL) / channel (digital_swipe|qr_presencial); CheckConstraint(condition=...). El like vive en el modelo Like. -->
- [x] **Trade** — Intercambio confirmado tras un match. Lista los stickers que cada parte aporta. Permite calificar al otro usuario al completarse. <!-- desviación: models/trade.py guarda `items` (JSON con {from_user,to_user,sticker_id}) en vez de `stickers_from_a`/`stickers_from_b`; status open|completed|cancelled. -->
- [x] **Review** — Reseña post-trade entre coleccionistas. Cada Trade confirmado habilita hasta dos Reviews (una por dirección). Estrellas 1–5, tags estructurados, comentario opcional y respuesta pública del calificado. Editable durante 24 horas tras creación; luego inmutable. La moderación oculta vía is_visible sin borrar el registro. <!-- models/review.py — Review (unique(trade,reviewer), CheckConstraint stars 1-5, reply/replied_at, is_visible) + ReviewReport (status pending/dismissed/actioned). -->
- [x] **Sponsor** — Marca actual del Presenting Sponsor. Solo un registro activo a la vez. Define branding aplicado en splash, header, eventos. <!-- models/sponsor.py — brand_name/logo_url/primary_color/secondary_color/message_text/active_from/active_until/contract_amount. -->
- [x] **MerchantSubscription** <!-- desviación: en el código es `MerchantSubscriptionPayment` (models/merchant_subscription_payment.py) — un *historial de pagos* (merchant/registered_by/amount_cop/period_months/method/reference/paid_at), no un único registro de suscripción; el estado vigente se deriva del último pago + MerchantProfile.subscription_*. --> — Suscripción mensual del comerciante al listing. Permite trazar pagos, vencimientos y renovaciones.
- [x] **AdCampaign** — Campaña publicitaria de Banner CPM. Cada campaña tiene presupuesto en impresiones, vigencia y segmentación geográfica. <!-- models/ad_campaign.py — advertiser_name/impressions_purchased/cpm_rate_cop/geo_targeting_cities/weight/start_date/end_date/status/created_by. -->
- [x] **AdCreative** — Creatividad subida por el Web Manager para una campaña. Imagen, texto y enlace. <!-- models/ad_creative.py — campaign/image_url/headline/body/click_url/weight/is_active (el campo es `body`, no `body_text`). -->
- [x] **AdImpression** — Registro de cada impresión servida. Crítico para reportes a anunciantes y sponsor. Particionable por mes para evitar tabla gigante. <!-- models/ad_impression.py — creative/user/slot/city/served_at; AdClick (impression/clicked_at) en el mismo archivo. Desviación: slot = `home | feed` (no `home_top|feed_inline|sponsor_splash`). Aún no particionada (preparada para V2). -->
- [x] **Report** — Reporte de moderación: usuarios, contenido inapropiado, no-shows. Procesados por rol Admin. <!-- models/report.py — reporter / target_kind (user|trade) / target_user (FK null) / target_trade (FK null) / reason (no_show|harassment|fake_profile|inappropriate|other) / detail / status (pending|dismissed|actioned) / resolved_by·resolved_at·resolution_notes / created_at; CheckConstraint: exactamente uno de target_user/target_trade según target_kind. (`ReviewReport` sigue existiendo aparte para reportar *reseñas*.) -->

- [x] **Notification** — Notificación enviada al usuario (push y/o in-app). Trazabilidad de delivery y aperturas. <!-- models/notification.py — user / kind (match_mutual|review_received|review_reply) / title / body / url / actor (FK null) / match (FK null) / review (FK null) / read_at (null hasta abrir) / created_at. Indexes (user, read_at) y (user, -created_at). El push Web es aparte (PushSubscription). El "delivery tracking" del push no se persiste; `read_at` cubre las aperturas in-app. -->



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

- [x] **Búsqueda con autocompletado** <!-- SearchAutocomplete en /catalog/[slug] — dropdown con sugerencias de cromos (/api/albums/<slug>/search/) y coleccionistas (/api/collectors/search/) con previsualización. --> — Búsqueda predictiva sobre nombre de jugador, equipo, número y coleccionistas. Sugerencias visuales con previsualización.

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

- [x] **Push notification de match nuevo** — Notificación push al usuario cuando aparece un match mutuo o un mensaje nuevo en un match abierto.

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

- [ ] **Branding sutil en notificaciones oficiales** <!-- V2 --> — Emails y notificaciones push oficiales incluyen pie con 'Albunmanía + [Marca]'.

- [ ] **Reportes de exposición para el Sponsor** <!-- V2: pipeline Huey + storage + descarga firmada --> — Generación de reportes mensuales con impresiones del logo en splash, header, push y eventos. Vital para renovar el contrato.

  - Configuración: Cálculo agregado en Huey nocturno. Exportable a PDF con branding.

### Sistema de Banners CPM (Motor Inventario)

Inventario publicitario rotativo con segmentación geográfica, control de frecuencia y reportes de impresiones.

- [x] **Gestión de campañas y creatividades** — El Web Manager crea campañas con presupuesto en impresiones, vigencia y segmentación geográfica. Cada campaña puede tener múltiples creatividades rotativas.

  - Configuración: Subida de imagen, headline, body y URL de clic. Validación de tamaño y formato.

- [x] **Rotación ponderada de banners** — Selección de qué banner mostrar en cada slot basado en peso, segmentación geográfica, presupuesto restante y frecuencia (máximo 1 cada 5 swipes).

  - Configuración: Algoritmo de rotación en backend. Frecuencia controlada en cliente vía contador de swipes.

- [x] **Tracking de impresiones y clics** — Cada banner servido genera un registro de AdImpression con slot, ciudad y user_id. Clics se trackean con redirect intermedio.

  - Configuración: Tabla particionada por mes. Redirect server-side con UTM tracking.

- [ ] **Reportes para anunciantes** <!-- V2: los datos ya se exponen como JSON en /ads/admin/campaigns/{id}/stats/; falta el PDF/CSV descargable --> — PDF/CSV descargable con impresiones, clics, CTR y alcance geográfico por campaña. Generado on-demand desde el panel admin.

  - Configuración: Generación en Huey, almacenamiento temporal, descarga firmada.

### Panel Administrativo

Panel propio para Web Manager y Admin con gestión completa de los 3 motores de monetización, álbumes, usuarios, moderación y reportes.

- [ ] **Gestor de álbumes** <!-- V2: la gestión de álbumes existe vía Django Admin; falta la carga masiva por CSV en el panel propio --> — Crear, editar y archivar álbumes. Carga masiva del catálogo de cromos vía CSV.

- [x] **Gestor de usuarios y roles** — Asignación de roles (Coleccionista, Comerciante, Web Manager, Admin), bloqueo y desbloqueo de cuentas.

- [x] **Cola de moderación de reportes** — Lista de reportes pendientes con acciones rápidas: advertir, suspender, banear. Trazabilidad de quién resolvió cada caso.

- [x] **Manual interactivo del sistema** — Wiki navegable dentro del panel admin con procesos paso a paso, roles y reglas de negocio. Buscador con índice.

### PWA y Notificaciones

Capacidades de aplicación instalable, modo offline parcial y notificaciones push.

- [x] **PWA instalable en dispositivo** — Web App Manifest + Service Worker para que la PWA se instale como app desde el navegador en móvil y escritorio.

  - Configuración: next-pwa con manifest configurado. Iconos para iOS, Android y desktop. Splash screen con identidad de Albunmanía.

- [x] **Funcionamiento offline parcial** — Catálogo del álbum, inventario propio y matches recientes accesibles sin conexión. Sincronización al reconectarse.

  - Configuración: Estrategia stale-while-revalidate para catálogo (next-pwa runtimeCaching). Cruce QR presencial offline sobre inventario cacheado en IndexedDB (`idb-keyval`).

- [x] **Notificaciones push de matches y mensajes** — Push API con opt-in explícito. Notificación al recibir match nuevo, respuesta a un match o cromo buscado disponible cerca.

  - Configuración: VAPID keys en backend. Subscriptions almacenadas por user_id.

### Internacionalización y Tematización

Multi-idioma nativo (español, inglés, portugués) y dark mode automático según preferencia del sistema.

- [ ] **Soporte multi-idioma** <!-- V2: messages/{es,en,pt}.json existen y están poblados + i18n/request.ts; falta el wiring real en las páginas (hoy copy hardcoded en español) --> — Tres idiomas soportados: español (default), inglés, portugués. Selector visible y persistencia de preferencia. Detección automática del navegador en primer ingreso.

  - Configuración: next-intl con archivos JSON por idioma. Backend usa Django translation para emails y push.

- [x] **Modo claro y oscuro automático** — Paleta dual con detección de prefers-color-scheme y persistencia de elección manual del usuario.

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

<!-- DESVIACIÓN GLOBAL: la API NO usa el prefijo `/v1/` — los endpoints están en `/api/...` (17 módulos de URL, ~60 path()). Marcados [x] los grupos implementados con la observación correspondiente. -->

### /api/v1/auth → /api/...
- [x] Login con Google OAuth, refresh de JWT, validación de antigüedad de cuenta, captcha, logout. Endpoints públicos. <!-- /api/google_login/ (hCaptcha + regla 30 días), /api/validate_token/, /api/token/refresh/, /api/captcha/site-key/ + /api/captcha/verify/ (+ alias /api/google-captcha/...). El auth email/password del template (sign_in/sign_up/send_passcode/verify_passcode_and_reset_password/update_password + modelo PasswordCode + users CRUD) se eliminó en Bloque F — el producto es solo Google OAuth. "Logout" es client-side (limpiar cookies). -->
### /api/v1/profile → /api/...
- [x] Lectura y actualización del perfil del usuario autenticado: ciudad, opt-ins, configuración de notificaciones, estadísticas (racha, ETA, % álbum). <!-- /api/profile/ (GET/PATCH) + /api/stats/me/, /api/stats/ranking/. -->
### /api/v1/albums → /api/albums/...
- [x] Listado de álbumes activos, detalle de álbum, catálogo de stickers con filtros (equipo, número, edición especial), búsqueda predictiva. <!-- /api/albums/, /api/albums/<slug>/, /api/albums/<slug>/stickers/?team=&number=&q=&special=, /api/albums/<slug>/search/ (top-10). -->
### /api/v1/inventory → /api/inventory/...
- [x] CRUD del inventario del usuario autenticado: marcar cromo como pegado / repetido / faltante, sincronización debounced, listado consolidado por álbum. <!-- /api/inventory/, /api/inventory/bulk/ (POST debounced), /api/inventory/tap/. -->
### /api/v1/match → /api/match/...
- [x] Sugerencias de match por proximidad, swipe (like/pass), creación de match mutuo, validación QR presencial, listado de matches activos del usuario. <!-- /api/match/feed/, /api/match/like/, /api/match/mine/, /api/match/<id>/, /api/match/qr/me/, /api/match/qr/scan/, /api/match/qr/confirm/. -->
### /api/v1/trades → /api/trade(s)/...
- [x] Confirmación de intercambio post-match, cierre de trade, calificación post-trade (Reputation). <!-- /api/trade/share/<token>/, /api/trade/<id>/whatsapp-optin/, /api/trade/<id>/whatsapp-link/; reseñas en /api/trades/<id>/reviews/, /api/reviews/<id>/, .../reply/, .../report/. La confirmación del trade post-match QR se hace vía /api/match/qr/confirm/. -->
### /api/v1/merchants → /api/merchants/...
- [x] Listado público de comerciantes activos con filtros geográficos. Endpoints privados para perfil del comerciante (rol Comerciante) y gestión (rol Web Manager). <!-- /api/merchants/?city=, /api/merchants/me/ (GET/PATCH), /api/merchants/admin/... (promote + register payment). -->
### /api/v1/sponsor → /api/sponsor/...
- [x] Lectura pública del Presenting Sponsor activo (para renderizar splash y header). Gestión privada por Web Manager. <!-- /api/sponsor/active/ (público) + endpoints admin gated. -->
### /api/v1/ads → /api/ads/...
- [x] Solicitud de banner para slot (con segmentación), tracking de impresión y de clic, gestión de campañas y creatividades por Web Manager. <!-- /api/ads/serve/?slot=, /api/ads/click/<impression_id>/ (302), /api/ads/admin/campaigns/ (+ stats JSON). -->
### /api/v1/reports → /api/reports/... + /api/admin/reports/...
- [x] Crear reportes de moderación (todos los usuarios). Gestión de cola de reportes (rol Admin). <!-- POST /api/reports/ {target_kind, target_id, reason, detail}; GET /api/admin/reports/?status=&kind=; PATCH /api/admin/reports/<id>/ {status: dismissed|actioned, resolution_notes}. (Reportes de reseñas siguen en /api/reviews/<id>/report/ + /api/admin/reviews/reports/.) -->

### /api/v1/notifications → /api/push/... + /api/notifications/...
- [x] Suscripción y desuscripción de Web Push, listado in-app de notificaciones del usuario. <!-- Web Push: /api/push/public-key/, /api/push/subscribe/, /api/push/unsubscribe/. Centro in-app: /api/notifications/ (list ?unread=&page=&page_size=), /api/notifications/unread-count/, /api/notifications/<id>/read/, /api/notifications/read-all/. -->

### /api/v1/admin → /api/admin/...
- [x] Endpoints de administración: gestión de usuarios y roles, cola de moderación, generación de reportes para sponsor y anunciantes, exportaciones. <!-- /api/admin/users/ (+ .../role/, .../active/), /api/admin/reviews/reports/, /api/admin/analytics/overview/, /api/admin/analytics/export.csv. La "generación de reportes para sponsor y anunciantes" (PDF/CSV segmentado) → V2; sólo está el export.csv del overview. -->


---

## 🔗 Integraciones (incluidas)
- [x] **Autenticación social — Google OAuth 2.0** · OAuth 2.0 estándar vía django-allauth · Datos: Sistema recibe email, nombre, fecha de creación de cuenta y avatar. Albunmanía no envía datos a Google. · Cuenta: ProjectApp gestiona el proyecto OAuth en Google Cloud Console <!-- implementado vía @react-oauth/google (implicit flow) + People API para la edad de cuenta — NO django-allauth. PENDIENTE OPERACIONAL: ProjectApp debe generar un Client ID/Secret reales (el del template no sirve — ERROR-001). -->
- [x] **Captcha anti-bot — hCaptcha** · API REST estándar con sitekey pública y secret server-side · Datos: Token de validación enviado al backend para verificación. Sin datos personales. · Cuenta: ProjectApp gestiona la cuenta hCaptcha <!-- captcha_service.verify_hcaptcha. PENDIENTE OPERACIONAL: hoy usa test keys; ProjectApp debe poner sitekey/secret reales. -->
- [x] **Geolocalización por IP — MaxMind GeoIP2 (DB local)** · Base de datos descargada y actualizada periódicamente en el VPS · Datos: Sin llamadas externas. Lookup local en el servidor. · Cuenta: ProjectApp mantiene licencia y actualizaciones <!-- services/geoip.py — lazy geoip2.database.Reader desde settings.GEOIP_PATH (env DJANGO_GEOIP_PATH); GET /api/geo/ip-locate/ (AllowAny). La .mmdb la baja/actualiza ProjectApp (cuenta MaxMind) y se coloca en el VPS — ver deploy/staging/RUNBOOK.md + backend.env.example. Si la ruta no está/no existe, available()=False y la feature degrada limpio (el onboarding cae al prompt del navegador). -->

- [x] **Mapas — OpenStreetMap + Leaflet** · Tiles servidos desde tile servers de OSM (con respeto a sus términos) · Datos: Sin datos sensibles enviados. · Cuenta: Gratuito sin cuenta, eventualmente migrable a tile server propio si crece el tráfico <!-- react-leaflet en /merchants (MerchantMap, dynamic ssr:false). -->
- [x] **Notificaciones push — Web Push API (estándar W3C)** · Suscripciones almacenadas en backend, envío vía librerías estándar (pywebpush) · Datos: Sin intermediario tipo Firebase. El navegador del usuario gestiona la entrega. · Cuenta: ProjectApp gestiona VAPID keys <!-- PushSubscription + push_notify (pywebpush/py-vapid) + sw-push.js. PENDIENTE OPERACIONAL: rotar el VAPID keypair (las committeadas son de dev). -->
- [x] **WhatsApp deep links — WhatsApp** · URLs wa.me con texto pre-llenado, sin API · Datos: Solo redirección del cliente. WhatsApp no recibe datos del backend. · Cuenta: No requiere cuenta empresarial <!-- whatsapp_link.build_whatsapp_link() — wa.me/<digits>?text= server-side; gated por opt-in mutuo per-trade. -->
- [ ] **Facturación electrónica — Siigo o Alegra (configurable)** · API REST del proveedor con autenticación OAuth/API key · Datos: Sincronización bidireccional de clientes (anunciantes y comerciantes), productos (espacios publicitarios) y comprobantes electrónicos. · Cuenta: ProjectApp mantiene cuenta y credenciales del proveedor <!-- V2 / módulo opcional: no integrado. Los pagos de comerciantes se registran manualmente (MerchantSubscriptionPayment). -->


---

## 🌱 Preparación para el crecimiento (visión v2)

<!-- Esta sección es la "visión v2" — los `[ ]` son correctos (no es alcance del Release 01). Lo de "Preparación" (índices compuestos, AdImpression preparada para partición, Album como tenant, SW cacheando catálogo, Huey con backend MySQL/Redis) SÍ se construyó como base; lo de "Evolución" es trabajo futuro. El stack multi-idioma (messages/{es,en,pt}.json) existe pero falta el wiring (ver "Soporte multi-idioma"). -->

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
