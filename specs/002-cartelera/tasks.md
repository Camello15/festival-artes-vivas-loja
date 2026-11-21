---
description: "Lista de tareas del Spec #2 â€” Cartelera y detalle"
---

# Tasks: Cartelera y detalle

**Input**: Documentos de diseÃ±o en `/specs/002-cartelera/`

**Prerequisites**: plan.md, spec.md; Spec #1 integrado en `develop`.

**Tests**: SÃ­ (constituciÃ³n, principio III).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Actualizar la rama: `git merge origin/develop`; `npm install && npm run db:setup && npm test` en verde
- [X] T002 [P] Ampliar `apps/web/src/lib/labels.ts` (ya trae las disciplinas y sus colores del Spec #1) con tipo de artista y disponibilidad
- [X] T003 [P] Crear `apps/web/src/features/catalog/types.ts` con los tipos de respuesta de los contratos de `plan.md`

## Phase 2: Foundational

- [X] T004 Crear `apps/api/src/modules/performances/performances.repository.ts` con `findMany(filters)` y `getReservedSeatsByPerformance(ids)`
- [X] T005 Crear `apps/api/src/modules/performances/availability.ts` con `computeAvailability(capacity, reserved)` â†’ `{ availableSeats, availability }`
- [X] T006 [P] Prueba unitaria de `computeAvailability` (disponible, Ãºltimas entradas en el 10 %, agotado, nunca negativo) en `apps/api/tests/availability.test.ts`

**Checkpoint**: la base de cÃ¡lculo de disponibilidad estÃ¡ probada.

## Phase 3: User Story 1 â€” Cartelera con filtros (P1) ðŸŽ¯ MVP

- [X] T007 [US1] Crear `performances.schemas.ts` (Zod: `date`, `discipline`, `venueId`, `includePast`)
- [X] T008 [US1] Crear `performances.service.ts`: convierte `date` a rango UTC de Ecuador, aplica filtros y agrega disponibilidad
- [X] T009 [US1] Crear `performances.controller.ts` y `performances.routes.ts` (`GET /`, `GET /filters`); registrar en `routes/index.ts`
- [X] T010 [P] [US1] Prueba unitaria del service (conversiÃ³n de fecha; combinaciÃ³n de filtros) en `apps/api/tests/performances.service.test.ts`
- [X] T011 [P] [US1] Pruebas de integraciÃ³n de `GET /api/performances` (sin filtros, con filtros, 400) y `/filters`
- [X] T012 [US1] Crear `features/catalog/api.ts` con `getPerformances(filters)` y `getFilters()`
- [X] T013 [P] [US1] Crear componentes `Filters`, `PerformanceCard` y `AvailabilityBadge`
- [X] T014 [US1] Crear `pages/ProgramPage.tsx` (agrupado por dÃ­a, filtros en URL, estado vacÃ­o, `aria-live`) y conectarla en `router.tsx`
- [X] T015 [P] [US1] Prueba de `ProgramPage` (render con datos simulados, filtro actualiza la URL)

**Checkpoint**: la cartelera funciona de punta a punta.

## Phase 4: User Story 2 â€” Detalle de obra (P1)

- [X] T016 [US2] MÃ³dulo `events` (repository, service con disponibilidad por funciÃ³n, controller, routes `GET /:id`)
- [X] T017 [P] [US2] Pruebas de integraciÃ³n de `GET /api/events/:id` (200, 404, 400)
- [X] T018 [US2] Crear `pages/EventDetailPage.tsx` con botÃ³n "Reservar" â†’ `/reservar/:performanceId`
- [X] T019 [P] [US2] Prueba de `EventDetailPage` (datos y estado 404)

## Phase 5: User Story 3 â€” Artistas (P2)

- [X] T020 [US3] MÃ³dulo `artists` (`GET /`, con `search`, y `GET /:id`)
- [X] T021 [P] [US3] Pruebas de integraciÃ³n de artistas
- [X] T022 [US3] Crear `ArtistsPage.tsx` (buscador con `label`) y `ArtistDetailPage.tsx`

## Phase 6: User Story 4 â€” Escenarios (P2)

- [X] T023 [US4] MÃ³dulo `venues` (`GET /`, `GET /:id` con `upcomingPerformances`)
- [X] T024 [P] [US4] Pruebas de integraciÃ³n de escenarios
- [X] T025 [US4] Crear componente `VenueMap` (iframe OSM con `title` + enlace "CÃ³mo llegar")
- [X] T026 [US4] Crear `VenuesPage.tsx` y `VenueDetailPage.tsx`

## Phase 7: Polish

- [X] T027 RevisiÃ³n de accesibilidad con teclado y lector de pantalla en las 6 pantallas
- [X] T028 `npm run lint && npm run typecheck && npm test` en verde
- [X] T029 Actualizar `docs/arquitectura/` si cambiÃ³ algÃºn flujo y abrir el PR hacia `develop`

## Dependencias

- Phase 2 bloquea las Phases 3 a 6.
- Las Phases 4, 5 y 6 son independientes entre sÃ­ tras la Phase 3.
- El Spec #3 reutiliza `getReservedSeatsByPerformance`: conviene integrar la Phase 2 pronto en `develop`.

