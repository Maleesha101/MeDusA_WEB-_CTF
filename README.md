# MEDUSA: The Forbidden Temple

A single-app, team-based CTF platform built as an immersive web world with seven interconnected chambers, an admin dashboard, static flags, and a full Docker deployment stack.

## Architecture

- Frontend: Next.js App Router + React + TypeScript + TailwindCSS + Framer Motion
- Backend: Node.js + Express + REST API
- Database: PostgreSQL
- Deployment: Docker, Docker Compose, Nginx reverse proxy

## Workspace Layout

- `frontend/` - Next.js player and admin UI
- `backend/` - Express API and chamber logic
- `database/` - PostgreSQL schema and seed data
- `docker/` - Dockerfiles and Nginx config
- `docs/` - setup, deployment, player, admin, and organizer docs

## Local Setup

1. Copy `.env.example` to `.env` and adjust secrets if needed.
2. Run `npm install` from the `medusa/` directory.
3. Start Postgres with `docker compose up -d postgres`.
4. Seed the database: `npm run seed`.
5. Start the stack with `docker compose up --build`.

## Test Accounts

The seed script inserts these teams:

- `Aegis` / `team-aegis`
- `Hydra` / `team-hydra`
- `Orion` / `team-orion`
- `Helios` / `team-helios`

## Key Routes

- `/` landing
- `/login` team login
- `/dashboard` temple map
- `/chamber/[id]` chamber detail
- `/admin` admin console
- `/api/login`
- `/api/chambers`
- `/api/chamber/:id`
- `/api/submit-flag`
- `/api/scoreboard`
- `/api/hints`
- `/api/admin/*`

## Notes

- Flags are static and seeded into Postgres.
- Solves are unique per team/chamber.
- The challenge endpoints intentionally contain exploitable weaknesses for the CTF.
