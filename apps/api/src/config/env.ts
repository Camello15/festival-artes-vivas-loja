import { z } from 'zod';

// Variables de entorno validadas al arrancar: si falta algo, la API falla
// de inmediato con un mensaje claro en lugar de fallar más tarde.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria (ver apps/api/.env.example)'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('cambia-este-secreto-en-local'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración inválida. Copia apps/api/.env.example a apps/api/.env');
}

export const env = parsed.data;
