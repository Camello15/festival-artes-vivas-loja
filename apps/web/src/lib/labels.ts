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

export function disciplineLabel(value: string): string {
  return DISCIPLINES.find((d) => d.value === value)?.label ?? value;
}
