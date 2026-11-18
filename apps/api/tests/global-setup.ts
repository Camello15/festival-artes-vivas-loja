import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

// Crea desde cero la base de pruebas: migraciones + datos de ejemplo.
export default function setup() {
  const env = { ...process.env, DATABASE_URL: 'file:./test.db' };
  rmSync(resolve(__dirname, '../prisma/test.db'), { force: true });
  execSync('npx prisma migrate deploy', { env, stdio: 'ignore' });
  execSync('npx tsx prisma/seed.ts', { env, stdio: 'ignore' });
}
