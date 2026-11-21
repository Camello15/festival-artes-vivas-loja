export type AvailabilityStatus = 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT';

export interface AvailabilityResult {
  availableSeats: number;
  availability: AvailabilityStatus;
}

/**
 * Calcula disponibilidad y estado de entradas:
 * - availableSeats nunca es negativo
 * - SOLD_OUT si availableSeats === 0
 * - FEW_LEFT si availableSeats <= 10 % de capacity
 * - AVAILABLE en caso contrario
 */
export function computeAvailability(capacity: number, reserved: number): AvailabilityResult {
  const safeCapacity = Math.max(0, capacity);
  const safeReserved = Math.max(0, reserved);
  const availableSeats = Math.max(0, safeCapacity - safeReserved);

  if (availableSeats === 0) {
    return { availableSeats: 0, availability: 'SOLD_OUT' };
  }

  if (availableSeats <= safeCapacity * 0.1) {
    return { availableSeats, availability: 'FEW_LEFT' };
  }

  return { availableSeats, availability: 'AVAILABLE' };
}
