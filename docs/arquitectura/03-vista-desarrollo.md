# 3. Vista de desarrollo

**Propósito**: mostrar cómo se organiza el código fuente en paquetes, módulos y capas, y
qué reglas de dependencia deben respetarse.
**Interesados**: programadores del equipo y de futuros mantenimientos.

## Diagrama de paquetes

Paquetes del monorepo y sus dependencias «import». Las flechas van siempre en un solo
sentido, de la interfaz hacia los datos; ningún paquete inferior conoce a uno superior.

```mermaid
flowchart TB
    subgraph REPO["«monorepo» festival-artes-vivas-loja · npm workspaces"]
        direction LR

        subgraph WEB["«workspace» @festival/web · apps/web/src"]
            direction TB
            wRouter["router.tsx"]
            wPages["pages<br/>+ pages/admin"]
            wFeatures["features<br/>festival · catalog · auth<br/>reservations · artist-agenda · admin"]
            wComponents["components<br/>layout · ui"]
            wLib["lib<br/>api · format · labels"]
            wRouter --> wPages
            wRouter --> wFeatures
            wPages --> wFeatures
            wPages --> wComponents
            wFeatures --> wComponents
            wFeatures --> wLib
            wPages --> wLib
        end

        subgraph API["«workspace» @festival/api · apps/api/src"]
            direction TB
            aApp["app.ts · server.ts"]
            aRoutes["routes<br/>index.ts"]
            aModules["modules<br/>health · festival · performances · events<br/>artists · venues · auth · users · reservations<br/>artist-agenda · admin/*"]
            aMw["middlewares<br/>auth · errorHandler · notFound"]
            aErr["errors<br/>AppError"]
            aDom["domain<br/>enums · festival"]
            aLib["lib<br/>prisma · auditLog"]
            aCfg["config<br/>env"]
            aApp --> aRoutes
            aApp --> aMw
            aRoutes --> aModules
            aModules --> aMw
            aModules --> aErr
            aModules --> aDom
            aModules --> aLib
            aMw --> aErr
            aMw --> aCfg
            aLib --> aCfg
        end

        subgraph PRISMA["«paquete» apps/api/prisma"]
            schema["schema.prisma<br/>migrations · seed.ts"]
        end

        subgraph DOCS["«documentación»"]
            direction TB
            specs["specs/001 · 002 · 003"]
            docs["docs/arquitectura · docs/adr"]
            specify[".specify/ constitución"]
        end

        GH[".github<br/>CI · plantilla de PR"]
    end

    aLib -- "«import» @prisma/client" --> schema
    wLib -. "HTTP /api (no es import)" .-> aRoutes
```

| Paquete | Contiene | Depende de |
|---|---|---|
| `web/pages` | Una página por ruta | `features`, `components`, `lib` |
| `web/features` | Llamadas a la API y componentes de cada dominio | `components`, `lib` |
| `web/lib` | `api.ts` (único cliente HTTP), formato y etiquetas | — |
| `api/routes` | Montaje de routers por recurso | `modules` |
| `api/modules/<recurso>` | `routes → controller → service → repository` | `middlewares`, `errors`, `domain`, `lib` |
| `api/lib` | Cliente Prisma y `logAudit` | `config`, `prisma/schema` |

## Reglas de dependencia entre capas

```mermaid
flowchart LR
    A["Routes"] --> B["Controllers"]
    B --> C["Services"]
    C --> D["Repositories"]
    D --> E[("Prisma / SQLite")]
    B -. "usa" .-> V["Schemas Zod"]
    C -. "lanza" .-> X["AppError"]
```

| Capa | Responsabilidad | Puede depender de | No puede |
|---|---|---|---|
| Routes | Asociar método y ruta a un controller y middlewares | Controllers, middlewares | Contener lógica |
| Controllers | Validar entrada (Zod), invocar el service, elegir el código HTTP | Services, schemas | Acceder a Prisma |
| Services | Reglas de negocio y transacciones | Repositories, domain, `AppError` | Conocer `req`/`res` |
| Repositories | Consultas a la base de datos | `lib/prisma.ts` | Contener reglas de negocio |

## Módulos por spec

| Módulo API | Módulo web | Spec |
|---|---|---|
| `health`, `festival` | `components/layout`, `pages/HomePage` | 1 |
| `performances`, `events`, `artists`, `venues` | `features/catalog`, páginas de cartelera | 2 |
| `auth`, `users`, `reservations`, `admin/{venues,artists,events,performances}` | `features/auth`, `features/reservations`, `features/admin`, `pages/admin/*` | 3 |
| `artist-agenda` (consume el repositorio de funciones públicas para disponibilidad reservada) | `features/artist-agenda`, `pages/ArtistAgendaPage.tsx` | 3 |

## Diagrama de componentes del sistema

Componentes desplegables y las interfaces que ofrecen (○) y consumen. Cada *feature* del
frontend consume exactamente una interfaz REST de la API a través de `lib/api.ts`.

