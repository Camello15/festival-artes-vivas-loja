import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `admin-events-${Date.now()}`;
const validEvent = {
  title: `${testPrefix} Obra de prueba`,
  discipline: 'THEATER',
  synopsis: 'Sinopsis para pruebas administrativas.',
  durationMinutes: 75,
  ageRating: 'Todo público',
  imageUrl: null,
};

let adminToken: string;
let publicToken: string;
let createdEventIds: number[] = [];
let dependencyEventId: number;
let dependencyPerformanceId: number;
let dependencyReservationId: number;

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
  if (dependencyReservationId) await prisma.reservation.deleteMany({ where: { id: dependencyReservationId } });
  if (dependencyPerformanceId) await prisma.performance.deleteMany({ where: { id: dependencyPerformanceId } });
  const ids = [...createdEventIds, dependencyEventId].filter((id): id is number => Boolean(id));
  if (ids.length) await prisma.event.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}, 30_000);

describe('Administración de obras', () => {
  it('protege todas las operaciones con sesión y rol ADMIN', async () => {
    const anonymous = await Promise.all([
      request(app).get('/api/admin/events'),
      request(app).get('/api/admin/events/1'),
      request(app).post('/api/admin/events').send({ ...validEvent, artistIds: [] }),
      request(app).put('/api/admin/events/1').send({ ...validEvent, artistIds: [] }),
      request(app).delete('/api/admin/events/1'),
    ]);
    expect(anonymous.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);

    const forbidden = await Promise.all([
      request(app).get('/api/admin/events').set('Authorization', `Bearer ${publicToken}`),
      request(app).get('/api/admin/events/1').set('Authorization', `Bearer ${publicToken}`),
      request(app).post('/api/admin/events').set('Authorization', `Bearer ${publicToken}`).send({ ...validEvent, artistIds: [] }),
      request(app).put('/api/admin/events/1').set('Authorization', `Bearer ${publicToken}`).send({ ...validEvent, artistIds: [] }),
      request(app).delete('/api/admin/events/1').set('Authorization', `Bearer ${publicToken}`),
    ]);
    expect(forbidden.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });

  it('lista, consulta, crea y actualiza obras con asociaciones de artistas', async () => {
    const artists = await prisma.artist.findMany({ take: 2, orderBy: { id: 'asc' } });
    expect(artists.length).toBeGreaterThanOrEqual(2);

    const list = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const create = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, artistIds: [artists[0].id, artists[1].id] });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject(validEvent);
    expect(create.body.artists.map((artist: { id: number }) => artist.id)).toEqual(expect.arrayContaining([artists[0].id, artists[1].id]));
    const eventId = create.body.id as number;
    createdEventIds.push(eventId);

    const detail = await request(app).get(`/api/admin/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ id: eventId, title: validEvent.title });

    const update = await request(app).put(`/api/admin/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, title: `${testPrefix} Obra actualizada`, discipline: 'DANCE', artistIds: [artists[1].id] });
    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({ id: eventId, title: `${testPrefix} Obra actualizada`, discipline: 'DANCE' });
    expect(update.body.artists.map((artist: { id: number }) => artist.id)).toEqual([artists[1].id]);
    await expect(prisma.artist.findUnique({ where: { id: artists[0].id } })).resolves.toMatchObject({ id: artists[0].id });
  });

  it('valida campos y artistas asociados', async () => {
    const invalid = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`).send({
      ...validEvent,
      title: ' ',
      discipline: 'FILM',
      durationMinutes: 0,
      artistIds: [],
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.error.details.map((detail: { path: string }) => detail.path)).toEqual(expect.arrayContaining(['title', 'discipline', 'durationMinutes']));

    const unknownArtist = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, artistIds: [99999999] });
    expect(unknownArtist.status).toBe(400);
    expect(unknownArtist.body.error.details.map((detail: { path: string }) => detail.path)).toContain('artistIds');

    const repeated = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, artistIds: [1, 1] });
    expect(repeated.status).toBe(400);
    expect(repeated.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await request(app).get('/api/admin/events/99999999').set('Authorization', `Bearer ${adminToken}`);
    const invalidId = await request(app).get('/api/admin/events/no-es-id').set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);
    expect(invalidId.status).toBe(400);
  });

  it('permite eliminar obras sin funciones y bloquea en transacción las que podrían borrar reservas', async () => {
    const artist = await prisma.artist.findFirstOrThrow();
    const free = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, title: `${testPrefix} Obra libre`, artistIds: [artist.id] });
    expect(free.status).toBe(201);
    const freeId = free.body.id as number;
    createdEventIds.push(freeId);

    const freeDelete = await request(app).delete(`/api/admin/events/${freeId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(freeDelete.status).toBe(204);
    await expect(prisma.event.findUnique({ where: { id: freeId } })).resolves.toBeNull();
    await expect(prisma.artist.findUnique({ where: { id: artist.id } })).resolves.toMatchObject({ id: artist.id });
    createdEventIds = createdEventIds.filter((id) => id !== freeId);

    const event = await prisma.event.create({ data: { ...validEvent, title: `${testPrefix} Obra con función` } });
    dependencyEventId = event.id;
    const venue = await prisma.venue.findFirstOrThrow();
    const attendee = await prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } });
    const performance = await prisma.performance.create({
      data: { eventId: event.id, venueId: venue.id, startsAt: new Date(Date.now() + 86_400_000), capacity: 1 },
    });
    dependencyPerformanceId = performance.id;
    const reservation = await prisma.reservation.create({
      data: { userId: attendee.id, performanceId: performance.id, quantity: 1, code: `TST-${Date.now()}` },
    });
    dependencyReservationId = reservation.id;

    const conflict = await request(app).delete(`/api/admin/events/${event.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'No se puede eliminar una obra que tiene funciones asociadas',
    });
    await expect(prisma.event.findUnique({ where: { id: event.id } })).resolves.toMatchObject({ id: event.id });
    await expect(prisma.performance.findUnique({ where: { id: performance.id } })).resolves.toMatchObject({ id: performance.id });
    await expect(prisma.reservation.findUnique({ where: { id: reservation.id } })).resolves.toMatchObject({ id: reservation.id });
  });
});
