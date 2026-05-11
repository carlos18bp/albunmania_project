---
trigger: manual
description: Project intelligence and lessons learned. Reference for project-specific patterns, preferences, and key insights discovered during development.
---

# Lessons Learned — Albunmanía

Patrones, preferencias e inteligencia del proyecto que ayudan a trabajar más eficazmente con este codebase. Se actualiza al detectar nuevos insights.

---

## 1. Patrones de arquitectura heredados del template (reusables verbatim)

### Single Django app
- Todo el dominio vive en `backend/albunmania_app/` (post-rename A2). Modelos, views, serializers, services bajo subdirectorios.
- No hay split en múltiples Django apps todavía — el dominio del release 01 cabe en un solo app.

### Service layer
- Lógica de negocio en `services/`, **no** en views.
- Views son thin wrappers FBV (`@api_view` + decoradores) que llaman a service methods.
- Referencia: `services/email_service.py` del template.

### URLs split por dominio
- `urls/<dominio>.py` (ej: `urls/auth.py`, `urls/captcha.py`) — no monolítico.
- Registro central en `urls/__init__.py`.

### Serializers split por operación
- `<model>_list.py`, `<model>_detail.py`, `<model>_create_update.py` — uno por uso.
- Permite distinta validación/campos por flujo sin condicionales.

### Views function-based con DRF decorators
- **Todas** las views usan `@api_view([...])` y `@permission_classes([...])`.
- Nunca convertir a class-based views salvo petición explícita.

### Management commands para fake data
- Pattern: `create_<entity>.py` por modelo (factory-boy + faker).
- Comando paraguas `create_fake_data` orquesta los individuales.
- `delete_fake_data` protege superusers.

### Test helpers compartidos
- `conftest.py` global en `backend/` con fixtures cross-app (`api_client`, etc.).
- Tests por capa: `tests/{models,serializers,views,services,utils,commands}/`.

---

## 2. Convenciones de código

### Backend (Python)
- snake_case en todo (PEP 8).
- Lint con `ruff` (config heredada).
- Imports absolutos siempre (no relativos).

### Frontend (TypeScript)
- Components: PascalCase (`SwipeCard.tsx`).
- Hooks: camelCase con `use` (`useSwipeGesture.ts`).
- Stores: camelCase (`authStore.ts`, `inventoryStore.ts`).
- Tests colocados en `__tests__/` junto al archivo testeado.

### Bilingual content (Albunmanía-specific)
- Modelos con campos paralelos cuando aplica: `title_es`/`title_en`/`title_pt`.
- Frontend lee según locale activo via `next-intl`.
- Locale por defecto: `es` (mercado primario Colombia).

---

## 3. Workflow de desarrollo

### Backend siempre con venv activo
```bash
source backend/venv/bin/activate && <command>
# ej:
source backend/venv/bin/activate && pytest backend/albunmania_app/tests/views/test_auth_endpoints.py -v
```

### Huey en modo inmediato en desarrollo
- Si `DJANGO_ENV != 'production'`, las tareas Huey se ejecutan **síncronamente** en el mismo proceso.
- No requiere Redis ni worker separado para dev.
- Las tareas siguen necesitando ser importables y funcionar.

### Frontend dev proxy
- Next.js proxy a Django en `127.0.0.1:8000` para `/api`, `/admin`, `/static`, `/media`.
- Ambos servidores corriendo simultáneos en dev.
- En producción todo va por Django (Nginx → Gunicorn).

### Reglas duras de testing (del CLAUDE.md raíz)
- **Nunca** `pytest` sin path. Siempre archivo o módulo específico.
- **Backend**: `source venv/bin/activate && pytest path/to/test_file.py -v`.
- **Frontend unit**: `npm test -- path/to/file.spec.ts`.
- **E2E**: máximo 2 archivos por `npx playwright test`. Usar `E2E_REUSE_SERVER=1` si dev server ya corre.
- Cada test verifica **UNA** conducta observable.
- Mock solo en boundaries (APIs externas, clock, email).
- AAA pattern: Arrange → Act → Assert.

---

## 4. Patrones específicos de Albunmanía (a establecer durante Bloque B)

