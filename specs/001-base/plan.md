# Implementation Plan: Base del proyecto

**Branch**: `feature/spec-1-base` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-base/spec.md`

## Summary

Crear el monorepo con dos aplicaciones (web y API), la base SQLite con Prisma, el modelo
de datos completo con datos de ejemplo, un endpoint de referencia que recorre todas las
capas del backend y el layout navegable del frontend con espacios reservados para los
Specs #2 y #3.

## Technical Context

**Language/Version**: TypeScript 5 sobre Node.js ≥ 20.12

**Primary Dependencies**: Frontend: React 19, Vite 7, React Router 7, TailwindCSS 4.
Backend: Express 5, Prisma 6, Zod 4 (validación), bcryptjs, cors.

**Storage**: SQLite (archivo `apps/api/prisma/dev.db`) mediante Prisma ORM con migraciones.

**Testing**: Vitest 5 en ambas apps; Supertest para integración HTTP; Testing Library para
componentes React.

**Target Platform**: Navegadores modernos (escritorio y móvil); servidor Node.js en Linux.

**Project Type**: Aplicación web cliente-servidor (SPA + API REST).

**Performance Goals**: Respuestas de la API < 200 ms en local con los datos de ejemplo.

**Constraints**: Correr en una Chromebook (Linux, recursos modestos): sin servicios
externos, sin Docker obligatorio, sin dependencias nativas difíciles de compilar
(`bcryptjs` en lugar de `bcrypt`).

**Scale/Scope**: Prototipo académico: ~10 pantallas, ~20 endpoints al final de los 3 specs.

## Constitution Check

| Principio | Cumplimiento en este plan |
|---|---|
| I. Claridad | Estructura de carpetas por capa, sin abstracciones extra; ADR para cada decisión. ✅ |
| II. Capas | `routes → controllers → services → repositories`; ejemplo completo con `festival/summary`. ✅ |
| III. Pruebas | Pruebas unitarias del service, de integración de los endpoints y de render del layout. ✅ |
| IV. Accesibilidad | Skip link, landmarks, `lang="es"`, menú móvil con `aria-expanded`, foco visible. ✅ |
| V. Idiomas | Código y modelos en inglés; textos de UI y docs en español. ✅ |

Sin violaciones; no se requiere *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/001-base/
├── spec.md
├── plan.md          # este archivo
├── data-model.md    # modelo de datos y decisiones
└── tasks.md
```

### Source Code (repository root)

```text
package.json                 # workspaces + scripts de la raíz
docker-compose.yml           # opcional
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts                 # crea la app Express (sin listen, testeable)
│   │   ├── server.ts              # punto de entrada (listen)
│   │   ├── config/env.ts          # variables de entorno validadas con Zod
│   │   ├── lib/prisma.ts          # instancia única de PrismaClient
│   │   ├── domain/enums.ts        # Role, Discipline, PerformanceStatus...
│   │   ├── middlewares/           # errorHandler, notFound
│   │   ├── errors/AppError.ts
│   │   ├── routes/index.ts        # monta los routers por módulo bajo /api
│   │   └── modules/
│   │       ├── health/            # health.routes/controller/service/repository
│   │       └── festival/          # festival.routes/controller/service/repository
│   └── tests/
└── web/
    ├── index.html
    ├── vite.config.ts             # proxy /api → API
    └── src/
        ├── main.tsx
        ├── router.tsx             # todas las rutas de los 3 specs
        ├── lib/api.ts             # cliente HTTP común
        ├── lib/format.ts          # fechas en America/Guayaquil
        ├── components/layout/     # Layout, Header, Footer, SkipLink
        ├── components/ui/         # ComingSoon, ErrorMessage, Spinner
        ├── pages/                 # HomePage, NotFoundPage + placeholders
        └── test/
```

**Structure Decision**: Monorepo con npm workspaces y organización **por módulo** dentro de
la API (`modules/<nombre>/` con un archivo por capa). Así cada spec agrega carpetas nuevas
(`modules/events`, `modules/reservations`…) en lugar de editar los mismos archivos, lo
que minimiza los conflictos de merge entre ramas. El único archivo compartido que se
edita es `routes/index.ts` (una línea por módulo).

## Contratos de la API (este spec)

| Método | Ruta | Respuesta 2xx | Errores |
|---|---|---|---|
| GET | `/api/health` | `200 { status: "ok", database: "up", uptime }` | `503 { status: "degraded", database: "down" }` |
| GET | `/api/festival/summary` | `200 { name, edition, city, startsAt, endsAt, events, performances, artists, venues }` | `500` |

Formato de error común para toda la API (lo reutilizan los Specs #2 y #3):

```json
{ "error": { "code": "NOT_FOUND", "message": "Recurso no encontrado", "details": [] } }
```

Códigos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

## Rutas del frontend

| Ruta | Pantalla | Spec |
|---|---|---|
| `/` | Inicio con resumen del festival | 1 |
| `/cartelera` | Cartelera con filtros | 2 |
| `/obras/:id` | Detalle de obra | 2 |
| `/artistas`, `/artistas/:id` | Artistas y detalle | 2 |
| `/escenarios`, `/escenarios/:id` | Escenarios y detalle con mapa | 2 |
| `/ingresar`, `/registro` | Autenticación | 3 |
| `/reservar/:performanceId` | Reservar entradas | 3 |
| `/mis-reservas` | Reservas del usuario | 3 |
| `/mi-agenda` | Funciones del artista | 3 |
| `/admin/*` | Panel de administración | 3 |
| `*` | 404 | 1 |

Las URLs del frontend están en español porque las ve el público (texto de interfaz);
los nombres de componentes y archivos siguen en inglés.

## Variables de entorno (`apps/api/.env`)

| Variable | Ejemplo | Uso |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Conexión SQLite (relativa a `prisma/`) |
| `PORT` | `3000` | Puerto de la API |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido |
| `JWT_SECRET` | `cambia-esto` | Reservado para el Spec #3 |

## Riesgos

- **Conflictos en `schema.prisma`** entre los Specs #2 y #3: mitigado porque el modelo
  queda completo aquí. Si un spec necesita un campo, lo agrega como opcional y genera una
  migración nueva con nombre descriptivo.
- **Versiones de Node distintas** entre integrantes: `engines.node >= 20.12` y `.nvmrc`.
