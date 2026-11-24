import type { Request, RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import type { Role } from '../domain/enums';

export interface AuthUser {
  id: number;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

function getAuthUser(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string') return null;

    const { sub, role } = payload as JwtPayload & { role?: unknown };
    const id = typeof sub === 'string' ? Number(sub) : Number.NaN;
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    if (role !== 'PUBLIC' && role !== 'ARTIST' && role !== 'ADMIN') return null;

    return { id, role };
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const user = match ? getAuthUser(match[1]) : null;

  if (!user) {
    next(new AppError('UNAUTHORIZED', 'Debes iniciar sesión'));
    return;
  }

  req.user = user;
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res, next) => {
    if (!req.user) {
      next(new AppError('UNAUTHORIZED', 'Debes iniciar sesión'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('FORBIDDEN', 'No tienes permisos'));
      return;
    }

    next();
  };
}
