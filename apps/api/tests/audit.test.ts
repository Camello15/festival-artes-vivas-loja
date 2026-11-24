import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testPrefix = `audit-${Date.now()}`;
let adminId: number;
let attendeeId: number;
let adminToken: string;
let attendeeToken: string;
let venueId: number;
let artistId: number;
let eventId: number;
let reservedPerformanceId: number;
let freePerformanceId: number;
let reservationId: number;

function token(user: { id: number; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '8h' });
}

function venueInput(name = `${testPrefix} Venue`) {
  return { name, address: 'Centro de Loja', latitude: -3.99, longitude: -79.2, capacity: 20, description: 'Auditoría' };
}

function eventInput(title = `${testPrefix} Event`, artistIds: number[] = []) {
  return {
    title,
    discipline: 'THEATER',
    synopsis: 'Obra creada para verificar auditoría.',
    durationMinutes: 60,
    ageRating: 'Todo público',
    imageUrl: null,
    artistIds,
  };
}

function performanceInput(event: number, venue: number, startsAt = new Date(Date.now() + 3 * 86_400_000).toISOString()) {
  return { eventId: event, venueId: venue, startsAt, capacity: 10, status: 'SCHEDULED' };
}

beforeAll(async () => {
  const [admin, attendee] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@festival.ec' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'publico@festival.ec' } }),
  ]);
  adminId = admin.id;
  attendeeId = attendee.id;
  adminToken = token(admin);
  attendeeToken = token(attendee);
});

afterAll(async () => {
  vi.restoreAllMocks();
  if (reservationId) await prisma.reservation.deleteMany({ where: { id: reservationId } });
  const performanceIds = [reservedPerformanceId, freePerformanceId].filter(Boolean);
  if (performanceIds.length) await prisma.performance.deleteMany({ where: { id: { in: performanceIds } } });
  if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
  if (artistId) await prisma.artist.deleteMany({ where: { id: artistId } });
  if (venueId) await prisma.venue.deleteMany({ where: { id: venueId } });
  await prisma.$disconnect();
}, 30_000);

