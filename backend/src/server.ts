import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from './config.js';
import { authenticateAdmin, authenticateTeam, findTeamByName, issueCookies, signAdminToken, signTeamToken } from './auth.js';
import { pool } from './db.js';
import { archiveImport, createTransaction, evaluateOracleScript, fetchMirrorTarget, getChambersForTeam, getMedusaCoreArtifacts, getScoreboard, getTransactionById, hydraRedeem, listChatMessages, postChatMessage, renderOracleProphecy, runWhispersBot, submitFlag, unsafeTreasuryReport, addTransactionComment } from './challenges.js';
import { chamberHints, chamberNarrative } from './gameData.js';

const app = express();
const adminRouter = express.Router();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: config.corsOrigin.split(','),
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(async (req, res, next) => {
  const started = Date.now();
  res.on('finish', async () => {
    try {
      await pool.query(
        'INSERT INTO traffic_logs (team_id, path, method, ip, user_agent, status_code) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.team?.id ?? null, req.path, req.method, req.ip, req.get('user-agent') ?? 'unknown', res.statusCode]
      );
    } catch {
      // Logging must never interrupt gameplay.
    }
  });
  res.locals.startedAt = started;
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'medusa-backend', time: new Date().toISOString() });
});

app.get('/api/meta', (_req, res) => {
  res.json({
    name: 'MEDUSA: The Forbidden Temple',
    version: '1',
    theme: 'ancient greek temple with cyberpunk corruption'
  });
});

app.post('/api/login', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials payload' });
    return;
  }

  const team = await findTeamByName(parsed.data.name);
  if (!team || !(await bcrypt.compare(parsed.data.password, team.password_hash))) {
    res.status(401).json({ error: 'Invalid team name or password' });
    return;
  }

  const token = signTeamToken({ id: team.id, name: team.name, score: team.score });
  issueCookies(res, token);
  res.json({ ok: true, team: { id: team.id, name: team.name, score: team.score } });
});

app.get('/api/me', authenticateTeam, (req, res) => {
  res.json({ team: req.team });
});

app.get('/api/chambers', authenticateTeam, async (req, res) => {
  const chambers = await getChambersForTeam(req.team!.id);
  res.json({ chambers });
});

app.get('/api/chamber/:id', authenticateTeam, async (req, res) => {
  const chamberId = Number(req.params.id);
  const chamber = await pool.query('SELECT id, name, description, difficulty, order_index, enabled FROM chambers WHERE id = $1', [chamberId]);
  const current = chamber.rows[0];
  if (!current) {
    res.status(404).json({ error: 'Unknown chamber' });
    return;
  }

  const solved = await pool.query('SELECT 1 FROM solves WHERE team_id = $1 AND chamber_id = $2', [req.team!.id, chamberId]);
  res.json({
    chamber: {
      ...current,
      narrative: chamberNarrative[current.id as number],
      solved: Boolean(solved.rows[0])
    },
    hints: chamberHints[current.id as number] ?? []
  });
});

