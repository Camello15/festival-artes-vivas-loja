# Implementation Plan: Reservas y administración

**Branch**: `feature/spec-3-reservas` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-reservas/spec.md`

## Summary

Agregar autenticación con JWT, el módulo de reservas con control de aforo transaccional y
el panel de administración (CRUD de las cuatro entidades del catálogo), respetando la
arquitectura en capas del Spec #1.

## Technical Context

**Language/Version**: TypeScript 5, Node.js ≥ 20.12

**Primary Dependencies**: las del Spec #1 más `jsonwebtoken` (+ `@types/jsonwebtoken`).
`bcryptjs` ya está instalado.

**Storage**: SQLite vía Prisma (sin cambios de esquema).

**Testing**: Vitest + Supertest; prueba de concurrencia con `Promise.all`.

**Project Type**: Web (SPA + API REST).

**Constraints**: SQLite admite un solo escritor a la vez; la estrategia de aforo se apoya
en eso (ver *Decisiones técnicas*).

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. Claridad | Módulos `auth`, `reservations`, `admin/*`; ADR para JWT y para el control de aforo. ✅ |
| II. Capas | Aforo, límites y reglas de borrado en services; controllers solo validan y responden. ✅ |
| III. Pruebas | Unitarias de reglas + integración por endpoint + prueba de concurrencia + autorización. ✅ |
| IV. Accesibilidad | Formularios con `label`, errores con `aria-describedby`, diálogo de confirmación accesible. ✅ |
| V. Idiomas | Código en inglés; mensajes de error al usuario en español. ✅ |

## Project Structure

```text
apps/api/src/
├── middlewares/auth.ts                 # requireAuth, requireRole
├── modules/
│   ├── auth/          auth.{routes,controller,service,schemas}.ts   (usa users.repository)
│   ├── users/         users.repository.ts
│   ├── reservations/  reservations.{routes,controller,service,repository,schemas}.ts
│   └── admin/
│       ├── venues/        admin-venues.{routes,controller,service,schemas}.ts
│       ├── artists/       ...
│       ├── events/        ...
│       └── performances/  ...  (+ lista de reservas)
apps/api/tests/  auth.test.ts, reservations.service.test.ts, reservations.concurrency.test.ts, admin.*.test.ts

apps/web/src/
├── features/auth/       AuthContext.tsx, ProtectedRoute.tsx, api.ts
├── features/reservations/  api.ts, components/QuantitySelector.tsx
├── features/admin/      api.ts, components/{DataTable,EntityForm,ConfirmDialog}.tsx
└── pages/
    ├── LoginPage.tsx, RegisterPage.tsx
    ├── ReservePage.tsx            # /reservar/:performanceId
    ├── MyReservationsPage.tsx     # /mis-reservas
    ├── ArtistAgendaPage.tsx       # /mi-agenda
    └── admin/ AdminLayout.tsx, AdminVenuesPage.tsx, AdminArtistsPage.tsx,
               AdminEventsPage.tsx, AdminPerformancesPage.tsx, AdminPerformanceReservationsPage.tsx
```

## Contratos de la API

### Autenticación

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `201 { token, user }` · `409` · `400` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { token, user }` · `401` |
| GET | `/api/auth/me` | — (Bearer) | `200 { user }` · `401` |

`user = { id, name, email, role }`. El JWT lleva `{ sub: userId, role }`, expira en 8 h y se
firma con `JWT_SECRET`. Se envía como `Authorization: Bearer <token>`.

### Reservas (requiere sesión)

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/reservations` | `{ performanceId, quantity }` | `201 { id, code, quantity, status, performance }` · `409` (sin aforo, función iniciada/cancelada, límite por persona) · `404` |
| GET | `/api/reservations/me` | — | `200 [reservation + performance + event + venue]` |
| PATCH | `/api/reservations/:id/cancel` | — | `200 reservation` · `404` · `409` (función ya iniciada) |
| GET | `/api/me/artist/performances` | — (rol `ARTIST`) | `200 [performance + reservedSeats]` |

### Administración (rol `ADMIN`)

Para cada `resource ∈ { venues, artists, events, performances }`:

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/admin/{resource}` | `200 [...]` |
| GET | `/api/admin/{resource}/:id` | `200` · `404` |
| POST | `/api/admin/{resource}` | `201` · `400` |
| PUT | `/api/admin/{resource}/:id` | `200` · `400` · `404` · `409` |
| DELETE | `/api/admin/{resource}/:id` | `204` · `404` · `409` (tiene dependencias) |

Adicionales:

- `PATCH /api/admin/performances/:id/cancel` → `200` (cancela la función y sus reservas).
- `GET /api/admin/performances/:id/reservations` → `200 { totalConfirmed, reservations: [...] }`.
- `events` acepta `artistIds: number[]` para la relación muchos-a-muchos.

## Decisiones técnicas

### Control de aforo (crítico)

```ts
await prisma.$transaction(async (tx) => {
  // 1. Escribir PRIMERO: en SQLite la primera escritura toma el bloqueo de escritura,
  //    así que otra transacción concurrente espera aquí hasta que esta termine.
  const reservation = await tx.reservation.create({ data: { ..., status: 'CONFIRMED' } });
  // 2. Verificar DESPUÉS, ya con el bloqueo: la suma incluye a la reserva recién creada.
  const performance = await tx.performance.findUniqueOrThrow({ where: { id } });
  const reserved = await sumConfirmed(tx, id);
  const mine = await sumConfirmed(tx, id, userId);
  if (performance.status !== 'SCHEDULED' || performance.startsAt <= now) throw conflict(...);
  if (reserved > performance.capacity) throw conflict(`Solo quedan ${...} entradas`);
  if (mine > 6) throw conflict('Máximo 6 entradas por persona y función');
  return reservation;
}); // si se lanza un error, Prisma hace rollback y la reserva no existe
```

Configura `PRAGMA busy_timeout` (por ejemplo, 5000 ms) para que las transacciones en
espera no fallen de inmediato con `SQLITE_BUSY`. Documenta la decisión en
`docs/adr/0006-control-de-aforo.md`. Si en el futuro se migra a PostgreSQL, se cambia por
`SELECT ... FOR UPDATE` sobre la función.

### Código de reserva

`FAV-` + 6 caracteres de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin 0/O/1/I) con
`crypto.randomInt`; reintentar ante colisión del índice único.

### Frontend

- `AuthContext` guarda `{ token, user }` en `localStorage` y expone `login`, `logout`, `user`.
- `lib/api.ts` (Spec #1) recibe el token: se le agrega un `setAuthToken()` y, ante `401`, se
  dispara `logout`.
- `ProtectedRoute roles={['ADMIN']}` envuelve `/admin/*`.
- La cantidad se elige con un `<select>` de 1 a 6 (accesible por defecto).

## Riesgos

- **Seguridad del JWT en `localStorage`** (XSS): aceptable para un prototipo local; se registra en un ADR.
- **Conflictos con el Spec #2** en `router.tsx` y `routes/index.ts`: cambios de una línea.
