# Arquitectura del sistema — Modelo 4+1 vistas

Documentamos la arquitectura con el modelo **4+1 vistas de Philippe Kruchten (1995)**. Cada
vista responde a las preocupaciones de un grupo de interesados distinto, y la vista "+1"
(escenarios) las une y valida.

| # | Vista | Pregunta que responde | Interesados | Diagrama | Archivo |
|---|---|---|---|---|---|
| 1 | Lógica | ¿Qué conceptos maneja el sistema y cómo se relacionan? | Usuarios finales, analistas | Clases y estados | [01-vista-logica.md](01-vista-logica.md) |
| 2 | Procesos | ¿Cómo colaboran los componentes en tiempo de ejecución? | Integradores, rendimiento | Secuencia | [02-vista-procesos.md](02-vista-procesos.md) |
| 3 | Desarrollo | ¿Cómo está organizado el código? | Programadores | Módulos, capas y componentes del frontend | [03-vista-desarrollo.md](03-vista-desarrollo.md) |
| 4 | Física | ¿Dónde se ejecuta cada componente? | Operaciones | Despliegue | [04-vista-fisica.md](04-vista-fisica.md) |
| +1 | Escenarios | ¿Qué casos de uso guían y validan las otras vistas? | Todos | Casos de uso | [05-escenarios.md](05-escenarios.md) |

Las decisiones que dan forma a estas vistas están registradas como ADR en
[`../adr/`](../adr/README.md).

## Vista general del sistema

Arquitectura **cliente-servidor** con un backend **en capas**. El navegador descarga una
SPA de React que consume una API REST en Express; la API es la única que accede a la base
de datos SQLite a través de Prisma.

```mermaid
flowchart LR
    subgraph actores["Actores"]
        P(["Público"])
        AR(["Artista"])
        AD(["Administrador"])
    end

    subgraph cliente["Cliente: navegador"]
        SPA["SPA React + Vite<br/>apps/web"]
    end

    subgraph servidor["Servidor: Node.js"]
        direction TB
        R["Routes"] --> C["Controllers"]
        C --> S["Services<br/>reglas de negocio"]
        S --> REPO["Repositories"]
    end

    DB[("SQLite<br/>dev.db")]

    P --> SPA
    AR --> SPA
    AD --> SPA
    SPA -- "HTTP JSON /api/*" --> R
    REPO -- "Prisma ORM" --> DB
```

## Módulos funcionales y spec responsable

```mermaid
flowchart TB
    subgraph s1["Spec 1 - Base, Camilo Velepucha"]
        M1["Monorepo y configuración"]
        M2["Modelo de datos y seed"]
        M3["Layout y navegación"]
        M4["health y festival/summary"]
    end
    subgraph s2["Spec 2 - Cartelera, Cristina Feijo"]
        C1["Cartelera con filtros"]
        C2["Detalle de obra"]
        C3["Artistas"]
        C4["Escenarios y mapa"]
    end
    subgraph s3["Spec 3 - Reservas, Bryan Villa"]
        R1["Autenticación JWT"]
        R2["Reservas con control de aforo"]
        R3["Panel de administración"]
        R4["Agenda del artista"]
    end
    s1 --> s2
    s1 --> s3
    C2 -- "botón Reservar" --> R2
```

## Atributos de calidad priorizados

| Atributo | Cómo lo atiende la arquitectura |
|---|---|
| **Integridad** (no sobrevender el aforo) | Regla en el service de reservas, ejecutada dentro de una transacción ([Spec #3](../../specs/003-reservas/plan.md)). |
| **Mantenibilidad** | Capas con dependencias en un solo sentido; módulos por recurso; ADR. |
| **Facilidad de ejecución local** | SQLite en archivo, npm workspaces, un solo `npm run dev` ([ADR-0003](../adr/0003-base-de-datos-sqlite-prisma.md)). |
| **Accesibilidad** | Principio IV de la constitución; HTML semántico y navegación por teclado. |
| **Trabajo en paralelo del equipo** | Un spec por integrante, ramas independientes, archivos compartidos mínimos ([ADR-0004](../adr/0004-estrategia-de-ramas-y-sdd.md)). |