```mermaid
flowchart LR
    subgraph SPA["«componente» SPA React · apps/web"]
        direction TB
        cFest["Festival"]
        cCat["Catálogo<br/>cartelera, obras,<br/>artistas, escenarios"]
        cAuth["Autenticación<br/>AuthContext · ProtectedRoute"]
        cRes["Reservas"]
        cAgenda["Agenda del artista"]
        cAdmin["Administración"]
        cHttp["Cliente HTTP<br/>lib/api.ts"]
        cFest & cCat & cAuth & cRes & cAgenda & cAdmin --> cHttp
    end

    subgraph APIC["«componente» API REST · apps/api"]
        direction TB
        iFest(("/festival<br/>/health"))
        iCat(("/performances<br/>/events /artists<br/>/venues"))
        iAuth(("/auth"))
        iRes(("/reservations"))
        iAgenda(("/me/artist/<br/>performances"))
        iAdmin(("/admin/*"))

        kFest["Festival"]
        kCat["Catálogo<br/>+ availability"]
        kAuth["Auth y usuarios<br/>bcrypt · JWT"]
        kRes["Reservas<br/>control de aforo"]
        kAgenda["Agenda del artista"]
        kAdmin["Administración<br/>CRUD + cancelar"]
        kSec["Seguridad<br/>requireAuth · requireRole"]
        kErr["Errores<br/>AppError · errorHandler"]
        kAudit["Auditoría<br/>logAudit"]
        kData["Acceso a datos<br/>Prisma Client"]

        iFest --- kFest
        iCat --- kCat
        iAuth --- kAuth
        iRes --- kRes
        iAgenda --- kAgenda
        iAdmin --- kAdmin
        kRes & kAgenda & kAdmin --> kSec
        kAgenda --> kCat
        kRes & kAdmin --> kAudit
        kFest & kCat & kAuth & kRes & kAgenda & kAdmin --> kData
        kSec -.-> kErr
    end

    DB[("«base de datos»<br/>SQLite dev.db")]
    OSM["«sistema externo»<br/>OpenStreetMap"]

    cHttp -- "JSON + JWT" --> iFest
    cHttp -- "JSON + JWT" --> iCat
    cHttp -- "JSON + JWT" --> iAuth
    cHttp -- "JSON + JWT" --> iRes
    cHttp -- "JSON + JWT" --> iAgenda
    cHttp -- "JSON + JWT" --> iAdmin
    kData --> DB
    cCat -. "iframe del mapa" .-> OSM
```

## Componentes internos del frontend

La SPA también está en capas: las páginas componen la interfaz, cada *feature* encapsula
las llamadas de su dominio y **todas** las peticiones pasan por `lib/api.ts`, que añade el
token JWT y traduce el formato de error común de la API.

```mermaid
flowchart TB
    router["router.tsx<br/>rutas en español"]

    subgraph guards["Sesión y protección"]
        authCtx["features/auth/AuthContext<br/>token y usuario en localStorage"]
        protected["features/auth/ProtectedRoute<br/>roles ARTIST / ADMIN"]
    end

    subgraph pages["pages/ — una por ruta"]
        direction LR
        pPublic["HomePage · ProgramPage<br/>EventDetailPage · ArtistsPage<br/>ArtistDetailPage · VenuesPage<br/>VenueDetailPage"]
        pAuth["LoginPage · RegisterPage"]
        pRes["ReservePage<br/>MyReservationsPage"]
        pArtist["ArtistAgendaPage"]
        pAdmin["admin/AdminLayout<br/>Admin{Venues,Artists,Events,<br/>Performances}Page<br/>AdminPerformanceReservationsPage"]
    end

    subgraph features["features/ — lógica por dominio"]
        direction LR
        fFest["festival<br/>useFestivalSummary"]
        fCat["catalog<br/>Filters · PerformanceCard<br/>AvailabilityBadge · VenueMap"]
        fAuthApi["auth/api"]
        fRes["reservations<br/>ConfirmDialog"]
        fAgenda["artist-agenda"]
        fAdmin["admin<br/>DataTable · EntityForm<br/>ConfirmDialog"]
    end

    subgraph shared["Compartido"]
        direction LR
        ui["components/layout · components/ui<br/>Header, Footer, Spinner, ErrorMessage"]
        lib["lib/format · lib/labels<br/>fechas y traducción de enums"]
    end

    api["lib/api.ts<br/>único cliente HTTP"]
    backend[["API REST /api<br/>vía proxy de Vite"]]

    router --> guards
    router --> pages
    protected -. "protege" .-> pRes
    protected -. "protege" .-> pArtist
    protected -. "protege" .-> pAdmin
    pPublic --> fFest
    pPublic --> fCat
    pAuth --> authCtx
    authCtx --> fAuthApi
    pRes --> fRes
    pArtist --> fAgenda
    pAdmin --> fAdmin
    pages --> shared
    authCtx -- "setAuthToken" --> api
    fFest --> api
    fCat --> api
    fAuthApi --> api
    fRes --> api
    fAgenda --> api
    fAdmin --> api
    api -- "fetch JSON + Bearer JWT" --> backend
```

## Decisiones

- **Organización por módulo y luego por capa** (`modules/events/events.service.ts`) en
  lugar de carpetas globales `controllers/`, `services/`. Cada spec agrega carpetas nuevas en
  vez de editar las mismas, lo que reduce los conflictos de merge entre ramas.
- **`app.ts` separado de `server.ts`**: la app Express se puede importar en las pruebas con
  Supertest sin abrir un puerto.
- **Un solo cliente HTTP** en el frontend (`lib/api.ts`), que centraliza la URL base, el
  token y el formato de error.
- **Monorepo con npm workspaces**: un solo `npm install`, scripts comunes y versiones
  coherentes ([ADR-0005](../adr/0005-monorepo-npm-workspaces.md)).
- **Pruebas junto a cada app** (`apps/api/tests`, `apps/web/src/test`) con Vitest en ambas, un
  solo framework para todo el equipo.