describe('auditoría de operaciones', () => {
  it('registra mutaciones exitosas con actor, acción, entidad, id y fecha; omite las fallidas', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});

    const venueCreate = await request(app).post('/api/admin/venues').set('Authorization', `Bearer ${adminToken}`).send(venueInput());
    expect(venueCreate.status).toBe(201);
    venueId = venueCreate.body.id;
    const venueUpdate = await request(app).put(`/api/admin/venues/${venueId}`).set('Authorization', `Bearer ${adminToken}`)
      .send(venueInput(`${testPrefix} Venue updated`));
    expect(venueUpdate.status).toBe(200);
    const venueDelete = await request(app).delete(`/api/admin/venues/${venueId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(venueDelete.status).toBe(204);

    const artistCreate = await request(app).post('/api/admin/artists').set('Authorization', `Bearer ${adminToken}`).send({
      name: `${testPrefix} Artist`, kind: 'SOLO', country: 'Ecuador', bio: '', imageUrl: null, website: null,
    });
    expect(artistCreate.status).toBe(201);
    artistId = artistCreate.body.id;
    const artistUpdate = await request(app).put(`/api/admin/artists/${artistId}`).set('Authorization', `Bearer ${adminToken}`).send({
      name: `${testPrefix} Artist updated`, kind: 'COMPANY', country: 'Ecuador', bio: '', imageUrl: null, website: null,
    });
    expect(artistUpdate.status).toBe(200);

    const eventCreate = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`)
      .send(eventInput(`${testPrefix} Event`, [artistId]));
    expect(eventCreate.status).toBe(201);
    eventId = eventCreate.body.id;
    const eventUpdate = await request(app).put(`/api/admin/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`)
      .send(eventInput(`${testPrefix} Event updated`, [artistId]));
    expect(eventUpdate.status).toBe(200);
    const eventDelete = await request(app).delete(`/api/admin/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(eventDelete.status).toBe(204);
    const artistDelete = await request(app).delete(`/api/admin/artists/${artistId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(artistDelete.status).toBe(204);

    const [seededEvent, seededVenue] = await Promise.all([prisma.event.findFirstOrThrow(), prisma.venue.findFirstOrThrow()]);
    const performanceCreate = await request(app).post('/api/admin/performances').set('Authorization', `Bearer ${adminToken}`)
      .send(performanceInput(seededEvent.id, seededVenue.id));
    expect(performanceCreate.status).toBe(201);
    reservedPerformanceId = performanceCreate.body.id;
    const performanceUpdate = await request(app).put(`/api/admin/performances/${reservedPerformanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(performanceInput(seededEvent.id, seededVenue.id, new Date(Date.now() + 4 * 86_400_000).toISOString()));
    expect(performanceUpdate.status).toBe(200);

    const reserve = await request(app).post('/api/reservations').set('Authorization', `Bearer ${attendeeToken}`)
      .send({ performanceId: reservedPerformanceId, quantity: 1 });
    expect(reserve.status).toBe(201);
    reservationId = reserve.body.id;
    const cancelReservation = await request(app).patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(cancelReservation.status).toBe(200);
    const cancelPerformance = await request(app).patch(`/api/admin/performances/${reservedPerformanceId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelPerformance.status).toBe(200);

    const performanceToDelete = await request(app).post('/api/admin/performances').set('Authorization', `Bearer ${adminToken}`)
      .send(performanceInput(seededEvent.id, seededVenue.id));
    expect(performanceToDelete.status).toBe(201);
    freePerformanceId = performanceToDelete.body.id;
    const performanceDelete = await request(app).delete(`/api/admin/performances/${freePerformanceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(performanceDelete.status).toBe(204);

    const logsBeforeFailure = log.mock.calls.length;
    const invalidMutation = await request(app).post('/api/admin/venues').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...venueInput(), name: ' ' });
    expect(invalidMutation.status).toBe(400);
    expect(log).toHaveBeenCalledTimes(logsBeforeFailure);

    const entries = log.mock.calls.map(([serialized]) => JSON.parse(String(serialized)) as Record<string, unknown>);
    expect(entries).toHaveLength(16);
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: adminId, action: 'CREATE', entity: 'Venue', entityId: venueCreate.body.id }),
      expect.objectContaining({ userId: adminId, action: 'UPDATE', entity: 'Venue', entityId: venueId }),
      expect.objectContaining({ userId: adminId, action: 'DELETE', entity: 'Venue', entityId: venueId }),
      expect.objectContaining({ userId: adminId, action: 'CREATE', entity: 'Artist', entityId: artistId }),
      expect.objectContaining({ userId: adminId, action: 'UPDATE', entity: 'Artist', entityId: artistId }),
      expect.objectContaining({ userId: adminId, action: 'DELETE', entity: 'Artist', entityId: artistId }),
      expect.objectContaining({ userId: adminId, action: 'CREATE', entity: 'Event', entityId: eventId }),
      expect.objectContaining({ userId: adminId, action: 'UPDATE', entity: 'Event', entityId: eventId }),
      expect.objectContaining({ userId: adminId, action: 'DELETE', entity: 'Event', entityId: eventId }),
      expect.objectContaining({ userId: adminId, action: 'CREATE', entity: 'Performance', entityId: reservedPerformanceId }),
      expect.objectContaining({ userId: adminId, action: 'UPDATE', entity: 'Performance', entityId: reservedPerformanceId }),
      expect.objectContaining({ userId: adminId, action: 'CANCEL', entity: 'Performance', entityId: reservedPerformanceId }),
      expect.objectContaining({ userId: adminId, action: 'CREATE', entity: 'Performance', entityId: freePerformanceId }),
      expect.objectContaining({ userId: adminId, action: 'DELETE', entity: 'Performance', entityId: freePerformanceId }),
      expect.objectContaining({ userId: attendeeId, action: 'RESERVE', entity: 'Reservation', entityId: reservationId }),
      expect.objectContaining({ userId: attendeeId, action: 'CANCEL', entity: 'Reservation', entityId: reservationId }),
    ]));
    for (const entry of entries) {
      expect(typeof entry.timestamp).toBe('string');
      expect(new Date(String(entry.timestamp)).toISOString()).toBe(entry.timestamp);
      expect(entry).not.toHaveProperty('password');
      expect(entry).not.toHaveProperty('passwordHash');
      expect(entry).not.toHaveProperty('token');
      expect(entry).not.toHaveProperty('email');
      expect(entry).not.toHaveProperty('payload');
    }
    log.mockRestore();
  });
});
