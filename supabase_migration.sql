-- ============================================================
-- Supabase Migration: Aave USDC Yield Tracker
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create the balance_snapshots table
CREATE TABLE IF NOT EXISTS balance_snapshots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address         TEXT        NOT NULL,
  snapshot_date   DATE        NOT NULL,
  scaled_balance  NUMERIC     NOT NULL,  -- aToken balance (constant unless deposit/withdraw)
  liquidity_index NUMERIC     NOT NULL,  -- Aave Pool liquidityIndex (RAY precision)
  underlying_value NUMERIC    NOT NULL,  -- scaled_balance × liquidity_index / 1e27
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_address_date UNIQUE (address, snapshot_date)
);

-- 2. Index for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_address_date
  ON balance_snapshots (address, snapshot_date DESC);

-- 3. Enable Row Level Security (optional — not strictly needed for server-side access)
ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous read access (frontend reads via anon key)
CREATE POLICY "Allow anon read" ON balance_snapshots
  FOR SELECT
  USING (true);
