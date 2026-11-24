import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `admin-artists-${Date.now()}`;
const validArtist = {
  name: `${testPrefix} Artista de prueba`,
  kind: 'SOLO',
  country: 'Ecuador',
  bio: 'Artista de prueba administrativa',
  imageUrl: null,
  website: null,
};

let adminToken: string;
let publicToken: string;
let createdArtistId: number;
let linkedEventId: number;

function token(user: { id: number; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
}

beforeAll(async () => {
  const [admin, attendee] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } }),
  ]);
  adminToken = token(admin);
  publicToken = token(attendee);
});

afterAll(async () => {
  if (createdArtistId && linkedEventId) {
    await prisma.event.update({ where: { id: linkedEventId }, data: { artists: { disconnect: { id: createdArtistId } } } });
  }
  if (createdArtistId) await prisma.artist.deleteMany({ where: { id: createdArtistId } });
  await prisma.$disconnect();
}, 30_000);

describe('Administración de artistas', () => {
  it('exige sesión y rol ADMIN para todas las operaciones', async () => {
    const anonymous = await Promise.all([
      request(app).get('/api/admin/artists'),
      request(app).get('/api/admin/artists/1'),
      request(app).post('/api/admin/artists').send(validArtist),
      request(app).put('/api/admin/artists/1').send(validArtist),
      request(app).delete('/api/admin/artists/1'),
    ]);
    expect(anonymous.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);

    const forbidden = await Promise.all([
      request(app).get('/api/admin/artists').set('Authorization', `Bearer ${publicToken}`),
      request(app).get('/api/admin/artists/1').set('Authorization', `Bearer ${publicToken}`),
      request(app).post('/api/admin/artists').set('Authorization', `Bearer ${publicToken}`).send(validArtist),
      request(app).put('/api/admin/artists/1').set('Authorization', `Bearer ${publicToken}`).send(validArtist),
      request(app).delete('/api/admin/artists/1').set('Authorization', `Bearer ${publicToken}`),
    ]);
    expect(forbidden.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });

  it('lista, consulta, crea y actualiza artistas con ADMIN', async () => {
    const list = await request(app).get('/api/admin/artists').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const create = await request(app).post('/api/admin/artists').set('Authorization', `Bearer ${adminToken}`).send(validArtist);
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject(validArtist);
    expect(create.body.id).toEqual(expect.any(Number));
    expect(create.body.userId).toBeNull();
    createdArtistId = create.body.id;

    const detail = await request(app).get(`/api/admin/artists/${createdArtistId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ id: createdArtistId, name: validArtist.name });

    const update = await request(app).put(`/api/admin/artists/${createdArtistId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validArtist, name: `${testPrefix} Artista actualizado`, kind: 'COMPANY' });
    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({ id: createdArtistId, name: `${testPrefix} Artista actualizado`, kind: 'COMPANY' });
  });

  it('rechaza datos inválidos, identifica recursos inexistentes y protege artistas con obras', async () => {
    const invalid = await request(app).post('/api/admin/artists').set('Authorization', `Bearer ${adminToken}`).send({
      ...validArtist,
      name: ' ',
      kind: 'BAND',
      country: '',
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.error.details.map((detail: { path: string }) => detail.path)).toEqual(expect.arrayContaining(['name', 'kind', 'country']));

    const missing = await request(app).get('/api/admin/artists/99999999').set('Authorization', `Bearer ${adminToken}`);
    const invalidId = await request(app).get('/api/admin/artists/no-es-id').set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);
    expect(invalidId.status).toBe(400);

    const freeArtist = await prisma.artist.create({ data: { ...validArtist, name: `${testPrefix} Artista libre` } });
    const freeDelete = await request(app).delete(`/api/admin/artists/${freeArtist.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(freeDelete.status).toBe(204);
    await expect(prisma.artist.findUnique({ where: { id: freeArtist.id } })).resolves.toBeNull();

    const event = await prisma.event.findFirstOrThrow();
    linkedEventId = event.id;
    await prisma.event.update({ where: { id: linkedEventId }, data: { artists: { connect: { id: createdArtistId } } } });
    const conflict = await request(app).delete(`/api/admin/artists/${createdArtistId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'No se puede eliminar un artista que tiene obras asociadas',
    });
    await expect(prisma.artist.findUnique({ where: { id: createdArtistId } })).resolves.toMatchObject({ id: createdArtistId });
  });
});
