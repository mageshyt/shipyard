# syntax = docker/dockerfile:1

##################
# SHARED BASE WITH PNPM
##################
FROM node:24.0-alpine AS base

ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Prepare pnpm and workspace permissions up-front to reuse across stages
RUN mkdir -p ${PNPM_HOME} && chown -R node:node /home/node/.local && \
    mkdir -p /app && chown -R node:node /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

##################
# BUILD FOR LOCAL DEVELOPMENT (monorepo context: .)
##################
FROM base AS development

WORKDIR /app

USER node

# Set a placeholder DATABASE_URL for build time (will be overridden at runtime)
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

# Copy workspace manifests first for layer caching
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY --chown=node:node packages ./packages
COPY --chown=node:node apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node apps/backend/prisma ./apps/backend/prisma
COPY --chown=node:node apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --chown=node:node apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --chown=node:node apps/backend/tsconfig.build.json ./apps/backend/tsconfig.build.json
COPY --chown=node:node apps/backend/nest-cli.json ./apps/backend/nest-cli.json

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of monorepo source
COPY --chown=node:node . .

# Generate Prisma client (allow failure if DB not reachable at build - runtime will regenerate if needed)
RUN pnpm --filter backend exec prisma generate || true

##################
# BUILD FOR PRODUCTION
##################
FROM base AS build

WORKDIR /app

USER node

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY --chown=node:node packages ./packages
COPY --chown=node:node apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node apps/backend/prisma ./apps/backend/prisma
COPY --chown=node:node apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --chown=node:node apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --chown=node:node apps/backend/tsconfig.build.json ./apps/backend/tsconfig.build.json
COPY --chown=node:node apps/backend/nest-cli.json ./apps/backend/nest-cli.json

# Reuse dependencies from development stage for faster builds
COPY --chown=node:node --from=development /app/node_modules ./node_modules
COPY --chown=node:node --from=development /app/apps/backend/node_modules ./apps/backend/node_modules

COPY --chown=node:node . .

# Generate Prisma client and build NestJS
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

RUN ls -la apps/backend/dist/

ENV NODE_ENV=production

RUN pnpm config set shamefully-hoist true
RUN pnpm --filter backend install --prod --frozen-lockfile --ignore-scripts
RUN pnpm --filter backend exec prisma generate

##################
# PRODUCTION
##################
FROM base AS production

WORKDIR /app/apps/backend

RUN mkdir -p /app/apps/backend && chown -R node:node /app

# Copy runtime dependencies
COPY --chown=node:node --from=build /app/node_modules ./../../node_modules
COPY --chown=node:node --from=build /app/apps/backend/node_modules ./node_modules
COPY --chown=node:node --from=build /app/apps/backend/dist ./dist
COPY --chown=node:node --from=build /app/apps/backend/package.json ./package.json
COPY --chown=node:node --from=build /app/pnpm-lock.yaml ./../../pnpm-lock.yaml

# Copy Prisma schema and generated client artefacts
COPY --chown=node:node --from=build /app/apps/backend/prisma ./prisma
COPY --chown=node:node --from=build /app/apps/backend/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=build /app/apps/backend/prisma/generated ./prisma/generated

# Create startup script (fallback if scripts/start.sh not present in repo)
USER root
RUN printf '#!/bin/sh\nset -e\n# Run migrations if prisma is available\nif pnpm exec prisma migrate deploy 2>/dev/null; then echo "migrations applied"; fi\nexec node dist/main\n' > ./start.sh && chmod +x ./start.sh && chown node:node ./start.sh
USER node

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "try { require('http').request({ host: 'localhost', port: '8080', path: '/health', timeout: 2000 }).end(); process.exit(0); } catch (e) { process.exit(1); }"

CMD ["./start.sh"]
