import { createServerClient } from '@/lib/supabase'

/**
 * Base URL for API calls from the browser.
 */
export async function getSnapshots(
    address: string,
    days = 7,
): Promise<unknown> {
    const supabase = createServerClient()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('balance_snapshots')
        .select('*')
        .eq('address', address.toLowerCase())
        .gte('snapshot_date', cutoffStr)
        .order('snapshot_date', { ascending: true })

    if (error) throw new Error(`Supabase query failed: ${error.message}`)
    return data
}
