// Error de aplicación con código HTTP y código legible por el frontend.
// Los services lanzan AppError; el middleware errorHandler lo convierte en JSON.

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.status = STATUS_BY_CODE[code];
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError('NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new AppError('CONFLICT', message);
  }
}
