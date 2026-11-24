# 1. Vista lógica

**Propósito**: describir los conceptos del dominio del festival y sus relaciones,
independientemente de cómo se implementen.
**Interesados**: usuarios finales, organizadores del festival y analistas.

## Diagrama de clases del dominio

```mermaid
classDiagram
    direction LR

    class User {
        +int id
        +string name
        +string email
        +string passwordHash
        +Role role
        +DateTime createdAt
    }

    class Artist {
        +int id
        +string name
        +ArtistKind kind
        +string country
        +string bio
        +string imageUrl
        +string website
    }

    class Event {
        +int id
        +string title
        +Discipline discipline
        +string synopsis
        +int durationMinutes
        +string ageRating
        +string imageUrl
    }

    class Venue {
        +int id
        +string name
        +string address
        +float latitude
        +float longitude
        +int capacity
        +string description
        +string imageUrl
    }

    class Performance {
        +int id
        +DateTime startsAt
        +int capacity
        +PerformanceStatus status
    }

    class Reservation {
        +int id
        +string code
        +int quantity
        +ReservationStatus status
        +DateTime createdAt
    }

    class Role {
        <<enumeration>>
        PUBLIC
        ARTIST
        ADMIN
    }
    class Discipline {
        <<enumeration>>
        THEATER
        DANCE
        MUSIC
        CIRCUS
        STREET_ARTS
    }
    class ArtistKind {
        <<enumeration>>
        SOLO
        COMPANY
    }
    class PerformanceStatus {
        <<enumeration>>
        SCHEDULED
        CANCELLED
    }
    class ReservationStatus {
        <<enumeration>>
        CONFIRMED
        CANCELLED
    }

    Event "1" --> "0..*" Performance : se presenta en
    Venue "1" --> "0..*" Performance : alberga
    Event "0..*" -- "0..*" Artist : presentada por
    User "1" --> "0..*" Reservation : realiza
    Performance "1" --> "0..*" Reservation : recibe
    User "0..1" -- "0..1" Artist : cuenta de
    User ..> Role
    Event ..> Discipline
    Artist ..> ArtistKind
    Performance ..> PerformanceStatus
    Reservation ..> ReservationStatus
```

## Ciclo de vida de una función (`Performance`)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> SCHEDULED : Admin crea la función<br/>fecha futura y aforo ≤ capacidad del escenario
    SCHEDULED --> SCHEDULED : Admin edita<br/>aforo ≥ entradas confirmadas
    SCHEDULED --> CANCELLED : Admin cancela antes del inicio<br/>sus reservas CONFIRMED pasan a CANCELLED
    CANCELLED --> SCHEDULED : Admin la reprograma con fecha futura<br/>las reservas canceladas no se restauran
    SCHEDULED --> [*] : Admin la elimina<br/>solo si no tiene reservas (si no, 409)
    CANCELLED --> [*] : Admin la elimina<br/>solo si no tiene reservas (si no, 409)
    note right of CANCELLED
        No admite nuevas reservas (409)
        y deja de sumar en la disponibilidad
    end note
```

## Ciclo de vida de una reserva (`Reservation`)

```mermaid
stateDiagram-v2
    direction LR
    state "Validación en transacción" as check
    [*] --> check : POST /api/reservations<br/>INSERT primero (toma el bloqueo SQLite)
    check --> CONFIRMED : Función SCHEDULED y futura<br/>Σ entradas ≤ aforo<br/>≤ 6 entradas por persona
    check --> [*] : Regla incumplida<br/>ROLLBACK y 409 (no queda registro)
    CONFIRMED --> CANCELLED : El propietario la cancela antes del inicio
    CONFIRMED --> CANCELLED : El admin cancela la función
    CANCELLED --> CANCELLED : Cancelar otra vez<br/>idempotente, sin cambios
    note right of CANCELLED
        El registro se conserva:
        las reservas nunca se borran
    end note
```

Los estados están en `apps/api/src/domain/enums.ts` y las transiciones en
`modules/reservations/reservations.service.ts` y
`modules/admin/performances/admin-performances.service.ts`.

## Decisiones

- **`Event` (obra) vs. `Performance` (función).** Separamos la obra, que es el contenido
  artístico, de cada presentación concreta en fecha, hora y escenario. Una obra se presenta
  varias veces; la reserva siempre es para una **función**, no para la obra.
- **El aforo pertenece a la función**, no solo al escenario: una misma sala puede montarse
  con distinta capacidad. La regla invariante es `Performance.capacity ≤ Venue.capacity`.
- **Disponibilidad y cancelación son operaciones de servicio**, no métodos del modelo:
  `availableSeats` se deriva como `capacity − Σ quantity (reservas CONFIRMED)` y las
  cancelaciones cambian el estado sin borrar el registro.
- **Las reservas no se borran, se cancelan** (`status = CANCELLED`). Esto conserva el
  historial y hace la cancelación idempotente.
- **`Artist` y `User` son conceptos distintos**: la mayoría de artistas no necesita cuenta. El
  vínculo opcional permite que un artista con rol `ARTIST` consulte su agenda.
- **Las relaciones con dependencias se protegen al borrar**: la administración rechaza
  (`409`) eliminar un artista con obras, un escenario con funciones, una obra con funciones
  o una función con reservas, para conservar el catálogo y el historial de reservas.
- **Enumeraciones** en inglés en el código; el frontend las traduce (principio V de la
  constitución).

El detalle físico de las tablas está en
[`specs/001-base/data-model.md`](../../specs/001-base/data-model.md).
