import { describe, expect, it, vi } from 'vitest';
import {
  createPerformancesService,
  ecuadorDateToUtcRange,
} from '../src/modules/performances/performances.service';
import type { PerformancesRepository } from '../src/modules/performances/performances.repository';

describe('performancesService', () => {
  it('convierte una fecha YYYY-MM-DD de Ecuador (UTC-5) al rango UTC correcto', () => {
    const { startsAtGte, startsAtLt } = ecuadorDateToUtcRange('2026-11-21');
    expect(startsAtGte.toISOString()).toBe('2026-11-21T05:00:00.000Z');
    expect(startsAtLt.toISOString()).toBe('2026-11-22T05:00:00.000Z');
  });

  it('combina filtros de fecha, disciplina y escenario y calcula availableSeats', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 12,
        startsAt: new Date('2026-11-22T00:30:00.000Z'), // 19:30 del 21 de nov en Ecuador
        status: 'SCHEDULED',
        capacity: 100,
        event: {
          id: 3,
          title: 'Raíces',
          discipline: 'DANCE',
          durationMinutes: 70,
          imageUrl: null,
        },
        venue: { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
      },
    ]);
    const getReservedSeatsByPerformance = vi.fn().mockResolvedValue(new Map([[12, 92]]));

    const repo: PerformancesRepository = {
      findMany,
      findFilterOptions: vi.fn(),
      getReservedSeatsByPerformance,
    };

    const service = createPerformancesService(repo, () => new Date('2026-11-20T00:00:00.000Z'));
    const result = await service.listPerformances({
      date: '2026-11-21',
      discipline: 'DANCE',
      venueId: 1,
    });

    expect(findMany).toHaveBeenCalledWith({
      startsAtGte: new Date('2026-11-21T05:00:00.000Z'),
      startsAtLt: new Date('2026-11-22T05:00:00.000Z'),
      discipline: 'DANCE',
      venueId: 1,
    });

    expect(result).toEqual([
      {
        id: 12,
        startsAt: '2026-11-22T00:30:00.000Z',
        status: 'SCHEDULED',
        capacity: 100,
        availableSeats: 8,
        availability: 'FEW_LEFT',
        event: {
          id: 3,
          title: 'Raíces',
          discipline: 'DANCE',
          durationMinutes: 70,
          imageUrl: null,
        },
        venue: { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
      },
    ]);
  });
});
