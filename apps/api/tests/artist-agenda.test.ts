import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `artist-agenda-${Date.now()}`;
let artistToken: string;
let publicToken: string;
let adminToken: string;
let unlinkedArtistUserId: number;
let ownEventId: number;
let unrelatedEventId: number;
let ownPerformanceId: number;
let unrelatedPerformanceId: number;
let confirmedReservationId: number;
let cancelledReservationId: number;

function token(user: { id: number; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
}

function eventInput(title: string) {
  return {
    title,
    discipline: 'THEATER',
    synopsis: 'Obra creada para probar la agenda del artista.',
    durationMinutes: 60,
  };
}

beforeAll(async () => {
  const [artistUser, publicUser, admin, artist] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'artista@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@festival.ec' } }),
    prisma.artist.findFirstOrThrow({ where: { user: { email: 'artista@festival.ec' } } }),
  ]);
  artistToken = token(artistUser);
  publicToken = token(publicUser);
  adminToken = token(admin);

  const [venue, unrelatedEvent, ownEvent] = await Promise.all([
    prisma.venue.findFirstOrThrow(),
    prisma.event.create({ data: eventInput(`${testPrefix} obra ajena`) }),
    prisma.event.create({
      data: { ...eventInput(`${testPrefix} obra propia`), artists: { connect: { id: artist.id } } },
    }),
  ]);
  unrelatedEventId = unrelatedEvent.id;
  ownEventId = ownEvent.id;

  const [ownPerformance, unrelatedPerformance] = await Promise.all([
    prisma.performance.create({
      data: { eventId: ownEventId, venueId: venue.id, startsAt: new Date(Date.now() + 2 * 86_400_000), capacity: 30 },
    }),
    prisma.performance.create({
      data: { eventId: unrelatedEventId, venueId: venue.id, startsAt: new Date(Date.now() + 86_400_000), capacity: 30 },
    }),
  ]);
  ownPerformanceId = ownPerformance.id;
  unrelatedPerformanceId = unrelatedPerformance.id;

  const [confirmed, cancelled] = await Promise.all([
    prisma.reservation.create({
      data: { code: `${testPrefix}-CONF`, userId: publicUser.id, performanceId: ownPerformanceId, quantity: 2 },
    }),
    prisma.reservation.create({
      data: {
        code: `${testPrefix}-CANC`, userId: publicUser.id, performanceId: ownPerformanceId,
        quantity: 4, status: 'CANCELLED',
      },
    }),
  ]);
  confirmedReservationId = confirmed.id;
  cancelledReservationId = cancelled.id;

  const unlinkedArtistUser = await prisma.user.create({
    data: {
      name: `${testPrefix} sin perfil`,
      email: `${testPrefix}@festival.ec`,
      passwordHash: 'not-used-in-this-test',
      role: 'ARTIST',
    },
  });
  unlinkedArtistUserId = unlinkedArtistUser.id;
});

afterAll(async () => {
  const reservationIds = [confirmedReservationId, cancelledReservationId].filter(Boolean);
  if (reservationIds.length) await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
  const performanceIds = [ownPerformanceId, unrelatedPerformanceId].filter(Boolean);
  if (performanceIds.length) await prisma.performance.deleteMany({ where: { id: { in: performanceIds } } });
  const eventIds = [ownEventId, unrelatedEventId].filter(Boolean);
  if (eventIds.length) await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  if (unlinkedArtistUserId) await prisma.user.deleteMany({ where: { id: unlinkedArtistUserId } });
  await prisma.$disconnect();
}, 30_000);

describe('GET /api/me/artist/performances', () => {
  it('requiere autenticación y rol ARTIST', async () => {
    const anonymous = await request(app).get('/api/me/artist/performances');
    const publicAccess = await request(app).get('/api/me/artist/performances')
      .set('Authorization', `Bearer ${publicToken}`);
    const adminAccess = await request(app).get('/api/me/artist/performances')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe('UNAUTHORIZED');
    expect(publicAccess.status).toBe(403);
    expect(publicAccess.body.error.code).toBe('FORBIDDEN');
    expect(adminAccess.status).toBe(403);
    expect(adminAccess.body.error.code).toBe('FORBIDDEN');
  });

  it('devuelve solo funciones de las obras vinculadas al usuario y cuenta reservas confirmadas', async () => {
    const response = await request(app).get('/api/me/artist/performances')
      .set('Authorization', `Bearer ${artistToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: ownPerformanceId,
        status: 'SCHEDULED',
        capacity: 30,
        reservedSeats: 2,
        event: expect.objectContaining({ id: ownEventId, title: `${testPrefix} obra propia` }),
        venue: expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }),
      }),
    ]));
    expect(response.body.map((performance: { id: number }) => performance.id)).not.toContain(unrelatedPerformanceId);
    expect(response.body.every((performance: { reservedSeats: number }) => Number.isInteger(performance.reservedSeats))).toBe(true);
  });

  it('devuelve una lista vacía para ARTIST sin perfil vinculado', async () => {
    const response = await request(app).get('/api/me/artist/performances')
      .set('Authorization', `Bearer ${token({ id: unlinkedArtistUserId, role: 'ARTIST' })}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
