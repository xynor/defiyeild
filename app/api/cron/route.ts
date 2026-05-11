import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBalance } from '@/lib/aave'

export const runtime = 'nodejs'

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

        // ---------- On-chain ----------
        const balance = await getBalance(address)

        // ---------- Upsert ----------
        const today = new Date().toISOString().split('T')[0]

        await prisma.balanceSnapshot.upsert({
            where: {
                address_snapshotDate: {
                    address: address.toLowerCase(),
                    snapshotDate: new Date(today + 'T00:00:00Z'),
                },
            },
            create: {
                address: address.toLowerCase(),
                snapshotDate: new Date(today + 'T00:00:00Z'),
                balance: balance.toString(),
            },
            update: {
                balance: balance.toString(),
            },
        })

        return NextResponse.json({
            ok: true,
            date: today,
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
