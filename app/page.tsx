'use client'

import { useEffect, useState, useCallback } from 'react'
import YieldChart from '@/components/YieldChart'
import type { BalanceSnapshot, ChartDataPoint } from '@/types'

// Replace with your actual wallet address or configure via env
const WALLET_ADDRESS =
    process.env.NEXT_PUBLIC_WALLET_ADDRESS?.toLowerCase() || ''

// USDC has 6 decimals — chain values must be divided by 1e6 for display
const USDC_DECIMALS = 1_000_000

function mapToChartData(
    snapshots: BalanceSnapshot[],
    firstBalance: number,
): ChartDataPoint[] {
    let prevBalance = firstBalance
    return snapshots.map((s) => {
        const bal = Number(s.balance) / USDC_DECIMALS
        const dailyEarnings = bal - prevBalance
        prevBalance = bal
        return {
            date: new Date(s.snapshot_date + 'T00:00:00').toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' },
            ),
            underlyingValue: bal,
            cumulativeEarnings: bal - firstBalance,
            dailyEarnings,
        }
    })
}

export default function HomePage() {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [summary, setSummary] = useState<{
        currentBalance: number
        totalEarnings: number
        earningsPct: number
    } | null>(null)

    const fetchData = useCallback(async () => {
        if (!WALLET_ADDRESS) {
            setError('WALLET_ADDRESS not configured — set NEXT_PUBLIC_WALLET_ADDRESS in environment variables')
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/snapshots?address=${WALLET_ADDRESS}&days=7`,
                { cache: 'no-store' },
            )
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            const snapshots: BalanceSnapshot[] = json.snapshots || []
            const first = Number(json.firstBalance) / USDC_DECIMALS

            if (snapshots.length > 0) {
                const current = Number(snapshots[snapshots.length - 1].balance) / USDC_DECIMALS
                const earnings = current - first
                const pct = first > 0 ? (earnings / first) * 100 : 0
                setSummary({
                    currentBalance: current,
                    totalEarnings: earnings,
                    earningsPct: pct,
                })
            }

            setChartData(mapToChartData(snapshots, first))
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    function formatUSD(value: number) {
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            {/* ---------- Header ---------- */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">
                    Aave USDC Yield Tracker
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                    aEthUSDC · Ethereum Mainnet · Last 7 days
                </p>
            </div>

            {/* ---------- Summary Cards ---------- */}
            {summary && (
                <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-gray-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Current Balance
                        </p>
                        <p className="mt-1 text-xl font-semibold text-white">
                            {formatUSD(summary.currentBalance)}
                        </p>
                    </div>
                    <div className="rounded-xl bg-gray-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            7-Day Earnings
                        </p>
                        <p
                            className={`mt-1 text-xl font-semibold ${summary.totalEarnings >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            {formatUSD(summary.totalEarnings)}
                        </p>
                    </div>
                    <div className="rounded-xl bg-gray-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Yield %
                        </p>
                        <p
                            className={`mt-1 text-xl font-semibold ${summary.earningsPct >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            {summary.earningsPct >= 0 ? '+' : ''}
                            {summary.earningsPct.toFixed(4)}%
                        </p>
                    </div>
                </div>
            )}

            {/* ---------- Chart ---------- */}
            <YieldChart data={chartData} loading={loading} error={error} />

            {/* ---------- Footer ---------- */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                <span>Data refreshed on page load</span>
                <button
                    onClick={fetchData}
                    className="rounded-lg px-3 py-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                >
                    Refresh
                </button>
            </div>
        </main>
    )
}
