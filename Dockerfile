FROM --platform=$BUILDPLATFORM oven/bun:1-slim AS deps

WORKDIR /app

COPY package.json ./
COPY packages/client/package.json packages/client/package.json
COPY packages/server/package.json packages/server/package.json

RUN bun install

FROM deps AS build

WORKDIR /app

COPY . .

RUN bun run build

FROM oven/bun:1-slim AS prod-deps

WORKDIR /app

COPY package.json ./
COPY packages/client/package.json packages/client/package.json
COPY packages/server/package.json packages/server/package.json

RUN bun install --production --no-lockfile

FROM oven/bun:1-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV STATIC=out
ENV PORT=8080

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/out ./out
COPY package.json ./

EXPOSE 8080

USER bun

CMD ["bun", "packages/server/dist/main.js"]
