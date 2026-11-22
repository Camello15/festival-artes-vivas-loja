import { PrismaClient } from '@prisma/client';
// Garantiza que .env esté cargado y validado antes de crear el cliente.
import { env } from '../config/env';

function sqliteUrlWithSingleConnection(url: string) {
  const [fileUrl, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('connection_limit', '1');
  return `${fileUrl}?${params.toString()}`;
}

// SQLite tiene un solo escritor; una conexión evita que transacciones diferidas
// compitan al actualizar su snapshot y deja que busy_timeout gestione la espera.
// Solo la capa de repositories debe importarla (principio II de la constitución).
export const prisma = new PrismaClient({
  datasources: { db: { url: sqliteUrlWithSingleConnection(env.DATABASE_URL) } },
});

let busyTimeoutPromise: Promise<void> | null = null;

/** Configura una espera de hasta 5 s para el bloqueo de escritura de SQLite. */
export function ensureSqliteBusyTimeout() {
  if (!busyTimeoutPromise) {
    busyTimeoutPromise = prisma
      .$queryRawUnsafe('PRAGMA busy_timeout = 5000')
      .then(() => undefined)
      .catch((error: unknown) => {
        busyTimeoutPromise = null;
        throw error;
      });
  }
  return busyTimeoutPromise;
}
