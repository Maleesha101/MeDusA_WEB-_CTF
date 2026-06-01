import { JSDOM } from 'jsdom';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ejs from 'ejs';
import { pool, scoreByOrder } from './db.js';
import { chamberHints, chamberNarrative } from './gameData.js';

const nodeRequire = createRequire(import.meta.url);

export async function getChambersForTeam(teamId: number) {
  const chambers = await pool.query('SELECT id, name, description, difficulty, order_index, enabled FROM chambers ORDER BY order_index ASC');
  const solves = await pool.query('SELECT chamber_id FROM solves WHERE team_id = $1', [teamId]);
  const solved = new Set(solves.rows.map(row => row.chamber_id));

  return chambers.rows.map(chamber => ({
    ...chamber,
    narrative: chamberNarrative[chamber.id as number],
    solved: solved.has(chamber.id),
    hints: chamberHints[chamber.id as number] ?? []
  }));
}

export async function submitFlag(teamId: number, chamberId: number, flag: string) {
  const chamber = await pool.query('SELECT id, flag, order_index, enabled FROM chambers WHERE id = $1', [chamberId]);
  const current = chamber.rows[0];
  if (!current || !current.enabled) {
    return { ok: false, message: 'Chamber locked' };
  }

  const solved = await pool.query('SELECT id FROM solves WHERE team_id = $1 AND chamber_id = $2', [teamId, chamberId]);
  if (solved.rows[0]) {
    return { ok: false, message: 'Already solved' };
  }

  if (current.flag !== flag.trim()) {
    return { ok: false, message: 'Incorrect flag' };
  }

  await pool.query('INSERT INTO solves (team_id, chamber_id) VALUES ($1, $2)', [teamId, chamberId]);
  await pool.query('UPDATE teams SET score = score + $1 WHERE id = $2', [scoreByOrder[current.order_index as number] ?? 100, teamId]);
  return { ok: true, message: 'Chamber solved' };
}

export async function getScoreboard() {
  const result = await pool.query(`
    SELECT
      t.id,
      t.name,
      t.score,
      COUNT(s.id)::int AS solves
    FROM teams t
    LEFT JOIN solves s ON s.team_id = t.id
    GROUP BY t.id, t.name, t.score
    ORDER BY t.score DESC, solves DESC, t.name ASC
  `);

  const firstBlood = await pool.query(`
    SELECT chamber_id, team_id, timestamp
    FROM solves
    WHERE (chamber_id, timestamp) IN (
      SELECT chamber_id, MIN(timestamp)
      FROM solves
      GROUP BY chamber_id
    )
    ORDER BY chamber_id ASC
  `);

  return {
    teams: result.rows,
    firstBlood: firstBlood.rows
  };
}

export async function createTransaction(teamId: number, amount: number, recipient: string, memo: string) {
  const result = await pool.query(
    'INSERT INTO transactions (team_id, amount, recipient, memo, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, team_id, amount, recipient, memo, status, created_at',
    [teamId, amount, recipient, memo, 'pending']
  );
  return result.rows[0];
}

export async function getTransactionById(id: number) {
  const result = await pool.query('SELECT id, team_id, amount, recipient, memo, status, created_at FROM transactions WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function addTransactionComment(transactionId: number, teamId: number, body: string) {
  const result = await pool.query(
    'INSERT INTO comments (transaction_id, author_team_id, body) VALUES ($1, $2, $3) RETURNING id, transaction_id, author_team_id, body, created_at',
    [transactionId, teamId, body]
  );
  return result.rows[0];
}

export async function unsafeTreasuryReport(teamId: number) {
  const commentRows = await pool.query('SELECT body FROM comments WHERE author_team_id = $1 ORDER BY created_at DESC LIMIT 1', [teamId]);
  const term = commentRows.rows[0]?.body ?? 'stone';
  const unsafeSql = `SELECT id, transaction_id, author_team_id, body, created_at FROM comments WHERE body ILIKE '%${term}%' ORDER BY created_at DESC LIMIT 10`;
  const result = await pool.query(unsafeSql);
  const audit = await pool.query('SELECT token FROM audit_tokens WHERE team_id = $1 ORDER BY created_at DESC LIMIT 1', [teamId]);
  return {
    auditCredential: audit.rows[0]?.token ?? 'audit_credential_missing',
    oracleServiceUser: 'oracle-service-user',
    rows: result.rows,
    legacyPublicKey: process.env.LEGACY_PUBLIC_KEY ?? 'legacy-public-key-exposed-in-training'
  };
}

export async function fetchMirrorTarget(url: string) {
  const blocked = ['127.0.0.1', 'localhost', '0.0.0.0', '::1', '169.254.169.254', 'file:', 'gopher:'];
  if (blocked.some(value => url.includes(value))) {
    throw new Error('Blocked by mirror filter');
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Medusa-Mirror/1.0'
    }
  });

  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? 'text/plain',
    body: await response.text()
  };
}

