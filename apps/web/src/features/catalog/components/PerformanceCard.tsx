import { Link } from 'react-router';
import { formatTime } from '../../../lib/format';
import { disciplineColorVar, disciplineLabel } from '../../../lib/labels';
import type { PerformanceItem } from '../types';
import { AvailabilityBadge } from './AvailabilityBadge';

interface PerformanceCardProps {
  performance: PerformanceItem;
}

export function PerformanceCard({ performance }: PerformanceCardProps) {
  const { event, venue, startsAt, status, availability, availableSeats } = performance;
  const isCancelled = status === 'CANCELLED';

  return (
    <article
      className={`grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:p-5 ${
        isCancelled ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0.5">
        <time dateTime={startsAt} className="font-display text-2xl font-bold text-ink">
          {formatTime(startsAt)}
        </time>
        <span className="text-xs text-muted">{event.durationMinutes} min</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{ backgroundColor: `var(${disciplineColorVar(event.discipline)})` }}
            className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
          >
            {disciplineLabel(event.discipline)}
          </span>
          <Link
            to={`/escenarios/${venue.id}`}
            className="text-sm font-medium text-muted underline-offset-2 hover:text-teal hover:underline"
          >
            {venue.name}
          </Link>
        </div>

        <h3 className="font-display text-2xl font-bold leading-snug text-ink">
          <Link to={`/obras/${event.id}`} className="no-underline hover:text-teal hover:underline">
            {event.title}
          </Link>
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <AvailabilityBadge
          status={status}
          availability={availability}
          availableSeats={availableSeats}
        />
        <Link
          to={`/obras/${event.id}`}
          className="rounded border border-line px-3 py-1.5 text-sm font-bold text-ink no-underline hover:border-teal hover:text-teal"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
