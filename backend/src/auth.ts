import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { pool, type DbTeam } from './db.js';

export type AuthTeam = {
  id: number;
  name: string;
  score: number;
  role: 'team' | 'admin';
};

export async function findTeamByName(name: string) {
  const result = await pool.query<DbTeam>('SELECT id, name, password_hash, score FROM teams WHERE name = $1', [name]);
  return result.rows[0] ?? null;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signTeamToken(team: { id: number; name: string; score: number }) {
  return jwt.sign({ sub: String(team.id), name: team.name, score: team.score, role: 'team' }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '8h'
  });
}

export function signAdminToken(adminEmail: string) {
  return jwt.sign({ sub: adminEmail, name: 'Oracle', role: 'admin' }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '8h'
  });
}

export function issueCookies(res: Response, token: string, adminToken?: string) {
  res.cookie('medusa_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 8 * 60 * 60 * 1000
  });

  if (adminToken) {
    res.cookie('medusa_admin', adminToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });
  }
}

export function readTeamToken(req: Request) {
  return req.cookies.medusa_session ?? req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? null;
}

export function readAdminToken(req: Request) {
  return req.cookies.medusa_admin ?? req.headers['x-admin-token'] ?? null;
}

export async function authenticateTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readTeamToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing session' });
      return;
    }

    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    const id = Number(payload.sub);
    if (!id || payload.role !== 'team') {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    const result = await pool.query<DbTeam>('SELECT id, name, password_hash, score FROM teams WHERE id = $1', [id]);
    const team = result.rows[0];
    if (!team) {
      res.status(401).json({ error: 'Unknown team' });
      return;
    }

    req.team = { id: team.id, name: team.name, score: team.score, role: 'team' };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readAdminToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing admin session' });
      return;
    }

    const payload = jwt.verify(String(token), config.jwtSecret) as jwt.JwtPayload;
    if (payload.role !== 'admin' || payload.sub !== config.adminEmail) {
      res.status(401).json({ error: 'Invalid admin session' });
      return;
    }

    req.team = { id: 0, name: 'Oracle', score: 0, role: 'admin' };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid admin session' });
  }
}

declare global {
  namespace Express {
    interface Request {
      team?: AuthTeam;
    }
  }
}
