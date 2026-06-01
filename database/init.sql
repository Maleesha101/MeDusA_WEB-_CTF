CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chambers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  flag TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  order_index INTEGER NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solves (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  chamber_id INTEGER NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, chamber_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  author_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  artifact TEXT NOT NULL,
  cost INTEGER NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hydra_claims (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  claim_key TEXT NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, claim_key)
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  blob TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traffic_logs (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_tokens (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO chambers (id, name, description, flag, difficulty, order_index, enabled)
VALUES
  (1, 'Treasury of Venom', 'A treasury ledger where forbidden balances hide a second-order SQL injection chain.', 'flag{treasury_of_venom_static}', 'Hard', 1, TRUE),
  (2, 'Mirror of Athena', 'A viewing mirror that fetches remote pages and leaks secrets through SSRF bypasses.', 'flag{mirror_of_athena_static}', 'Hard', 2, TRUE),
  (3, 'Oracle of Stone', 'A prophecy engine with a template injection path leading to file disclosure and RCE.', 'flag{oracle_of_stone_static}', 'Hard', 3, TRUE),
  (4, 'Hydra Gate', 'A reward gate where parallel redemption can duplicate credits and unlock a hidden artifact.', 'flag{hydra_gate_static}', 'Hard', 4, TRUE),
  (5, 'Serpent Archive', 'An archive importer that evaluates a custom serialization format inside a VM sandbox.', 'flag{serpent_archive_static}', 'Very Hard', 5, TRUE),
  (6, 'Gorgon Whispers', 'Temple chat moderated by a bot that can be steered by stored XSS and DOM tricks.', 'flag{gorgon_whispers_static}', 'Hard', 6, TRUE),
  (7, 'Medusa Core', 'The final throne room where all previous secrets combine into the final access ritual.', 'flag{medusa_core_static}', 'Insane', 7, TRUE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    flag = EXCLUDED.flag,
    difficulty = EXCLUDED.difficulty,
    order_index = EXCLUDED.order_index,
    enabled = EXCLUDED.enabled;
