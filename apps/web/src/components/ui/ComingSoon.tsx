import { Link } from 'react-router';

const SPECS = {
  2: { name: 'Cartelera y detalle', owner: 'Cristina Feijo', folder: '002-cartelera' },
  3: { name: 'Reservas y administración', owner: 'Bryan Villa', folder: '003-reservas' },
} as const;

interface ComingSoonProps {
  title: string;
  description: string;
  spec: keyof typeof SPECS;
}

// Marcador para las pantallas que construyen los Specs #2 y #3.
export function ComingSoon({ title, description, spec }: ComingSoonProps) {
  const info = SPECS[spec];
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-5xl font-black sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-prose text-lg">{description}</p>
      <div className="mt-8 border-l-4 border-marigold bg-white px-5 py-4">
        <p className="font-bold">Próximamente</p>
        <p className="text-muted">
          Esta sección se construye en el Spec #{spec}, {info.name}, a cargo de {info.owner}. Su
          especificación está en <code>specs/{info.folder}/</code>.
        </p>
      </div>
      <p className="mt-8">
        <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  );
}
