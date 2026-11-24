import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Ingresa tu nombre'),
    email: z.string().trim().toLowerCase().email('Ingresa un correo válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Ingresa un correo válido'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
