import { defineConfig } from 'vitest/config';

// Las pruebas usan una base SQLite separada (prisma/test.db) que se crea
// y se llena con el seed antes de ejecutar la suite (tests/global-setup.ts).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    // Los archivos comparten una SQLite de prueba; la prueba de concurrencia
    // sigue lanzando sus solicitudes simultáneamente dentro de su propio test.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
    },
  },
});