### Bilingüismo del dominio
- Modelos con descripción visible al usuario llevan campos `_es`/`_en`/`_pt` cuando aplica (ej: `Album.name`, `Sticker.name`).
- Modelos internos (Match, Trade, AdImpression) sin variantes — son datos.

### Inventario por toque (UX clave)
- `UserSticker.count` semántica: 0 = falta, 1 = pegada, 2+ = repetida.
- Sincronización **debounced** cliente → servidor cada 2s.
- Conflictos: last-write-wins (no CRDT — release 01 no lo justifica).

### QR firmado con HMAC
- Patrón estándar: payload JSON + `hashlib.hmac` con `DJANGO_SECRET_KEY` derivada.
- Verificación server-side antes de aceptar match.
- Para QRs públicos compartibles: incluir `expires_at` y firmar también la expiración.

### Match offline (cache catálogo en SW)
- Service Worker cachea catálogo del álbum activo + inventario propio en IndexedDB.
- Cruce de inventarios al escanear QR cara-a-cara se hace **en cliente**, sin llamada al servidor.
- Solo el `POST /api/v1/match/qr/confirm` requiere conexión.

### Reseñas: agregados cacheados en Profile
- Signal `post_save` y `post_delete` sobre `Review` recalcula `Profile.rating_avg`, `rating_count`, `positive_pct`.
- Operación atómica (UPDATE single-row).
- Idempotente — si falla a mitad, próxima reseña recalcula desde cero.
- Evita N+1 al renderizar listas en Match (Swipe Card incluye preview compacto).

### Banner CPM frecuencia
- Server-side decide qué banner mostrar (rotación ponderada + segmentación geo + presupuesto).
- Cliente respeta frecuencia local: máximo 1 banner cada 5 swipes (contador en Zustand store).

---

## 5. Anti-patrones explícitos a evitar

- ❌ **No** convertir views a class-based.
- ❌ **No** usar raw SQL con input del usuario (siempre ORM o `cursor.execute` con `%s` parametrizado).
- ❌ **No** desactivar CSRF globalmente. Solo `@csrf_exempt` en webhooks externos con verificación de firma.
- ❌ **No** exponer `fields = '__all__'` en serializers — siempre lista explícita (evita leak de password hashes, tokens, fechas internas).
- ❌ **No** correr `pytest` sin path.
- ❌ **No** generar PR sin actualizar `tasks/active_context.md`.
- ❌ **No** agregar features no pedidas en la épica activa (scope creep).
- ❌ **No** introducir abstracciones para hipotéticos casos futuros (3 líneas similares > abstracción prematura).
- ❌ **No** comentarios que repitan el qué (el código ya lo dice). Solo el por qué cuando no es obvio.

---

## 6. Decisiones de diseño Albunmanía-specific (acumuladas)

### Por qué `is_visible` en Review en vez de soft-delete
- Trazabilidad histórica para auditoría y disputas legales.
- Las reseñas ocultas siguen contabilizando para integridad pero no afectan agregados públicos.
- Permite restauración rápida si la moderación se equivoca.

### Por qué WhatsApp deep links sin API empresarial
- Cero costo recurrente de WhatsApp Business API.
- Opt-in mutuo por trade respeta privacidad sin necesidad de número verificado.
- Cierre del intercambio sucede en el canal donde la comunidad ya está cómoda.

### Por qué Web Push estándar W3C (no Firebase FCM)
- Datos propios, sin intermediario externo.
- VAPID es estándar y soportado por todos los navegadores principales.
- Sin lock-in con Google.

### Por qué AdImpression particionada por mes
- Tabla más caliente del sistema durante el Mundial (impresiones por usuario por slot por día).
- Particionado mensual permite queries rápidas + archivado/drop trivial.
- Reportes a anunciantes filtran por mes naturalmente.

---

## 7. Decisiones cerradas en Epic 1 (Auth & Onboarding)

### Por qué People API en vez de claims del id_token para verificar account age
- El id_token de Google **no incluye** `created_at`. Solo trae `iat` (token issuance) y `sub` (user id).
- La única vía oficial es **People API** `metadata.sources[].createTime` con scope `profile`. Requiere `access_token` (no id_token).
- El frontend usa `useGoogleLogin({ flow: 'implicit' })` para obtener access_token. El backend lo recibe y consulta People API.
- En DEBUG mode + access_token ausente, el backend **bypass-ea** la verificación con un warning de log para no romper dev local con clientes legacy. En prod ese mismo path devuelve 403.

