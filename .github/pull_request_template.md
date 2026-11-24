## Descripción

<!-- ¿Qué cambia este PR y por qué? Una o dos frases. -->

## Spec relacionado

- Spec: `specs/00N-nombre/` <!-- 001-base, 002-cartelera, 003-reservas -->
- Tareas completadas: <!-- ej. T010–T018 de tasks.md -->

## Tipo de cambio

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — corrección de error
- [ ] `docs` — solo documentación
- [ ] `refactor` / `chore` / `test`

## ¿Cómo probarlo?

```bash
npm install
npm run db:setup
npm run dev
# pasos para verificar el cambio...
```

## Capturas (si cambia la interfaz)

<!-- Arrastra aquí las imágenes. -->

## Lista de verificación (constitución)

- [ ] **Capas**: la lógica de negocio está en `services/`, el acceso a datos en `repositories/` y el frontend no calcula reglas de negocio.
- [ ] **Pruebas**: agregué o actualicé pruebas y `npm test` pasa.
- [ ] **Accesibilidad**: HTML semántico, navegable con teclado, `label`/`alt` presentes.
- [ ] **Idiomas**: código en inglés, documentación y textos de la interfaz en español.
- [ ] **Calidad**: `npm run lint` y `npm run typecheck` pasan.
- [ ] Marqué como completadas (`[X]`) las tareas en `tasks.md`.
- [ ] Si tomé una decisión de arquitectura, agregué un ADR en `docs/adr/`.
