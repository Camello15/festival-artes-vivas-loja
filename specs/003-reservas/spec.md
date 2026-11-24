# Feature Specification: Reservas y administración

**Feature Branch**: `feature/spec-3-reservas`

**Created**: 2026-11-18

**Status**: Approved (pendiente de implementación)

**Owner**: Bryan Villa

**Input**: User description: "Reservas y administración: reserva de entradas con control
de aforo, autenticación simple y panel admin (CRUD)."

**Depends on**: Spec #1 (modelo, layout, errores). Se integra con el Spec #2 a través del
botón "Reservar" (`/reservar/:performanceId`) y de `getReservedSeatsByPerformance`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrarse e iniciar sesión (Priority: P1)

Como asistente, quiero crear una cuenta con nombre, correo y contraseña e iniciar sesión,
para poder reservar entradas a mi nombre.

**Why this priority**: Toda reserva y toda acción de administración requieren identidad.

**Independent Test**: Registrarse en `/registro`, cerrar sesión, ingresar en `/ingresar` y
ver el nombre en el encabezado.

**Acceptance Scenarios**:

1. **Given** un correo no registrado, **When** me registro con contraseña de 8+ caracteres,
   **Then** se crea la cuenta con rol `PUBLIC` y quedo con la sesión iniciada.
2. **Given** un correo ya registrado, **When** intento registrarme, **Then** veo "Ese correo
   ya está registrado" (API `409 CONFLICT`).
3. **Given** credenciales incorrectas, **When** intento ingresar, **Then** veo "Correo o
   contraseña incorrectos", sin revelar cuál de los dos falló (API `401`).
4. **Given** una sesión iniciada, **When** pulso "Cerrar sesión", **Then** vuelvo al estado
   anónimo.

---

### User Story 2 - Reservar entradas con control de aforo (Priority: P1) 🎯 MVP

Como asistente con sesión, quiero reservar de 1 a 6 entradas para una función y recibir
un código de reserva, para presentarlo en la entrada del escenario.

**Why this priority**: Es el objetivo de negocio principal; el control de aforo es la
regla más crítica del sistema.

**Independent Test**: Reservar 2 entradas en una función con aforo 450: se obtiene un
código `FAV-XXXXXX` y la disponibilidad baja a 448 en la cartelera.

**Acceptance Scenarios**:

1. **Given** una función con entradas disponibles, **When** reservo N entradas (1 ≤ N ≤ 6),
   **Then** se crea la reserva `CONFIRMED` con un código único y veo la confirmación.
2. **Given** una función con 3 entradas libres, **When** intento reservar 4, **Then** la
   reserva se rechaza con "Solo quedan 3 entradas" (API `409`) y no se crea nada.
3. **Given** dos usuarios que reservan las últimas entradas **al mismo tiempo**, **Then**
   solo uno lo consigue; el aforo nunca se supera.
4. **Given** una función ya iniciada o cancelada, **When** intento reservar, **Then** se
   rechaza (`409`).
5. **Given** que ya tengo 6 entradas en esa función, **When** intento reservar más,
   **Then** se rechaza: máximo 6 entradas por persona y función.
6. **Given** que no tengo sesión, **When** pulso "Reservar", **Then** voy a `/ingresar` y,
   tras ingresar, vuelvo a la reserva.

---

### User Story 3 - Ver y cancelar mis reservas (Priority: P2)

Como asistente, quiero ver mis reservas y cancelar las que no usaré, para liberar el cupo.

**Independent Test**: En `/mis-reservas` aparece la reserva creada; al cancelarla, su estado
cambia a "Cancelada" y la disponibilidad de la función sube.

**Acceptance Scenarios**:

1. **Given** reservas propias, **When** abro `/mis-reservas`, **Then** veo código, obra,
   fecha, escenario, cantidad y estado, ordenadas por fecha de la función.
2. **Given** una reserva confirmada de una función futura, **When** la cancelo (con
   diálogo de confirmación), **Then** pasa a `CANCELLED`; no se borra.
3. **Given** una reserva de otro usuario, **When** intento cancelarla por la API, **Then**
   recibo `404` (no se revela que existe).

---

### User Story 4 - Panel de administración (Priority: P2)

Como administrador del festival, quiero crear, editar y eliminar escenarios, artistas,
obras y funciones, y ver la lista de reservas de cada función, para mantener la
programación al día y controlar el acceso.

