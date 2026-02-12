# Utilisation d'une base commune pour alléger les layers
FROM oven/bun:1.3.9 AS base
WORKDIR /app

# 1. Install dependencies into temp directory
FROM base AS install

RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# 2. Prerelease (Builder) - Build the app
FROM base AS prerelease

COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Generate Prisma & Build
RUN bun x prisma generate
RUN bun run build

# 3. Release (Production) - Create the final image
FROM base AS release

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/dist dist
COPY --from=prerelease /app/package.json .

# Copy Prisma specific files (the generated client)
COPY --from=prerelease /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prerelease /app/node_modules/@prisma ./node_modules/@prisma

# Run the app as non-root user
USER bun
EXPOSE 3000
CMD ["bun", "run", "dist/main.js"]