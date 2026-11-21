import { formatDay } from '../../../lib/format';
import { disciplineLabel, type Discipline } from '../../../lib/labels';
import type { VenueSummary } from '../types';

interface FiltersProps {
  dates: string[];
  disciplines: Discipline[];
  venues: VenueSummary[];
  selectedDate: string;
  selectedDiscipline: string;
  selectedVenueId: string;
  onChangeDate: (value: string) => void;
  onChangeDiscipline: (value: string) => void;
  onChangeVenue: (value: string) => void;
  onClear: () => void;
}

export function Filters({
  dates,
  disciplines,
  venues,
  selectedDate,
  selectedDiscipline,
  selectedVenueId,
  onChangeDate,
  onChangeDiscipline,
  onChangeVenue,
  onClear,
}: FiltersProps) {
  const hasActiveFilters = Boolean(selectedDate || selectedDiscipline || selectedVenueId);

  return (
    <form
      aria-label="Filtrar cartelera"
      onSubmit={(e) => e.preventDefault()}
      className="rounded-lg border border-line bg-white p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-fecha" className="text-sm font-bold text-ink">
            Fecha
          </label>
          <select
            id="filtro-fecha"
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="rounded border border-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          >
            <option value="">Todas las fechas</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDay(`${d}T12:00:00.000Z`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-disciplina" className="text-sm font-bold text-ink">
            Disciplina
          </label>
          <select
            id="filtro-disciplina"
            value={selectedDiscipline}
            onChange={(e) => onChangeDiscipline(e.target.value)}
            className="rounded border border-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          >
            <option value="">Todas las disciplinas</option>
            {disciplines.map((disc) => (
              <option key={disc} value={disc}>
                {disciplineLabel(disc)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-escenario" className="text-sm font-bold text-ink">
            Escenario
          </label>
          <select
            id="filtro-escenario"
            value={selectedVenueId}
            onChange={(e) => onChangeVenue(e.target.value)}
            className="rounded border border-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          >
            <option value="">Todos los escenarios</option>
            {venues.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="w-full rounded border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </form>
  );
}
