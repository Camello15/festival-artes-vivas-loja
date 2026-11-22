import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { errorHandler } from '../src/middlewares/errorHandler';
import { requireAuth, requireRole } from '../src/middlewares/auth';

function protectedApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => res.json({ user: req.user }));
  app.get('/admin', requireAuth, requireRole('ADMIN'), (_req, res) => res.sendStatus(204));
  app.use(errorHandler);
  return app;
}

function token(role: string) {
  return jwt.sign({ sub: '42', role }, env.JWT_SECRET, { expiresIn: '8h' });
}

describe('auth middleware', () => {
  it('responde 401 cuando falta el token', async () => {
    const response = await request(protectedApp()).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('responde 401 cuando el token es inválido', async () => {
    const response = await request(protectedApp()).get('/protected').set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('pone el id y el rol verificados en req.user', async () => {
    const response = await request(protectedApp()).get('/protected').set('Authorization', `Bearer ${token('PUBLIC')}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 42, role: 'PUBLIC' });
  });

  it('responde 403 cuando el rol no está permitido', async () => {
    const response = await request(protectedApp()).get('/admin').set('Authorization', `Bearer ${token('PUBLIC')}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
