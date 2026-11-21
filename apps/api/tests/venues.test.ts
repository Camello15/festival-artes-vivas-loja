import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/venues y GET /api/venues/:id', () => {
  it('lista los escenarios con dirección, capacidad y coordenadas', async () => {
    const res = await request(app).get('/api/venues');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      address: expect.any(String),
      capacity: expect.any(Number),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
  });

  it('devuelve 200 con descripción y próximas funciones en GET /api/venues/:id', async () => {
    const listRes = await request(app).get('/api/venues');
    const venueId = listRes.body[0].id;

    const res = await request(app).get(`/api/venues/${venueId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: venueId,
      name: expect.any(String),
      address: expect.any(String),
      description: expect.any(String),
    });
    expect(Array.isArray(res.body.upcomingPerformances)).toBe(true);
  });

  it('devuelve 404 NOT_FOUND si el escenario no existe y 400 si el id no es válido', async () => {
    const notFoundRes = await request(app).get('/api/venues/999999');
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.error.code).toBe('NOT_FOUND');

    const badIdRes = await request(app).get('/api/venues/abc');
    expect(badIdRes.status).toBe(400);
    expect(badIdRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
