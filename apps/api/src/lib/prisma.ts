import { PrismaClient } from '@prisma/client';
// Garantiza que .env esté cargado y validado antes de crear el cliente.
import '../config/env';

// Instancia única de PrismaClient para toda la API.
// Solo la capa de repositories debe importarla (principio II de la constitución).
export const prisma = new PrismaClient();