**Independent Test**: Con el usuario admin del seed, crear una obra y una función en
`/admin`: aparecen en la cartelera pública.

**Acceptance Scenarios**:

1. **Given** un usuario sin rol `ADMIN`, **When** entra a `/admin` o llama a `/api/admin/*`,
   **Then** se le niega el acceso (`403`; el frontend muestra "No tienes permisos").
2. **Given** el panel, **When** creo o edito una entidad con datos inválidos, **Then** veo los
   errores junto a cada campo (API `400` con `details`).
3. **Given** una función, **When** intento poner un aforo mayor que la capacidad del
   escenario o menor que las entradas ya reservadas, **Then** se rechaza.
4. **Given** una función con reservas confirmadas, **When** intento eliminarla, **Then** se
   rechaza y se ofrece **cancelarla** (estado `CANCELLED`, reservas canceladas).
5. **Given** una función, **When** abro su lista de reservas, **Then** veo código, nombre,
   cantidad y estado, y el total de entradas confirmadas.

---

### User Story 5 - Artista consulta sus funciones (Priority: P3)

Como artista con cuenta, quiero ver mis funciones y cuántas entradas se han reservado,
para preparar cada presentación.

**Independent Test**: Ingresar con el usuario artista del seed y abrir `/mi-agenda`.

**Acceptance Scenarios**:

1. **Given** un usuario `ARTIST` vinculado a un `Artist`, **When** abre `/mi-agenda`,
   **Then** ve sus funciones con entradas reservadas / aforo.

### Edge Cases

- Token expirado o manipulado: la API responde `401` y el frontend cierra la sesión.
- Cantidad no entera, 0 o > 6: `400 VALIDATION_ERROR`.
- Borrar un escenario con funciones o un artista con obras: `409` con mensaje claro.
- Cancelar una reserva ya cancelada: idempotente, responde `200` sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La API MUST exponer `POST /api/auth/register`, `POST /api/auth/login` y
  `GET /api/auth/me`, con contraseñas cifradas con bcrypt y sesión mediante JWT (8 h).
- **FR-002**: La API MUST tener middlewares `requireAuth` y `requireRole(...roles)`.
- **FR-003**: `POST /api/reservations` MUST verificar disponibilidad y crear la reserva
  **dentro de una sola transacción**, de modo que reservas concurrentes nunca superen el aforo.
- **FR-004**: La API MUST exponer `GET /api/reservations/me` y
  `PATCH /api/reservations/:id/cancel` (solo el dueño, solo funciones futuras).
- **FR-005**: La API MUST exponer CRUD bajo `/api/admin/{venues,artists,events,performances}`
  y `GET /api/admin/performances/:id/reservations`, solo para `ADMIN`.
- **FR-006**: Las reglas de negocio (aforo, límites, borrados) MUST vivir en services con
  pruebas unitarias.
- **FR-007**: El frontend MUST implementar `/ingresar`, `/registro`, `/reservar/:performanceId`,
  `/mis-reservas`, `/mi-agenda` y `/admin/*`, con rutas protegidas por rol.
- **FR-008**: Las acciones de administración y las reservas MUST registrarse en el log del
  servidor (quién, qué, cuándo).
- **FR-009**: Los formularios MUST cumplir la accesibilidad de la constitución (labels,
  errores asociados con `aria-describedby`, foco al primer error).

### Key Entities

Usa `User`, `Reservation`, `Performance`, `Event`, `Artist`, `Venue` del Spec #1. No se
requieren entidades nuevas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una prueba que lanza 20 reservas concurrentes sobre una función con 10 entradas
  libres termina con exactamente 10 entradas reservadas.
- **SC-002**: Un asistente completa una reserva (desde la cartelera, con sesión) en menos de 1 minuto.
- **SC-003**: El 100 % de los endpoints `/api/admin/*` responde `401` sin token y `403` con
  un token que no es de administrador (prueba automatizada).
- **SC-004**: Todas las reglas de la sección *Acceptance Scenarios* tienen al menos una prueba.

## Assumptions

- Autenticación simple de prototipo: JWT en `localStorage`. En producción se usarían
  cookies `httpOnly` (se documenta en un ADR del Spec #3).
- No hay pagos: las entradas son gratuitas (registro de asistencia), como en muchas
  funciones del festival.
- El registro público siempre crea usuarios `PUBLIC`; los roles `ARTIST` y `ADMIN` se
  asignan desde el seed o el panel admin.
- No se envían correos; el código de reserva se muestra en pantalla.
