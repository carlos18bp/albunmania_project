# Product Requirement Document — Albunmanía

**Cliente:** ProjectApp · **Estado release 01:** accepted · **Idioma producto:** español

---

## 1. Visión

Albunmanía es la **primera comunidad colombiana digital de intercambio de cromos del Mundial 26**. Nace para capturar el fenómeno cultural masivo del álbum (5M+ usuarios reportados por Panini en 2018, 10M de paquetes vendidos solo en EE.UU. para 2010) en una experiencia móvil instalable que reemplaza los grupos caóticos de WhatsApp y publicaciones dispersas en Marketplace por un flujo profesional, fluido y seguro.

## 2. Problema

El intercambio de cromos en Colombia y Latinoamérica ocurre hoy de forma fragmentada en grupos de WhatsApp con cientos de mensajes desordenados, sin geolocalización, sin reputación, sin filtros y sin verificación. Esto genera fricción, no-shows y fraude. Albunmanía resuelve la brecha con **mecánica viral del swipe + cierre vía WhatsApp** sobre catálogo precargado.

## 3. Usuarios y roles

| Rol | Descripción | Capacidades clave |
|-----|-------------|-------------------|
| **Coleccionista** | Usuario final | Cataloga cromos (0/1/2+), match swipe + QR presencial, cierra trades via WhatsApp opt-in, reseña post-trade |
| **Comerciante** | Papelería, kiosco, librería, distribuidor oficial | Dashboard propio, listing en mapa con suscripción mensual, declarar stock |
| **Web Manager** | Equipo ProjectApp | Subir creativas Banner CPM, configurar Presenting Sponsor, aprobar comerciantes |
| **Administrador** | Gestión global | Álbumes, usuarios, moderación de reportes y reseñas, reportes para sponsor |

## 4. Features (release 01) — fuente: `docs/release/01-release-checklist.md`

### Vistas (21)
Inicio, Login Google + Captcha, Onboarding, Dashboard Coleccionista, Mis Cromos, Faltantes, Buscador con Filtros, Match (Swipe), Mapa de Coleccionistas, Perfil con pestaña Reseñas, Notificaciones, T&C, Privacidad, FAQ, Match QR Presencial, Mis QRs Compartibles, Dashboard Comerciante, Ranking por Ciudad, Detalle de Trade.

### Componentes (18)
Header, Footer, Sticker Card, Swipe Card, Banner CPM, Espacio Presenting Sponsor, Widget de Reseñas, FAQ, Live Badge, Badge Edición Especial, QR Compartible Animado, Stat Card racha+ETA, Review Card, Formulario Reseña Post-Trade, Rating Summary, Drawer de Reseñas.

### Funcionalidades clave
PWA instalable, Google OAuth + hCaptcha + verificación cuenta >30 días, geolocalización dual (IP + browser), motor match por proximidad, WhatsApp opt-in, sistema 4 roles, multi-álbum (Mundial 26 + Champions + Copa América + Pokémon), sistema reseñas (★1–5 + tags + reply + 24h editable), contador rápido 0/1/2+, stats avanzadas (racha + ETA + comparativa ciudad), match QR offline, listas QR compartibles WhatsApp/Instagram, onboarding como invitado, búsqueda predictiva, live badge, ediciones especiales destacadas.

### Módulos
Admin (gestor álbumes/sponsor/comerciantes/banners/usuarios + cola moderación + reportes), Analítica (cromos buscados/ofertados, visitantes, dispositivos, mapa calor, fuentes tráfico, tendencia matches), KPIs Dashboard (comunitarios + publicitarios + alertas + export), Manual interactivo (buscador + flujos + roles + reglas).

## 5. Reglas de negocio críticas

- **Verificación cuenta Google ≥ 30 días** antes de permitir registro.
- **Reseña única por (Trade, Reviewer)**, editable solo durante 24h tras creación; luego inmutable. Moderación oculta sin borrar (`is_visible`).
- **Solo 1 Presenting Sponsor activo** simultáneamente.
- **Banner CPM frecuencia controlada**: máximo 1 cada 5 swipes.
- **Listing comerciante visible solo si suscripción al día** ($150–250K COP/mes).
- **Match QR presencial 100% offline** una vez cargado el inventario.
- **Compartir WhatsApp requiere opt-in mutuo por trade** (no global).
- **Aclaración obligatoria** en T&C, footer y FAQ: NO afiliación oficial con FIFA o Panini.

## 6. Modelo de monetización

Tres motores de ingreso simultáneos:
1. **Presenting Sponsor anchor** — alianza estratégica con marca grande, branding en splash + header + push.
2. **Listing de Comerciantes** — suscripción mensual.
3. **Banner CPM Home + Feed** — espacios publicitarios escalables con tracking de impresiones y clics.

## 7. Integraciones (incluidas)

Google OAuth 2.0, hCaptcha, MaxMind GeoIP2, OpenStreetMap + Leaflet, Web Push API (W3C estándar, sin Firebase), WhatsApp deep links, Siigo o Alegra (facturación electrónica DIAN).

## 8. KPIs comunitarios y publicitarios objetivo

Comunitarios: usuarios activos, matches generados, intercambios completados, % álbumes completos, retención por cohorte, racha promedio.
Publicitarios: impresiones servidas, CTR, alcance geográfico por campaña, exposición acumulada del Presenting Sponsor.

## 9. Oportunidad temporal

**Faltan menos de 6 semanas para el inicio del Mundial 26.** Construir antes del kickoff la primera comunidad colombiana de intercambio.

## 10. Visión post-release 01

Escalar a Champions, Copa América, Pokémon (multi-álbum nativo); expansión geográfica México/Argentina/Brasil; módulos opcionales: IA (matching inteligente, moderación, asistente), Conversiones server-side Meta+Google, Gift Cards, pasarelas pago, email marketing, alertas Telegram, multi-idioma (es/en/pt), dark mode, chat first-party.
