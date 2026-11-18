// Formateo de fechas en la zona horaria del festival (Ecuador, UTC-5).
// La API siempre envía fechas en UTC (ISO 8601).

export const FESTIVAL_TIME_ZONE = 'America/Guayaquil';

const dayFormatter = new Intl.DateTimeFormat('es-EC', {
  timeZone: FESTIVAL_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('es-EC', {
  timeZone: FESTIVAL_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dayNumberFormatter = new Intl.DateTimeFormat('es-EC', { timeZone: FESTIVAL_TIME_ZONE, day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('es-EC', { timeZone: FESTIVAL_TIME_ZONE, month: 'long' });

/** "sábado, 21 de noviembre" */
export function formatDay(iso: string): string {
  return dayFormatter.format(new Date(iso));
}

/** "19:30" */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** "20 al 28 de noviembre" (o "28 de noviembre al 2 de diciembre" si cambia el mes) */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMonth = monthFormatter.format(start);
  const endMonth = monthFormatter.format(end);
  const startDay = dayNumberFormatter.format(start);
  const endDay = dayNumberFormatter.format(end);
  return startMonth === endMonth
    ? `${startDay} al ${endDay} de ${endMonth}`
    : `${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
}
