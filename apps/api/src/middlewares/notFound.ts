import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`No existe la ruta ${req.method} ${req.originalUrl}`));
};
