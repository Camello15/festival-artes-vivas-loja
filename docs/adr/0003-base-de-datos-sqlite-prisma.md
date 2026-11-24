# ADR-0003: Base de datos: SQLite con Prisma ORM

- **Estado**: Aceptado
- **Fecha**: 2026-11-18
- **Autores**: Camilo Velepucha

## Contexto

El dominio es relacional: obras, funciones, escenarios, artistas (muchos-a-muchos con
obras), usuarios y reservas. La regla de aforo exige **transacciones**. El prototipo debe
levantarse en local con comandos simples, también en una Chromebook, y los tres
integrantes necesitan los mismos datos de ejemplo.

## Decisión

Usaremos **SQLite** como motor (un archivo, `apps/api/prisma/dev.db`) y **Prisma ORM** para:

- Definir el modelo en un único `schema.prisma`, que es el contrato compartido entre specs.
- Versionar los cambios de esquema con **Prisma Migrate** (`prisma/migrations/`).
- Cargar datos de ejemplo con un **seed** idempotente (`npm run db:setup`).
- Ejecutar transacciones interactivas (`prisma.$transaction`) para las reservas.

Los valores enumerados (rol, disciplina, estados) se guardan como `String` y se validan
en el código (`src/domain/enums.ts` y Zod), para que el esquema sea portable a otros motores.

## Alternativas consideradas

| Alternativa | A favor | En contra |
|---|---|---|
| **PostgreSQL** | Robusto; `SELECT … FOR UPDATE`; el estándar en producción | Hay que instalar un servidor o usar Docker (pesado en Chromebook); más fricción para empezar |
| **MySQL / MariaDB** | Conocido | Mismos inconvenientes que PostgreSQL |
| **MongoDB** | Esquema flexible | El dominio es relacional; transacciones multi-documento más complejas |
| **JSON en archivos / lowdb** | Cero instalación | Sin transacciones ni integridad referencial: imposible garantizar el aforo |
| **TypeORM / Sequelize** | ORMs maduros | Tipado menos preciso; migraciones más manuales |
| **SQL directo (better-sqlite3)** | Control total | Compila código nativo; más código repetitivo; sin migraciones |

## Consecuencias

- **Positivas**
  - Cero infraestructura: `npm run db:setup` crea la base con datos en segundos.
  - Tipos generados automáticamente a partir del esquema (`@prisma/client`).
  - `prisma studio` permite ver y editar los datos durante la demostración.
  - Migrar a PostgreSQL más adelante solo requiere cambiar `provider` y `DATABASE_URL` y
    regenerar migraciones.
- **Negativas / riesgos**
  - SQLite admite **un solo escritor a la vez**. Para el volumen del festival es suficiente
    y, de hecho, lo aprovechamos para serializar las reservas (ver la vista de procesos).
  - Sin enums nativos: la validación se hace en el código.
  - `dev.db` **no se versiona** (`.gitignore`); cada integrante la genera con el seed.
- **Seguimiento**: cualquier cambio de esquema se hace con
  `npm run db:migrate -- --name descripcion` y se incluye la migración en el PR.
