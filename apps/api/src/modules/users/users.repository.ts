import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Persistencia de usuarios: las reglas de autenticación viven en el service.
export const usersRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
};

export type UsersRepository = typeof usersRepository;
