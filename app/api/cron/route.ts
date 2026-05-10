import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUnderlyingValue } from '@/lib/aave'

export const runtime = 'nodejs'

/**
 * POST /api/cron
 *
 * Called daily by Vercel Cron Job.
 * Fetches the user's aEthUSDC scaled balance + Aave liquidityIndex,
 * computes the underlying USDC value, and upserts into Supabase.
 *
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
        const { scaledBalance, liquidityIndex, underlyingValue } =
            await getUnderlyingValue(address)

        // ---------- Upsert ----------
        const today = new Date().toISOString().split('T')[0] // "YYYY-MM-DD"

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
                scaledBalance: scaledBalance.toString(),
                liquidityIndex: liquidityIndex.toString(),
                underlyingValue: underlyingValue.toString(),
            },
            update: {
                scaledBalance: scaledBalance.toString(),
                liquidityIndex: liquidityIndex.toString(),
                underlyingValue: underlyingValue.toString(),
            },
        })

        return NextResponse.json({
            ok: true,
            date: today,
            scaledBalance: scaledBalance.toString(),
            liquidityIndex: liquidityIndex.toString(),
            underlyingValue: underlyingValue.toString(),
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
