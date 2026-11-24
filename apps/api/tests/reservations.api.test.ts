import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
let userId: number;
let performanceId: number;
let token: string;

beforeAll(async () => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } });
  const event = await prisma.event.findFirstOrThrow();
  const venue = await prisma.venue.findFirstOrThrow();
  userId = user.id;
  token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
  const performance = await prisma.performance.create({
    data: {
      eventId: event.id,
      venueId: venue.id,
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      capacity: 10,
    },
  });
  performanceId = performance.id;
});

afterAll(async () => {
  if (performanceId) {
    await prisma.reservation.deleteMany({ where: { performanceId } });
    await prisma.performance.delete({ where: { id: performanceId } });
  }
  await prisma.$disconnect();
});

describe('POST /api/reservations', () => {
  it('requiere una sesión válida', async () => {
    const response = await request(app).post('/api/reservations').send({ performanceId: 1, quantity: 1 });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('valida cantidad y rechaza userId enviado por el cliente', async () => {
    const invalidQuantity = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ performanceId, quantity: 7 });
    const suppliedUser = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ performanceId, quantity: 1, userId: userId + 1 });

    expect(invalidQuantity.status).toBe(400);
    expect(invalidQuantity.body.error.code).toBe('VALIDATION_ERROR');
    expect(suppliedUser.status).toBe(400);
    expect(suppliedUser.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('crea reserva confirmada y devuelve su código y la función asociada', async () => {
    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ performanceId, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      quantity: 2,
      status: 'CONFIRMED',
      performance: { id: performanceId, event: { id: expect.any(Number) }, venue: { id: expect.any(Number) } },
    });
    expect(response.body).not.toHaveProperty('userId');
    expect(response.body.code).toMatch(/^FAV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});
