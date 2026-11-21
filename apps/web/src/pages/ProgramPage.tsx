import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getPerformanceFilters, getPerformances } from '../features/catalog/api';
import { Filters } from '../features/catalog/components/Filters';
import { PerformanceCard } from '../features/catalog/components/PerformanceCard';
import type {
  PerformanceFiltersResponse,
  PerformanceItem,
} from '../features/catalog/types';
import { ApiError } from '../lib/api';
import { FESTIVAL_TIME_ZONE, formatDay } from '../lib/format';
import { DISCIPLINES, type Discipline } from '../lib/labels';

const VALID_DISCIPLINES = new Set<string>(DISCIPLINES.map((d) => d.value));

const ecuDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FESTIVAL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toEcuadorDateKey(iso: string): string {
  return ecuDateKeyFormatter.format(new Date(iso));
}

function isValidDateParam(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

interface DayGroup {
  dateKey: string;
  label: string;
  items: PerformanceItem[];
}

export function ProgramPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawDate = searchParams.get('fecha') ?? '';
  const rawDiscipline = searchParams.get('disciplina') ?? '';
  const rawVenue = searchParams.get('escenario') ?? '';

  const { selectedDate, selectedDiscipline, selectedVenueId, invalidFilterNotice } = useMemo(() => {
    const warnings: string[] = [];

    let date = '';
    if (rawDate) {
      if (isValidDateParam(rawDate)) {
        date = rawDate;
      } else {
        warnings.push('fecha');
      }
    }

    let discipline = '';
    if (rawDiscipline) {
      if (VALID_DISCIPLINES.has(rawDiscipline)) {
        discipline = rawDiscipline;
      } else {
        warnings.push('disciplina');
      }
    }

    let venueId = '';
    if (rawVenue) {
      const parsed = Number(rawVenue);
      if (Number.isInteger(parsed) && parsed > 0) {
        venueId = String(parsed);
      } else {
        warnings.push('escenario');
      }
    }

    return {
      selectedDate: date,
      selectedDiscipline: discipline,
      selectedVenueId: venueId,
      invalidFilterNotice:
        warnings.length > 0
          ? `Se ignoró un filtro no válido en la dirección (${warnings.join(', ')}).`
          : '',
    };
  }, [rawDate, rawDiscipline, rawVenue]);

  const [filterOptions, setFilterOptions] = useState<PerformanceFiltersResponse>({
    dates: [],
    disciplines: DISCIPLINES.map((d) => d.value),
    venues: [],
  });
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPerformanceFilters()
      .then((opts) => {
        if (active) setFilterOptions(opts);
      })
      .catch(() => {
        // Si falla la carga de opciones, se mantienen las disciplinas por defecto
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPerformances({
      date: selectedDate || undefined,
      discipline: (selectedDiscipline as Discipline) || undefined,
      venueId: selectedVenueId ? Number(selectedVenueId) : undefined,
    })
      .then((items) => {
        if (!active) return;
        setPerformances(items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar la cartelera. Intenta de nuevo.';
        setError(message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, selectedDiscipline, selectedVenueId, reloadKey]);

  const updateParam = useCallback(
    (key: 'fecha' | 'disciplina' | 'escenario', value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const groupedByDay = useMemo(() => {
    const groups: DayGroup[] = [];
    const byKey = new Map<string, DayGroup>();

    for (const perf of performances) {
      const dateKey = toEcuadorDateKey(perf.startsAt);
      const existing = byKey.get(dateKey);
      if (existing) {
        existing.items.push(perf);
      } else {
        const group: DayGroup = {
          dateKey,
          label: formatDay(perf.startsAt),
          items: [perf],
        };
        byKey.set(dateKey, group);
        groups.push(group);
      }
    }
    return groups;
  }, [performances]);

  return (
    <section aria-labelledby="titulo-cartelera" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 id="titulo-cartelera" className="font-display text-4xl font-black text-ink sm:text-5xl">
          Cartelera
        </h1>
        <p className="mt-2 max-w-prose text-muted">
          Funciones programadas en hora de Ecuador (Loja). Filtra por fecha, disciplina o escenario.
        </p>
      </header>

      <Filters
        dates={filterOptions.dates}
        disciplines={filterOptions.disciplines}
        venues={filterOptions.venues}
        selectedDate={selectedDate}
        selectedDiscipline={selectedDiscipline}
        selectedVenueId={selectedVenueId}
        onChangeDate={(v) => updateParam('fecha', v)}
        onChangeDiscipline={(v) => updateParam('disciplina', v)}
        onChangeVenue={(v) => updateParam('escenario', v)}
        onClear={clearFilters}
      />

      {invalidFilterNotice && (
        <p
          role="status"
          className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
        >
          {invalidFilterNotice}
        </p>
      )}

      <div aria-live="polite" className="mt-6 text-sm font-medium text-muted">
        {!loading && !error && (
          <span>
            {performances.length === 1
              ? '1 función encontrada'
              : `${performances.length} funciones encontradas`}
          </span>
        )}
      </div>

      <div className="mt-4">
        {loading && <Spinner label="Cargando cartelera…" />}

        {!loading && error && (
          <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {!loading && !error && performances.length === 0 && (
          <div className="rounded-lg border border-line bg-white p-8 text-center">
            <p className="font-display text-2xl font-bold text-ink">
              No hay funciones con estos filtros
            </p>
            <p className="mt-1 text-sm text-muted">
              Prueba cambiando la fecha, disciplina o escenario seleccionado.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-teal"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {!loading && !error && groupedByDay.length > 0 && (
          <div className="space-y-10">
            {groupedByDay.map((group) => (
              <section key={group.dateKey} aria-labelledby={`dia-${group.dateKey}`}>
                <h2
                  id={`dia-${group.dateKey}`}
                  className="border-b-2 border-ink pb-2 font-display text-2xl font-bold capitalize text-ink sm:text-3xl"
                >
                  {group.label}
                </h2>
                <ul className="mt-4 space-y-3">
                  {group.items.map((perf) => (
                    <li key={perf.id}>
                      <PerformanceCard performance={perf} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