app.post('/api/submit-flag', authenticateTeam, async (req, res) => {
  const schema = z.object({ chamberId: z.coerce.number().int().positive(), flag: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid flag payload' });
    return;
  }

  const result = await submitFlag(req.team!.id, parsed.data.chamberId, parsed.data.flag);
  res.status(result.ok ? 200 : 400).json(result);
});

app.get('/api/scoreboard', authenticateTeam, async (_req, res) => {
  res.json(await getScoreboard());
});

app.get('/api/hints', authenticateTeam, async (req, res) => {
  const chamberId = Number(req.query.chamberId ?? 0);
  const chamber = await pool.query('SELECT id, enabled FROM chambers WHERE id = $1', [chamberId]);
  if (!chamber.rows[0]) {
    res.status(404).json({ error: 'Unknown chamber' });
    return;
  }

  const hints = await pool.query('SELECT * FROM solves WHERE team_id = $1', [req.team!.id]);
  res.json({
    chamberId,
    hints: [
      'A chamber is never solved by the first thing you notice.',
      'Look for hidden endpoints, old keys, and asynchronous edges.',
      `Solved chambers so far: ${hints.rowCount}`
    ]
  });
});

app.get('/api/treasury/transactions/:id', authenticateTeam, async (req, res) => {
  const transaction = await getTransactionById(Number(req.params.id));
  if (!transaction) {
    res.status(404).json({ error: 'Unknown transaction' });
    return;
  }

  res.json({ transaction });
});

app.post('/api/treasury/transactions', authenticateTeam, async (req, res) => {
  const schema = z.object({ amount: z.coerce.number().int(), recipient: z.string().min(1), memo: z.string().default('') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid transaction' });
    return;
  }

  const transaction = await createTransaction(req.team!.id, parsed.data.amount, parsed.data.recipient, parsed.data.memo);
  res.json({ transaction });
});

app.post('/api/treasury/transactions/:id/comment', authenticateTeam, async (req, res) => {
  const schema = z.object({ body: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid comment' });
    return;
  }

  const comment = await addTransactionComment(Number(req.params.id), req.team!.id, parsed.data.body);
  res.json({ comment });
});

app.get('/api/treasury/audit/report', authenticateTeam, async (req, res) => {
  const result = await unsafeTreasuryReport(req.team!.id);
  res.json(result);
});

app.get('/api/treasury/jwks', (_req, res) => {
  res.json({
    legacyPublicKey: process.env.LEGACY_PUBLIC_KEY ?? '-----BEGIN PUBLIC KEY-----\nFAKE-MEDUSA-PUBLIC-KEY\n-----END PUBLIC KEY-----',
    note: 'The temple never fully rotated its keys.'
  });
});

app.post('/api/mirror/fetch', authenticateTeam, async (req, res) => {
  const schema = z.object({ url: z.string().url() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  try {
    const result = await fetchMirrorTarget(parsed.data.url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post('/api/oracle/prophecy', authenticateTeam, async (req, res) => {
  const schema = z.object({ name: z.string().min(1), temple: z.string().min(1), message: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid prophecy input' });
    return;
  }

  const rendered = renderOracleProphecy(parsed.data);
  res.json({ rendered });
});

app.post('/api/oracle/evaluate', authenticateTeam, async (req, res) => {
  const schema = z.object({ snippet: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid snippet' });
    return;
  }

  try {
    const outcome = await evaluateOracleScript(parsed.data.snippet, { team: req.team!.name });
    res.json(outcome);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post('/api/hydra/redeem', authenticateTeam, async (req, res) => {
  const schema = z.object({ claimKey: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid claim key' });
    return;
  }

  res.json(await hydraRedeem(req.team!.id, parsed.data.claimKey));
});

app.post('/api/archive/import', authenticateTeam, async (req, res) => {
  const schema = z.object({ payload: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid archive payload' });
    return;
  }

  try {
    const result = await archiveImport(req.team!.id, parsed.data.payload);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get('/api/chat', authenticateTeam, async (_req, res) => {
  res.json({ messages: await listChatMessages() });
});

app.post('/api/chat', authenticateTeam, async (req, res) => {
  const schema = z.object({ username: z.string().min(1), message: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid chat payload' });
    return;
  }

  const message = await postChatMessage(req.team!.id, parsed.data.username, parsed.data.message);
  res.json({ message });
});

app.post('/api/chat/bot', authenticateTeam, async (req, res) => {
  res.json(await runWhispersBot(req.team!.id));
});

app.get('/api/core/artifacts', authenticateTeam, async (req, res) => {
  res.json(await getMedusaCoreArtifacts(req.team!.id));
});

app.post('/api/core/unseal', authenticateTeam, async (req, res) => {
  const schema = z.object({ accessKey: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid access key' });
    return;
  }

  const artifacts = await getMedusaCoreArtifacts(req.team!.id);
  const expected = Object.values(artifacts).join(':');
  if (parsed.data.accessKey !== expected) {
    res.status(403).json({ error: 'The core remains sealed' });
    return;
  }

  const flagRow = await pool.query('SELECT flag FROM chambers WHERE id = 7');
  res.json({ flag: flagRow.rows[0]?.flag ?? 'missing' });
});

adminRouter.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid admin login payload' });
    return;
  }

  if (parsed.data.email !== config.adminEmail || parsed.data.password !== config.adminPassword) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = signAdminToken(config.adminEmail);
  issueCookies(res, signTeamToken({ id: 0, name: 'Oracle', score: 0 }), token);
  res.json({ ok: true });
});

adminRouter.use(authenticateAdmin);

adminRouter.get('/teams', async (_req, res) => {
  const result = await pool.query('SELECT id, name, score, created_at FROM teams ORDER BY score DESC, name ASC');
  res.json({ teams: result.rows });
});

adminRouter.get('/solves', async (_req, res) => {
  const result = await pool.query(`
    SELECT s.id, s.team_id, t.name AS team_name, s.chamber_id, c.name AS chamber_name, s.timestamp
    FROM solves s
    JOIN teams t ON t.id = s.team_id
    JOIN chambers c ON c.id = s.chamber_id
    ORDER BY s.timestamp DESC
  `);
  res.json({ solves: result.rows });
});

adminRouter.get('/scoreboard', async (_req, res) => {
  res.json(await getScoreboard());
});

adminRouter.get('/traffic', async (_req, res) => {
  const result = await pool.query('SELECT * FROM traffic_logs ORDER BY created_at DESC LIMIT 250');
  res.json({ logs: result.rows });
});

adminRouter.get('/chambers', async (_req, res) => {
  const result = await pool.query('SELECT id, name, enabled, flag, difficulty, order_index FROM chambers ORDER BY order_index ASC');
  res.json({ chambers: result.rows });
});

adminRouter.post('/chambers/:id/reset', async (req, res) => {
  const schema = z.object({ flag: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid reset payload' });
    return;
  }

  await pool.query('UPDATE chambers SET flag = $1 WHERE id = $2', [parsed.data.flag, Number(req.params.id)]);
  res.json({ ok: true });
});

adminRouter.post('/chambers/:id/toggle', async (req, res) => {
  const chamber = await pool.query('SELECT enabled FROM chambers WHERE id = $1', [Number(req.params.id)]);
  const current = chamber.rows[0];
  if (!current) {
    res.status(404).json({ error: 'Unknown chamber' });
    return;
  }

  const nextEnabled = !current.enabled;
  await pool.query('UPDATE chambers SET enabled = $1 WHERE id = $2', [nextEnabled, Number(req.params.id)]);
  res.json({ ok: true, enabled: nextEnabled });
});

app.use('/api/admin', adminRouter);

app.get('/api/legacy/admin-portal', authenticateTeam, async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token) {
    res.status(401).json({ error: 'Legacy bridge expects a signed token' });
    return;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { role?: string };
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Legacy bridge rejected token' });
      return;
    }

    res.json({
      mirrorApiKey: `mirror-api-${req.team!.id}-credential`,
      flag: (await pool.query('SELECT flag FROM chambers WHERE id = 1')).rows[0]?.flag ?? 'missing'
    });
  } catch {
    res.status(400).json({ error: 'Malformed legacy token' });
  }
});

app.get('/api/hidden/forgotten/chamber', authenticateTeam, async (_req, res) => {
  res.json({ lore: 'The forgotten chamber remembers the first key the treasury lost.' });
});

app.get('/api/hidden/athena/journal', authenticateTeam, async (_req, res) => {
  res.json({ lore: 'Athena wrote the mirror bypass in the margins of a tax ledger.' });
});

app.get('/api/hidden/serpent/logs', authenticateTeam, async (_req, res) => {
  res.json({ lore: 'The archive parser trusts a string that looks almost like JSON.' });
});

app.get('/api/debug/session', authenticateTeam, (req, res) => {
  res.json({ session: req.team, trace: crypto.randomUUID() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, () => {
  console.log(`Medusa backend listening on ${config.port}`);
});
