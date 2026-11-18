<!--
Sync Impact Report
- Versión: (plantilla) → 1.0.0
- Principios añadidos: I. Claridad, II. Arquitectura en capas, III. Pruebas mínimas,
  IV. Accesibilidad, V. Código en inglés, documentación en español
- Secciones añadidas: Restricciones técnicas, Flujo de trabajo, Gobernanza
- Plantillas revisadas: plan-template.md (Constitution Check usa estos principios) ✅,
  spec-template.md ✅, tasks-template.md ✅
- TODOs pendientes: ninguno
-->

# Constitución del proyecto Festival de Artes Vivas Loja

## Principios fundamentales

### I. Claridad antes que astucia

El código y la documentación se escriben para que cualquier integrante del equipo los
entienda en la primera lectura.

- Nombres descriptivos; funciones cortas con una sola responsabilidad.
- Nada de abstracciones "por si acaso" (YAGNI): solo se agrega complejidad que un
  requisito del spec justifique, y se registra en la sección *Complexity Tracking* del plan.
- Cada decisión de arquitectura relevante se documenta en un ADR (`docs/adr/`).

### II. Arquitectura en capas (NO NEGOCIABLE)

El sistema es cliente-servidor y el backend se organiza en capas con dependencias en un
solo sentido:

`routes → controllers → services → repositories → Prisma/SQLite`

- Los **controllers** solo traducen HTTP ↔ dominio (validan entrada, devuelven códigos de
  estado). No contienen reglas de negocio.
- Los **services** contienen las reglas de negocio (por ejemplo, el control de aforo).
- Los **repositories** son la única capa que accede a la base de datos.
- El **frontend** es solo presentación: consume la API REST y nunca calcula reglas de
  negocio (aforo disponible, permisos) por su cuenta.

### III. Pruebas mínimas obligatorias

- Toda regla de negocio en un service tiene al menos una prueba unitaria.
- Todo endpoint nuevo tiene al menos una prueba de integración del caso feliz y una del
  caso de error principal.
- `npm test` debe pasar antes de abrir un Pull Request. Un PR con pruebas en rojo no se
  integra.

### IV. Accesibilidad

La interfaz debe poder usarse con teclado y lector de pantalla:

- HTML semántico (`header`, `nav`, `main`, `footer`, encabezados en orden).
- Todo control interactivo es alcanzable con teclado y tiene foco visible.
- Imágenes con `alt`; formularios con `label` asociado; contraste mínimo WCAG 2.1 AA.
- Diseño responsive (se usa desde celulares durante el festival).

### V. Código en inglés, documentación en español

- Identificadores, nombres de archivos, rutas de la API y modelos de datos: **inglés**
  (`Event`, `Performance`, `GET /api/performances`).
- Specs, planes, ADR, README, CONTRIBUTING, comentarios explicativos y textos de la
  interfaz: **español**.
- Mensajes de commit: tipo de Conventional Commits en inglés (`feat:`, `fix:`…) y
  descripción en español.

## Restricciones técnicas

- Stack: React + Vite + TypeScript + TailwindCSS (frontend); Node.js + Express +
  TypeScript (backend); SQLite + Prisma (persistencia). Cambiarlo requiere un ADR nuevo.
- El proyecto debe correr en local con `npm install` y `npm run dev`, en Linux (incluida
  Chromebook) sin dependencias específicas de Windows ni servicios externos de pago.
- Ningún secreto se versiona: se usa `.env` (ignorado) y `.env.example` (versionado).

## Flujo de trabajo

- Specification-Driven Development con GitHub Spec Kit: ninguna funcionalidad se
  implementa sin `spec.md`, `plan.md` y `tasks.md` en `specs/<nnn-nombre>/`.
- Ramas: `main` (estable) ← `develop` (integración) ← `feature/spec-N-nombre`.
  Nada se integra a `main` o `develop` sin Pull Request revisado por otro integrante.
- Commits pequeños con Conventional Commits; cada commit compila.

## Gobernanza

- Esta constitución prevalece sobre cualquier otra guía del repositorio.
- Todo PR debe verificar el cumplimiento de los cinco principios (la plantilla de PR
  incluye la lista de verificación).
- Enmiendas: se proponen por PR, requieren aprobación de los tres integrantes y
  actualizan la versión (MAJOR: se elimina o redefine un principio; MINOR: se agrega un
  principio o sección; PATCH: redacción).

**Version**: 1.0.0 | **Ratified**: 2026-11-18 | **Last Amended**: 2026-11-18
