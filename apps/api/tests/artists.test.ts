import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/artists y GET /api/artists/:id', () => {
  it('lista los artistas y permite filtrar por nombre con search', async () => {
    const listRes = await request(app).get('/api/artists');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);

    const sample = listRes.body[0];
    expect(sample).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      kind: expect.any(String),
      country: expect.any(String),
    });

    const term = sample.name.slice(0, 4);
    const searchRes = await request(app).get(`/api/artists?search=${encodeURIComponent(term)}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.some((a: { id: number }) => a.id === sample.id)).toBe(true);
  });

  it('devuelve 200 con biografía y obras del artista en GET /api/artists/:id', async () => {
    const listRes = await request(app).get('/api/artists');
    const artistId = listRes.body[0].id;

    const res = await request(app).get(`/api/artists/${artistId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: artistId,
      name: expect.any(String),
      bio: expect.any(String),
    });
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('devuelve 404 NOT_FOUND si el artista no existe y 400 si el id no es válido', async () => {
    const notFoundRes = await request(app).get('/api/artists/999999');
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.error.code).toBe('NOT_FOUND');

    const badIdRes = await request(app).get('/api/artists/no-valido');
    expect(badIdRes.status).toBe(400);
    expect(badIdRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
