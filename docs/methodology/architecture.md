# Architecture — Albunmanía

## 1. System overview

```mermaid
flowchart TD
    subgraph Client["Browser / PWA instalada"]
        UI[Next.js App Router<br/>React + TypeScript + Zustand]
        SW[Service Worker<br/>next-pwa + Web Push]
        IDB[(IndexedDB<br/>cache catálogo<br/>cola mutaciones)]
    end

    subgraph Edge["Nginx (VPS)"]
        STATIC[Static assets<br/>gzip + brotli]
        PROXY[Reverse proxy]
    end

    subgraph Backend["Django + DRF (Gunicorn)"]
        API[REST API /api/v1/]
        AUTH[JWT + Google OAuth + hCaptcha]
        ADMIN[Django Admin]
        SVC[Service layer]
    end

    subgraph Async["Huey workers"]
        TASKS[Push, reports, billing,<br/>match cleanup, racha/ETA]
    end

    subgraph Data["Persistencia"]
        MYSQL[(MySQL 8<br/>indexes compuestos)]
        REDIS[(Redis<br/>Huey + cache)]
        FILES[(Media<br/>django-attachments<br/>+ easy-thumbnails)]
        GEOIP[(MaxMind GeoIP2 DB<br/>local)]
    end

    subgraph External["Servicios externos"]
        GOOG[Google OAuth]
        HCAP[hCaptcha]
        WAPP[WhatsApp deep links]
        SIIGO[Siigo / Alegra]
        OSM[OpenStreetMap tiles]
        WPUSH[Web Push delivery<br/>navegador del usuario]
    end

    UI <--> SW
    SW <--> IDB
    UI -->|HTTPS| PROXY
    PROXY --> API
    PROXY --> STATIC
    API <--> AUTH
    AUTH <--> GOOG
    AUTH <--> HCAP
    API <--> SVC
    SVC --> MYSQL
    SVC --> REDIS
    SVC --> FILES
    SVC --> GEOIP
    API -->|enqueue| TASKS
    TASKS --> MYSQL
    TASKS --> WPUSH
    TASKS --> SIIGO
    UI -->|deep link| WAPP
    UI -->|tiles| OSM
```

## 2. Request flow — Match swipe (Epic 3 referencia)

```mermaid
sequenceDiagram
    actor User_A
    participant FE as Next.js (UI)
    participant SW as Service Worker
    participant API as DRF /api/v1/match
    participant DB as MySQL
    participant Q as Huey
    actor User_B

    User_A->>FE: Abre /match (Swipe)
    FE->>API: GET /candidates?radius=10
    API->>DB: SELECT con haversine + filtro inventarios cruzados
    DB-->>API: top N coleccionistas con cromos compatibles
    API-->>FE: JSON con cards (incluye preview reseñas cacheado)
    FE->>User_A: Renderiza Swipe Card
    User_A->>FE: Swipe right (like)
    FE->>API: POST /like {target_user_id}
    API->>DB: INSERT Match(user_a, user_b, status=pending)
    API->>DB: SELECT Match(user_b → user_a, status=pending)
    alt match mutuo encontrado
        API->>DB: UPDATE Match status=matched
        API->>Q: enqueue task push_match_notification(match_id)
        Q->>DB: SELECT user_b push subscription
        Q->>User_B: Web Push (deep link al match)
        API-->>FE: {matched: true, deep_link_pending_optin: true}
        FE->>User_A: Mostrar diálogo "compartir WhatsApp?"
    else sin match aún
        API-->>FE: {matched: false}
    end
```

## 3. ER Diagram — Modelos del release 01

```mermaid
erDiagram
    User ||--|| Profile : has
    User ||--o| MerchantProfile : "if role=Merchant"
    User ||--o{ UserSticker : owns
    User ||--o{ Match : "user_a"
    User ||--o{ Match : "user_b"
    User ||--o{ Review : "reviewer"
    User ||--o{ Review : "reviewee"
    User ||--o{ Notification : receives
    User ||--o{ Report : "reporter / target"

    Album ||--o{ Sticker : contains
    Sticker ||--o{ UserSticker : "tracked by"

    Match ||--o| Trade : confirms
    Trade ||--o{ Review : "yields up to 2"

    Sponsor }o..o{ Album : "active in"

    MerchantProfile ||--o{ MerchantSubscription : "billed via"

    AdCampaign ||--o{ AdCreative : "rotates between"
    AdCreative ||--o{ AdImpression : served
    User ||--o{ AdImpression : "viewed by"

    Trade ||--o{ Report : "may be reported"
    Review ||--o{ Report : "may be reported"
```

**Modelos del release 01 (15):**
User, Profile, MerchantProfile, Album, Sticker, UserSticker, Match, Trade, Review, Sponsor, MerchantSubscription, AdCampaign, AdCreative, AdImpression, Report, Notification.

