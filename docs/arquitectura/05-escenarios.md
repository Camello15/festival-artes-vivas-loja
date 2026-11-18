# 5. Escenarios (+1)

**Propósito**: describir los casos de uso principales que motivan la arquitectura y
mostrar cómo cada uno recorre las otras cuatro vistas. Sirven para validar que las vistas
son coherentes entre sí.
**Interesados**: todos (usuarios, equipo y docente).

## Casos de uso

```mermaid
flowchart LR
    publico(["Público"])
    artista(["Artista"])
    admin(["Administrador"])

    subgraph sistema["Sistema Festival de Artes Vivas Loja"]
        direction TB
        UC1(["UC1 Consultar cartelera con filtros"])
        UC2(["UC2 Ver detalle de obra"])
        UC3(["UC3 Ver artistas y compañías"])
        UC4(["UC4 Ver escenarios y ubicación"])
        UC5(["UC5 Registrarse e iniciar sesión"])
        UC6(["UC6 Reservar entradas"])
        UC7(["UC7 Ver y cancelar mis reservas"])
        UC8(["UC8 Consultar mi agenda de funciones"])
        UC9(["UC9 Gestionar obras, funciones, artistas y escenarios"])
        UC10(["UC10 Ver reservas de una función"])
    end

    publico --- UC1
    publico --- UC2
    publico --- UC3
    publico --- UC4
    publico --- UC5
    publico --- UC6
    publico --- UC7

    artista --- UC5
    artista --- UC8
    artista --- UC3

    admin --- UC5
    admin --- UC9
    admin --- UC10

    UC6 -. "incluye" .-> UC5
    UC2 -. "extiende" .-> UC6
    UC9 -. "incluye" .-> UC5
```

| Caso de uso | Actor | Spec | Prioridad |
|---|---|---|---|
| UC1 Consultar cartelera | Público | 2 | P1 |
| UC2 Ver detalle de obra | Público | 2 | P1 |
| UC3 Ver artistas | Público, Artista | 2 | P2 |
| UC4 Ver escenarios | Público | 2 | P2 |
| UC5 Registrarse / ingresar | Todos | 3 | P1 |
| UC6 Reservar entradas | Público | 3 | P1 |
| UC7 Mis reservas | Público | 3 | P2 |
| UC8 Agenda del artista | Artista | 3 | P3 |
| UC9 Gestionar catálogo | Administrador | 3 | P2 |
| UC10 Reservas de una función | Administrador | 3 | P2 |

## Recorrido de los escenarios por las cuatro vistas

### Escenario 1 — Público: "¿Qué obras de danza hay el sábado en el Teatro Bolívar?" (UC1 → UC2)

| Vista | Qué elementos intervienen |
|---|---|
| **Lógica** | `Performance` filtrada por fecha; su `Event` (disciplina `DANCE`) y su `Venue`; `availableSeats()` derivado de `Reservation`. |
| **Procesos** | Secuencia *Consultar la cartelera*: SPA → Controller (Zod) → Service (rango UTC, disponibilidad) → Repository (dos consultas). |
| **Desarrollo** | `pages/ProgramPage.tsx` → `features/catalog/api.ts` → `lib/api.ts`; en la API, `modules/performances/*`. |
| **Física** | Navegador → Vite :5173 (proxy) → API :3000 → `dev.db`. |

### Escenario 2 — Público: "Reservar 2 entradas para *Raíces*" (UC5 → UC6 → UC7)

| Vista | Qué elementos intervienen |
|---|---|
| **Lógica** | `User` crea una `Reservation` para una `Performance`; invariante `Σ quantity ≤ capacity`. |
| **Procesos** | Secuencia *Reservar una entrada*: `requireAuth` → transacción con inserción y verificación posterior; `409` si no hay aforo. |
| **Desarrollo** | `pages/ReservePage.tsx`, `features/auth/AuthContext.tsx`; `modules/reservations/*`, `middlewares/auth.ts`. |
| **Física** | El bloqueo de escritura de SQLite (un único proceso de API) garantiza la serialización. |

### Escenario 3 — Artista: "¿Cuántas personas reservaron para mi función?" (UC5 → UC8)

| Vista | Qué elementos intervienen |
|---|---|
| **Lógica** | `User` con rol `ARTIST` vinculado a un `Artist` → sus `Event` → `Performance` → reservas confirmadas. |
| **Procesos** | `requireRole('ARTIST')` → service que agrega reservas por función. |
| **Desarrollo** | `pages/ArtistAgendaPage.tsx`; endpoint `GET /api/me/artist/performances`. |
| **Física** | Igual que el escenario 1. |

### Escenario 4 — Administrador: "Programar una función nueva y revisar su asistencia" (UC9 → UC10)

| Vista | Qué elementos intervienen |
|---|---|
| **Lógica** | Crear `Performance` para un `Event` existente en un `Venue`; regla `capacity ≤ venue.capacity`. Cancelar en lugar de borrar si hay reservas. |
| **Procesos** | `requireRole('ADMIN')` → controller (Zod) → service (reglas) → repository; registro de auditoría en el log. |
| **Desarrollo** | `pages/admin/*`, `features/admin/components/{DataTable,EntityForm}`; `modules/admin/performances/*`. |
| **Física** | Igual que el escenario 1; la nueva función aparece de inmediato en la cartelera pública. |

## Validación cruzada

| Pregunta | Respuesta y vista que la garantiza |
|---|---|
| ¿Cada entidad lógica tiene dónde persistirse? | Sí: las 6 clases están en `schema.prisma` (lógica ↔ desarrollo). |
| ¿Cada caso de uso tiene un endpoint y una pantalla? | Sí: ver los contratos en los `plan.md` de cada spec (escenarios ↔ desarrollo). |
| ¿La regla crítica de aforo resiste la concurrencia? | Sí: transacción con escritura primero sobre un único escritor SQLite (procesos ↔ física). |
| ¿Corre en el entorno del equipo? | Sí: dos procesos Node.js y un archivo SQLite, sin servicios externos (física). |
