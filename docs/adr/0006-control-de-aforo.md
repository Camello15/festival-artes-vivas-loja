# ADR-0006: Control de aforo concurrente con SQLite

**Estado**: Aceptada
**Fecha**: 2026-11-21

## Contexto

Varias personas pueden reservar simultáneamente las últimas entradas de una función.
Una lectura de disponibilidad seguida de una escritura fuera de una transacción permite
que dos solicitudes observen el mismo cupo y lo sobrepasen. El proyecto usa SQLite a
través de Prisma, y el aforo de una función no debe excederse.

## Alternativas consideradas

1. Leer primero el total confirmado y crear después la reserva. No es segura: ambas
   solicitudes pueden leer el mismo total antes de que cualquiera escriba.
2. Mantener un contador de disponibilidad en `Performance`. Evita sumar reservas, pero
   duplica estado derivable y requiere cambiar el esquema, contrario al modelo actual.
3. Serializar el flujo crítico mediante una transacción SQLite que escriba primero y
   luego lea y valide el total. Es la opción definida por el plan del Spec #3.

## Decisión

`reserve()` ejecuta una transacción interactiva de Prisma. Su primera operación dentro
de la transacción inserta una reserva `CONFIRMED`; esa escritura adquiere el bloqueo de
escritura de SQLite. Mientras se mantiene la transacción, el service lee la función,
comprueba que siga programada y futura, suma las reservas confirmadas (incluida la nueva)
y suma las del usuario. Si el aforo se excede o el usuario supera seis entradas, lanza
`AppError(CONFLICT)`. Prisma revierte entonces el `INSERT`. Solo confirma la transacción
si todas las reglas se cumplen.

El cliente Prisma se configura con `connection_limit=1` para SQLite: sus transacciones se
encolan sobre una sola conexión y SQLite sigue siendo quien protege la escritura. Antes
de iniciar transacciones, el cliente ejecuta `PRAGMA busy_timeout = 5000` una vez por
proceso. Así SQLite espera hasta cinco segundos para obtener el bloqueo; las transacciones
también tienen límites explícitos de espera (`maxWait`) y duración (`timeout`) de 30 s.
El timeout de espera de SQLite aplica al bloqueo de la conexión y no convierte un error
de concurrencia en una reserva exitosa.

La integración se verifica con veinte llamadas concurrentes reales contra la base
SQLite aislada de pruebas: diez reservas de una entrada deben confirmarse y diez deben
responder conflicto; la suma persistida debe ser exactamente diez.

## Consecuencias y limitaciones

- La base garantiza que la validación se ejecuta después de adquirir el bloqueo de
  escritura; el rollback elimina las filas de solicitudes rechazadas.
- El pool de una conexión serializa el acceso a la base por este proceso. Las reservas
  concurrentes esperan y se procesan una a la vez; esto limita el rendimiento de escritura,
  pero resulta adecuado para la escala del prototipo.
- Si el bloqueo no se libera dentro del `busy_timeout`, la operación falla; el service no
  reintenta `SQLITE_BUSY` como si fuera una reserva aceptada.
- El enfoque depende de SQLite. Si el proyecto migra a PostgreSQL, debe reemplazarse por
  bloqueo de fila de la función (`SELECT ... FOR UPDATE`) dentro de la transacción.
