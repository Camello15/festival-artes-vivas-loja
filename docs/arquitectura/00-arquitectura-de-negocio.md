# 0. Arquitectura de negocio

**Propósito**: explicar qué valor entrega el festival y qué capacidades necesita, antes de
bajar al software. De aquí salen los casos de uso de la vista de escenarios (+1), y de ellos
las otras cuatro vistas.
**Interesados**: organización del festival, docente y equipo.

La cadena de trazabilidad que sigue toda la documentación es:

```mermaid
flowchart LR
    CV["Cadena de valor"] --> FV["Flujo de valor"] --> MC["Mapa de capacidades"]
    MC --> CU["Casos de uso<br/>(+1 escenarios)"]
    CU --> CL["Clases<br/>(lógica)"]
    CU --> SQ["Secuencias por caso de uso<br/>(procesos)"]
    CL --> CO["Componentes y paquetes<br/>(desarrollo)"]
    SQ --> CO
    CO --> DE["Despliegue<br/>(física)"]
```

## 1. Cadena de valor

Cadena de valor de Porter adaptada a un festival de artes escénicas. Las actividades
primarias recorren el camino desde la convocatoria de artistas hasta la evaluación de la
edición. Las marcadas con **★** son las que el sistema soporta.

```mermaid
flowchart LR
    subgraph apoyo["Actividades de apoyo"]
        direction TB
        A1["Dirección y gestión del festival<br/>presupuesto, alianzas, permisos municipales"]
        A2["Gestión del talento<br/>voluntarios, técnicos, personal de sala"]
        A3["Tecnología ★<br/>plataforma web de cartelera y reservas"]
        A4["Abastecimiento<br/>escenarios, sonido, iluminación, logística"]
    end

    subgraph primarias["Actividades primarias"]
        direction LR
        P1["Curaduría y<br/>convocatoria<br/>artistas y obras"]
        P2["Programación ★<br/>funciones por fecha,<br/>hora y escenario"]
        P3["Difusión ★<br/>cartelera pública,<br/>artistas y escenarios"]
        P4["Reservas y<br/>control de aforo ★"]
        P5["Producción y<br/>ejecución de<br/>las funciones"]
        P6["Atención al público<br/>y evaluación ★<br/>cancelaciones, asistencia"]
        P1 --> P2 --> P3 --> P4 --> P5 --> P6
    end

    apoyo --> primarias
    P6 --> M(["Margen:<br/>público que asiste,<br/>salas llenas sin sobreventa,<br/>artistas con visibilidad"])

    classDef sys fill:#e0f2ff,stroke:#1f6feb,color:#0b2a4a
    class P2,P3,P4,P6,A3 sys
```

| Actividad | Qué aporta el sistema |
|---|---|
| Programación | Panel de administración para crear obras, funciones, artistas y escenarios (UC9). |
| Difusión | Cartelera con filtros, detalle de obra, artistas y escenarios con mapa (UC1–UC4). |
| Reservas y control de aforo | Reserva en línea con regla de aforo concurrente y límite de 6 entradas (UC5, UC6). |
| Atención al público y evaluación | Mis reservas y cancelación (UC7), agenda del artista (UC8), reservas por función (UC10). |
| Tecnología (apoyo) | El propio sistema: SPA React + API Express en capas ([ADR-0001](../adr/0001-estilo-arquitectonico-capas-cliente-servidor.md)). |

## 2. Flujo de valor

Flujo de valor **"Asistir a una función del festival"**, visto desde quien lo recibe, el
público. Cada etapa tiene un disparador, un resultado de valor y los actores y casos de uso
que intervienen.

```mermaid
flowchart LR
    start(["Disparador:<br/>una persona quiere<br/>ir al festival"])
    E1["1. Programar<br/>la edición"]
    E2["2. Descubrir<br/>la oferta"]
    E3["3. Elegir<br/>una función"]
    E4["4. Asegurar<br/>la entrada"]
    E5["5. Gestionar<br/>la asistencia"]
    E6["6. Asistir y<br/>evaluar"]
    fin(["Valor entregado:<br/>la persona asiste con<br/>entrada garantizada"])

    start --> E1 --> E2 --> E3 --> E4 --> E5 --> E6 --> fin

    E1 -.- r1["Admin · UC9"]
    E2 -.- r2["Público · UC1, UC3, UC4"]
    E3 -.- r3["Público · UC2"]
    E4 -.- r4["Público · UC5, UC6"]
    E5 -.- r5["Público · UC7<br/>Artista · UC8"]
    E6 -.- r6["Admin · UC10"]

    classDef etapa fill:#fff4e0,stroke:#d97706,color:#3b2300
    class E1,E2,E3,E4,E5,E6 etapa
```

