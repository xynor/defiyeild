import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBalance } from '@/lib/aave'

export const runtime = 'nodejs'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 5_000

/**
 * Retry a function up to maxRetries times with a fixed delay between attempts.
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    maxRetries = MAX_RETRIES,
    delayMs = RETRY_DELAY_MS,
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(
                `[cron] ${label} attempt ${attempt}/${maxRetries} failed: ${msg}`,
            )
            if (attempt === maxRetries) throw err
            await new Promise((r) => setTimeout(r, delayMs))
        }
    }
    throw new Error('unreachable')
}

/**
 * POST /api/cron
 *
 * Called daily by Vercel Cron Job.
 * Fetches the user's aEthUSDC balance and upserts into Supabase.
 * Protected by CRON_SECRET in Authorization header.
 */
export async function POST(request: NextRequest) {
    try {
        // ---------- Auth ----------
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
        const expectedSecret = process.env.CRON_SECRET

        if (!expectedSecret || token !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ---------- Env ----------
        const address = process.env.NEXT_PUBLIC_WALLET_ADDRESS
        if (!address) {
            return NextResponse.json(
                { error: 'NEXT_PUBLIC_WALLET_ADDRESS not configured' },
                { status: 500 },
            )
        }

        // ---------- On-chain (with retry) ----------
        const balance = await withRetry(
            () => getBalance(address),
            'RPC getBalance',
        )

        // ---------- Upsert (with retry) ----------
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split('T')[0]

        await withRetry(
            () =>
                prisma.balanceSnapshot.upsert({
                    where: {
                        address_snapshotDate: {
                            address: address.toLowerCase(),
                            snapshotDate: new Date(dateStr + 'T00:00:00Z'),
                        },
                    },
                    create: {
                        address: address.toLowerCase(),
                        snapshotDate: new Date(dateStr + 'T00:00:00Z'),
                        balance: balance.toString(),
                    },
                    update: {
                        balance: balance.toString(),
                    },
                }),
            'DB upsert',
        )

        return NextResponse.json({
            ok: true,
            date: dateStr,
            balance: balance.toString(),
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('Cron job error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

/**
 * Vercel Cron sends GET requests by default.
 * We simply delegate to POST for convenience.
 */
export async function GET(request: NextRequest) {
    return POST(request)
}
