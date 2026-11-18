import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

// Pruebas de integración: app Express real + base de pruebas con el seed.
const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('responde 200 con la base de datos disponible', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });
});

describe('GET /api/festival/summary', () => {
  it('devuelve el resumen calculado con los datos del seed', async () => {
    const res = await request(app).get('/api/festival/summary');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ events: 9, performances: 18, artists: 8, venues: 6 });
    expect(new Date(res.body.startsAt).getTime()).toBeLessThan(new Date(res.body.endsAt).getTime());
  });
});

describe('Manejo de errores', () => {
  it('responde 404 con el formato de error común en rutas inexistentes', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'No existe la ruta GET /api/no-existe', details: [] },
    });
  });

  it('responde 400 cuando el cuerpo no es un JSON válido', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ "mal": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
