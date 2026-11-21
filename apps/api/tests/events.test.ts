import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/events/:id', () => {
  it('devuelve 200 con el detalle de la obra, artistas y funciones con disponibilidad', async () => {
    const listRes = await request(app).get('/api/performances?includePast=true');
    const eventId = listRes.body[0].event.id;

    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: eventId,
      title: expect.any(String),
      synopsis: expect.any(String),
      discipline: expect.any(String),
      durationMinutes: expect.any(Number),
      ageRating: expect.any(String),
    });
    expect(Array.isArray(res.body.artists)).toBe(true);
    expect(Array.isArray(res.body.performances)).toBe(true);
    expect(res.body.performances[0]).toHaveProperty('availableSeats');
    expect(res.body.performances[0]).toHaveProperty('venue.name');
  });

  it('devuelve 404 NOT_FOUND cuando la obra no existe', async () => {
    const res = await request(app).get('/api/events/999999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('devuelve 400 VALIDATION_ERROR cuando el id no es un entero válido', async () => {
    const res = await request(app).get('/api/events/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
