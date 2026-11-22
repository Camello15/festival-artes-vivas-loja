# 3. Vista de desarrollo

**Propósito**: mostrar cómo se organiza el código fuente en paquetes, módulos y capas, y
qué reglas de dependencia deben respetarse.
**Interesados**: programadores del equipo y de futuros mantenimientos.

## Organización del repositorio

```mermaid
flowchart TB
    root["festival-artes-vivas-loja<br/>npm workspaces"]

    root --> web["apps/web<br/>React + Vite + Tailwind"]
    root --> api["apps/api<br/>Express + Prisma"]
    root --> specs["specs/<br/>001-base, 002-cartelera, 003-reservas"]
    root --> docs["docs/<br/>arquitectura y adr"]
    root --> specify[".specify/<br/>constitución y plantillas Spec Kit"]
    root --> gh[".github/<br/>CI y plantilla de PR"]

    subgraph WEB["apps/web/src"]
        direction TB
        pages["pages/<br/>una por ruta"]
        features["features/<br/>catalog, auth, reservations, admin, artist-agenda"]
        components["components/<br/>layout y ui"]
        lib["lib/<br/>api.ts y format.ts"]
        adminPages["pages/admin/<br/>AdminLayout y páginas por recurso"]
        pages --> features
        pages --> components
        adminPages --> features
        features --> lib
        features --> components
    end

    subgraph API["apps/api/src"]
        direction TB
        routes["routes/index.ts"]
        subgraph modules["modules/nombre-del-modulo"]
            direction TB
            rt["*.routes.ts"] --> ct["*.controller.ts"]
            ct --> sv["*.service.ts"]
            sv --> rp["*.repository.ts"]
        end
        mw["middlewares/<br/>errorHandler, notFound, auth"]
        dom["domain/enums.ts"]
        prismaLib["lib/prisma.ts"]
        auditLib["lib/auditLog.ts"]
        admin["modules/admin/<br/>venues, artists, events, performances"]
        modulesOthers["modules/<br/>health, festival, auth, users,<br/>reservations, artist-agenda,<br/>performances, events, artists, venues"]
        routes --> rt
        routes --> admin
        routes --> modulesOthers
        rp --> prismaLib
        sv --> dom
        sv -. "audita operaciones correctas" .-> auditLib
        ct --> mw
    end

    web --> WEB
    api --> API
    prismaLib --> schema[("apps/api/prisma/schema.prisma<br/>migrations y seed")]
```

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
