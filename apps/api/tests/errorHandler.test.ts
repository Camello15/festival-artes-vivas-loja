import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError } from '../src/errors/AppError';
import { errorHandler } from '../src/middlewares/errorHandler';

// App mínima que lanza errores a propósito para probar el middleware.
function appThatThrows(error: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('traduce un AppError a su código HTTP', async () => {
    const res = await request(appThatThrows(AppError.conflict('Solo quedan 3 entradas'))).get('/boom');

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'CONFLICT', message: 'Solo quedan 3 entradas', details: [] });
  });

  it('traduce un ZodError a 400 con el detalle de cada campo', async () => {
    const zodError = z.object({ quantity: z.number().max(6) }).safeParse({ quantity: 9 }).error;
    const res = await request(appThatThrows(zodError)).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('quantity');
  });

  it('responde 500 sin filtrar el mensaje interno ante un error inesperado', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(appThatThrows(new Error('SQLITE_CORRUPT: detalle interno'))).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor', details: [] });
    expect(JSON.stringify(res.body)).not.toContain('SQLITE');
    spy.mockRestore();
  });
});
