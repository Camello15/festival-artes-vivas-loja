// Textos en español para los valores enumerados de la API (principio V).
// El color de cada disciplina es informativo: identifica la disciplina en toda la interfaz.

export const DISCIPLINES = [
  { value: 'THEATER', label: 'Teatro', colorVar: '--color-theater' },
  { value: 'DANCE', label: 'Danza', colorVar: '--color-dance' },
  { value: 'MUSIC', label: 'Música', colorVar: '--color-music' },
  { value: 'CIRCUS', label: 'Circo', colorVar: '--color-circus' },
  { value: 'STREET_ARTS', label: 'Artes de calle', colorVar: '--color-street' },
] as const;

export type Discipline = (typeof DISCIPLINES)[number]['value'];
export type ArtistKind = 'SOLO' | 'COMPANY';
export type AvailabilityStatus = 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT';
export type PerformanceStatus = 'SCHEDULED' | 'CANCELLED';

export function disciplineLabel(value: string): string {
  return DISCIPLINES.find((d) => d.value === value)?.label ?? value;
}

export function disciplineColorVar(value: string): string {
  return DISCIPLINES.find((d) => d.value === value)?.colorVar ?? '--color-theater';
}

export const ARTIST_KIND_LABELS: Record<ArtistKind, string> = {
  SOLO: 'Solista',
  COMPANY: 'Compañía',
};

export function artistKindLabel(kind: string): string {
  return ARTIST_KIND_LABELS[kind as ArtistKind] ?? kind;
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Disponible',
  FEW_LEFT: 'Últimas entradas',
  SOLD_OUT: 'Agotado',
};

export function availabilityLabel(status: AvailabilityStatus): string {
  return AVAILABILITY_LABELS[status] ?? status;
}
