# ADR-0005: Monorepo con npm workspaces

- **Estado**: Aceptado
- **Fecha**: 2026-11-18
- **Autores**: Camilo Velepucha

## Contexto

Tenemos dos aplicaciones (web y API) que se desarrollan y prueban juntas, y la
documentación (specs, arquitectura, ADR) debe estar junto al código para que el
repositorio sea el entregable completo. Queremos que un integrante nuevo levante todo con
el menor número de comandos.

## Decisión

Usaremos **un solo repositorio** con **npm workspaces** (`apps/web`, `apps/api`). La raíz
define scripts que orquestan ambas apps (`npm run dev`, `test`, `lint`, `typecheck`,
`build`, `db:*`). Usamos `concurrently` para levantar las dos apps en paralelo.

## Alternativas consideradas

| Alternativa | A favor | En contra |
|---|---|---|
| **Dos repositorios** (web y api) | Independencia total | Duplica PR, CI y documentación; difícil mantener contratos sincronizados; peor evidencia del trabajo en equipo |
| **pnpm workspaces** | Más rápido, ahorra disco | Herramienta adicional que instalar; npm ya viene con Node |
| **Turborepo / Nx** | Caché de tareas, grafos de dependencias | Sobredimensionado para dos apps |
| **Carpetas sin workspaces** | Simple | Dos `npm install`, scripts duplicados |

## Consecuencias

- **Positivas**: `npm install` único; un pipeline de CI; specs, docs y código versionados juntos,
  lo que facilita que DeepWiki genere documentación completa.
- **Negativas / riesgos**: un `package-lock.json` grande y compartido puede generar
  conflictos; regla: no editarlo a mano y regenerarlo con `npm install` al resolver conflictos.
- **Seguimiento**: si en el futuro hay código compartido (tipos de la API), se agregará un
  workspace `packages/shared`.
