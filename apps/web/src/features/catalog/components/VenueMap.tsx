interface VenueMapProps {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export function VenueMap({ name, address, latitude, longitude }: VenueMapProps) {
  const minLon = (longitude - 0.004).toFixed(6);
  const minLat = (latitude - 0.003).toFixed(6);
  const maxLon = (longitude + 0.004).toFixed(6);
  const maxLat = (latitude + 0.003).toFixed(6);

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${latitude},${longitude}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line bg-zinc-100">
        <iframe
          title={`Mapa de ubicación de ${name}`}
          src={embedUrl}
          loading="lazy"
          className="h-72 w-full border-0 sm:h-80"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted">
          <span className="font-bold text-ink">Dirección: </span>
          {address}
        </p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded bg-ink px-4 py-2 font-bold text-white no-underline hover:bg-teal"
        >
          Cómo llegar ↗
        </a>
      </div>
    </div>
  );
}