**Constraints críticos:**
- `Profile.rating_avg / rating_count / positive_pct` — agregados cacheados, recalculados via signal post_save/post_delete sobre Review.
- `Review` UNIQUE `(trade_id, reviewer_id)` + ventana de edición 24h post-creación.
- `Sponsor` solo 1 con `active_from <= now() <= active_until`.
- `UserSticker` UNIQUE `(user_id, sticker_id)` con índice compuesto.
- `Match.channel` enum: `digital_swipe | qr_presencial`.
- `AdImpression` particionada por mes.

## 4. Capas y boundaries

```mermaid
flowchart LR
    subgraph Presentation["Presentation Layer"]
        VIEWS[Views<br/>function-based @api_view]
        URLS[URLs split por dominio]
    end
    subgraph DTO["DTO Layer"]
        SER[Serializers<br/>list / detail / create_update]
    end
    subgraph Domain["Domain Layer"]
        SVC[Services<br/>match engine, ad rotation,<br/>review aggregation,<br/>email_service, push_service]
        UTIL[Utils<br/>auth_utils, geo_utils,<br/>qr_signing]
    end
    subgraph Persistence["Persistence Layer"]
        MOD[Models]
        SIG[Signals<br/>review aggregates]
    end

    URLS --> VIEWS
    VIEWS --> SER
    VIEWS --> SVC
    SER --> MOD
    SVC --> MOD
    SVC --> UTIL
    MOD --> SIG
    SIG --> MOD
```

## 5. Workflow de desarrollo (Memory Bank flow)

```mermaid
flowchart TD
    PB[product_requirement_docs.md] --> PC[technical.md]
    PB --> SP[architecture.md]
    SP --> TC[tasks_plan.md]
    PC --> TC
    PB --> TC
    TC --> AC[active_context.md]
    AC --> ER[error-documentation.md]
    AC --> LL[lessons-learned.md]
    subgraph Releases["docs/release/"]
        R01[01-release-checklist.md]
    end
    PB -.fed by.-> R01
```

## 6. Deployment topology (objetivo)

```mermaid
flowchart LR
    subgraph VPS["VPS 4 vCPU / 8 GB"]
        NGINX[Nginx<br/>:443 SSL]
        GUNI[Gunicorn<br/>albunmania_staging]
        HUEY[Huey worker<br/>albunmania-staging-huey]
        MYSQL_PROD[(MySQL 8)]
        REDIS_PROD[(Redis)]
    end
    subgraph CDN_FUTURE["CDN futuro (mes 6+)"]
        CDN[Static assets]
    end
    USER[Browsers / PWA] -->|HTTPS| NGINX
    NGINX --> GUNI
    GUNI -.enqueue.-> HUEY
    GUNI --> MYSQL_PROD
    GUNI --> REDIS_PROD
    HUEY --> MYSQL_PROD
    HUEY --> REDIS_PROD
    NGINX -.future.-> CDN
```

## 7. Decisiones arquitectónicas clave

| Decisión | Razón |
|----------|-------|
| **Single Django app** (`albunmania_app`) | Simplicidad para release 01; el dominio cabe sin necesidad de splitting; coherente con el patrón del template que ya validamos |
| **Multi-álbum como tenant lógico** (Album es la raíz, no schema/db) | Soporta Mundial 26 + Champions + Pokémon sin reescritura; cargar catálogo nuevo = INSERT |
| **Match QR offline en cliente** | Evita dependencia de red en cambiatones presenciales; cruce de inventarios en cliente sobre cache de Service Worker |
| **WhatsApp deep links sin API empresarial** | Cero costo de WhatsApp Business; opt-in mutuo por trade respeta privacidad |
| **AdImpression particionada por mes** | Tabla crecerá rápido durante el Mundial; partición evita tabla gigante |
| **Web Push estándar W3C, sin Firebase** | Datos propios; no dependencia de Google FCM |
| **Reseñas con `is_visible` (soft hide)** | Trazabilidad histórica para auditoría sin afectar agregados públicos |
| **JWT corto + refresh largo** | Balance UX (no relogin frecuente) + seguridad (revocación rápida si se compromete access token) |

## 8. Crecimiento previsto (visión v2 — fuente: release 01 §🌱)

| Eje | Preparación día 1 | Próximo paso |
|-----|-------------------|--------------|
| Tráfico | Nginx caché agresivo + SW catálogo | Vertical scale 8/16 → separar Huey VPS → CDN |
| Datos | Índices compuestos + partición AdImpression | Archivado álbumes inactivos cuando >10M UserSticker |
| Inventario ads | Rotación ponderada + segmentación geo desde día 1 | Self-service anunciantes (mes 6+) |
| Multi-álbum | Album como tenant lógico | `champions.albunmania.co` subdomain por álbum si tráfico exige |
| Geográfico | Stack es/en/pt + ciudad explícita | Campo `country` + catálogo local + pasarela local |
| Async | Huey con MySQL backend | Workers dedicados por tipo (push / reports / billing) |
