# ADR-0002: Elección del stack tecnológico

- **Estado**: Aceptado
- **Fecha**: 2026-11-18
- **Autores**: Camilo Velepucha

## Contexto

Con el estilo definido en [ADR-0001](0001-estilo-arquitectonico-capas-cliente-servidor.md)
necesitamos elegir tecnologías para el cliente y el servidor. Restricciones:

- Al menos un integrante trabaja desde una **Chromebook** (Linux con recursos modestos).
- Sin dependencias específicas de Windows ni servicios de pago.
- El equipo conoce JavaScript; queremos detectar errores antes de ejecutar.
- Tiempo corto de entrega: priorizar herramientas con buena documentación.

## Decisión

| Capa | Tecnología | Motivo principal |
|---|---|---|
| Lenguaje | **TypeScript** en frontend y backend | Un solo lenguaje; tipos que documentan los contratos y detectan errores |
| Frontend | **React 19 + Vite 7** | Ecosistema más conocido; Vite arranca en milisegundos y consume poca memoria |
| Enrutado web | **React Router 7** | Estándar de facto para SPA en React |
| Estilos | **TailwindCSS 4** | Diseño responsive rápido sin escribir CSS a mano; plugin oficial para Vite |
| Backend | **Node.js ≥ 20.12 + Express 5** | Minimalista, sin "magia"; las capas se ven explícitamente en el código; Express 5 propaga los errores async al middleware de errores |
| Validación | **Zod 4** | Valida en tiempo de ejecución y genera los tipos de TypeScript |
| Persistencia | **Prisma + SQLite** | Ver [ADR-0003](0003-base-de-datos-sqlite-prisma.md) |
| Pruebas | **Vitest 5** (+ Supertest, Testing Library) | Un solo runner para las dos apps, compatible con Vite y rápido |
| Calidad | **ESLint 9 + Prettier** | Estilo uniforme entre los tres integrantes |
| Cifrado | **bcryptjs** | Implementación en JavaScript puro: no requiere compilar código nativo |

## Alternativas consideradas

| Alternativa | A favor | En contra |
|---|---|---|
| **Next.js** (full-stack) | Frontend y API en un proyecto; SSR | Difumina la separación cliente/servidor del ADR-0001; más conceptos (server components, caché) |
| **NestJS** en el backend | Capas y módulos impuestos por el framework | Decoradores e inyección de dependencias añaden curva de aprendizaje; más pesado |
| **Fastify** | Más rendimiento que Express | Rendimiento no es un requisito; menos ejemplos para el equipo |
| **Python (FastAPI) o Java (Spring)** | Buenos frameworks | Dos lenguajes en el equipo; Spring es pesado para una Chromebook |
| **Angular / Vue** | Alternativas maduras | El equipo tiene más experiencia con React |
| **Create React App** | Conocido | Abandonado; lento frente a Vite |
| **Jest** | Muy conocido | Configuración adicional para TypeScript/ESM; Vitest es compatible con su API |

## Consecuencias

- **Positivas**: un solo lenguaje y un solo runner de pruebas; arranque rápido en hardware
  modesto; sin compilaciones nativas (salvo los binarios precompilados de Prisma).
- **Negativas / riesgos**: Express no impone estructura; la mantenemos con la constitución
  (principio II) y la revisión de PR. Prisma descarga un motor precompilado la primera vez
  (requiere internet en `npm install`).
- **Seguimiento**: las versiones mayores están fijadas en `package.json`; actualizar una
  versión mayor requiere un PR propio (`chore:`).

## Notas de implementación (Spec #1)

- Durante la implementación se subió a **Vite 7, Vitest 5 y Zod 4** para resolver avisos de
  seguridad de `npm audit` en `vitest`/`tinypool` y `zod`.
- **Deuda técnica conocida**: `npm audit` reporta una vulnerabilidad *high* en `deepmerge-ts`
  (dependencia del CLI de Prisma 6). Solo afecta a la herramienta de línea de comandos en
  desarrollo, no al código de la API. Se corrige migrando a Prisma 7, que cambia la
  configuración (`prisma.config.ts` y adaptadores de conexión); se hará en un PR `chore:` propio.
