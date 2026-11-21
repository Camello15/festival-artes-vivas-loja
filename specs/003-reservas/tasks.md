---
description: "Lista de tareas del Spec #3 — Reservas y administración"
---

# Tasks: Reservas y administración

**Input**: Documentos de diseño en `/specs/003-reservas/`

**Prerequisites**: plan.md, spec.md; Spec #1 integrado en `develop`.

**Tests**: Sí (constitución, principio III). La prueba de concurrencia es obligatoria.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Actualizar la rama: `git merge origin/develop`; `npm install && npm run db:setup && npm test` en verde
- [X] T002 Instalar `jsonwebtoken` y `@types/jsonwebtoken` en `apps/api`; agregar `JWT_SECRET` y `JWT_EXPIRES_IN` a `config/env.ts`

## Phase 2: Foundational

- [X] T003 Crear `apps/api/src/modules/users/users.repository.ts` (`findByEmail`, `findById`, `create`)
- [X] T004 Crear `apps/api/src/middlewares/auth.ts` con `requireAuth` (verifica JWT y pone `req.user`) y `requireRole(...roles)`
- [X] T005 [P] Pruebas de los middlewares (sin token → 401, token inválido → 401, rol incorrecto → 403)
- [X] T006 Agregar `setAuthToken()` y manejo de `401` en `apps/web/src/lib/api.ts`

## Phase 3: User Story 1 — Registro e inicio de sesión (P1)

- [X] T007 [US1] Módulo `auth`: schemas (Zod), service (bcrypt + JWT), controller, routes; registrar en `routes/index.ts`
- [X] T008 [P] [US1] Pruebas de integración: registro (201, 409, 400), login (200, 401), me (200, 401)
- [X] T009 [US1] Crear `features/auth/AuthContext.tsx` y `ProtectedRoute.tsx`
- [X] T010 [US1] Crear `LoginPage.tsx` (con redirección `?next=`) y `RegisterPage.tsx`
- [X] T011 [US1] Mostrar usuario / "Cerrar sesión" en el `Header` y el enlace "Admin" solo para `ADMIN`

## Phase 4: User Story 2 — Reservar con control de aforo (P1) 🎯 MVP

- [X] T012 [US2] Crear `reservations.repository.ts` (`create`, `sumConfirmed(tx, performanceId, userId?)`, `findByUser`)
- [X] T013 [US2] Crear `reservations.service.ts` con `reserve()` transaccional según `plan.md` y generador de código `FAV-XXXXXX`
- [X] T014 [P] [US2] Pruebas unitarias de las reglas: sin aforo, función iniciada, función cancelada, límite de 6
- [X] T015 [US2] Prueba de concurrencia `reservations.concurrency.test.ts`: 20 reservas simultáneas sobre 10 entradas libres → exactamente 10 confirmadas
- [X] T016 [US2] Controller y routes `POST /api/reservations` (requiere sesión); configurar `busy_timeout` en `lib/prisma.ts`
- [X] T017 [US2] Crear `ReservePage.tsx` (`/reservar/:performanceId`): resumen de la función, selector de cantidad, confirmación con código
- [X] T018 [US2] Escribir `docs/adr/0006-control-de-aforo.md`

## Phase 5: User Story 3 — Mis reservas (P2)

- [X] T019 [US3] `GET /api/reservations/me` y `PATCH /api/reservations/:id/cancel` (idempotente; 404 si no es del usuario)
- [X] T020 [P] [US3] Pruebas de integración de listar y cancelar
- [X] T021 [US3] Crear `MyReservationsPage.tsx` con `ConfirmDialog` accesible

## Phase 6: User Story 4 — Panel de administración (P2)

- [X] T022 [US4] Componentes reutilizables `DataTable`, `EntityForm` y `ConfirmDialog` en `features/admin/components/`
- [X] T023 [P] [US4] CRUD admin de `venues` (API + pruebas + página)
- [X] T024 [P] [US4] CRUD admin de `artists` (API + pruebas + página; borrar con obras → 409)
- [X] T025 [P] [US4] CRUD admin de `events` con `artistIds` (API + pruebas + página)
- [X] T026 [US4] CRUD admin de `performances` con reglas de aforo, cancelación y lista de reservas (API + pruebas + páginas)
- [ ] T027 [US4] Prueba de autorización: todos los `/api/admin/*` → 401 sin token y 403 con rol `PUBLIC`
- [ ] T028 [US4] `AdminLayout` con navegación lateral y rutas `/admin/*` protegidas por rol
- [ ] T029 [US4] Log de auditoría (`console.info` estructurado: usuario, acción, entidad, id) en services de admin y reservas

## Phase 7: User Story 5 — Agenda del artista (P3)

- [ ] T030 [US5] `GET /api/me/artist/performances` (rol `ARTIST`) con prueba
- [ ] T031 [US5] Crear `ArtistAgendaPage.tsx` (`/mi-agenda`)

## Phase 8: Polish

- [ ] T032 Revisión de accesibilidad de formularios y diálogos con teclado
- [ ] T033 `npm run lint && npm run typecheck && npm test` en verde
- [ ] T034 Actualizar las vistas de arquitectura si cambió algún flujo y abrir el PR hacia `develop`

## Dependencias

- Phase 2 bloquea todo. Phase 3 (auth) bloquea las Phases 4 a 7.
- T023, T024 y T025 son paralelizables; T026 depende de T023 y T025.
