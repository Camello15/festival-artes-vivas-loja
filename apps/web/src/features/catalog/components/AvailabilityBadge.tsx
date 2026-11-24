import {
  availabilityLabel,
  type AvailabilityStatus,
  type PerformanceStatus,
} from '../../../lib/labels';

interface AvailabilityBadgeProps {
  status: PerformanceStatus;
  availability: AvailabilityStatus;
  availableSeats: number;
}

const STYLES_BY_AVAILABILITY: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  FEW_LEFT: 'bg-amber-100 text-amber-950 border-amber-300',
  SOLD_OUT: 'bg-zinc-200 text-zinc-800 border-zinc-300',
};

export function AvailabilityBadge({
  status,
  availability,
  availableSeats,
}: AvailabilityBadgeProps) {
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center rounded border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-red-900">
        Cancelada
      </span>
    );
  }

  const label = availabilityLabel(availability);
  const title =
    availability === 'SOLD_OUT'
      ? 'Sin entradas disponibles'
      : `${availableSeats} ${availableSeats === 1 ? 'entrada disponible' : 'entradas disponibles'}`;

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-bold ${STYLES_BY_AVAILABILITY[availability]}`}
    >
      {label}
    </span>
  );
}
