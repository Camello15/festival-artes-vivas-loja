# Implementation Plan: Cartelera y detalle

**Branch**: `feature/spec-2-cartelera` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-cartelera/spec.md`

## Summary

Agregar a la API cuatro módulos de solo lectura (`performances`, `events`, `artists`,
`venues`) siguiendo el patrón de capas del Spec #1, y construir en el frontend las seis
pantallas públicas de consulta con filtros sincronizados a la URL.

## Technical Context

**Language/Version**: TypeScript 5, Node.js ≥ 20.12

**Primary Dependencies**: las del Spec #1. **No se agregan dependencias nuevas** (mapa con
iframe de OpenStreetMap; fechas con `Intl.DateTimeFormat`).

**Storage**: SQLite vía Prisma (sin cambios de esquema).

**Testing**: Vitest + Supertest (API), Vitest + Testing Library (web).

**Project Type**: Web (SPA + API REST).

**Constraints**: Las fechas se filtran en hora de Ecuador (UTC-5, sin horario de verano):
el día `2026-11-21` equivale a `[2026-11-21T05:00Z, 2026-11-22T05:00Z)`.

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. Claridad | Un módulo por recurso, mismo patrón que `festival/`. ✅ |
| II. Capas | El cálculo de `availableSeats` y la conversión de fecha a rango UTC viven en services; los repositories solo consultan. ✅ |
| III. Pruebas | Unitarias de services (filtros, disponibilidad) + integración por endpoint. ✅ |
| IV. Accesibilidad | `label` en filtros, `aria-live="polite"` en el conteo de resultados, `title` en el iframe del mapa. ✅ |
| V. Idiomas | Rutas API en inglés; etiquetas de disciplina traducidas en `apps/web/src/lib/labels.ts`. ✅ |

## Project Structure

```text
apps/api/src/modules/
├── performances/   performances.{routes,controller,service,repository,schemas}.ts
├── events/         events.{routes,controller,service,repository}.ts
├── artists/        artists.{routes,controller,service,repository}.ts
└── venues/         venues.{routes,controller,service,repository}.ts
apps/api/tests/     performances.*.test.ts, events.test.ts, artists.test.ts, venues.test.ts

apps/web/src/
├── lib/labels.ts                 # Discipline → "Danza", etc.
├── features/catalog/
│   ├── api.ts                    # funciones tipadas que usan lib/api.ts
│   ├── types.ts
│   └── components/               # PerformanceCard, Filters, AvailabilityBadge, VenueMap
└── pages/
    ├── ProgramPage.tsx           # /cartelera
    ├── EventDetailPage.tsx       # /obras/:id
    ├── ArtistsPage.tsx / ArtistDetailPage.tsx
    └── VenuesPage.tsx / VenueDetailPage.tsx
```

Archivo compartido que se edita: `apps/api/src/routes/index.ts` (registrar los 4 routers)
y `apps/web/src/router.tsx` (reemplazar los `ComingSoon` de este spec).

## Contratos de la API

### `GET /api/performances`

Query: `date?` (`YYYY-MM-DD`), `discipline?` (`THEATER|DANCE|MUSIC|CIRCUS|STREET_ARTS`),
`venueId?` (entero), `includePast?` (`true|false`, por defecto `false`).

```json
200 [
  {
    "id": 12,
    "startsAt": "2026-11-21T00:30:00.000Z",
    "status": "SCHEDULED",
    "capacity": 450,
    "availableSeats": 448,
    "event": { "id": 3, "title": "Raíces", "discipline": "DANCE", "durationMinutes": 70, "imageUrl": "..." },
    "venue": { "id": 1, "name": "Teatro Nacional Benjamín Carrión" }
  }
]
```

Errores: `400 VALIDATION_ERROR`.

### `GET /api/performances/filters`

```json
200 { "dates": ["2026-11-20", "..."], "disciplines": ["THEATER", "..."], "venues": [{ "id": 1, "name": "..." }] }
```

### `GET /api/events/:id`

`200` con la obra, `artists[]` y `performances[]` (cada una con `venue` y `availableSeats`).
`404 NOT_FOUND`, `400` si el id no es entero.

### `GET /api/artists?search=`

`200 [{ id, name, kind, country, imageUrl }]`.

### `GET /api/artists/:id`

`200 { ...artist, events: [{ id, title, discipline }] }` · `404`.

### `GET /api/venues` · `GET /api/venues/:id`

Lista: `200 [{ id, name, address, capacity, latitude, longitude, imageUrl }]`.
Detalle: igual más `description` y `upcomingPerformances[]`. `404`.

## Decisiones técnicas

- **Disponibilidad** con `prisma.reservation.groupBy({ by: ['performanceId'], where: { status: 'CONFIRMED' }, _sum: { quantity: true } })`:
  una sola consulta para toda la cartelera (evita N+1). Expón la función
  `getReservedSeatsByPerformance(ids)` en `performances.repository.ts`: el Spec #3 la reutiliza.
- **Umbral "Últimas entradas"**: `availableSeats ≤ 10 % de capacity`. Lo calcula el backend y
  devuelve `availability: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT"` para que el frontend solo lo pinte.
- **Filtros en URL** con `useSearchParams` de React Router.
- **Mapa**: `https://www.openstreetmap.org/export/embed.html?bbox=<lon-0.004>,<lat-0.003>,<lon+0.004>,<lat+0.003>&marker=<lat>,<lon>`
  y enlace "Cómo llegar" a `https://www.openstreetmap.org/directions?to=<lat>,<lon>`.

## Riesgos

- Conflicto con el Spec #3 en `routes/index.ts` y `router.tsx`: son cambios de una línea;
  se resuelven al hacer merge de `develop`.
