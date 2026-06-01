# Deployment Guide

## Docker Deployment

Use the root compose file:

```bash
docker compose up --build
```

## Single VPS Notes

- Keep ports `80`, `3000`, `4000`, and `5433` available.
- Put production secrets in `.env`.
- Use a persistent Postgres volume.
- Run the stack behind Nginx.

## Production Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `APP_URL`
- `API_URL`
- `CORS_ORIGIN`
- `NODE_ENV=production`

## Startup Sequence

1. Postgres starts and loads `database/init.sql`.
2. Backend starts and serves `/api` plus internal routes.
3. Frontend starts and talks to the backend through Nginx.
4. Admin operators use the separate admin login.
