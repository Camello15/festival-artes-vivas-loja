# Feature Specification: Base del proyecto

**Feature Branch**: `feature/spec-1-base`

**Created**: 2026-11-18

**Status**: Approved

**Owner**: Camilo Velepucha (líder)

**Input**: User description: "Base del proyecto: estructura del monorepo, configuración de
frontend y backend, base de datos, modelo de datos (Evento, Función, Artista, Escenario,
Reserva, Usuario), layout general y navegación."

## Contexto

El Festival Internacional de Artes Vivas de Loja reúne teatro, danza, música, circo y
artes de calle en varios escenarios de la ciudad. Este spec construye los cimientos sobre
los que los Specs #2 (cartelera y detalle) y #3 (reservas y administración) se
implementan en paralelo, sin pisarse.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Levantar el proyecto en local (Priority: P1)

Como integrante del equipo, quiero clonar el repositorio y levantar frontend, backend y
base de datos con pocos comandos, para empezar a trabajar en mi spec el mismo día.

**Why this priority**: Sin esto ningún otro spec puede comenzar.

**Independent Test**: En una máquina Linux limpia con Node.js 20+, ejecutar
`npm install`, `npm run db:setup` y `npm run dev`. La web responde en
`http://localhost:5173` y `GET http://localhost:3000/api/health` responde `200`.

**Acceptance Scenarios**:

1. **Given** el repositorio recién clonado, **When** ejecuto `npm install` en la raíz,
   **Then** se instalan las dependencias de `apps/web` y `apps/api` sin errores.
2. **Given** las dependencias instaladas, **When** ejecuto `npm run db:setup`, **Then** se
   crea la base SQLite con todas las tablas y datos de ejemplo del festival.
3. **Given** la base creada, **When** ejecuto `npm run dev`, **Then** frontend y backend
   arrancan a la vez y el frontend puede llamar a la API a través de `/api`.
4. **Given** el proyecto levantado, **When** ejecuto `npm test`, **Then** las pruebas de
   ambas aplicaciones pasan.

---

### User Story 2 - Modelo de datos del festival (Priority: P1)

Como desarrollador de los Specs #2 y #3, quiero un modelo de datos completo y con datos de
ejemplo realistas, para construir la cartelera y las reservas sin redefinir entidades.

**Why this priority**: Es el contrato compartido entre los tres specs; cambiarlo después
genera conflictos entre ramas.

**Independent Test**: Tras `npm run db:setup`, `npm run db:studio` muestra las seis
entidades con datos y relaciones coherentes.

**Acceptance Scenarios**:

1. **Given** la base inicializada, **When** consulto los eventos, **Then** cada uno tiene
   disciplina, al menos un artista y al menos una función en un escenario.
2. **Given** la base inicializada, **When** consulto los usuarios, **Then** existe al
   menos un administrador, un artista y un usuario del público con contraseña cifrada.
3. **Given** una función, **When** consulto su aforo, **Then** es un número positivo que
   no supera la capacidad del escenario.

---

### User Story 3 - Layout y navegación (Priority: P2)

Como visitante, quiero una página de inicio con identidad del festival y un menú que me
lleve a cartelera, artistas, escenarios y mi cuenta, para orientarme desde el primer
momento.

**Why this priority**: Da a los Specs #2 y #3 un lugar fijo donde montar sus pantallas.

**Independent Test**: Abrir `http://localhost:5173`, recorrer el menú solo con teclado
(Tab/Enter) y llegar a cada sección. Las secciones aún no implementadas muestran un aviso
"Próximamente" que indica qué spec las construirá.

**Acceptance Scenarios**:

1. **Given** la página de inicio, **When** carga, **Then** muestra el nombre del festival,
   las fechas y un resumen (número de obras, funciones, artistas y escenarios) obtenido de
   la API.
2. **Given** cualquier página, **When** navego con Tab, **Then** el primer elemento es un
   enlace "Saltar al contenido" y el foco es siempre visible.
3. **Given** una pantalla de celular (360 px), **When** abro el menú, **Then** se muestra
   como menú desplegable accesible (botón con `aria-expanded`).
4. **Given** una URL inexistente, **When** la visito, **Then** veo una página 404 con
   enlace al inicio.
5. **Given** la API apagada, **When** cargo el inicio, **Then** veo un mensaje de error
   comprensible en lugar de una pantalla en blanco.

---

### User Story 4 - Arquitectura en capas lista para extender (Priority: P2)

