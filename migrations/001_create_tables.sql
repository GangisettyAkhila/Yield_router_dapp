-- Players and stats
CREATE TABLE IF NOT EXISTS players (
  address TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_stats (
  address TEXT PRIMARY KEY REFERENCES players(address),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0
);

-- Matches and proofs
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  metadata JSONB,
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_proofs (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  txid TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stakes
CREATE TABLE IF NOT EXISTS stakes (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  staker TEXT,
  txid TEXT,
  amount BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stakes_match ON stakes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_proofs_match ON match_proofs(match_id);
