import { prisma } from '@/lib/prisma'

/**
 * Fetch the last N days of snapshots for an address.
 */
export async function getSnapshots(address: string, days = 7) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setUTCHours(0, 0, 0, 0)

    return prisma.balanceSnapshot.findMany({
        where: {
            address: address.toLowerCase(),
            snapshotDate: { gte: cutoff },
        },
        orderBy: { snapshotDate: 'asc' },
    })
}
