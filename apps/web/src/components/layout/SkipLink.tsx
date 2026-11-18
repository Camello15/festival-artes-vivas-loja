// Primer elemento enfocable de la página: permite saltar la navegación con el teclado.
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-marigold focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
    >
      Saltar al contenido
    </a>
  );
}
