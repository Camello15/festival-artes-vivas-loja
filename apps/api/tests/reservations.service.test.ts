import { describe, expect, it, vi } from 'vitest';
import { createReservationsService } from '../src/modules/reservations/reservations.service';
import type {
  ReservationsPrismaClient,
  ReservationsRepository,
  ReservationTransaction,
} from '../src/modules/reservations/reservations.repository';

const futureStart = new Date('2030-01-01T20:00:00.000Z');
const fixedNow = () => new Date('2030-01-01T19:00:00.000Z');

function setup({
  status = 'SCHEDULED',
  startsAt = futureStart,
  capacity = 10,
  totalAfterCreate = 1,
  mineAfterCreate = 1,
}: {
  status?: string;
  startsAt?: Date;
  capacity?: number;
  totalAfterCreate?: number;
  mineAfterCreate?: number;
} = {}) {
  const order: string[] = [];
  const tx = {} as ReservationTransaction;
  const reservation = { id: 87, code: 'FAV-ABC234', quantity: 1, status: 'CONFIRMED', performance: { id: 9 } };
  const repository = {
    create: vi.fn(async () => {
      order.push('create');
      return reservation;
    }),
    findPerformance: vi.fn(async () => {
      order.push('findPerformance');
      return { id: 9, status, startsAt, capacity };
    }),
    sumConfirmed: vi.fn(async (_tx: unknown, _performanceId: number, userId?: number) => {
      order.push(userId === undefined ? 'sumAll' : 'sumUser');
      return userId === undefined ? totalAfterCreate : mineAfterCreate;
    }),
    findByUser: vi.fn(),
  } as unknown as ReservationsRepository;
  const client = {
    $transaction: vi.fn(async (callback: (transaction: ReservationTransaction) => Promise<unknown>) => {
      const result = await callback(tx);
      order.push('commit');
      return result;
    }),
  } as unknown as ReservationsPrismaClient;
  const service = createReservationsService(client, repository, fixedNow, () => 'FAV-ABC234', async () => {});

  return { service, repository, client, order, reservation };
}

describe('reservationsService.reserve', () => {
  it('escribe primero, confirma una reserva con código y devuelve su función', async () => {
    const { service, repository, order, reservation } = setup();

    const result = await service.reserve(3, 9, 1);

    expect(result).toEqual(reservation);
    expect(order).toEqual(['create', 'findPerformance', 'sumAll', 'sumUser', 'commit']);
    expect(repository.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ code: 'FAV-ABC234', userId: 3, performanceId: 9, quantity: 1 }),
    );
  });

  it('rechaza cuando no quedan entradas y la transacción no confirma', async () => {
    const { service, order } = setup({ capacity: 4, totalAfterCreate: 5 });

    await expect(service.reserve(3, 9, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Solo quedan 0 entradas',
    });
    expect(order).toEqual(['create', 'findPerformance', 'sumAll']);
  });

  it('rechaza una función que ya inició', async () => {
    const { service, order } = setup({ startsAt: new Date('2030-01-01T18:59:59.000Z') });

    await expect(service.reserve(3, 9, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'La función ya inició y no admite reservas',
    });
    expect(order).toEqual(['create', 'findPerformance']);
  });

  it('rechaza una función cancelada', async () => {
    const { service, order } = setup({ status: 'CANCELLED' });

    await expect(service.reserve(3, 9, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'La función está cancelada y no admite reservas',
    });
    expect(order).toEqual(['create', 'findPerformance']);
  });

  it('rechaza cuando la reserva supera el máximo de seis entradas por usuario', async () => {
    const { service, order } = setup({ totalAfterCreate: 7, mineAfterCreate: 7 });

    await expect(service.reserve(3, 9, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Máximo 6 entradas por persona y función',
    });
    expect(order).toEqual(['create', 'findPerformance', 'sumAll', 'sumUser']);
  });

  it('vuelve a intentar con otro código si hay una colisión única', async () => {
    const { client, repository } = setup();
    const create = vi.mocked(repository.create);
    create.mockRejectedValueOnce(Object.assign(new Error('unique'), { code: 'P2002' }));
    const service = createReservationsService(
      client,
      repository,
      fixedNow,
      vi.fn().mockReturnValueOnce('FAV-ABC234').mockReturnValueOnce('FAV-DEF567'),
      async () => {},
    );

    await expect(service.reserve(3, 9, 1)).resolves.toMatchObject({ code: 'FAV-ABC234' });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]?.[1].code).toBe('FAV-ABC234');
    expect(create.mock.calls[1]?.[1].code).toBe('FAV-DEF567');
  });

  it('traduce una función inexistente a 404', async () => {
    const { service, repository } = setup();
    vi.mocked(repository.create).mockRejectedValueOnce(Object.assign(new Error('foreign key'), { code: 'P2003' }));

    await expect(service.reserve(3, 999, 1)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
