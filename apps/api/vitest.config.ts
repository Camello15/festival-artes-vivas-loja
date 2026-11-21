import { defineConfig } from 'vitest/config';

// Las pruebas usan una base SQLite separada (prisma/test.db) que se crea
// y se llena con el seed antes de ejecutar la suite (tests/global-setup.ts).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
    },
  },
});
