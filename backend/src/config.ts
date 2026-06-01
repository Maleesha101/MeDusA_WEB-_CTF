import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function resolveDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const runningInDocker = fs.existsSync('/.dockerenv');

    if (!runningInDocker && url.hostname === 'postgres') {
      url.hostname = 'localhost';
      url.port = '5433';
      return url.toString();
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: resolveDatabaseUrl(process.env.DATABASE_URL ?? 'postgres://medusa:medusa@localhost:5432/medusa'),
  jwtSecret: process.env.JWT_SECRET ?? 'medusa-temple-secret-change-me',
  adminEmail: process.env.ADMIN_EMAIL ?? 'oracle@medusa.ctf',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me-now',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV ?? 'development'
};
