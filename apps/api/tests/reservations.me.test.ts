import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `my-reservations-${Date.now()}`;
let ownerToken: string;
let otherToken: string;
let ownerId: number;
let otherUserId: number;
let futurePerformanceId: number;
let startedPerformanceId: number;
let ownFutureReservationId: number;
let otherReservationId: number;
let ownStartedReservationId: number;
let ownCancelledReservationId: number;

function createToken(user: { id: number; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
}

beforeAll(async () => {
  const [owner, other] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@festival.ec' } }),
  ]);
  const event = await prisma.event.findFirstOrThrow();
  const venue = await prisma.venue.findFirstOrThrow();
  ownerId = owner.id;
  otherUserId = other.id;
  ownerToken = createToken(owner);
  otherToken = createToken(other);

  const future = await prisma.performance.create({
    data: { eventId: event.id, venueId: venue.id, startsAt: new Date(Date.now() + 60 * 60 * 1000), capacity: 20 },
  });
  const started = await prisma.performance.create({
    data: { eventId: event.id, venueId: venue.id, startsAt: new Date(Date.now() - 60 * 60 * 1000), capacity: 20 },
  });
  futurePerformanceId = future.id;
  startedPerformanceId = started.id;

  const ownFuture = await prisma.reservation.create({
    data: { code: `${testPrefix}-OWN01`, userId: ownerId, performanceId: future.id, quantity: 2 },
  });
  const otherFuture = await prisma.reservation.create({
    data: { code: `${testPrefix}-OTHER`, userId: otherUserId, performanceId: future.id, quantity: 1 },
  });
  const ownStarted = await prisma.reservation.create({
    data: { code: `${testPrefix}-START`, userId: ownerId, performanceId: started.id, quantity: 1 },
  });
  const ownCancelled = await prisma.reservation.create({
    data: {
      code: `${testPrefix}-CANCEL`,
      userId: ownerId,
      performanceId: future.id,
      quantity: 1,
      status: 'CANCELLED',
    },
  });
  ownFutureReservationId = ownFuture.id;
  otherReservationId = otherFuture.id;
  ownStartedReservationId = ownStarted.id;
  ownCancelledReservationId = ownCancelled.id;
});

afterAll(async () => {
  const reservationIds = [ownFutureReservationId, otherReservationId, ownStartedReservationId, ownCancelledReservationId].filter(Boolean);
  if (reservationIds.length) await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
  const performanceIds = [futurePerformanceId, startedPerformanceId].filter(Boolean);
  if (performanceIds.length) await prisma.performance.deleteMany({ where: { id: { in: performanceIds } } });
  await prisma.$disconnect();
}, 30_000);

describe('reservations owned by the authenticated user', () => {
  it('requiere autenticación para consultar y cancelar', async () => {
    const list = await request(app).get('/api/reservations/me');
    const cancel = await request(app).patch('/api/reservations/1/cancel');

    expect(list.status).toBe(401);
    expect(cancel.status).toBe(401);
  });

  it('lista las reservas propias con los datos de función, obra y escenario', async () => {
    const response = await request(app).get('/api/reservations/me').set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: ownFutureReservationId,
        code: `${testPrefix}-OWN01`,
        quantity: 2,
        status: 'CONFIRMED',
        performance: expect.objectContaining({
          id: futurePerformanceId,
          event: expect.objectContaining({ title: expect.any(String) }),
          venue: expect.objectContaining({ name: expect.any(String) }),
        }),
      }),
      expect.objectContaining({ id: ownCancelledReservationId, status: 'CANCELLED' }),
    ]));
    expect(response.body.map((reservation: { id: number }) => reservation.id)).not.toContain(otherReservationId);
    expect(response.body.every((reservation: object) => !('userId' in reservation))).toBe(true);
  });

  it('cancela una reserva futura sin borrarla y permite repetir la cancelación', async () => {
    const first = await request(app)
      .patch(`/api/reservations/${ownFutureReservationId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const second = await request(app)
      .patch(`/api/reservations/${ownFutureReservationId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ id: ownFutureReservationId, status: 'CANCELLED' });
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ id: ownFutureReservationId, status: 'CANCELLED' });
    await expect(prisma.reservation.findUnique({ where: { id: ownFutureReservationId } })).resolves.toMatchObject({
      id: ownFutureReservationId,
      status: 'CANCELLED',
    });
  });

  it('responde 404 con el mismo mensaje para reservas ajenas e inexistentes', async () => {
    const foreign = await request(app)
      .patch(`/api/reservations/${otherReservationId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const missing = await request(app)
      .patch('/api/reservations/99999999/cancel')
      .set('Authorization', `Bearer ${ownerToken}`);
    const otherUserList = await request(app).get('/api/reservations/me').set('Authorization', `Bearer ${otherToken}`);

    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(foreign.body.error.message).toBe(missing.body.error.message);
    expect(otherUserList.body.map((reservation: { id: number }) => reservation.id)).toContain(otherReservationId);
    expect(otherUserList.body.map((reservation: { id: number }) => reservation.id)).not.toContain(ownFutureReservationId);
  });

  it('rechaza cancelar una reserva cuya función ya comenzó', async () => {
    const response = await request(app)
      .patch(`/api/reservations/${ownStartedReservationId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: ownStartedReservationId } });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(stored.status).toBe('CONFIRMED');
    expect(startedPerformanceId).toBeGreaterThan(0);
  });
});
