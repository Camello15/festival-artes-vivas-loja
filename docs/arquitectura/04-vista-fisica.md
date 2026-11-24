# 4. Vista física

**Propósito**: mostrar en qué nodos de hardware y software se ejecuta cada componente y
cómo se comunican.
**Interesados**: quien instala y opera el sistema (en este proyecto, el propio equipo).

## Diagrama de despliegue: local (modo desarrollo)

Es el entorno objetivo del prototipo: todo corre en la máquina del desarrollador, incluida
una Chromebook con el entorno Linux activado.

```mermaid
flowchart LR
    subgraph dispositivo["Dispositivo del usuario"]
        browser["Navegador web<br/>Chrome, Firefox o móvil"]
    end

    subgraph host["Máquina local: Linux o Chromebook"]
        direction TB
        subgraph node1["Proceso Node.js: Vite dev server :5173"]
            spa["Bundle SPA<br/>HTML, JS y CSS"]
            proxy["Proxy /api"]
        end
        subgraph node2["Proceso Node.js: API Express :3000"]
            apiapp["apps/api<br/>Express + Prisma Client"]
            sqlite["Motor SQLite<br/>embebido"]
        end
        file[("apps/api/prisma/dev.db")]
    end

    osm["«nodo externo»<br/>openstreetmap.org<br/>mapa embebido"]

    browser -- "HTTP :5173" --> spa
    browser -- "HTTP /api/*" --> proxy
    proxy -- "HTTP :3000" --> apiapp
    apiapp --> sqlite
    sqlite -- "lectura y escritura" --> file
    browser -. "HTTPS iframe (VenueMap)" .-> osm
```

| Nodo | Artefacto desplegado | Puerto / protocolo |
|---|---|---|
| Dispositivo del usuario | Navegador que ejecuta la SPA | HTTP hacia :5173 |
| Proceso Vite | `apps/web` (bundle en memoria) y proxy `/api` | :5173 |
| Proceso API | `apps/api` con `tsx` y Prisma Client | :3000 |
| Archivo | `apps/api/prisma/dev.db` (SQLite) | E/S de archivo local |
| OpenStreetMap | Mapa de escenarios (externo, sin datos del usuario) | HTTPS |

## Despliegue alternativo con Docker Compose (opcional)

```mermaid
flowchart LR
    browser["Navegador"]

    subgraph compose["docker compose"]
        direction TB
        web["Contenedor web<br/>node:22-slim<br/>Vite :5173"]
        api["Contenedor api<br/>node:22-slim<br/>Express :3000"]
        vol[("Volumen api-data<br/>dev.db")]
    end

    browser -- "localhost:5173" --> web
    browser -. "localhost:3000, opcional" .-> api
    web -- "proxy http://api:3000" --> api
    api --> vol
```

## Despliegue hacia producción (referencia, fuera del alcance)

Si el festival quisiera publicar el sistema, la misma arquitectura se mapearía así sin
cambiar el código de las capas:

| Componente | Local | Producción sugerida |
|---|---|---|
| SPA | Vite dev server | Archivos estáticos (`vite build`) en un CDN o Nginx |
| API | `tsx watch` | `node dist/server.js` detrás de un proxy inverso con HTTPS |
| Base de datos | SQLite en archivo | PostgreSQL gestionado (cambiar `provider` en Prisma) |

## Decisiones

- **SQLite embebido en el proceso de la API**: no hay servidor de base de datos que instalar;
  el archivo `dev.db` se regenera con `npm run db:setup`. Ver
  [ADR-0003](../adr/0003-base-de-datos-sqlite-prisma.md).
- **Proxy de Vite** para `/api`: el navegador ve un único origen en desarrollo, así que no
  hay problemas de CORS. Igual se configura `CORS_ORIGIN` para cuando se llame a la API
  directamente.
- **Docker es opcional**: en una Chromebook Docker consume muchos recursos; el camino
  principal es `npm run dev`.
- **Puertos configurables** por variables de entorno (`PORT`, `VITE_API_PROXY_TARGET`).
