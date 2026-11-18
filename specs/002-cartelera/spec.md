# Feature Specification: Cartelera y detalle

**Feature Branch**: `feature/spec-2-cartelera`

**Created**: 2026-11-18

**Status**: Approved (pendiente de implementación)

**Owner**: Cristina Feijo

**Input**: User description: "Cartelera y detalle: listado de funciones con filtros,
detalle de obra, artistas y escenarios (API + pantallas)."

**Depends on**: Spec #1 (modelo de datos, layout, cliente HTTP, formato de errores).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar la cartelera con filtros (Priority: P1) 🎯 MVP

Como asistente al festival, quiero ver todas las funciones ordenadas por fecha y hora y
filtrarlas por fecha, disciplina y escenario, para decidir a qué ir.

**Why this priority**: Es la razón principal por la que el público visita el sitio.

**Independent Test**: Abrir `/cartelera`, elegir "Danza" y "Teatro Bolívar": solo
aparecen funciones de danza en ese escenario, agrupadas por día.

**Acceptance Scenarios**:

1. **Given** funciones programadas, **When** abro `/cartelera` sin filtros, **Then** veo
   todas las funciones `SCHEDULED` futuras agrupadas por día y ordenadas por hora.
2. **Given** la cartelera, **When** selecciono una fecha, **Then** solo veo las funciones de
   ese día (en hora de Ecuador, `America/Guayaquil`).
3. **Given** la cartelera, **When** combino disciplina y escenario, **Then** los filtros se
   aplican juntos (AND) y la URL refleja los filtros (`?fecha=2026-11-21&disciplina=DANCE&escenario=2`)
   para poder compartirla.
4. **Given** filtros sin resultados, **When** se aplican, **Then** veo "No hay funciones con
   estos filtros" y un botón para limpiar los filtros.
5. **Given** cada función listada, **Then** muestra: título de la obra, disciplina, hora,
   escenario, duración y estado de disponibilidad (`Disponible`, `Últimas entradas`
   si quedan ≤ 10 %, o `Agotado`).
6. **Given** una función cancelada, **Then** aparece marcada como "Cancelada" y no es
   reservable.

---

### User Story 2 - Ver el detalle de una obra (Priority: P1)

Como asistente, quiero ver la sinopsis, duración, clasificación por edad, artistas y todas
las funciones de una obra, para decidir y luego reservar.

**Independent Test**: Desde la cartelera, abrir una obra: se ve su información completa,
la lista de funciones y enlaces a cada artista y escenario.

**Acceptance Scenarios**:

1. **Given** una obra existente, **When** abro `/obras/:id`, **Then** veo título, imagen con
   texto alternativo, disciplina, sinopsis, duración, clasificación por edad, artistas
   (con enlace) y funciones (fecha, hora, escenario con enlace y disponibilidad).
2. **Given** una función disponible en el detalle, **Then** hay un botón "Reservar" que lleva
   a la pantalla de reserva del Spec #3 (`/reservar/:performanceId`).
3. **Given** un id inexistente, **When** abro `/obras/9999`, **Then** veo "Obra no
   encontrada" con enlace a la cartelera (la API responde `404`).

---

### User Story 3 - Conocer a los artistas y compañías (Priority: P2)

Como asistente, quiero ver el listado de artistas y compañías y su biografía, para
descubrir propuestas nuevas.

**Independent Test**: `/artistas` lista los artistas; al abrir uno se ve su biografía,
país y las obras que presenta.

**Acceptance Scenarios**:

1. **Given** `/artistas`, **Then** veo tarjetas con nombre, tipo (Solista / Compañía), país e imagen.
2. **Given** `/artistas`, **When** escribo en el buscador, **Then** la lista se filtra por nombre.
3. **Given** `/artistas/:id`, **Then** veo biografía, sitio web (si existe) y obras con enlace.

---

### User Story 4 - Ubicar los escenarios (Priority: P2)

Como asistente que no conoce Loja, quiero ver los escenarios con dirección y mapa, para
llegar a tiempo.

**Independent Test**: `/escenarios/:id` muestra la dirección, un mapa con la ubicación y las
próximas funciones en ese escenario.

**Acceptance Scenarios**:

1. **Given** `/escenarios`, **Then** veo cada escenario con nombre, dirección y capacidad.
2. **Given** `/escenarios/:id`, **Then** veo un mapa de OpenStreetMap centrado en sus
   coordenadas, un enlace "Cómo llegar" y las próximas funciones en ese escenario.
3. **Given** el mapa, **Then** tiene un título accesible y la dirección también está en texto
   (el mapa no es la única forma de obtener la información).

### Edge Cases

- Filtro con valor inválido (`?disciplina=XYZ` o fecha mal formada): la API responde `400`
  `VALIDATION_ERROR`; el frontend ignora el filtro inválido y lo indica.
- Obra sin funciones futuras: el detalle lo indica ("Sin funciones programadas").
- Artista sin imagen: se muestra un marcador con sus iniciales.
- Muchas funciones: el listado sigue siendo usable en móvil (agrupación por día).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La API MUST exponer `GET /api/performances` con filtros opcionales `date`
  (`YYYY-MM-DD`, en hora de Ecuador), `discipline` y `venueId`, ordenado por `startsAt`.
- **FR-002**: Cada función MUST incluir `availableSeats`, calculado en el backend como
  `capacity − Σ quantity` de reservas `CONFIRMED`. El frontend no lo calcula.
- **FR-003**: La API MUST exponer `GET /api/performances/filters` con las fechas que tienen
  funciones, las disciplinas y los escenarios, para poblar los selectores.
- **FR-004**: La API MUST exponer `GET /api/events/:id`, `GET /api/artists`,
  `GET /api/artists/:id`, `GET /api/venues` y `GET /api/venues/:id`.
- **FR-005**: Todos los parámetros MUST validarse con Zod y responder con el formato de
  error común del Spec #1.
- **FR-006**: El frontend MUST implementar las pantallas `/cartelera`, `/obras/:id`,
  `/artistas`, `/artistas/:id`, `/escenarios` y `/escenarios/:id`, reemplazando los
  placeholders del Spec #1.
- **FR-007**: Los filtros de la cartelera MUST sincronizarse con la URL.
- **FR-008**: Las disciplinas MUST mostrarse en español (Teatro, Danza, Música, Circo,
  Artes de calle).
- **FR-009**: Las pantallas MUST cumplir la accesibilidad de la constitución (filtros con
  `label`, resultados anunciados con `aria-live`, imágenes con `alt`).

### Key Entities

Usa las entidades del Spec #1 sin modificarlas: `Event`, `Performance`, `Artist`, `Venue`
(y `Reservation` solo para calcular la disponibilidad).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario encuentra las funciones de una disciplina en un día concreto en
  menos de 3 interacciones.
- **SC-002**: Todas las pantallas son navegables solo con teclado.
- **SC-003**: Cada endpoint tiene pruebas de integración (caso feliz + error) y los filtros
  tienen pruebas unitarias en el service.
- **SC-004**: La cartelera carga en menos de 1 s en local con los datos de ejemplo.

## Assumptions

- La cartelera muestra por defecto solo funciones futuras. Para la demostración, el seed
  genera funciones del 20 al 28 de noviembre de 2026.
- El mapa usa el iframe de OpenStreetMap (sin API key, sin dependencias nuevas).
- No hay paginación: el volumen del festival (decenas de funciones) no la requiere.
- El botón "Reservar" solo navega; la lógica de reserva es del Spec #3.