### Por qué hCaptcha y no reCAPTCHA
- Spec del cliente lo pide explícitamente.
- Tiene **test keys oficiales** que siempre devuelven success en cualquier token: `sitekey=10000000-ffff-ffff-ffff-000000000001`, `secret=0x0000000000000000000000000000000000000000`. Las usamos en dev y CI.
- El servicio backend (`services/captcha_service.py`) abstrae el provider; el shim `verify_recaptcha` mantiene la API antigua durante una sesión de transición.

### Por qué Profile y MerchantProfile en lugar de extender User
- Mantiene `User` pequeño y compatible con `AbstractBaseUser` estándar.
- Profile lleva campos de presentación pública + opt-ins; MerchantProfile lleva datos de negocio. Permite borrar/reescribir cualquiera sin tocar el modelo de auth.
- `Profile.rating_*` son **agregados cacheados** (recomputados por signal post_save de Review en Epic 11) — evita N+1 al renderizar listas de coleccionistas en Match (Swipe Card).
- `MerchantProfile.is_listing_visible` es property, no field, para que el filtro de mapa siempre lea estado fresco.

### Por qué role + Group espejo en lugar de solo Role enum
- Permitir permissions de Django (Group-based) sobre el rol sin reinventar permisos.
- `User.assign_role()` es el único punto que toca `groups` para mantener coherencia.

### Por qué endpoint `/captcha/` Y `/google-captcha/` simultáneos
- El frontend en `sign-in/up` viejo apunta a `/google-captcha/site-key/`. Mantener el alias evita romper despliegues a medio actualizar.
- Quitamos el alias en una próxima épica (cuando todos los sitios apunten al nuevo path).

---

## 8. Insights heredados del bootstrap (mayo 2026)

- El template `base_django_react_next_feature` traía 6 modelos demo (Blog, Product, Sale, User, PasswordCode, StagingPhaseBanner) — solo User y PasswordCode se conservan.
- El template usa **reCAPTCHA**; Albunmanía exige **hCaptcha** según propuesta. Migración mínima de var names + paquete pip.
- El template trae custom `django_attachments` app — se reusa para covers de álbumes, imágenes de cromos y avatars (no reinventar).
- `easy-thumbnails` ya configurado con aliases small/medium/large — reutilizar para cromos.
- `django-cleanup` evita archivos huérfanos al borrar registros — clave para storage limpio.

---

## 9. Decisiones cerradas en Epic 3 (Match)

### Match QR offline-first: cliente es source of truth, server es sanity check
- El cruce `compute_offline_cross` es **una sola función** definida en `services/qr_cross.py` (Python) y portada byte-equivalente a `lib/stores/qrStore.ts` (TypeScript).
- En cambiatones físicos, el cliente la corre offline (sin red) sobre los inventarios cacheados con `idb-keyval`.
- Cuando la red vuelve, `POST /match/qr/confirm/` envía los items propuestos. **El server vuelve a correr `compute_offline_cross` con los inventarios reales en DB** y rechaza con 400 cualquier item no derivable. Así un cliente malicioso no puede fabricar trades de cromos que no posee.

### Haversine inline en lugar de PostGIS o `haversine` package
- `services/match_engine.py` usa `math.radians/sin/cos` puro para calcular distancias entre dos coordenadas.
- Bounding-box prefilter SQL (`lat_approx BETWEEN x AND y`) recorta candidatos antes del cálculo trigonométrico Python — mantiene la complejidad en O(K) donde K << total usuarios.
- PostGIS deferido a V2 (no soportado por MySQL en stack actual).

### Match canonical pair: `user_a < user_b` enforzado en DB
- `models.CheckConstraint(condition=Q(user_a__lt=F('user_b')))` + `UniqueConstraint(user_a, user_b, channel)`.
- El helper `Match.canonical_pair(x, y)` ordena los ids antes de cualquier insert.
- Beneficio: una pareja no puede tener dos rows del mismo canal sin importar quién likeó primero.

### Django 5.1+: `CheckConstraint(condition=...)` (no `check=`)
- `check=` fue deprecado y eliminado. Si una migración fue creada en Django <5.1 hay que regenerarla o el `makemigrations` revienta.

