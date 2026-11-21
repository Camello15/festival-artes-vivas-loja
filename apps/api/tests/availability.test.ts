import { describe, expect, it } from 'vitest';
import { computeAvailability } from '../src/modules/performances/availability';

describe('computeAvailability', () => {
  it('devuelve AVAILABLE cuando quedan más del 10 % de entradas', () => {
    expect(computeAvailability(100, 89)).toEqual({
      availableSeats: 11,
      availability: 'AVAILABLE',
    });
  });

  it('devuelve FEW_LEFT exactamente en el límite del 10 %', () => {
    expect(computeAvailability(100, 90)).toEqual({
      availableSeats: 10,
      availability: 'FEW_LEFT',
    });
    expect(computeAvailability(450, 405)).toEqual({
      availableSeats: 45,
      availability: 'FEW_LEFT',
    });
  });

  it('devuelve SOLD_OUT cuando no quedan asientos disponibles', () => {
    expect(computeAvailability(100, 100)).toEqual({
      availableSeats: 0,
      availability: 'SOLD_OUT',
    });
  });

  it('nunca devuelve asientos disponibles negativos si las reservas superan la capacidad', () => {
    expect(computeAvailability(50, 55)).toEqual({
      availableSeats: 0,
      availability: 'SOLD_OUT',
    });
  });
});
