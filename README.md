# Aave USDC Yield Tracker

Track your aEthUSDC yield on Aave V3 Ethereum Mainnet. Daily snapshots via Vercel Cron, stored in Supabase, displayed with Recharts.

## Architecture

```
Vercel Cron (daily 0:00 UTC)  →  /api/cron  →  Ethereum RPC  →  aEthUSDC + Pool
                                    │
                              Supabase (balance_snapshots)
                                    │
      /api/snapshots  ←  Frontend  ←  YieldChart (Recharts)
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **Anon Key** (from Settings → API)
3. Generate a **Service Role Key** (also under Settings → API)
4. In the SQL Editor, paste and run the contents of `supabase_migration.sql`

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (safe for browser) |
| `SUPABASE_SERVICE_KEY` | Service role key (server only, never expose) |
| `WALLET_ADDRESS` | The wallet address to track |
| `RPC_URL` | Ethereum RPC endpoint (Alchemy / Infura) |
| `CRON_SECRET` | Random secret for cron endpoint auth |

### 3. Local Dev

```bash
npm install
npm run dev
```

- Main page: http://localhost:3000
- Manual cron trigger: `curl -X POST http://localhost:3000/api/cron -H "Authorization: Bearer $CRON_SECRET"`
- Query snapshots: `http://localhost:3000/api/snapshots?address=0x...&days=7`

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in Vercel's dashboard. The cron job is defined in `vercel.json`.

## Key Files

| File | Purpose |
|---|---|
| `lib/aave.ts` | Fetch scaledBalance & liquidityIndex from chain |
| `lib/supabase.ts` | Server/browser Supabase clients |
| `app/api/cron/route.ts` | Cron handler — reads chain, writes DB |
| `app/api/snapshots/route.ts` | Query snapshots for frontend chart |
| `components/YieldChart.tsx` | Recharts AreaChart (balance + earnings) |
| `app/page.tsx` | Main page with summary cards and chart |
| `supabase_migration.sql` | Database schema — run in Supabase SQL Editor |

## Contract Addresses (Ethereum Mainnet)

- **aEthUSDC**: `0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c`
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Aave V3 Pool**: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`

## How Yield is Calculated

```
underlyingValue = scaledBalance × liquidityIndex / 10²⁷
cumulativeEarnings = currentUnderlyingValue - firstDayUnderlyingValue
```

- `scaledBalance` — aToken balance (changes only on deposit/withdraw)
- `liquidityIndex` — Aave's interest-bearing index (increases over time)
