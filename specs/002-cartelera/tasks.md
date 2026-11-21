---
description: "Lista de tareas del Spec #2 — Cartelera y detalle"
---

# Tasks: Cartelera y detalle

**Input**: Documentos de diseño en `/specs/002-cartelera/`

**Prerequisites**: plan.md, spec.md; Spec #1 integrado en `develop`.

**Tests**: Sí (constitución, principio III).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Actualizar la rama: `git merge origin/develop`; `npm install && npm run db:setup && npm test` en verde
- [ ] T002 [P] Ampliar `apps/web/src/lib/labels.ts` (ya trae las disciplinas y sus colores del Spec #1) con tipo de artista y disponibilidad
- [ ] T003 [P] Crear `apps/web/src/features/catalog/types.ts` con los tipos de respuesta de los contratos de `plan.md`

## Phase 2: Foundational

- [ ] T004 Crear `apps/api/src/modules/performances/performances.repository.ts` con `findMany(filters)` y `getReservedSeatsByPerformance(ids)`
- [ ] T005 Crear `apps/api/src/modules/performances/availability.ts` con `computeAvailability(capacity, reserved)` → `{ availableSeats, availability }`
- [ ] T006 [P] Prueba unitaria de `computeAvailability` (disponible, últimas entradas en el 10 %, agotado, nunca negativo) en `apps/api/tests/availability.test.ts`

**Checkpoint**: la base de cálculo de disponibilidad está probada.

## Phase 3: User Story 1 — Cartelera con filtros (P1) 🎯 MVP

- [ ] T007 [US1] Crear `performances.schemas.ts` (Zod: `date`, `discipline`, `venueId`, `includePast`)
- [ ] T008 [US1] Crear `performances.service.ts`: convierte `date` a rango UTC de Ecuador, aplica filtros y agrega disponibilidad
- [ ] T009 [US1] Crear `performances.controller.ts` y `performances.routes.ts` (`GET /`, `GET /filters`); registrar en `routes/index.ts`
- [ ] T010 [P] [US1] Prueba unitaria del service (conversión de fecha; combinación de filtros) en `apps/api/tests/performances.service.test.ts`
- [ ] T011 [P] [US1] Pruebas de integración de `GET /api/performances` (sin filtros, con filtros, 400) y `/filters`
- [ ] T012 [US1] Crear `features/catalog/api.ts` con `getPerformances(filters)` y `getFilters()`
- [ ] T013 [P] [US1] Crear componentes `Filters`, `PerformanceCard` y `AvailabilityBadge`
- [ ] T014 [US1] Crear `pages/ProgramPage.tsx` (agrupado por día, filtros en URL, estado vacío, `aria-live`) y conectarla en `router.tsx`
- [ ] T015 [P] [US1] Prueba de `ProgramPage` (render con datos simulados, filtro actualiza la URL)

**Checkpoint**: la cartelera funciona de punta a punta.

## Phase 4: User Story 2 — Detalle de obra (P1)

- [ ] T016 [US2] Módulo `events` (repository, service con disponibilidad por función, controller, routes `GET /:id`)
- [ ] T017 [P] [US2] Pruebas de integración de `GET /api/events/:id` (200, 404, 400)
- [ ] T018 [US2] Crear `pages/EventDetailPage.tsx` con botón "Reservar" → `/reservar/:performanceId`
- [ ] T019 [P] [US2] Prueba de `EventDetailPage` (datos y estado 404)

## Phase 5: User Story 3 — Artistas (P2)

- [ ] T020 [US3] Módulo `artists` (`GET /`, con `search`, y `GET /:id`)
- [ ] T021 [P] [US3] Pruebas de integración de artistas
- [ ] T022 [US3] Crear `ArtistsPage.tsx` (buscador con `label`) y `ArtistDetailPage.tsx`

## Phase 6: User Story 4 — Escenarios (P2)

- [ ] T023 [US4] Módulo `venues` (`GET /`, `GET /:id` con `upcomingPerformances`)
- [ ] T024 [P] [US4] Pruebas de integración de escenarios
- [ ] T025 [US4] Crear componente `VenueMap` (iframe OSM con `title` + enlace "Cómo llegar")
- [ ] T026 [US4] Crear `VenuesPage.tsx` y `VenueDetailPage.tsx`

## Phase 7: Polish

- [ ] T027 Revisión de accesibilidad con teclado y lector de pantalla en las 6 pantallas
- [ ] T028 `npm run lint && npm run typecheck && npm test` en verde
- [ ] T029 Actualizar `docs/arquitectura/` si cambió algún flujo y abrir el PR hacia `develop`

## Dependencias

- Phase 2 bloquea las Phases 3 a 6.
- Las Phases 4, 5 y 6 son independientes entre sí tras la Phase 3.
- El Spec #3 reutiliza `getReservedSeatsByPerformance`: conviene integrar la Phase 2 pronto en `develop`.
