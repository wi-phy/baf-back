# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Baf-music back-end: a NestJS 11 REST API using Prisma + PostgreSQL for persistence and JWT (Passport) for auth. **Bun** is the package manager and runtime (`bun.lock`, Dockerfile, and CI all use Bun); the npm `scripts` in `package.json` invoke the Nest/Jest CLIs but should be run via `bun run ...`.

## Common commands

```bash
bun install                  # install deps (CI uses --frozen-lockfile)
bun run start:dev            # run with watch (nest start --watch)
bun run start:debug          # watch + --debug
bun run build                # nest build -> dist/
bun run start:prod           # node dist/main (prod build)

bun run lint                 # eslint --fix over {src,apps,libs,test}
bun run format               # prettier --write

bun run test                 # jest unit tests (*.spec.ts under src/)
bun run test:watch
bun run test:cov
bun run test:e2e             # jest with test/jest-e2e.json
bun x jest path/to/file.spec.ts            # run a single test file
bun x jest -t "test name substring"        # run tests matching a name

# Prisma (run after schema changes)
bun x prisma generate                       # regenerate client (also runs in Docker build)
bun x prisma migrate dev --name <name>      # create + apply a migration locally
bun x prisma migrate deploy                 # apply migrations (CI does this on deploy)
bun x prisma studio                         # browse the DB
```

Local DB: `docker-compose up baf-music-db` brings up Postgres 18 (reads `DB_USER`/`DB_PASSWORD`/`DB_NAME`/`DB_PORT` from `.env`). `docker-compose up` runs the full app + DB.

## General rules

- Always use the built-in Grep, Glob, and Read tools instead of running their shell equivalents (grep, find, cat, sed) via Bash. Only fall back to Bash when there is no built-in tool for the task.

## Environment

Required vars (see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, and the `DB_*` vars used by docker-compose. `FRONTEND_URL` (CORS origin) and `PORT` (default 3000) are read at runtime in `main.ts`. The app boots with `ConfigModule.forRoot({ isGlobal: true })`, so config is injected via `ConfigService` rather than read from `process.env` directly (except in `main.ts`).

## Architecture

Feature-module structure under `src/`. Each feature module folds into `controllers/`, `services/`, and (for auth) `dtos/`, `strategy/`, `guard/` subfolders, each exposed through a barrel `index.ts` — import from the folder (`'../services'`), not the concrete file.

- **`PrismaModule`** (`src/prisma/`) is `@Global()`, so `PrismaService` is injectable everywhere without re-importing. `PrismaService extends PrismaClient` and pulls `DATABASE_URL` from `ConfigService`.
- **`UsersModule`** owns all DB access to the `User` table via `UsersService` and `exports` it. `AuthModule` depends on `UsersModule` for user lookups/creation — auth never touches Prisma for user CRUD directly (though `JwtStrategy` does query `user` directly to validate tokens).
- **`AuthModule`** handles sign-up/login. `AuthService` hashes passwords with bcrypt (salt rounds = 10), issues JWTs (`signToken`, 30m expiry, `sub` + `email` payload). `JwtStrategy` (key `'jwt'`) extracts the bearer token, verifies against `JWT_SECRET`, and resolves the user. Protect routes with `JwtAuthGuard` from `src/auth/guard`.

### Conventions

- All routes are prefixed with `/api` (`app.setGlobalPrefix('api')` in `main.ts`), so e.g. sign-up is `POST /api/auth/sign-up`.
- A global `ValidationPipe` runs with `whitelist`, `forbidNonWhitelisted`, and `transform` enabled — request bodies must be `class-validator`-decorated DTOs (see `src/auth/dtos/`), and unknown properties are rejected.
- Errors are surfaced as Nest HTTP exceptions: e.g. duplicate-email maps Prisma `P2002` -> `ForbiddenException` in `AuthService.signUp`.
- Tests are co-located `*.spec.ts` next to source. Jest `rootDir` is `src/`; e2e tests live in `test/` with a separate config.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`: build & push a Docker image to the Scaleway registry, run `prisma migrate deploy` against the production `DATABASE_URL`, then redeploy the Scaleway container. The multi-stage `Dockerfile` builds with Bun and ships a production image running `bun run dist/main.js` as the non-root `bun` user.
