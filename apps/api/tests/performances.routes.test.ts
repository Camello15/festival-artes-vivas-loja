import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/performances', () => {
  it('devuelve las funciones programadas con availableSeats y availability', async () => {
    const res = await request(app).get('/api/performances?includePast=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const first = res.body[0];
    expect(first).toHaveProperty('availableSeats');
    expect(first).toHaveProperty('availability');
    expect(first).toHaveProperty('event.title');
    expect(first).toHaveProperty('venue.name');
  });

  it('filtra por disciplina y escenario combinados', async () => {
    const allRes = await request(app).get('/api/performances?includePast=true');
    const sample = allRes.body[0];

    const filteredRes = await request(app).get(
      `/api/performances?includePast=true&discipline=${sample.event.discipline}&venueId=${sample.venue.id}`,
    );
    expect(filteredRes.status).toBe(200);
    for (const item of filteredRes.body) {
      expect(item.event.discipline).toBe(sample.event.discipline);
      expect(item.venue.id).toBe(sample.venue.id);
    }
  });

  it('responde 400 VALIDATION_ERROR cuando los filtros son inválidos', async () => {
    const res = await request(app).get('/api/performances?discipline=XYZ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    const badDateRes = await request(app).get('/api/performances?date=21-11-2026');
    expect(badDateRes.status).toBe(400);
    expect(badDateRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/performances/filters', () => {
  it('devuelve fechas, disciplinas y escenarios disponibles', async () => {
    const res = await request(app).get('/api/performances/filters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.dates)).toBe(true);
    expect(Array.isArray(res.body.disciplines)).toBe(true);
    expect(Array.isArray(res.body.venues)).toBe(true);
  });
});
