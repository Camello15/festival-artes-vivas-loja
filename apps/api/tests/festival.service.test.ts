import { describe, expect, it } from 'vitest';
import { createFestivalService } from '../src/modules/festival/festival.service';
import type { FestivalRepository } from '../src/modules/festival/festival.repository';

// Prueba unitaria: el repository se simula, no se toca la base de datos.
function fakeRepository(overrides: Partial<FestivalRepository> = {}): FestivalRepository {
  return {
    getCounts: async () => ({ events: 9, performances: 18, artists: 8, venues: 6 }),
    getPerformanceDateRange: async () => ({
      first: new Date('2026-11-20T21:00:00.000Z'),
      last: new Date('2026-11-29T00:00:00.000Z'),
    }),
    ...overrides,
  };
}

describe('festivalService.getSummary', () => {
  it('combina los conteos con las fechas de la primera y la última función', async () => {
    const service = createFestivalService(fakeRepository());

    const summary = await service.getSummary();

    expect(summary).toMatchObject({
      name: 'Festival Internacional de Artes Vivas de Loja',
      city: 'Loja, Ecuador',
      startsAt: '2026-11-20T21:00:00.000Z',
      endsAt: '2026-11-29T00:00:00.000Z',
      events: 9,
      performances: 18,
      artists: 8,
      venues: 6,
    });
  });

  it('devuelve fechas nulas si todavía no hay funciones programadas', async () => {
    const service = createFestivalService(
      fakeRepository({ getPerformanceDateRange: async () => ({ first: null, last: null }) }),
    );

    const summary = await service.getSummary();

    expect(summary.startsAt).toBeNull();
    expect(summary.endsAt).toBeNull();
  });
});
