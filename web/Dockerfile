# Next.js console (standalone output). Built from the repo root because `web/`
# is a workspace member and shares the root lock file; the standalone output
# nests the app under `web/` for the same reason.
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY web ./web
RUN npm ci

# The /api/v1 -> control-plane rewrite destination is baked at build time.
ARG HARIZEON_API_BASE=http://api:8080
ENV HARIZEON_API_BASE=$HARIZEON_API_BASE
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace web

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# The standalone bundle nests the workspace app under web/ (web/server.js) with
# hoisted node_modules at the top. Copy static assets next to that entrypoint.
COPY --from=build /app/web/.next/standalone ./
COPY --from=build /app/web/.next/static ./web/.next/static
COPY --from=build /app/web/public ./web/public

WORKDIR /app/web
EXPOSE 3000
CMD ["node", "server.js"]
