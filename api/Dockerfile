# Harizeon control plane (Fastify, TypeScript).
# Runs the TS source via tsx — the app uses ESNext module resolution with
# extension-less imports, so a tsc build would break Node ESM import paths.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# HARIZEON_MASTER_KEY / DATABASE_URL / REDIS_URL are required at runtime; the
# server fails fast at boot if they are missing (config.ts).
CMD ["npm", "run", "start"]
