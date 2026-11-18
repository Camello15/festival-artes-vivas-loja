# Guía de contribución

Esta guía explica cómo trabajamos en el repositorio. Léela completa antes de tu primer commit.

## 1. Requisitos

| Herramienta | Versión mínima | Para qué |
|---|---|---|
| Git | 2.30 | Control de versiones |
| Node.js | 20 LTS | Frontend y backend |
| npm | 10 | Gestor de paquetes (workspaces) |
| uv | 0.4 | Instalar Spec Kit (`specify-cli`) |
| GitHub CLI (`gh`) | 2.40 | Abrir Pull Requests desde la terminal (opcional) |
| Claude Code u otro agente | — | Ejecutar los comandos `/speckit-*` (opcional) |

En una Chromebook, activa el entorno Linux y usa estos mismos comandos.

## 2. Clonar y preparar el proyecto

```bash
git clone https://github.com/Camello15/festival-artes-vivas-loja.git
cd festival-artes-vivas-loja
git checkout develop
npm install
cp apps/api/.env.example apps/api/.env
npm run db:setup      # crea la base SQLite, aplica migraciones y carga datos de ejemplo
npm run dev           # web en http://localhost:5173 · API en http://localhost:3000
```

## 3. Ramas

```
main      ← solo recibe PRs desde develop (versiones estables)
 └─ develop   ← rama de integración; aquí llegan los PRs de cada spec
     ├─ feature/spec-1-base       (Camilo Velepucha)
     ├─ feature/spec-2-cartelera  (Cristina Feijo)
     └─ feature/spec-3-reservas   (Bryan Villa)
```

Reglas:

- **Nunca** hagas commit directo en `main` ni en `develop`.
- Cada spec se trabaja en su rama `feature/spec-N-nombre`.
- Para correcciones pequeñas fuera de un spec: `fix/descripcion-corta`.

### Empezar a trabajar en tu spec

Las ramas de los Specs #2 y #3 ya existen en GitHub:

```bash
git fetch origin
git checkout feature/spec-2-cartelera     # o feature/spec-3-reservas
git pull origin develop                   # trae lo último de develop (incluye el Spec #1)
```

Si la rama no existiera, créala desde `develop`:

```bash
git checkout develop && git pull
git checkout -b feature/spec-2-cartelera
git push -u origin feature/spec-2-cartelera
```

### Mantener tu rama al día

```bash
git fetch origin
git merge origin/develop     # resuelve conflictos si los hay, prueba y haz push
```

## 4. Specification-Driven Development con Spec Kit

Ninguna funcionalidad se implementa sin especificación. Cada spec vive en `specs/<nnn-nombre>/`:

| Archivo | Contenido | Comando de Spec Kit |
|---|---|---|
| `spec.md` | **Qué** y **por qué**: historias de usuario, requisitos, criterios de éxito | `/speckit-specify` |
| `plan.md` | **Cómo**: decisiones técnicas, estructura, contratos de la API | `/speckit-plan` |
| `tasks.md` | Lista de tareas ordenadas y numeradas (T001, T002…) | `/speckit-tasks` |
| — | Implementación tarea por tarea | `/speckit-implement` |

Los principios que todo spec debe respetar están en
[`.specify/memory/constitution.md`](.specify/memory/constitution.md).

### Instalar Spec Kit (opcional, solo si vas a regenerar artefactos)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify check
```

El repositorio ya está inicializado (`.specify/` y `.claude/skills/`), así que **no**
vuelvas a ejecutar `specify init`.

### Flujo para los Specs #2 y #3

Tus `spec.md`, `plan.md` y `tasks.md` ya están escritos. El flujo es:

1. Lee `spec.md` y `plan.md` de tu carpeta. Si algo no está claro, ejecuta
   `/speckit-clarify` en Claude Code o discútelo con el equipo y actualiza el spec.
2. (Opcional) `/speckit-analyze` para revisar la consistencia entre spec, plan y tareas.
3. Implementa con `/speckit-implement`, o a mano siguiendo `tasks.md` en orden.
4. Marca cada tarea terminada cambiando `- [ ]` por `- [X]` en `tasks.md`.
5. Haz un commit por tarea o por grupo pequeño de tareas relacionadas.

> Si usas Claude Code, antes de `/speckit-implement` ejecuta
> `echo '{"feature_directory":"specs/002-cartelera"}' > .specify/feature.json`
> (ajusta la carpeta) para indicarle qué spec trabajar.

## 5. Convención de commits (Conventional Commits)

Formato: `tipo(alcance opcional): descripción en español en minúsculas`

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(api): agregar filtro por disciplina en GET /performances` |
| `fix` | Corrección de error | `fix(web): corregir fecha mostrada en zona horaria de Ecuador` |
| `docs` | Solo documentación | `docs(adr): registrar decisión sobre autenticación JWT` |
| `test` | Agregar o corregir pruebas | `test(api): cubrir reserva cuando el aforo está lleno` |
| `refactor` | Cambio interno sin cambiar comportamiento | `refactor(api): extraer validación de fechas` |
| `chore` | Configuración, dependencias, scripts | `chore: actualizar prisma a 6.x` |
| `style` | Formato, sin cambios de lógica | `style(web): aplicar prettier` |

Reglas:

- Commits **pequeños**: un cambio lógico por commit, y cada commit debe compilar.
- Alcances sugeridos: `api`, `web`, `db`, `docs`, `adr`, `specs`.
- Nada de mensajes como "cambios" o "avance".

## 6. Antes de abrir un Pull Request

```bash
npm run lint
npm run typecheck
npm test
```

Las tres deben pasar.

## 7. Abrir un Pull Request hacia `develop`

```bash
git push -u origin feature/spec-2-cartelera
gh pr create --base develop --title "feat: Spec #2 cartelera y detalle" --fill
```

O desde GitHub: **Compare & pull request**, con *base* `develop` y *compare* tu rama.

- Completa la plantilla (se carga sola), incluida la lista de verificación de la constitución.
- Asigna como revisor a otro integrante. Al menos **una aprobación** antes de fusionar.
- Usa **Squash and merge** solo si los commits son ruido; si son atómicos, prefiere
  **Create a merge commit** para conservar la evidencia del trabajo.

## 8. Publicar una versión estable

Cuando los tres specs estén en `develop` y probados, el líder abre un PR `develop → main`.
