import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `admin-venues-${Date.now()}`;
const validVenue = {
  name: `${testPrefix} Teatro de prueba`,
  address: 'Calle de prueba 123, Loja',
  latitude: -3.99,
  longitude: -79.20,
  capacity: 240,
  description: 'Escenario para pruebas administrativas',
  imageUrl: null,
};

let adminToken: string;
let publicToken: string;
let createdVenueId: number;
let venueWithPerformanceId: number;
let testPerformanceId: number;

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
  if (testPerformanceId) await prisma.performance.deleteMany({ where: { id: testPerformanceId } });
  const ids = [createdVenueId, venueWithPerformanceId].filter((id): id is number => Boolean(id));
  if (ids.length) await prisma.venue.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}, 30_000);

describe('Administración de escenarios', () => {
  it('exige sesión y rol ADMIN para todas las operaciones', async () => {
    const requests = [
      request(app).get('/api/admin/venues'),
      request(app).get('/api/admin/venues/1'),
      request(app).post('/api/admin/venues').send(validVenue),
      request(app).put('/api/admin/venues/1').send(validVenue),
      request(app).delete('/api/admin/venues/1'),
    ];
    const anonymous = await Promise.all(requests);
    expect(anonymous.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);

    const forbidden = await Promise.all([
      request(app).get('/api/admin/venues').set('Authorization', `Bearer ${publicToken}`),
      request(app).get('/api/admin/venues/1').set('Authorization', `Bearer ${publicToken}`),
      request(app).post('/api/admin/venues').set('Authorization', `Bearer ${publicToken}`).send(validVenue),
      request(app).put('/api/admin/venues/1').set('Authorization', `Bearer ${publicToken}`).send(validVenue),
      request(app).delete('/api/admin/venues/1').set('Authorization', `Bearer ${publicToken}`),
    ]);
    expect(forbidden.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });

  it('lista escenarios y consulta uno por id con ADMIN', async () => {
    const list = await request(app).get('/api/admin/venues').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const seededVenue = await prisma.venue.findFirstOrThrow();
    const detail = await request(app).get(`/api/admin/venues/${seededVenue.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ id: seededVenue.id, name: seededVenue.name, capacity: seededVenue.capacity });
  });

  it('crea y actualiza un escenario', async () => {
    const create = await request(app).post('/api/admin/venues').set('Authorization', `Bearer ${adminToken}`).send(validVenue);
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject(validVenue);
    expect(create.body.id).toEqual(expect.any(Number));
    createdVenueId = create.body.id;

    const update = await request(app).put(`/api/admin/venues/${createdVenueId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validVenue, name: `${testPrefix} Teatro actualizado`, capacity: 300 });
    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({ id: createdVenueId, name: `${testPrefix} Teatro actualizado`, capacity: 300 });
  });

  it('rechaza datos inválidos y devuelve errores asociados a campos', async () => {
    const response = await request(app).post('/api/admin/venues').set('Authorization', `Bearer ${adminToken}`).send({
      ...validVenue,
      name: ' ',
      latitude: 95,
      capacity: 0,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.map((detail: { path: string }) => detail.path)).toEqual(expect.arrayContaining(['name', 'latitude', 'capacity']));
  });

  it('responde 404 para identificadores inexistentes o inválidos', async () => {
    const missing = await request(app).get('/api/admin/venues/99999999').set('Authorization', `Bearer ${adminToken}`);
    const invalid = await request(app).get('/api/admin/venues/no-es-id').set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('elimina escenarios libres y rechaza los que tienen funciones asociadas', async () => {
    const freeVenue = await prisma.venue.create({ data: { ...validVenue, name: `${testPrefix} Escenario libre` } });
    const freeDelete = await request(app).delete(`/api/admin/venues/${freeVenue.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(freeDelete.status).toBe(204);
    await expect(prisma.venue.findUnique({ where: { id: freeVenue.id } })).resolves.toBeNull();

    const event = await prisma.event.findFirstOrThrow();
    const venue = await prisma.venue.create({ data: { ...validVenue, name: `${testPrefix} Escenario ocupado` } });
    venueWithPerformanceId = venue.id;
    const performance = await prisma.performance.create({
      data: { eventId: event.id, venueId: venue.id, startsAt: new Date(Date.now() + 86_400_000), capacity: venue.capacity },
    });
    testPerformanceId = performance.id;

    const conflict = await request(app).delete(`/api/admin/venues/${venue.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toMatchObject({ code: 'CONFLICT', message: 'No se puede eliminar un escenario que tiene funciones asociadas' });
    await expect(prisma.venue.findUnique({ where: { id: venue.id } })).resolves.toMatchObject({ id: venue.id });
  });
});
