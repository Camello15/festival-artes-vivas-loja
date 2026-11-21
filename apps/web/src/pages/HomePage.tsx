import { Link } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { useFestivalSummary } from '../features/festival/useFestivalSummary';
import type { FestivalSummary } from '../features/festival/api';
import { formatDateRange } from '../lib/format';
import { DISCIPLINES } from '../lib/labels';

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function SummarySentence({ data }: { data: FestivalSummary }) {
  return (
    <p className="max-w-[34ch] text-xl leading-snug text-white/90 sm:text-2xl">
      {plural(data.events, 'obra', 'obras')}, {plural(data.performances, 'función', 'funciones')} y{' '}
      {plural(data.artists, 'artista o compañía', 'artistas y compañías')} en{' '}
      {plural(data.venues, 'escenario', 'escenarios')} de la ciudad.
    </p>
  );
}

const EXPLORE = [
  {
    to: '/cartelera',
    title: 'Cartelera',
    text: 'Todas las funciones por día. Filtra por disciplina y escenario, y reserva tu entrada.',
  },
  {
    to: '/artistas',
    title: 'Artistas y compañías',
    text: 'Quiénes llegan a Loja este año, de dónde vienen y qué presentan.',
  },
  {
    to: '/escenarios',
    title: 'Escenarios',
    text: 'Teatros, plazas y parques del festival, con dirección y mapa para llegar a tiempo.',
  },
];

export function HomePage() {
  const { state, retry } = useFestivalSummary();
  const data = state.status === 'success' ? state.data : null;

  return (
    <>
      {/* Hero: tratado como el afiche del festival */}
      <section aria-labelledby="titulo-festival" className="on-dark overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-end md:pt-16 md:pb-20">
          <h1 id="titulo-festival" className="font-black uppercase">
            <span className="block text-lg font-bold tracking-wide normal-case text-marigold sm:text-xl">
              Festival Internacional de
            </span>
            <span className="block text-[clamp(5rem,22vw,12.5rem)] leading-[0.82] tracking-tight">
              Artes
              <br />
              Vivas
            </span>
            <span className="mt-3 block text-[clamp(2.25rem,8vw,4.5rem)] leading-none text-white/90">
              Loja 2026
            </span>
          </h1>

          <div className="flex flex-col gap-6 md:pb-3">
            <div aria-hidden="true" className="h-1.5 w-24 bg-marigold" />
            {state.status === 'loading' && (
              <div className="text-white/80 [&_span]:border-white/30 [&_span]:border-t-marigold">
                <Spinner label="Cargando la programación…" />
              </div>
            )}
            {data && (
              <>
                {data.startsAt && data.endsAt && (
                  <p className="font-display text-4xl font-bold sm:text-5xl">
                    Del {formatDateRange(data.startsAt, data.endsAt)}
                  </p>
                )}
                <SummarySentence data={data} />
              </>
            )}
            {state.status === 'error' && (
              <div className="text-ink">
                <ErrorMessage message={state.message} onRetry={retry} />
              </div>
            )}
            <p>
              <Link
                to="/cartelera"
                className="inline-block rounded bg-marigold px-6 py-3 text-lg font-bold text-ink no-underline hover:bg-white"
              >
                Ver la cartelera
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Disciplinas: el color de cada una se mantiene en todo el sitio */}
      <section aria-labelledby="titulo-disciplinas" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h2 id="titulo-disciplinas" className="text-4xl font-black">
          Cinco lenguajes en escena
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {DISCIPLINES.map((d) => (
            <li key={d.value} className="last:col-span-2 sm:last:col-span-1">
              <Link
                to={`/cartelera?disciplina=${d.value}`}
                style={{ backgroundColor: `var(${d.colorVar})` }}
                className="flex min-h-24 items-end p-4 font-display text-3xl font-bold text-white no-underline hover:underline"
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Accesos principales */}
      <section aria-labelledby="titulo-explora" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="titulo-explora" className="text-4xl font-black">
          Explora el festival
        </h2>
        <ul className="mt-6 border-t border-line">
          {EXPLORE.map((item) => (
            <li key={item.to} className="border-b border-line">
              <Link
                to={item.to}
                className="group grid gap-1 py-6 text-ink no-underline md:grid-cols-[18rem_1fr] md:items-baseline md:gap-8"
              >
                <span className="font-display text-3xl font-bold group-hover:text-teal group-hover:underline">
                  {item.title}
                </span>
                <span className="max-w-prose text-muted">{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