export function renderOracleProphecy(payload: Record<string, string>) {
  const template = String(payload.message ?? '');
  return ejs.render(template, {
    name: payload.name,
    temple: payload.temple,
    message: payload.message,
    process,
    Buffer,
    require: nodeRequire
  }, { async: false, rmWhitespace: true });
}

export async function evaluateOracleScript(snippet: string, sandboxHint: Record<string, unknown> = {}) {
  const sandbox = {
    console,
    Math,
    JSON,
    snippet,
    hint: sandboxHint,
    result: ''
  };

  const context = vm.createContext(sandbox, { name: 'oracle-sandbox' });
  const wrapped = `
    (function () {
      const payload = (${snippet});
      result = String(payload);
      return result;
    })()
  `;
  const result = await vm.runInContext(wrapped, context, { timeout: 1200 });
  return { result: String(result), sandbox: sandbox.result };
}

export async function hydraRedeem(teamId: number, claimKey: string) {
  const claim = await pool.query('SELECT id, claimed FROM hydra_claims WHERE team_id = $1 AND claim_key = $2', [teamId, claimKey]);
  const row = claim.rows[0];
  if (!row) {
    await pool.query('INSERT INTO hydra_claims (team_id, claim_key, claimed) VALUES ($1, $2, FALSE) ON CONFLICT (team_id, claim_key) DO NOTHING', [teamId, claimKey]);
  }

  const current = await pool.query('SELECT id, claimed FROM hydra_claims WHERE team_id = $1 AND claim_key = $2', [teamId, claimKey]);
  const hydra = current.rows[0];
  if (!hydra || hydra.claimed) {
    return { ok: false, message: 'Already claimed' };
  }

  await new Promise(resolve => setTimeout(resolve, 450));
  await pool.query('UPDATE hydra_claims SET claimed = TRUE WHERE id = $1', [hydra.id]);
  await pool.query('UPDATE teams SET score = score + 250 WHERE id = $1', [teamId]);

  return { ok: true, reward: 'archive_import_token', flag: 'flag{hydra_gate_static}' };
}

export async function archiveImport(teamId: number, serialized: string) {
  const decoded = Buffer.from(serialized, 'base64').toString('utf8');
  const payload = decoded.trim();
  const sandbox = {
    console,
    Buffer,
    hint: 'archive-memory-sandbox',
    module: {},
    exports: {},
    teamId,
    file: async (path: string) => {
      const result = await pool.query('SELECT token FROM audit_tokens WHERE team_id = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 1', [teamId, path]);
      return result.rows[0]?.token ?? 'missing';
    }
  } as Record<string, unknown>;

  const context = vm.createContext(sandbox, { name: 'serpent-archive' });
  const script = new vm.Script(`(function(){ return ${payload}; })()`);
  const result = script.runInContext(context, { timeout: 1200 });
  return { result: String(result), decoded };
}

export async function postChatMessage(teamId: number, username: string, message: string) {
  const result = await pool.query('INSERT INTO chat_messages (team_id, username, message) VALUES ($1, $2, $3) RETURNING id, username, message, created_at', [teamId, username, message]);
  return result.rows[0];
}

function sanitizeWhispersMarkup(message: string) {
  return message
    .replace(/<script/gi, '&lt;script')
    .replace(/javascript:/gi, 'blocked:')
    .replace(/onerror\s*=/gi, 'data-onerror=')
    .replace(/onload\s*=/gi, 'data-onload=');
}

export async function listChatMessages() {
  const result = await pool.query('SELECT id, username, message, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 50');
  return result.rows;
}

export async function runWhispersBot(teamId: number) {
  const messages = await listChatMessages();
  const html = `<!doctype html><html><body><div id="timeline">${messages.map(message => `<article class="message"><strong>${message.username}</strong><div>${sanitizeWhispersMarkup(String(message.message))}</div></article>`).join('')}</div></body></html>`;
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://medusa.local/admin' });
  dom.window.localStorage.setItem('core_access_token', `core-${teamId}-${Date.now()}`);
  dom.window.document.body.setAttribute('data-bot', 'visited');
  return {
    token: dom.window.localStorage.getItem('core_access_token'),
    flag: 'flag{gorgon_whispers_static}'
  };
}

export async function getMedusaCoreArtifacts(teamId: number) {
  const rows = await pool.query('SELECT kind, token FROM audit_tokens WHERE team_id = $1 ORDER BY created_at ASC', [teamId]);
  const map = Object.fromEntries(rows.rows.map(row => [row.kind, row.token]));
  return {
    treasury: map.audit_credential ?? 'missing',
    mirror: map.oracle_secret ?? 'missing',
    oracle: map.hydra_token ?? 'missing',
    hydra: map.archive_token ?? 'missing',
    archive: map.master_key ?? 'missing',
    whispers: map.core_token ?? 'missing'
  };
}
