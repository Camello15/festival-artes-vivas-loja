---
description: "Lista de tareas del Spec #1 — Base del proyecto"
---

# Tasks: Base del proyecto

**Input**: Documentos de diseño en `/specs/001-base/`

**Prerequisites**: plan.md, spec.md, data-model.md

**Tests**: Sí; la constitución (principio III) exige pruebas mínimas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede hacerse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario (US1…US4)

## Phase 1: Setup

- [ ] T001 Crear `package.json` raíz con npm workspaces (`apps/*`), scripts comunes y `engines.node >= 20`; agregar `.nvmrc`
- [ ] T002 [P] Crear `tsconfig.base.json` compartido y configuración de ESLint (flat config) + Prettier en la raíz
- [ ] T003 [P] Inicializar `apps/api/package.json` con Express 5, Prisma 6, Zod, cors, bcryptjs, tsx y Vitest + Supertest
- [ ] T004 [P] Inicializar `apps/web` con Vite + React 19 + TypeScript, React Router 7, TailwindCSS 4 y Vitest + Testing Library

## Phase 2: Foundational

- [ ] T005 [US2] Definir el esquema en `apps/api/prisma/schema.prisma` según `data-model.md`
- [ ] T006 [US2] Generar la migración inicial `init` en `apps/api/prisma/migrations/`
- [ ] T007 [P] [US2] Crear `apps/api/src/domain/enums.ts` con `Role`, `Discipline`, `ArtistKind`, `PerformanceStatus`, `ReservationStatus`
- [ ] T008 [P] [US4] Crear `apps/api/src/config/env.ts` (variables validadas con Zod) y `apps/api/.env.example`
- [ ] T009 [P] [US4] Crear `apps/api/src/lib/prisma.ts` (instancia única de PrismaClient)
- [ ] T010 [US4] Crear `AppError`, middleware `errorHandler` y `notFound` en `apps/api/src/errors` y `apps/api/src/middlewares`
- [ ] T011 [US4] Crear `apps/api/src/app.ts` (Express, cors, json, router `/api`, middlewares de error) y `apps/api/src/server.ts`

**Checkpoint**: la API arranca y responde 404 con formato JSON.

## Phase 3: User Story 2 — Datos de ejemplo (P1)

- [ ] T012 [US2] Escribir `apps/api/prisma/seed.ts` idempotente: 5 escenarios de Loja, 8 artistas, 8 obras (5 disciplinas), ≥15 funciones del 20 al 28 de noviembre de 2026, 3 usuarios con bcrypt y 2 reservas de ejemplo
- [ ] T013 [US2] Agregar scripts `db:setup`, `db:seed`, `db:studio` en la API y en la raíz

## Phase 4: User Story 4 — Ejemplo de capas (P2)

- [ ] T014 [P] [US4] Módulo `health`: `health.repository.ts` (ping a la BD), `health.service.ts`, `health.controller.ts`, `health.routes.ts`
- [ ] T015 [P] [US4] Módulo `festival`: repository (conteos y rango de fechas), service (arma el resumen), controller y routes para `GET /api/festival/summary`
- [ ] T016 [US4] Registrar los módulos en `apps/api/src/routes/index.ts`
- [ ] T017 [P] [US4] Prueba unitaria de `festival.service` con repository simulado en `apps/api/tests/festival.service.test.ts`
- [ ] T018 [P] [US4] Pruebas de integración de `/api/health`, `/api/festival/summary` y 404 en `apps/api/tests/app.test.ts`

## Phase 5: User Story 3 — Layout y navegación (P2)

- [ ] T019 [US3] Configurar Tailwind con la paleta del festival y `index.html` con `lang="es"`
- [ ] T020 [P] [US3] Crear `apps/web/src/lib/api.ts` (cliente fetch con manejo del formato de error) y `lib/format.ts`
- [ ] T021 [US3] Crear `Layout`, `Header` (navegación + menú móvil accesible), `Footer` y `SkipLink` en `apps/web/src/components/layout/`
- [ ] T022 [P] [US3] Crear `ComingSoon`, `ErrorMessage` y `Spinner` en `apps/web/src/components/ui/`
- [ ] T023 [US3] Crear `HomePage` que consume `/api/festival/summary` con estados de carga y error
- [ ] T024 [US3] Crear `router.tsx` con todas las rutas de los 3 specs (placeholders `ComingSoon` para Specs #2 y #3) y `NotFoundPage`
- [ ] T025 [P] [US3] Pruebas de render del layout, navegación y 404 en `apps/web/src/test/`

## Phase 6: User Story 1 — Levantar en local (P1)

- [ ] T026 [US1] Script `dev` raíz que levanta web y API en paralelo; proxy `/api` en `vite.config.ts`
- [ ] T027 [P] [US1] `docker-compose.yml` opcional (servicios `api` y `web` con volumen para la BD)
- [ ] T028 [US1] Workflow de CI `.github/workflows/ci.yml`: install, lint, typecheck, test, build
- [ ] T029 [US1] Verificar en limpio: `npm install && npm run db:setup && npm test && npm run dev`

## Dependencias

- Phase 1 → Phase 2 → (Phase 3 y Phase 4 en paralelo) → Phase 5 → Phase 6.
- T015 depende de T012 solo para las pruebas de integración con datos.
