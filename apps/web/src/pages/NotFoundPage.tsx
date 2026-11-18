import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <p className="font-display text-8xl font-black text-line" aria-hidden="true">
        404
      </p>
      <h1 className="mt-2 text-5xl font-black">Esta página no está en la programación</h1>
      <p className="mt-4 text-lg">Revisa la dirección o vuelve al inicio para encontrar las funciones.</p>
      <p className="mt-8">
        <Link to="/" className="inline-block rounded bg-ink px-5 py-2.5 font-bold text-white no-underline">
          Ir al inicio
        </Link>
      </p>
    </section>
  );
}
