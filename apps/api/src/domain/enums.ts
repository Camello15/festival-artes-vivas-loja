// Valores enumerados del dominio. En la base de datos se guardan como texto
// (ver ADR-0003); estas constantes son la única fuente de verdad en el código.

export const Role = {
  PUBLIC: 'PUBLIC',
  ARTIST: 'ARTIST',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Discipline = {
  THEATER: 'THEATER',
  DANCE: 'DANCE',
  MUSIC: 'MUSIC',
  CIRCUS: 'CIRCUS',
  STREET_ARTS: 'STREET_ARTS',
} as const;
export type Discipline = (typeof Discipline)[keyof typeof Discipline];

export const ArtistKind = {
  SOLO: 'SOLO',
  COMPANY: 'COMPANY',
} as const;
export type ArtistKind = (typeof ArtistKind)[keyof typeof ArtistKind];

export const PerformanceStatus = {
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;
export type PerformanceStatus = (typeof PerformanceStatus)[keyof typeof PerformanceStatus];

export const ReservationStatus = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

/** Útil para validar con Zod: z.enum(enumValues(Discipline)) */
export function enumValues<T extends Record<string, string>>(obj: T): [T[keyof T], ...T[keyof T][]] {
  return Object.values(obj) as [T[keyof T], ...T[keyof T][]];
}
