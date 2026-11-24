# ADR-0001: Estilo arquitectónico: cliente-servidor con backend en capas

- **Estado**: Aceptado
- **Fecha**: 2026-11-18
- **Autores**: Camilo Velepucha, Cristina Feijo, Bryan Villa

## Contexto

Necesitamos un prototipo web para el Festival de Artes Vivas de Loja con consulta pública
(cartelera, obras, artistas, escenarios), reservas con control de aforo y un panel de
administración. Condiciones:

- Equipo de 3 estudiantes que trabaja **en paralelo**, cada uno con un spec.
- Atributo de calidad crítico: **integridad del aforo** (no sobrevender).
- Debe ser fácil de entender, probar y explicar en una sustentación de 5 minutos.
- Corre en local; no hay requisitos de escalado horizontal.

## Decisión

Adoptamos un estilo **cliente-servidor** con dos piezas desplegables:

1. **Cliente**: una SPA (Single Page Application) que solo presenta datos y captura
   intenciones del usuario.
2. **Servidor**: una API REST organizada en **capas** estrictas
   `routes → controllers → services → repositories → base de datos`, donde cada capa solo
   depende de la inmediatamente inferior.

Las reglas de negocio (aforo, permisos, límites) viven **exclusivamente** en la capa de
servicios del servidor.

## Alternativas consideradas

| Alternativa | A favor | En contra |
|---|---|---|
| **Monolito con renderizado en servidor** (Express + plantillas) | Una sola pieza; sin CORS | Mezcla presentación y lógica; menos separación para repartir trabajo; interfaz menos interactiva |
| **Microservicios** (catálogo, reservas, usuarios) | Despliegue independiente; escalado por servicio | Complejidad desproporcionada para 3 personas y un prototipo; transacciones distribuidas para el aforo; más infraestructura |
| **Arquitectura hexagonal / limpia completa** (puertos y adaptadores) | Máximo desacople del framework y de la BD | Más interfaces y archivos por funcionalidad; curva de aprendizaje; principio I (claridad) de la constitución |
| **Serverless / BaaS** (Firebase, Supabase) | Poco backend propio | Reglas de aforo en reglas de seguridad o funciones; dependencia de un servicio externo; no corre 100 % en local |
| **Cliente-servidor + capas** ✅ | Separación clara; cada capa se prueba por separado; patrón conocido por el equipo; fácil de explicar | Algo de código "de paso" entre capas en operaciones CRUD simples |

## Consecuencias

- **Positivas**
  - La regla de aforo se implementa y prueba en un solo lugar (service) y no puede saltarse
    desde el cliente.
  - Los services se prueban con repositories simulados, sin HTTP ni base de datos.
  - El frontend y el backend pueden evolucionar en paralelo acordando solo los contratos
    REST de cada `plan.md`.
  - La organización por módulos (`modules/<recurso>/`) permite que cada spec agregue
    carpetas sin chocar con los otros.
- **Negativas / riesgos**
  - En CRUD simples, el controller y el service parecen redundantes. Se acepta por
    consistencia.
  - Dos procesos en desarrollo (web y API). Se mitiga con un único `npm run dev`.
- **Seguimiento**: la plantilla de PR obliga a confirmar que la lógica está en `services/`.
