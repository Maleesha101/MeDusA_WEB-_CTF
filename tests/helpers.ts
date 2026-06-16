import assert from 'node:assert/strict';
export { assert };
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiBaseUrl = process.env.MEDUSA_API_URL ?? 'http://localhost:4000';
const jwtSecret = process.env.JWT_SECRET ?? 'medusa-temple-secret-change-me';
const adminEmail = process.env.ADMIN_EMAIL ?? 'oracle@medusa.ctf';

export type TeamSession = {
  id: number;
  name: string;
  score: number;
  token: string;
};

export type RequestResult<T> = {
  response: Response;
  body: T | string | null;
  text: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload: Record<string, unknown>) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function signTeamSession(team: { id: number; name: string; score: number }) {
  return signJwt({ sub: String(team.id), name: team.name, score: team.score, role: 'team' });
}

export function signAdminSession() {
  return signJwt({ sub: adminEmail, name: 'Oracle', role: 'admin' });
}

export function expectedFlags() {
  const flagListPath = path.join(rootDirectory, 'docs', 'flag-list-internal.md');
  const contents = readFileSync(flagListPath, 'utf8');
  const matches = [...contents.matchAll(/Chamber\s+(\d+):\s+`([^`]+)`/g)];
  const flags = new Map<number, string>();

  for (const match of matches) {
    flags.set(Number(match[1]), match[2]);
  }

  assert.equal(flags.size, 7, 'Expected all seven internal chamber flags to be documented');
  return flags;
}

export async function requestJson<T = unknown>(pathName: string, init: RequestInit = {}): Promise<RequestResult<T>> {
  const headers = new Headers(init.headers ?? {});
  if (init.body != null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const response = await fetch(new URL(pathName, apiBaseUrl), {
    ...init,
    headers
  });

  const text = await response.text();
  let body: T | string | null = null;

  if (text.length > 0) {
    try {
      body = JSON.parse(text) as T;
    } catch {
      body = text;
    }
  }

  return { response, body, text };
}

export async function loginTeam(name: string, password: string): Promise<TeamSession> {
  const result = await requestJson<{ ok: true; team: { id: number; name: string; score: number } }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ name, password })
  });

  assert.equal(result.response.status, 200, `Login failed for ${name}: ${result.text}`);
  assert.ok(result.body && typeof result.body === 'object', `Expected a JSON response for ${name}`);

  const team = (result.body as { team: { id: number; name: string; score: number } }).team;
  return {
    ...team,
    token: signTeamSession(team)
  };
}

export function teamHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`
  };
}

export function teamCookieHeaders(token: string) {
  return {
    cookie: `medusa_session=${token}`
  };
}

export function adminHeaders() {
  return {
    'x-admin-token': signAdminSession()
  };
}

export async function assertAdminChambersIntact() {
  const response = await requestJson<{ chambers: Array<{ id: number; enabled: boolean; flag: string }> }>('/api/admin/chambers', {
    headers: adminHeaders()
  });

  assert.equal(response.response.status, 200, `Admin chamber catalog is unreachable: ${response.text}`);
  assert.ok(response.body && typeof response.body === 'object', 'Expected an admin chamber catalog response');

  const chambers = (response.body as { chambers: Array<{ id: number; enabled: boolean; flag: string }> }).chambers;
  const expected = expectedFlags();

  assert.equal(chambers.length, 7, 'Expected all seven chambers to remain present');

  for (const chamber of chambers) {
    assert.equal(chamber.enabled, true, `Chamber ${chamber.id} should remain enabled`);
    assert.equal(chamber.flag, expected.get(chamber.id), `Chamber ${chamber.id} flag drifted or was patched`);
  }
}