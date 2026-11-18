/**
 * Datos de ejemplo del festival (idempotente: borra y vuelve a crear todo).
 *
 * - Escenarios: lugares reales de Loja con coordenadas aproximadas.
 * - Artistas y obras: FICTICIOS, creados solo para el prototipo.
 * - Usuarios (contraseña "festival2026"):
 *     admin@festival.ec    (ADMIN)
 *     artista@festival.ec  (ARTIST, vinculado a "Compañía Danza Raíces")
 *     publico@festival.ec  (PUBLIC)
 *
 * Las fechas se generan a partir de SEED_FESTIVAL_START (por defecto 2026-11-20)
 * en hora de Ecuador (UTC-5) y se guardan en UTC.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FESTIVAL_START = process.env.SEED_FESTIVAL_START ?? '2026-11-20';
const SEED_PASSWORD = 'festival2026';
const ECUADOR_UTC_OFFSET_HOURS = 5;

/** Convierte "día N del festival a las HH:MM (hora de Ecuador)" en una fecha UTC. */
function ecuadorDate(dayOffset: number, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(`${FESTIVAL_START}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hours + ECUADOR_UTC_OFFSET_HOURS, minutes, 0, 0);
  return date;
}

async function reset() {
  // Orden inverso a las dependencias.
  await prisma.reservation.deleteMany();
  await prisma.performance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();
  // Reinicia los autoincrementales para que los ids sean estables entre ejecuciones.
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence');
}

async function main() {
  await reset();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ---------- Usuarios ----------
  const admin = await prisma.user.create({
    data: { name: 'Administración del Festival', email: 'admin@festival.ec', passwordHash, role: 'ADMIN' },
  });
  const artistUser = await prisma.user.create({
    data: { name: 'Lucía Paredes', email: 'artista@festival.ec', passwordHash, role: 'ARTIST' },
  });
  const publicUser = await prisma.user.create({
    data: { name: 'Andrés Jaramillo', email: 'publico@festival.ec', passwordHash, role: 'PUBLIC' },
  });

  // ---------- Escenarios ----------
  const venueData = [
    {
      name: 'Teatro Nacional Benjamín Carrión',
      address: 'Av. Universitaria y Mercadillo, Loja',
      latitude: -3.9994,
      longitude: -79.2046,
      capacity: 450,
      description: 'Sala principal de la Casa de la Cultura, Núcleo de Loja. Escenario a la italiana.',
    },
    {
      name: 'Teatro Bolívar',
      address: 'Calle Bolívar y Rocafuerte, Loja',
      latitude: -3.9961,
      longitude: -79.2018,
      capacity: 300,
      description: 'Teatro patrimonial del centro histórico.',
    },
    {
      name: 'Plaza de San Sebastián',
      address: 'Plaza de San Sebastián, calle Bernardo Valdivieso, Loja',
      latitude: -4.0013,
      longitude: -79.2009,
      capacity: 1500,
      description: 'Plaza al aire libre junto a la torre del reloj. Funciones de calle y circo.',
    },
    {
      name: 'Parque Recreacional Jipiro',
      address: 'Av. Salvador Bustamante Celi, Loja',
      latitude: -3.9735,
      longitude: -79.2008,
      capacity: 2000,
      description: 'Gran espacio abierto para conciertos y espectáculos masivos.',
    },
    {
      name: 'Puerta de la Ciudad',
      address: 'Av. Gran Colombia y Av. Universitaria, Loja',
      latitude: -3.9890,
      longitude: -79.2043,
      capacity: 500,
      description: 'Explanada frente al ícono arquitectónico de Loja.',
    },
    {
      name: 'Parque Central de Loja',
      address: 'Calles Bolívar, 10 de Agosto, Sucre y José Antonio Eguiguren, Loja',
      latitude: -3.9965,
      longitude: -79.2015,
      capacity: 800,
      description: 'Corazón del centro histórico, frente a la Catedral.',
    },
  ];
  const venues = [];
  for (const data of venueData) venues.push(await prisma.venue.create({ data }));
  const [benjamin, bolivar, sanSebastian, jipiro, puerta, parqueCentral] = venues;

  // ---------- Artistas y compañías (ficticios) ----------
  const artistData = [
    {
      name: 'Compañía Danza Raíces',
      kind: 'COMPANY',
      country: 'Ecuador',
      bio: 'Colectivo lojano que fusiona la danza contemporánea con ritmos tradicionales andinos.',
      userId: artistUser.id,
    },
    { name: 'Colectivo Teatro del Sur', kind: 'COMPANY', country: 'Ecuador', bio: 'Teatro de creación colectiva sobre memoria e identidad del sur del Ecuador.' },
    { name: 'Circo Andante', kind: 'COMPANY', country: 'Argentina', bio: 'Circo contemporáneo itinerante: acrobacia, malabares y clown.' },
    { name: 'Ensamble de Cámara Andino', kind: 'COMPANY', country: 'Ecuador', bio: 'Ensamble que reinterpreta música académica y popular andina.' },
    { name: 'La Máscara Errante', kind: 'COMPANY', country: 'Colombia', bio: 'Teatro de máscaras y objetos para todo público.' },
    { name: 'Valeria Quispe', kind: 'SOLO', country: 'Perú', bio: 'Cantautora y multiinstrumentista de música andina contemporánea.' },
    { name: 'Les Funambules du Vent', kind: 'COMPANY', country: 'Francia', bio: 'Compañía de artes de calle y equilibrio en altura.' },
    { name: 'Pasacalle Lojano', kind: 'COMPANY', country: 'Ecuador', bio: 'Banda de pueblo y comparsa que recorre las calles del centro histórico.' },
  ];
  const artists = [];
  for (const data of artistData) artists.push(await prisma.artist.create({ data }));
  const [raices, teatroSur, circoAndante, ensamble, mascara, valeria, funambules, pasacalle] = artists;

  // ---------- Obras ----------
  const eventData = [
    {
      title: 'Raíces',
      discipline: 'DANCE',
      synopsis: 'Un viaje coreográfico por la memoria de los pueblos del sur andino, entre el sanjuanito y la danza contemporánea.',
      durationMinutes: 70,
      ageRating: 'Todo público',
      artists: [raices],
    },
    {
      title: 'La casa de los relojes',
      discipline: 'THEATER',
      synopsis: 'Tres generaciones de una familia lojana se reencuentran en una casa donde el tiempo se detuvo.',
      durationMinutes: 90,
      ageRating: '+12',
      artists: [teatroSur],
    },
    {
      title: 'Gravedad cero',
      discipline: 'CIRCUS',
      synopsis: 'Acróbatas y malabaristas desafían la gravedad en un espectáculo de circo contemporáneo.',
      durationMinutes: 60,
      ageRating: 'Todo público',
      artists: [circoAndante],
    },
    {
      title: 'Concierto de los Andes',
      discipline: 'MUSIC',
      synopsis: 'Repertorio de compositores ecuatorianos y peruanos con la participación especial de Valeria Quispe.',
      durationMinutes: 80,
      ageRating: 'Todo público',
      artists: [ensamble, valeria],
    },
    {
      title: 'Máscaras del viento',
      discipline: 'THEATER',
      synopsis: 'Teatro de máscaras sin palabras sobre un pueblo que pierde y recupera su voz.',
      durationMinutes: 55,
      ageRating: '+6',
      artists: [mascara],
    },
    {
      title: 'Voz de la montaña',
      discipline: 'MUSIC',
      synopsis: 'Concierto íntimo de canciones originales en español y quechua.',
      durationMinutes: 60,
      ageRating: 'Todo público',
      artists: [valeria],
    },
    {
      title: 'Equilibrios',
      discipline: 'STREET_ARTS',
      synopsis: 'Funambulistas cruzan la plaza sobre un cable a diez metros de altura.',
      durationMinutes: 45,
      ageRating: 'Todo público',
      artists: [funambules],
    },
    {
      title: 'Pasacalle inaugural',
      discipline: 'STREET_ARTS',
      synopsis: 'Desfile festivo de bandas, zancos y comparsas que inaugura el festival.',
      durationMinutes: 90,
      ageRating: 'Todo público',
      artists: [pasacalle, circoAndante],
    },
    {
      title: 'Cuerpos en tránsito',
      discipline: 'DANCE',
      synopsis: 'Coproducción sobre la migración: cuerpos que se van y regresan.',
      durationMinutes: 65,
      ageRating: '+12',
      artists: [raices, mascara],
    },
  ];
  const events: Record<string, { id: number }> = {};
  for (const { artists: eventArtists, ...data } of eventData) {
    events[data.title] = await prisma.event.create({
      data: { ...data, artists: { connect: eventArtists.map((a) => ({ id: a.id })) } },
    });
  }

  // ---------- Funciones ----------
  // [obra, escenario, día del festival (0 = primer día), hora local, aforo opcional]
  const schedule: Array<[string, { id: number; capacity: number }, number, string, number?]> = [
    ['Pasacalle inaugural', parqueCentral, 0, '16:00'],
    ['Raíces', benjamin, 0, '19:30'],
    ['La casa de los relojes', bolivar, 1, '19:00'],
    ['Gravedad cero', sanSebastian, 1, '17:00', 1200],
    ['Concierto de los Andes', benjamin, 2, '20:00'],
    ['Máscaras del viento', bolivar, 2, '11:00', 250],
    ['Equilibrios', sanSebastian, 3, '16:30'],
    ['Raíces', benjamin, 3, '19:30'],
    ['Voz de la montaña', puerta, 4, '18:00', 400],
    ['Cuerpos en tránsito', bolivar, 4, '20:00'],
    ['Gravedad cero', jipiro, 5, '16:00', 1800],
    ['La casa de los relojes', bolivar, 5, '19:00'],
    ['Máscaras del viento', puerta, 6, '11:00', 300],
    ['Concierto de los Andes', jipiro, 6, '19:00'],
    ['Equilibrios', parqueCentral, 7, '17:00'],
    ['Cuerpos en tránsito', benjamin, 7, '20:00'],
    ['Voz de la montaña', bolivar, 8, '18:30'],
    ['Raíces', jipiro, 8, '19:00', 1500],
  ];
  const performances = [];
  for (const [title, venue, day, time, capacity] of schedule) {
    performances.push(
      await prisma.performance.create({
        data: {
          eventId: events[title].id,
          venueId: venue.id,
          startsAt: ecuadorDate(day, time),
          capacity: capacity ?? venue.capacity,
        },
      }),
    );
  }

  // ---------- Reservas de ejemplo ----------
  await prisma.reservation.createMany({
    data: [
      { code: 'FAV-DEMO01', userId: publicUser.id, performanceId: performances[1].id, quantity: 2 },
      { code: 'FAV-DEMO02', userId: publicUser.id, performanceId: performances[4].id, quantity: 4 },
    ],
  });

  console.info(
    `Seed completado: ${venues.length} escenarios, ${artists.length} artistas, ` +
      `${eventData.length} obras, ${performances.length} funciones, 3 usuarios (admin #${admin.id}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
