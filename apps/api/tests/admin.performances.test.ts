import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const startsAt = new Date(Date.now() + 3 * 86_400_000).toISOString();

let adminToken: string;
let publicToken: string;
let attendeeId: number;
let eventId: number;
let venueId: number;
let performanceId: number;
let freePerformanceId: number;
const reservationIds: number[] = [];

function token(user: { id: number; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
}

function validPerformance(input: Partial<{ status: string; capacity: number; startsAt: string }> = {}) {
  return {
    eventId,
    venueId,
    startsAt,
    capacity: 2,
    status: 'SCHEDULED',
    ...input,
  };
}

beforeAll(async () => {
  const [admin, attendee, event, venue] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } }),
    prisma.event.findFirstOrThrow(),
    prisma.venue.findFirstOrThrow(),
  ]);
  adminToken = token(admin);
  publicToken = token(attendee);
  attendeeId = attendee.id;
  eventId = event.id;
  venueId = venue.id;
});

afterAll(async () => {
  const ids = [performanceId, freePerformanceId].filter((id): id is number => Boolean(id));
  if (reservationIds.length) await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
  if (ids.length) await prisma.performance.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}, 30_000);

describe('Administración de funciones', () => {
  it('protege todas las operaciones con sesión y rol ADMIN', async () => {
    const anonymous = await Promise.all([
      request(app).get('/api/admin/performances'),
      request(app).get('/api/admin/performances/1'),
      request(app).get('/api/admin/performances/1/reservations'),
      request(app).post('/api/admin/performances').send(validPerformance()),
      request(app).put('/api/admin/performances/1').send(validPerformance()),
      request(app).patch('/api/admin/performances/1/cancel'),
      request(app).delete('/api/admin/performances/1'),
    ]);
    expect(anonymous.map((response) => response.status)).toEqual([401, 401, 401, 401, 401, 401, 401]);

    const forbidden = await Promise.all([
      request(app).get('/api/admin/performances').set('Authorization', `Bearer ${publicToken}`),
      request(app).get('/api/admin/performances/1').set('Authorization', `Bearer ${publicToken}`),
      request(app).get('/api/admin/performances/1/reservations').set('Authorization', `Bearer ${publicToken}`),
      request(app).post('/api/admin/performances').set('Authorization', `Bearer ${publicToken}`).send(validPerformance()),
      request(app).put('/api/admin/performances/1').set('Authorization', `Bearer ${publicToken}`).send(validPerformance()),
      request(app).patch('/api/admin/performances/1/cancel').set('Authorization', `Bearer ${publicToken}`),
      request(app).delete('/api/admin/performances/1').set('Authorization', `Bearer ${publicToken}`),
    ]);
    expect(forbidden.map((response) => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
  });

  it('lista, consulta, crea y actualiza funciones con sus referencias', async () => {
    const create = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance());
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ eventId, venueId, capacity: 2, status: 'SCHEDULED', reservedSeats: 0 });
    expect(create.body.event).toMatchObject({ id: eventId });
    expect(create.body.venue).toMatchObject({ id: venueId });
    performanceId = create.body.id;

    const list = await request(app).get('/api/admin/performances').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: performanceId })]));

    const detail = await request(app).get(`/api/admin/performances/${performanceId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ id: performanceId, capacity: 2 });

    const update = await request(app).put(`/api/admin/performances/${performanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance({ capacity: 3 }));
    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({ id: performanceId, capacity: 3 });
  });

  it('valida fecha, estado, referencias y capacidad máxima del escenario', async () => {
    const venue = await prisma.venue.findUniqueOrThrow({ where: { id: venueId } });
    const invalidCapacity = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance({ capacity: venue.capacity + 1 }));
    expect(invalidCapacity.status).toBe(400);
    expect(invalidCapacity.body.error.details.map((detail: { path: string }) => detail.path)).toContain('capacity');

    const invalidDate = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance({ startsAt: 'fecha-invalida' }));
    expect(invalidDate.status).toBe(400);

    const invalidStatus = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPerformance(), status: 'POSTPONED' });
    expect(invalidStatus.status).toBe(400);

    const missingReferences = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPerformance(), eventId: 99999999, venueId: 99999999 });
    expect(missingReferences.status).toBe(404);
  });

  it('rechaza reducir aforo por debajo de reservas confirmadas y cancela sin borrar el historial', async () => {
    const reservation = await request(app).post('/api/reservations')
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ performanceId, quantity: 2 });
    expect(reservation.status).toBe(201);
    const reservationId = reservation.body.id as number;
    reservationIds.push(reservationId);

    const tooSmall = await request(app).put(`/api/admin/performances/${performanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance({ capacity: 1 }));
    expect(tooSmall.status).toBe(409);
    expect(tooSmall.body.error.code).toBe('CONFLICT');
    await expect(prisma.performance.findUnique({ where: { id: performanceId } })).resolves.toMatchObject({ capacity: 3 });

    const reservationsBeforeCancel = await request(app).get(`/api/admin/performances/${performanceId}/reservations`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reservationsBeforeCancel.status).toBe(200);
    expect(reservationsBeforeCancel.body.totalConfirmed).toBe(2);
    expect(reservationsBeforeCancel.body.reservations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: reservationId, code: reservation.body.code, quantity: 2, status: 'CONFIRMED', user: { id: attendeeId, name: expect.any(String) } }),
    ]));

    const deleteConflict = await request(app).delete(`/api/admin/performances/${performanceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteConflict.status).toBe(409);
    await expect(prisma.reservation.findUnique({ where: { id: reservationId } })).resolves.toMatchObject({ id: reservationId, status: 'CONFIRMED' });

    const cancelled = await request(app).patch(`/api/admin/performances/${performanceId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body).toMatchObject({ cancelledReservations: 1, performance: { id: performanceId, status: 'CANCELLED', reservedSeats: 0 } });
    await expect(prisma.reservation.findUnique({ where: { id: reservationId } })).resolves.toMatchObject({ id: reservationId, status: 'CANCELLED' });

    const reCancel = await request(app).patch(`/api/admin/performances/${performanceId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reCancel.status).toBe(200);
    expect(reCancel.body.cancelledReservations).toBe(0);

    const bookingAfterCancel = await request(app).post('/api/reservations')
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ performanceId, quantity: 1 });
    expect(bookingAfterCancel.status).toBe(409);

    const deleteAfterCancel = await request(app).delete(`/api/admin/performances/${performanceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteAfterCancel.status).toBe(409);
    await expect(prisma.reservation.findUnique({ where: { id: reservationId } })).resolves.toMatchObject({ id: reservationId, status: 'CANCELLED' });
  });

  it('elimina funciones sin reservas y responde 404 para identificadores inexistentes', async () => {
    const create = await request(app).post('/api/admin/performances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPerformance());
    expect(create.status).toBe(201);
    freePerformanceId = create.body.id;

    const missing = await request(app).get('/api/admin/performances/99999999').set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);

    const deleted = await request(app).delete(`/api/admin/performances/${freePerformanceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);
    await expect(prisma.performance.findUnique({ where: { id: freePerformanceId } })).resolves.toBeNull();
    freePerformanceId = 0;
  });
});
