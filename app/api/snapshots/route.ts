import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/snapshots?address=0x...&days=7
 *
 * Returns the last N days of balance snapshots, along with
 * the first day's balance so the frontend can compute earnings.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const days = Number(searchParams.get('days')) || 7

    if (!address) {
        return NextResponse.json(
            { error: 'Missing "address" query parameter' },
            { status: 400 },
        )
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setUTCHours(0, 0, 0, 0)

    const snapshots = await prisma.balanceSnapshot.findMany({
        where: {
            address: address.toLowerCase(),
            snapshotDate: { gte: cutoff },
        },
        orderBy: { snapshotDate: 'asc' },
    })

    if (snapshots.length === 0) {
        return NextResponse.json(
            { snapshots: [], firstBalance: 0 },
            {
                headers: { 'Cache-Control': 'no-store, max-age=0' },
            },
        )
    }

    return NextResponse.json(
        {
            snapshots: snapshots.map((s) => ({
                id: s.id,
                address: s.address,
                snapshot_date: s.snapshotDate.toISOString().split('T')[0],
                balance: s.balance.toString(),
                created_at: s.createdAt.toISOString(),
            })),
            firstBalance: snapshots[0].balance,
        },
        {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        },
    )
}
