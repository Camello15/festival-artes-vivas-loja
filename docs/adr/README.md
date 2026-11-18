# Architecture Decision Records (ADR)

Registramos cada decisión de arquitectura relevante con el formato de Michael Nygard
(contexto, decisión, alternativas, consecuencias). Un ADR aceptado no se edita: si la
decisión cambia, se escribe un ADR nuevo que lo **reemplaza**.

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [0001](0001-estilo-arquitectonico-capas-cliente-servidor.md) | Estilo arquitectónico: cliente-servidor con backend en capas | Aceptado | 2026-11-18 |
| [0002](0002-eleccion-del-stack.md) | Elección del stack tecnológico | Aceptado | 2026-11-18 |
| [0003](0003-base-de-datos-sqlite-prisma.md) | Base de datos: SQLite con Prisma ORM | Aceptado | 2026-11-18 |
| [0004](0004-estrategia-de-ramas-y-sdd.md) | Estrategia de ramas y Specification-Driven Development | Aceptado | 2026-11-18 |
| [0005](0005-monorepo-npm-workspaces.md) | Monorepo con npm workspaces | Aceptado | 2026-11-18 |

Los ADR futuros previstos en los specs: `0006-control-de-aforo` (Spec #3) y
`0007-autenticacion-jwt` (Spec #3).

## Cómo agregar un ADR

1. Copia [`plantilla.md`](plantilla.md) como `NNNN-titulo-en-kebab-case.md` con el siguiente número.
2. Complétalo y agrégalo a la tabla de arriba.
3. Inclúyelo en el PR de la funcionalidad que motiva la decisión.