### HMAC-SHA256 propio para QR tokens (sin PyJWT)
- Stdlib (`hmac`, `hashlib`, `base64`) cubre el caso simple sin sumar dep.
- Payload `<user_id>|<exp_unix>` base64url, sig base64url, separados por `.`.
- TTL default 24h. Verificación con `hmac.compare_digest` (constant-time).
- Decisión: comparación `exp_unix <= now()` (no `<`) para que `ttl=0` siempre expire.

### `idb-keyval` sobre `localStorage`
- API trivial (`get`/`set` async), 4kB minified, evita el límite ~5MB y la sincronía de localStorage.
- Solo se usa dentro de stores `'use client'` y guard `typeof window !== 'undefined'` para no romper SSR.

---

## 10. Decisiones cerradas en Epics 4 (WhatsApp) + 12 (Stats)

### Per-trade WhatsApp opt-in — `TradeWhatsAppOptIn` separado de `Profile.whatsapp_optin`
- `Profile.whatsapp_optin` queda como preferencia general del usuario (puede usarse para sugerencias UI).
- El deep link `wa.me` solo se construye si **ambos** participantes flippearon `TradeWhatsAppOptIn(opted_in=True)` para el mismo Trade.
- Beneficio: consentimiento explícito por caso, revocable sin afectar otros trades. Cumple con la propuesta del cliente ("no global").

### Plantilla wa.me server-side (no client-side)
- `services/whatsapp_link.build_whatsapp_link()` construye el mensaje pre-llenado y URL-encodea con `urllib.parse.quote`.
- Razón: si la plantilla se construyera en el cliente, el usuario podría editarla arbitrariamente (suplantación, spam, etc.). Server-side garantiza control y permite a futuro respetar `Profile.locale` para mensajes en es/en/pt.

### `wa.me` requiere número en formato digits-only
- `wa.me/<digits>` no acepta `+`, `-`, espacios, ni paréntesis. Extracción: `''.join(c for c in e164 if c.isdigit())`.

### Stats on-demand en V1, Huey nightly diferido a V2
- `compute_stats(user)` se ejecuta en cada `GET /stats/me/`. Para volúmenes esperados en lanzamiento (<10k usuarios activos diarios) es trivial.
- Cuando los volúmenes lo justifiquen, mover a `tasks.py` con Huey nightly cacheando en `Profile.stats_cache_*` fields. Documentado para no olvidarlo.

### Streak con grace day (1 día)
- La racha cuenta días consecutivos hacia atrás desde hoy. Si el usuario no pegó hoy pero sí ayer, la racha sigue contando ayer y anteriores.
- Sin grace day, una notificación tarde o un día ocupado mata toda la racha — mala UX. Un día de gracia balancea engagement vs honestidad numérica.

### ETA = `remaining / (weekly_velocity / 7)` sin smoothing
- Regresión simple en V1. `None` cuando velocity == 0 (no podemos predecir nada). `0` cuando completion == 100%.
- Smoothing exponencial / multi-week regression difiere a V2 cuando tengamos data real para validar overfit.

---

## 11. Decisiones cerradas en Epics 5 (Comerciantes) + 7 (Banners CPM)

### Frequency cap de banners en cliente, no en server
- `adStore.noteSwipe()` cuenta swipes y devuelve `true` cada N (default 5). El backend solo decide *cuál* creative servir.
- Razón: un round-trip por swipe rompería el UX (swipe es la interacción más caliente). El conteo en cliente es "good enough" para un slot publicitario; si el usuario refresca, vuelve a contar — eso es aceptable y mantiene el feed snappy.

### Click via 302 redirect server-side, no link directo al anunciante
- El `<a>` apunta a `/api/ads/click/{impression_id}/`, no directo al `click_url`. El endpoint registra `AdClick` y devuelve un 302.
- Beneficios: (1) registra el click incluso si el usuario cierra la pestaña justo al hacer clic; (2) el `Referer` que llega al sitio del anunciante es `wa.me`/landing limpio, no expone `impression_id`; (3) facilita futuro fraud detection (el server ve cada click).

