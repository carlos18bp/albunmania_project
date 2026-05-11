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
