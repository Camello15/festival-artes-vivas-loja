export type Discipline = 'THEATER' | 'DANCE' | 'MUSIC' | 'CIRCUS' | 'STREET_ARTS';
export type ArtistKind = 'SOLOIST' | 'COMPANY';
export type AvailabilityStatus = 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT';
export type PerformanceStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  THEATER: 'Teatro',
  DANCE: 'Danza',
  MUSIC: 'Música',
  CIRCUS: 'Circo',
  STREET_ARTS: 'Artes de calle',
};

export const ARTIST_KIND_LABELS: Record<ArtistKind, string> = {
  SOLOIST: 'Solista',
  COMPANY: 'Compañía',
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Disponible',
  FEW_LEFT: 'Últimas entradas',
  SOLD_OUT: 'Agotado',
};

export function getDisciplineLabel(discipline: string): string {
  return DISCIPLINE_LABELS[discipline as Discipline] ?? discipline;
}

export function getArtistKindLabel(kind: string): string {
  return ARTIST_KIND_LABELS[kind as ArtistKind] ?? kind;
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  return AVAILABILITY_LABELS[status] ?? status;
}
