import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/snapshots?address=0x...&days=7
 *
 * Returns the last N days of balance snapshots, along with
 * the first day's underlying value so the frontend can compute
 * cumulative earnings.
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

    const supabase = createServerClient()

    // 1. Get first snapshot in range (for baseline)
    // 2. Get all snapshots ordered by date
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('balance_snapshots')
        .select('*')
        .eq('address', address.toLowerCase())
        .gte('snapshot_date', cutoffStr)
        .order('snapshot_date', { ascending: true })

    if (error) {
        return NextResponse.json(
            { error: `Supabase query failed: ${error.message}` },
            { status: 500 },
        )
    }

    if (!data || data.length === 0) {
        return NextResponse.json({
            snapshots: [],
            firstUnderlyingValue: 0,
        })
    }

    return NextResponse.json(
        {
            snapshots: data,
            firstUnderlyingValue: data[0].underlying_value,
        },
        {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        },
    )
}
