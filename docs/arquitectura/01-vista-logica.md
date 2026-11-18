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
    }

    class Performance {
        +int id
        +DateTime startsAt
        +int capacity
        +PerformanceStatus status
        +availableSeats() int
        +isBookable(now) bool
    }

    class Reservation {
        +int id
        +string code
        +int quantity
        +ReservationStatus status
        +DateTime createdAt
        +cancel()
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

    Event "1" --> "1..*" Performance : se presenta en
    Venue "1" --> "0..*" Performance : alberga
    Event "0..*" -- "1..*" Artist : presentada por
    User "1" --> "0..*" Reservation : realiza
    Performance "1" --> "0..*" Reservation : recibe
    User "0..1" -- "0..1" Artist : cuenta de
    User ..> Role
    Event ..> Discipline
    Artist ..> ArtistKind
    Performance ..> PerformanceStatus
    Reservation ..> ReservationStatus
```

## Decisiones

- **`Event` (obra) vs. `Performance` (función).** Separamos la obra, que es el contenido
  artístico, de cada presentación concreta en fecha, hora y escenario. Una obra se presenta
  varias veces; la reserva siempre es para una **función**, no para la obra.
- **El aforo pertenece a la función**, no solo al escenario: una misma sala puede montarse
  con distinta capacidad. La regla invariante es `Performance.capacity ≤ Venue.capacity`.
- **`availableSeats()` es derivado**: `capacity − Σ quantity (reservas CONFIRMED)`. No se
  almacena para evitar inconsistencias; lo calcula la capa de servicios.
- **Las reservas no se borran, se cancelan** (`status = CANCELLED`). Esto conserva el
  historial y hace la cancelación idempotente.
- **`Artist` y `User` son conceptos distintos**: la mayoría de artistas no necesita cuenta. El
  vínculo opcional permite que un artista con rol `ARTIST` consulte su agenda.
- **Enumeraciones** en inglés en el código; el frontend las traduce (principio V de la
  constitución).

El detalle físico de las tablas está en
[`specs/001-base/data-model.md`](../../specs/001-base/data-model.md).
