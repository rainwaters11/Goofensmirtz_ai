FROM node:20-slim

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace manifests and lockfile first so Docker can cache the
# dependency-install layer independently of source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy every package/app manifest (needed for pnpm workspace linking)
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/personas/package.json ./packages/personas/package.json
COPY packages/toon/package.json ./packages/toon/package.json
COPY packages/video/package.json ./packages/video/package.json

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY apps/ ./apps/
COPY packages/ ./packages/

# Build every package in dependency order (turbo respects "dependsOn": ["^build"])
RUN pnpm turbo run build

CMD ["pnpm", "--filter", "@pet-pov/web", "start"]
