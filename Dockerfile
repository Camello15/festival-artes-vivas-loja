# Imagen de desarrollo compartida por los servicios "api" y "web" (opcional).
# El camino principal sigue siendo `npm run dev` sin Docker (ver README).
FROM node:22-slim

# Prisma necesita OpenSSL en tiempo de ejecución.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Primero solo los manifiestos y el esquema para aprovechar la caché de capas.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/api/prisma apps/api/prisma
RUN npm ci

COPY . .
