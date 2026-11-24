import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { usersRepository, type UsersRepository } from '../users/users.repository';
import type { LoginInput, RegisterInput } from './auth.schemas';

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';

function toPublicUser(user: { id: number; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function createAuthService(repository: UsersRepository = usersRepository) {
  function createToken(user: { id: number; role: string }) {
    return jwt.sign({ role: user.role }, env.JWT_SECRET, {
      subject: String(user.id),
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  return {
    async register(input: RegisterInput) {
      if (await repository.findByEmail(input.email)) {
        throw AppError.conflict('Ese correo ya está registrado');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      try {
        const user = await repository.create({
          name: input.name,
          email: input.email,
          passwordHash,
          role: 'PUBLIC',
        });

        return { token: createToken(user), user: toPublicUser(user) };
      } catch (error) {
        // Cubre dos registros concurrentes para el mismo correo.
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
          throw AppError.conflict('Ese correo ya está registrado');
        }
        throw error;
      }
    },

    async login(input: LoginInput) {
      const user = await repository.findByEmail(input.email);
      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new AppError('UNAUTHORIZED', INVALID_CREDENTIALS);
      }

      return { token: createToken(user), user: toPublicUser(user) };
    },

    async getCurrentUser(id: number) {
      const user = await repository.findById(id);
      if (!user) throw new AppError('UNAUTHORIZED', 'La sesión ya no es válida');
      return toPublicUser(user);
    },
  };
}

export const authService = createAuthService();
