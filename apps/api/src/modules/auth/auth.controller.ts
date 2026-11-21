import type { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { authService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schemas';

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión');
    res.status(200).json({ user: await authService.getCurrentUser(req.user.id) });
  },
};