| Etapa | Disparador | Resultado de valor | Capacidades (mapa) |
|---|---|---|---|
| 1. Programar la edición | Se confirman obras y artistas | Funciones publicadas con aforo válido | C1.1, C1.2, C1.3 |
| 2. Descubrir la oferta | El público entra a la web | Ve qué hay, cuándo y dónde | C2.1, C2.3, C2.4 |
| 3. Elegir una función | Le interesa una obra | Conoce sinopsis, funciones y disponibilidad | C2.2, C3.1 |
| 4. Asegurar la entrada | Decide asistir | Reserva confirmada con código `FAV-XXXXXX` | C4.1, C3.2, C3.3 |
| 5. Gestionar la asistencia | Cambia de planes / el artista quiere saber cuántos irán | Cupos liberados o asistencia esperada conocida | C3.4, C5.1 |
| 6. Asistir y evaluar | Se realiza la función | La organización conoce la asistencia por función | C5.2, C5.3 |

## 3. Mapa de capacidades

Capacidades de negocio en dos niveles. El color indica el grado en que el sistema las
cubre; las capacidades sin color quedan fuera del alcance del prototipo.

```mermaid
flowchart TB
    subgraph C1["C1 Gestión de la programación"]
        direction LR
        C11["C1.1 Gestionar<br/>artistas y compañías"]
        C12["C1.2 Gestionar<br/>obras"]
        C13["C1.3 Programar funciones<br/>fecha, escenario y aforo"]
        C14["C1.4 Gestionar<br/>escenarios"]
    end
    subgraph C2["C2 Difusión de la oferta"]
        direction LR
        C21["C2.1 Publicar cartelera<br/>filtrable"]
        C22["C2.2 Presentar<br/>detalle de obra"]
        C23["C2.3 Presentar<br/>artistas"]
        C24["C2.4 Ubicar escenarios<br/>en el mapa"]
    end
    subgraph C3["C3 Gestión de entradas"]
        direction LR
        C31["C3.1 Calcular<br/>disponibilidad"]
        C32["C3.2 Reservar<br/>entradas"]
        C33["C3.3 Controlar aforo<br/>y límite por persona"]
        C34["C3.4 Cancelar<br/>reservas"]
        C35["C3.5 Venta y cobro<br/>de entradas"]
    end
    subgraph C4["C4 Gestión de identidades"]
        direction LR
        C41["C4.1 Registrar y<br/>autenticar usuarios"]
        C42["C4.2 Autorizar<br/>por rol"]
    end
    subgraph C5["C5 Seguimiento y evaluación"]
        direction LR
        C51["C5.1 Agenda<br/>del artista"]
        C52["C5.2 Asistencia<br/>por función"]
        C53["C5.3 Auditoría de<br/>operaciones admin"]
        C54["C5.4 Encuestas de<br/>satisfacción"]
    end
    subgraph C6["C6 Producción y logística"]
        direction LR
        C61["C6.1 Montaje técnico"]
        C62["C6.2 Voluntariado"]
    end

    classDef full fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef out fill:#f3f4f6,stroke:#9ca3af,color:#6b7280,stroke-dasharray:4 3
    class C11,C12,C13,C14,C21,C22,C23,C24,C31,C32,C33,C34,C41,C42,C51,C52,C53 full
    class C35,C54,C61,C62 out
```

Verde: soportada por el sistema. Gris punteado: fuera del alcance (el festival es de
entrada libre con reserva, sin cobro).

### Trazabilidad capacidad → caso de uso → módulo

| Capacidad | Caso de uso | Módulo API | Spec |
|---|---|---|---|
| C1.1–C1.4 Programación | UC9 Gestionar catálogo | `admin/{artists,events,performances,venues}` | 3 |
| C2.1 Cartelera filtrable | UC1 Consultar cartelera | `performances` | 2 |
| C2.2 Detalle de obra | UC2 Ver detalle de obra | `events` | 2 |
| C2.3 Artistas | UC3 Ver artistas | `artists` | 2 |
| C2.4 Escenarios y mapa | UC4 Ver escenarios | `venues` (+ OpenStreetMap en la SPA) | 2 |
| C3.1 Disponibilidad | UC1, UC2, UC4 | `performances/availability.ts` | 2 |
| C3.2, C3.3 Reservar con aforo | UC6 Reservar entradas | `reservations` ([ADR-0006](../adr/0006-control-de-aforo.md)) | 3 |
| C3.4 Cancelar | UC7 Mis reservas | `reservations` | 3 |
| C4.1, C4.2 Identidad | UC5 Registrarse e ingresar | `auth`, `users`, `middlewares/auth` | 3 |
| C5.1 Agenda del artista | UC8 Mi agenda | `artist-agenda` | 3 |
| C5.2 Asistencia por función | UC10 Reservas de una función | `admin/performances` | 3 |
| C5.3 Auditoría | UC9 (efecto) | `lib/auditLog.ts` | 3 |
| — Resumen de la edición | Portada | `festival`, `health` | 1 |
