# CLAUDE.md

Guía para agentes de IA (Claude Code) que trabajen en este repositorio.

## Antes de programar

- Lee la constitución: `.specify/memory/constitution.md` (prevalece sobre todo lo demás).
- Cada funcionalidad tiene su spec en `specs/<nnn-nombre>/` (`spec.md`, `plan.md`, `tasks.md`).
  Implementa las tareas en orden y márcalas con `[X]` al terminarlas.
- Para los comandos `/speckit-*`, indica el spec activo:
  `echo '{"feature_directory":"specs/002-cartelera"}' > .specify/feature.json`.

## Comandos

- `npm install`, `npm run db:setup`, `npm run dev` (web :5173, API :3000).
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Una sola prueba de la API: `npm test -w @festival/api -- festival`.

## Reglas de arquitectura

- Backend en capas por módulo: `apps/api/src/modules/<recurso>/<recurso>.{routes,controller,service,repository}.ts`.
  Solo los repositories importan `lib/prisma.ts`; las reglas de negocio van en los services.
- Errores: lanzar `AppError` desde los services; el middleware `errorHandler` da el formato JSON común.
- Frontend: solo presentación. Llamadas a la API a través de `apps/web/src/lib/api.ts`.
- Código en inglés; documentación y textos de la interfaz en español.
- Cambios de esquema: `npm run db:migrate -- --name descripcion` e incluir la migración en el PR.
- Commits con Conventional Commits; PR hacia `develop` con la plantilla.
