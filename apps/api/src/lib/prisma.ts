import { PrismaClient } from '@prisma/client';

// Instancia única de PrismaClient para toda la API.
// Solo la capa de repositories debe importarla (principio II de la constitución).
export const prisma = new PrismaClient();
