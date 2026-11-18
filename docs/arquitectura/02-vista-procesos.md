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

## Escenario A: consultar la cartelera

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

## Escenario B: reservar una entrada

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
