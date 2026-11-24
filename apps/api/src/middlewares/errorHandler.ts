import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

// Formato de error común de toda la API:
// { "error": { "code": "NOT_FOUND", "message": "...", "details": [] } }
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  // JSON mal formado en el body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'El cuerpo no es un JSON válido', details: [] },
    });
    return;
  }

  // Error inesperado: se registra completo en el servidor, pero no se filtran detalles al cliente.
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor', details: [] },
  });
};
