import { Pool } from 'pg';
import { config } from './config.js';

export const pool = new Pool({ connectionString: config.databaseUrl });

export type DbTeam = {
  id: number;
  name: string;
  password_hash: string;
  score: number;
};

export type DbChamber = {
  id: number;
  name: string;
  description: string;
  flag: string;
  difficulty: string;
  order_index: number;
  enabled: boolean;
};

export async function query<T = any>(text: string, values: unknown[] = []) {
  const result = await pool.query(text, values as never[]);
  return result.rows as T[];
}

export const scoreByOrder: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
  7: 700
};
