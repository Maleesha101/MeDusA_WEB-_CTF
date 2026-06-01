import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const teams = [
  ['Aegis', 'team-aegis'],
  ['Hydra', 'team-hydra'],
  ['Orion', 'team-orion'],
  ['Helios', 'team-helios']
] as const;

async function seed() {
  for (const [name, password] of teams) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO teams (name, password_hash, score) VALUES ($1, $2, 0) ON CONFLICT (name) DO UPDATE SET password_hash = EXCLUDED.password_hash',
      [name, hash]
    );
  }

  const teamRows = await pool.query('SELECT id FROM teams ORDER BY id ASC');
  for (const row of teamRows.rows) {
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `audit_${row.id}_credential`, 'audit_credential']);
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `mirror_${row.id}_secret`, 'oracle_secret']);
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `oracle_${row.id}_token`, 'hydra_token']);
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `hydra_${row.id}_archive`, 'archive_token']);
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `archive_${row.id}_master`, 'master_key']);
    await pool.query('INSERT INTO audit_tokens (team_id, token, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [row.id, `whispers_${row.id}_core`, 'core_token']);
  }

  console.log('Seeded Medusa teams and artifacts');
  await pool.end();
}

seed().catch(async error => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
