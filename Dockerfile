# syntax=docker/dockerfile:1

# Bun instala las dependencias y ejecuta los scripts; Node (entorno oficial de
# React Router) sirve la aplicación. Ambas imágenes son Alpine, así que los
# binarios nativos (sharp, argon2) coinciden entre etapas.
FROM oven/bun:1-alpine AS bun

# 1) Dependencias completas para compilar
FROM node:24-alpine AS deps
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) Solo dependencias de producción
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# 3) Compilación
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# 4) Imagen final
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_DIR=/app/storage

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock tsconfig.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
# Migraciones y scripts (migrate/seed) para poder ejecutarlos dentro del contenedor
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY app ./app

RUN mkdir -p /app/storage && chown -R node:node /app/storage
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["sh", "-c", "bun run db:migrate && bun run start"]
