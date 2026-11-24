# 2. Vista de procesos

**Propósito**: mostrar cómo colaboran los componentes en tiempo de ejecución en los
flujos más importantes, incluidas la concurrencia y el manejo de errores.
**Interesados**: integradores del sistema, responsables de rendimiento y de integridad.

## Procesos en ejecución

| Proceso | Tecnología | Instancias | Comunicación |
|---|---|---|---|
| SPA | React en el navegador | Una por usuario | HTTP/JSON hacia la API |
| Servidor web de desarrollo | Vite (Node.js) | 1 | Sirve la SPA y redirige `/api` a la API (proxy) |
| API REST | Express (Node.js, un hilo con event loop) | 1 | Atiende peticiones concurrentes de forma asíncrona |
| Base de datos | SQLite (biblioteca embebida en el proceso de la API) | — | Llamadas locales vía Prisma |

## Diagramas de secuencia por caso de uso

Hay un diagrama por cada caso de uso de la [vista de escenarios](05-escenarios.md). Todos
siguen el mismo camino por capas: SPA → (middleware) → Controller (Zod) → Service (reglas)
→ Repository (Prisma) → SQLite.

| Caso de uso | Endpoint principal | Diagrama |
|---|---|---|
| UC1 Consultar cartelera | `GET /api/performances` | [UC1](#uc1--consultar-la-cartelera-con-filtros) |
| UC2 Ver detalle de obra | `GET /api/events/:id` | [UC2](#uc2--ver-el-detalle-de-una-obra) |
| UC3 Ver artistas | `GET /api/artists`, `/api/artists/:id` | [UC3](#uc3--ver-artistas-y-compañías) |
| UC4 Ver escenarios | `GET /api/venues`, `/api/venues/:id` | [UC4](#uc4--ver-escenarios-y-su-ubicación) |
| UC5 Registrarse e ingresar | `POST /api/auth/register`, `/login` | [UC5](#uc5--registrarse-iniciar-sesión-y-autorizar-una-petición) |
| UC6 Reservar entradas | `POST /api/reservations` | [UC6](#uc6--reservar-entradas) |
| UC7 Ver y cancelar mis reservas | `GET /api/reservations/me`, `PATCH …/:id/cancel` | [UC7](#uc7--ver-y-cancelar-mis-reservas) |
| UC8 Mi agenda (artista) | `GET /api/me/artist/performances` | [UC8](#uc8--consultar-la-agenda-del-artista) |
| UC9 Gestionar catálogo | `/api/admin/{venues,artists,events,performances}` | [UC9](#uc9--gestionar-el-catálogo-y-cancelar-una-función) |
| UC10 Reservas de una función | `GET /api/admin/performances/:id/reservations` | [UC10](#uc10--ver-las-reservas-de-una-función) |

### UC1 — Consultar la cartelera con filtros

```mermaid
sequenceDiagram
    autonumber
    actor U as Público
    participant W as SPA React
    participant R as Router Express
    participant C as PerformancesController
    participant S as PerformancesService
    participant RP as PerformancesRepository
    participant DB as SQLite

    U->>W: Abre /cartelera?disciplina=DANCE
    W->>R: GET /api/performances?discipline=DANCE
    R->>C: list(req, res)
    C->>C: Validar query con Zod
    alt Parámetros inválidos
        C-->>W: 400 VALIDATION_ERROR
        W-->>U: Aviso de filtro inválido
    else Parámetros válidos
        C->>S: listPerformances(filtros)
        S->>S: Convertir fecha local a rango UTC
        S->>RP: findMany(filtros)
        RP->>DB: SELECT funciones JOIN obras y escenarios
        DB-->>RP: Filas
        S->>RP: getReservedSeatsByPerformance(ids)
        RP->>DB: SELECT SUM(quantity) GROUP BY performanceId
        DB-->>RP: Totales reservados
        S->>S: Calcular availableSeats y availability
        S-->>C: Lista de funciones
        C-->>W: 200 JSON
        W-->>U: Cartelera agrupada por día
    end
```

### UC2 — Ver el detalle de una obra

```mermaid
sequenceDiagram
    autonumber
    actor U as Público
    participant W as EventDetailPage
    participant C as EventsController
    participant S as EventsService
    participant ER as EventsRepository
    participant PR as PerformancesRepository
    participant DB as SQLite

    U->>W: Abre /obras/:id desde la cartelera
    W->>C: GET /api/events/:id
    C->>C: Validar id con Zod
    C->>S: getEventById(id)
    S->>ER: findById(id)
    ER->>DB: SELECT obra con artistas y funciones (JOIN escenario)
    DB-->>ER: Obra o null
    alt Obra inexistente
        S-->>C: AppError NOT_FOUND
        C-->>W: 404
        W-->>U: "Obra no encontrada"
    else Obra encontrada
        S->>PR: getReservedSeatsByPerformance(ids de sus funciones)
        PR->>DB: SELECT SUM(quantity) GROUP BY performanceId
        DB-->>S: Totales reservados
        S->>S: computeAvailability por función
        S-->>C: Obra + artistas + funciones con availableSeats
        C-->>W: 200 JSON
        W-->>U: Sinopsis, artistas y funciones con botón Reservar
    end
```

### UC3 — Ver artistas y compañías

```mermaid
sequenceDiagram
    autonumber
    actor U as Público / Artista
    participant W as ArtistsPage / ArtistDetailPage
    participant C as ArtistsController
    participant S as ArtistsService
    participant R as ArtistsRepository
    participant DB as SQLite

    U->>W: Abre /artistas y escribe en el buscador
    W->>C: GET /api/artists?search=texto
    C->>C: Validar search (máx. 100) con Zod
    C->>S: listArtists(search)
    S->>S: trim (vacío = sin filtro)
    S->>R: findMany(search)
    R->>DB: SELECT artistas WHERE name LIKE %texto% ORDER BY name
    DB-->>W: 200 lista (id, nombre, tipo, país, imagen)
    U->>W: Elige un artista
    W->>C: GET /api/artists/:id
    C->>S: getArtistById(id)
    S->>R: findById(id) con sus obras
    R->>DB: SELECT artista JOIN obras
    alt No existe
        S-->>W: 404 "Artista no encontrado"
    else Existe
        S-->>W: 200 biografía, web y obras
        W-->>U: Perfil con enlaces a sus obras (UC2)
    end
```

### UC4 — Ver escenarios y su ubicación

```mermaid
sequenceDiagram
    autonumber
    actor U as Público
    participant W as VenuesPage / VenueDetailPage
    participant C as VenuesController
    participant S as VenuesService
    participant VR as VenuesRepository
    participant PR as PerformancesRepository
    participant DB as SQLite
    participant OSM as OpenStreetMap (externo)

    U->>W: Abre /escenarios
    W->>C: GET /api/venues
    C->>S: listVenues()
    S->>VR: findMany()
    VR->>DB: SELECT escenarios
    DB-->>W: 200 lista de escenarios
    U->>W: Elige un escenario
    W->>C: GET /api/venues/:id
    C->>S: getVenueById(id)
    S->>VR: findByIdWithUpcoming(id, ahora)
    VR->>DB: SELECT escenario + funciones futuras
    alt No existe
        S-->>W: 404 "Escenario no encontrado"
    else Existe
        S->>PR: getReservedSeatsByPerformance(ids)
        PR->>DB: SUM(quantity) GROUP BY performanceId
        S-->>W: 200 datos, coordenadas y próximas funciones
        W->>OSM: iframe export/embed con lat/long (VenueMap)
        OSM-->>U: Mapa con marcador y enlace "Cómo llegar"
    end
```

### UC5 — Registrarse, iniciar sesión y autorizar una petición

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant W as SPA React
    participant R as Router Express
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UsersRepository
    participant MW as requireAuth / requireRole
    participant DB as SQLite

    opt Primera vez: registro
        U->>W: Nombre, correo y contraseña en /registro
        W->>R: POST /api/auth/register
        R->>AC: register(req, res) valida con Zod
        AC->>AS: register(input)
        AS->>UR: findByEmail(email)
        alt Correo ya registrado
            AS-->>W: 409 CONFLICT
        else Nuevo
            AS->>AS: bcrypt.hash(password, 10)
            AS->>UR: create(rol PUBLIC)
            UR->>DB: INSERT user (email UNIQUE)
            AS-->>W: 201 { token, user } (sesión iniciada)
        end
    end
    U->>W: Envía correo y contraseña
    W->>R: POST /api/auth/login
    R->>AC: login(req, res)
    AC->>AS: login(email, password)
    AS->>UR: findByEmail(email)
    UR->>DB: SELECT usuario
    DB-->>AS: Usuario y passwordHash
    AS->>AS: bcrypt.compare y firmar JWT (sub, role, 8 h)
    AS-->>W: 200 { token, user }
    W->>W: Guardar sesión en AuthContext/localStorage
    U->>W: Solicita recurso protegido
    W->>R: Petición con Authorization: Bearer JWT
    R->>MW: requireAuth verifica firma, vencimiento, sub y role
    alt Token ausente, inválido o expirado
        MW-->>W: 401 UNAUTHORIZED
    else Token válido
        MW->>MW: requireRole comprueba el rol si la ruta lo exige
        alt Rol insuficiente
            MW-->>W: 403 FORBIDDEN
        else Rol autorizado
            MW-->>R: Continúa a la ruta protegida
        end
    end
```

### UC6 — Reservar entradas

```mermaid
sequenceDiagram
    autonumber
    actor U as Público
    participant W as SPA React
    participant MW as requireAuth
    participant C as ReservationsController
    participant S as ReservationsService
    participant RP as ReservationsRepository
    participant DB as SQLite
    participant L as logAudit / console.info

    U->>W: Elige 2 entradas y pulsa Confirmar
    W->>MW: POST /api/reservations con Bearer JWT
    alt Token ausente o inválido
        MW-->>W: 401 UNAUTHORIZED
        W-->>U: Redirige a /ingresar
    else Token válido
        MW->>C: req.user = id y rol
        C->>C: Validar body con Zod
        C->>S: reserve(userId, performanceId, 2)
        S->>DB: BEGIN TRANSACTION
        S->>RP: create(reserva CONFIRMED)
        RP->>DB: INSERT reservation, toma el bloqueo de escritura
        S->>RP: sumConfirmed(performanceId)
        RP->>DB: SELECT SUM(quantity)
        DB-->>S: total reservado
        alt total supera el aforo, función iniciada o límite por persona
            S->>DB: ROLLBACK
            S-->>C: AppError CONFLICT
            C-->>W: 409 con mensaje
            W-->>U: Solo quedan N entradas
        else Hay aforo
            S->>DB: COMMIT
            S-->>C: Reserva con código FAV-XXXXXX
            C-->>W: 201 Created
            W-->>U: Confirmación con código
        end
    end
```

### UC7 — Ver y cancelar mis reservas

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario autenticado
    participant W as MyReservationsPage
    participant MW as requireAuth
    participant C as ReservationsController
    participant S as ReservationsService
    participant RP as ReservationsRepository
    participant L as logAudit / console.info
    participant DB as SQLite

    U->>W: Abre /mis-reservas
    W->>MW: GET /api/reservations/me con Bearer JWT
    MW->>C: req.user.id
    C->>S: findMine(userId)
    S->>RP: findByUser(userId)
    RP->>DB: SELECT reservas del usuario ORDER BY fecha de función
    DB-->>W: 200 lista con estado y función
    U->>W: Confirma cancelar una reserva
    W->>MW: PATCH /api/reservations/:id/cancel con Bearer JWT
    MW->>C: req.user.id
    C->>S: cancel(userId, reservationId)
    S->>DB: BEGIN TRANSACTION
    S->>RP: findByIdForUser(id, userId)
    RP->>DB: SELECT reserva propia y fecha de función

    alt Reserva ausente o de otro usuario
        DB-->>S: Sin resultado
        S->>DB: ROLLBACK
        S-->>W: 404
    else Ya cancelada
        S->>DB: COMMIT sin cambios (idempotente)
        S->>L: logAudit(CANCEL, Reservation, id)
        S-->>W: 200 reserva CANCELLED
    else Función futura y reserva confirmada
        S->>RP: markCancelled(id, userId)
        RP->>DB: UPDATE status = CANCELLED
        S->>DB: COMMIT
        S->>L: logAudit(CANCEL, Reservation, id)
        S-->>W: 200 reserva CANCELLED
    end
```

### UC8 — Consultar la agenda del artista

```mermaid
sequenceDiagram
    autonumber
    actor A as Artista autenticado
    participant W as ArtistAgendaPage
    participant MW as requireAuth + requireRole(ARTIST)
    participant C as ArtistAgendaController
    participant S as ArtistAgendaService
    participant AR as ArtistAgendaRepository
    participant PR as PerformancesRepository
    participant DB as SQLite

    A->>W: Abre /mi-agenda
    W->>MW: GET /api/me/artist/performances con Bearer JWT
    MW->>MW: Verifica identidad y rol ARTIST
    MW->>C: Continúa con req.user.id
    C->>S: listForUser(userId)
    S->>AR: findPerformancesForUser(userId)
    AR->>DB: Busca obras y funciones del perfil vinculado
    DB-->>AR: Funciones (vacío si no existe perfil vinculado)
    S->>PR: getReservedSeatsByPerformance(ids)
    PR->>DB: Agrega cantidad de reservas CONFIRMED
    DB-->>S: Totales por función
    S-->>W: 200 lista ordenada con reservedSeats
    W-->>A: Presenta obra, escenario, fecha, estado y aforo
```

### UC9 — Gestionar el catálogo y cancelar una función

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant W as Panel admin
    participant MW as requireAuth + requireRole(ADMIN)
    participant C as AdminController
    participant S as AdminService
    participant RP as AdminRepository
    participant DB as SQLite
    participant L as logAudit / console.info

    A->>W: Crea, edita o elimina una entidad
    W->>MW: GET/POST/PUT/DELETE /api/admin/{resource}[/id]
    MW->>MW: Verifica JWT y rol ADMIN
    MW->>C: Continúa
    C->>C: Valida parámetros y body con Zod
    C->>S: Ejecuta operación
    S->>RP: Aplica regla del recurso y persiste
    RP->>DB: Consulta o mutación
    alt Regla incumplida o dependencia impide eliminar
        DB-->>S: Dependencia o error de validación
        S-->>W: 409/400/404, no registra éxito
    else Operación confirmada
        DB-->>S: Entidad afectada
        S->>L: Entrada JSON: timestamp, userId, action, entity, entityId
        S-->>W: 200/201/204
    end

    opt Cancelar función con sus reservas
        A->>W: Solicita cancelar función
        W->>MW: PATCH /api/admin/performances/:id/cancel
        MW->>C: Requiere ADMIN
        C->>S: cancel(id, userId)
        S->>DB: Transacción: función y reservas CONFIRMED a CANCELLED
        DB-->>S: Commit atómico
        S->>L: logAudit(CANCEL, Performance, id)
        S-->>W: 200 función cancelada, historial conservado
    end
```

### UC10 — Ver las reservas de una función

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant W as AdminPerformanceReservationsPage
    participant MW as requireAuth + requireRole(ADMIN)
    participant C as AdminPerformancesController
    participant S as AdminPerformancesService
    participant R as AdminPerformancesRepository
    participant DB as SQLite

    A->>W: En la tabla de funciones pulsa "Ver reservas"
    W->>MW: GET /api/admin/performances/:id/reservations con Bearer JWT
    alt Sin token o rol distinto de ADMIN
        MW-->>W: 401 / 403
    else ADMIN
        MW->>C: Continúa
        C->>C: Validar id con Zod
        C->>S: listReservations(id)
        S->>R: findById(id)
        alt Función inexistente
            S-->>W: 404 "Función no encontrada"
        else Existe
            par En paralelo
                R->>DB: SELECT reservas con nombre del usuario ORDER BY createdAt
            and
                R->>DB: SUM(quantity) WHERE status = CONFIRMED
            end
            DB-->>S: reservas y totalConfirmed
            S-->>W: 200 { performanceId, reservations, totalConfirmed }
            W-->>A: Tabla con código, persona, cantidad, estado y total asistentes
        end
    end
```

## Decisiones

- **Validación en el borde** (controller con Zod) y **reglas en el service**: el service
  recibe datos ya tipados y se prueba sin HTTP.
- **Escribir primero y verificar después** dentro de la transacción. En SQLite solo hay un
  escritor a la vez; al insertar primero, la transacción toma el bloqueo de escritura y
  cualquier reserva concurrente espera. Cuando la segunda continúa, su suma ya incluye la
  primera, así que **el aforo nunca se supera**. Si la regla falla, el `ROLLBACK` deshace el
  `INSERT`.
- **Disponibilidad en una sola consulta agregada** (`GROUP BY`) para toda la cartelera,
  evitando el problema N+1.
- **Errores homogéneos**: todo error termina en el middleware `errorHandler`, que responde
  `{ error: { code, message, details } }`. El frontend solo necesita una forma de leerlos.
- **Event loop no bloqueante**: Express atiende varias peticiones a la vez mientras espera a
  la base de datos; no se necesitan hilos ni colas para la escala del festival.