Como desarrollador, quiero un ejemplo funcional que recorra todas las capas del backend
(route → controller → service → repository), para copiar el patrón al agregar endpoints.

**Independent Test**: `GET /api/festival/summary` devuelve los conteos y fechas del
festival, y tiene pruebas unitarias del service e integración del endpoint.

**Acceptance Scenarios**:

1. **Given** la base con datos, **When** llamo `GET /api/festival/summary`, **Then**
   recibo `200` con `events`, `performances`, `artists`, `venues`, `startsAt`, `endsAt`.
2. **Given** una ruta inexistente `/api/xyz`, **When** la llamo, **Then** recibo `404`
   con cuerpo JSON `{ "error": { "code": "NOT_FOUND", "message": ... } }`.
3. **Given** un error inesperado en un service, **When** ocurre, **Then** la API responde
   `500` con el mismo formato de error y sin filtrar detalles internos.

### Edge Cases

- Base de datos inexistente o sin migrar: `GET /api/health` responde `503` con
  `database: "down"` en lugar de colgarse.
- Puerto 3000 o 5173 ocupado: los puertos se configuran con variables de entorno.
- Ejecutar `npm run db:setup` dos veces: el seed es idempotente (borra y recrea los datos
  de ejemplo) y no duplica registros.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El repositorio MUST ser un monorepo con npm workspaces: `apps/web` y `apps/api`.
- **FR-002**: La raíz MUST exponer los scripts `dev`, `build`, `test`, `lint`,
  `typecheck`, `db:setup`, `db:seed` y `db:studio`.
- **FR-003**: El backend MUST organizarse en las capas `routes`, `controllers`,
  `services`, `repositories`, con un middleware común de errores y de rutas no encontradas.
- **FR-004**: El backend MUST exponer `GET /api/health` (estado de API y base de datos) y
  `GET /api/festival/summary`.
- **FR-005**: El modelo de datos MUST incluir `User`, `Venue`, `Artist`, `Event`,
  `Performance` y `Reservation` con las relaciones descritas en `data-model.md`.
- **FR-006**: El sistema MUST incluir datos de ejemplo: al menos 5 escenarios reales de
  Loja, 8 artistas o compañías, 8 obras de las 5 disciplinas, 15 funciones y 3 usuarios
  (uno por rol).
- **FR-007**: Las contraseñas de ejemplo MUST guardarse cifradas (bcrypt).
- **FR-008**: El frontend MUST tener un layout común (encabezado con navegación,
  contenido principal y pie) y rutas para todas las pantallas de los tres specs.
- **FR-009**: El frontend MUST tener un cliente HTTP único (`src/lib/api.ts`) que los
  Specs #2 y #3 reutilizan.
- **FR-010**: La interfaz MUST cumplir el principio de accesibilidad de la constitución
  (skip link, foco visible, `lang="es"`, landmarks).
- **FR-011**: El proyecto MAY levantarse con `docker compose up`.

### Key Entities

- **User**: persona que usa el sistema; rol `PUBLIC`, `ARTIST` o `ADMIN`.
- **Venue (Escenario)**: lugar físico del festival con dirección, coordenadas y capacidad.
- **Artist (Artista/Compañía)**: persona o colectivo que presenta obras.
- **Event (Obra/Evento)**: espectáculo con disciplina, sinopsis, duración y clasificación.
- **Performance (Función)**: presentación concreta de un evento en un escenario,
  fecha/hora y aforo.
- **Reservation (Reserva)**: entradas reservadas por un usuario para una función.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un integrante nuevo levanta el proyecto en menos de 10 minutos siguiendo
  solo el README.
- **SC-002**: `npm test`, `npm run lint` y `npm run typecheck` terminan sin errores.
- **SC-003**: La página de inicio no tiene errores de accesibilidad críticos (sin
  violaciones de contraste ni elementos sin nombre accesible).
- **SC-004**: Los Specs #2 y #3 pueden implementarse sin modificar `schema.prisma` salvo
  para agregar campos opcionales.

## Assumptions

- El prototipo corre solo en local; no hay despliegue en la nube.
- Zona horaria del festival: `America/Guayaquil` (UTC-5). Las fechas se guardan en UTC.
- Fechas del festival de ejemplo: del 20 al 28 de noviembre de 2026.
- La autenticación (registro, login, JWT) es responsabilidad del Spec #3; este spec solo
  crea el modelo `User` y usuarios de ejemplo.
