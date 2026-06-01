# Setup Guide

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

## Steps

1. Copy `.env.example` to `.env`.
2. Review the admin credentials in `.env`.
3. Install dependencies with `npm install` from the `medusa/` directory.
4. Start Postgres with `docker compose up -d postgres`.
5. Seed the database with `npm run seed`.
6. Start the rest of the stack with `docker compose up --build`.

## Default Services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Nginx: `http://localhost`
- Postgres: `localhost:5433`

## Operational Notes

- The backend reads `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `CORS_ORIGIN`.
- The frontend reads `NEXT_PUBLIC_API_URL`.
- The default CTF flow assumes all teams use the same static flags.