### Listing público de comerciantes filtra subscripción al día por default
- Query base: `subscription_status='active' AND subscription_expires_at > now()`. La property `is_listing_visible` es defensa secundaria.
- Razón: los merchants morosos no deben aparecer en el mapa público — es la palanca de cobranza más fuerte que tenemos.

### `register_payment` extiende desde `max(now, current_expiry)`
- Pre-pagos consecutivos se acumulan correctamente (merchant paga 3 meses adelantados → 90 días, no 30).
- Pagos tras vencimiento parten desde hoy (no recuperan el tiempo perdido).
- Comportamiento documentado en docstring + cubierto por test `test_consecutive_payment_extends_from_existing_expiry`.

### Mapa Leaflet con `dynamic(..., {ssr:false})`
- `react-leaflet` toca `window` en module init → rompe SSR de Next.js.
- Solución: el componente `MerchantMap` (server-render-safe) hace `dynamic(import('./MerchantMapInner'), {ssr:false})`. El "Inner" es el real con `MapContainer`.
- Sin `next/dynamic` el wrapping requeriría `'use client'` + `useEffect` truco; este es más limpio y testable.

### Weighted rotation = `creative.weight * campaign.weight`
- Multiplicación, no suma — permite al Web Manager priorizar (a) toda una campaña con `campaign.weight=10` o (b) una creative específica dentro de una campaña con `creative.weight=10`.
- Default ambos a 1 → rotación uniforme entre creatives elegibles.

### Reportes PDF/CSV de campañas diferidos a V2
- El item del checklist "Reportes para anunciantes (PDF/CSV descargable)" requiere generación con Huey + storage temporal + descarga firmada. Los datos *ya están* en `AdImpression`/`AdClick`; el endpoint `/ads/admin/campaigns/{id}/stats/` los expone como JSON.
- Decisión: V1 entrega los datos en JSON desde el panel admin. PDF/CSV se difiere a V2 cuando exista demanda real de un anunciante específico.

---

## 12. Decisiones cerradas en Epics 11 (Reseñas) + 8 (Panel Admin)

### Edit window de 24h enforzada en view, no en BD ni cron
- `Review.is_editable` es property simple: `now <= created_at + 24h`. La view `PATCH /reviews/{id}/` la consulta antes de aceptar cambios.
- Razón: un trigger DB o cron diario añaden complejidad operacional sin beneficio. La lógica en lectura es suficiente — una review más vieja que 24h simplemente devuelve 403 al editar.

### Aggregates cacheados en Profile vía signal post_save/post_delete
- `Profile.{rating_avg,rating_count,positive_pct}` se recomputan cada vez que cambia un Review (incluso solo `is_visible`).
- Razón: el feed de Match renderiza una preview de reputación por candidato — calcular agregados en cada render genera N+1 contra Review. Cachear en Profile + signal idempotente da reads O(1).
- Hidden reviews se excluyen del recompute → moderar (toggle `is_visible=False`) actualiza inmediatamente sin job nocturno.

### Hidden ≠ deleted (moderación reversible)
- `is_visible=False` esconde la reseña del público; el row sigue en BD con `ReviewReport` referenciando.
- Razón: defensas legales (no podemos perder evidencia) + permite revertir decisiones de moderación con un toggle.

### Reply única (409 Conflict en intento duplicado)
- `POST /reviews/{id}/reply/` rechaza con 409 si `review.reply` ya existe.
- Razón: la propuesta del cliente especifica una sola respuesta pública por reseña — evita argumentos públicos prolongados que dañan el trust loop.

### `assign_role` espera el enum `Role`, no string
- Bug encontrado en test: la view de `admin_users` pasaba string raw → `'str' object has no attribute 'value'`.
- Fix: `valid_roles = {choice.value: choice for choice in User.Role}` y `target.assign_role(valid_roles[role])`.
- Lección: cuando un método del modelo asume un tipo enum, las views REST deben hacer la conversión explícita en el deserializer o en la view, no confiar en duck typing.

### Admin gating defense-in-depth (client + server)
- Páginas `/admin/*` redirigen client-side si `user.role` no está en `{web_manager, admin}` (UX inmediato).
- Endpoints hacen el check real (`_is_admin_or_wm`) — un atacante que bypassa el JS aún recibe 403.
- Razón: el client-side check es solo UX; nunca es la única barrera.

