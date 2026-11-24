import { prisma } from '../../lib/prisma';

export const healthRepository = {
  /** Devuelve true si la base de datos responde a una consulta trivial. */
  async pingDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};

export type HealthRepository = typeof healthRepository;