### `<details>/<summary>` HTML para CTA "Calificar al coleccionista"
- Más simple que un modal, accesible nativamente (Enter/Space para abrir/cerrar, soporta lectores de pantalla), no rompe scroll.
- Aparece collapsed por default — el usuario lo expande cuando quiere calificar. No fuerza la calificación con un modal bloqueante (anti-patrón en la propuesta del cliente).

### `cannot_block_self` enforced server-side
- El endpoint `POST /admin/users/{id}/active/` rechaza con 400 si `target.id == request.user.id`.
- Razón: prevenir lockout accidental del único Web Manager. Listo para extender a "no se puede bloquear el último admin restante" en V2.

---

## 13. Decisiones cerradas en Epics 13 (Analítica/KPIs) + 14 (Manual interactivo)

### Composite endpoint en lugar de uno por bloque
- `/admin/analytics/overview/` devuelve los 7 bloques (community, ads, returning_vs_new, devices, top_stickers, matches_trend, heatmap) en un solo payload.
- Razón: una request en lugar de siete reduce latencia perceptible y simplifica el frontend (un único loading state, un único error). Si en el futuro algún bloque crece a >1s, lo extraemos a su propio endpoint sin romper el contrato — el frontend simplemente puede ignorar ese campo.

### Heatmap entrega coords, no imagen renderizada
- El endpoint devuelve `[{lat, lng, weight}]` como JSON.
- Razón: V1 simple sin sumar deps de visualización pesadas. La capa Leaflet con `leaflet.heat` queda para V2 — V1 expone los datos crudos para que el equipo los pueda explotar (export CSV, exportar a Tableau/Looker, etc).

### Devices placeholder honesto, no inventado
- Sin instrumentación de UA todavía, el bloque devuelve estimaciones razonables (78% mobile, 17% desktop, 5% tablet) marcadas con asterisco en la UI.
- Razón: mejor que mostrar nada (rompe el grid del dashboard) o números falsos sin advertencia (engañan al equipo). Cuando se agregue tracking real de UA en `User`/`Session`, el cálculo se vuelve real sin tocar el frontend.

### CSV export sincrónico en memoria
- `csv.writer(StringIO())` arma el archivo en memoria y lo entrega como `Content-Disposition: attachment`.
- Razón: para volúmenes esperados (<10k rows) es trivial y evita la complejidad de Huey + storage temporal + URL firmada. PDFs sí requerirán esa pipeline en V2.

### MiniBarChart sin chart lib externa
- Barras horizontales con `style.width = '${value/max*100}%'`. Etiqueta + valor en grid de 3 columnas.
- Razón: cubre todos los charts del dashboard sin sumar `recharts` (~80kB) o `chart.js` (~70kB). Si más adelante necesitamos pie charts, sparklines, etc., evaluaremos una dep — pero hoy no.

### Manual content separado del rendering (Epic 14)
- El componente `ManualPage` y la búsqueda client-side ya estaban del Bloque A. Epic 14 fue puramente expansión de `lib/manual/content.ts` (un solo archivo, 9 secciones × 14 procesos).
- Razón: el schema es estable y permite añadir contenido sin tocar JS. Aceptamos que el manual puede deriver de la realidad si nadie actualiza `content.ts` — mitigación: pull-request review check-list incluye "¿el manual sigue siendo correcto?".

### Búsqueda por keywords explícitos, no por contenido full-text
- Cada `ManualProcess` tiene `keywords: string[]`. La búsqueda matchea sobre keywords + título + summary.
- Razón: contenido bilingüe en formato `{es, en}` complica un full-text genérico. Los keywords cubren los términos que el usuario buscaría (rol, verbo, sustantivo) en cualquiera de los dos idiomas. Funciona client-side sin index ni service.

### CSV usa "Albunman" en vez de "Albunmanía" para tests case-insensitive
- Bug encontrado en test: `b'albunmania' in res.content.lower()` falla porque `í` (UTF-8 0xC3 0xAD) no se lowercase a 'i'.
- Fix: usar el prefijo `albunman` que matchea ambas escrituras. Lección: los tests de contenido bytes deben evitar caracteres ASCII-extended cuando el lowercase no preserva la equivalencia — o usar `.decode('utf-8').lower()` antes del match.
