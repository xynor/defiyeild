'use client'

import {
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import type { ChartDataPoint } from '@/types'

interface Props {
    data: ChartDataPoint[]
    loading: boolean
    error: string | null
}

function formatUSD(value: number) {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
}) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-gray-700 bg-gray-900/95 px-4 py-3 shadow-xl backdrop-blur">
            <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                    {entry.name}:{' '}
                    <span className="font-semibold">{formatUSD(entry.value)}</span>
                </p>
            ))}
        </div>
    )
}

export default function YieldChart({ data, loading, error }: Props) {
    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-2xl bg-gray-900/60">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    <p className="text-sm text-gray-400">Loading chart data…</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-2xl bg-gray-900/60">
                <div className="text-center">
                    <p className="text-red-400">Failed to load data</p>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                </div>
            </div>
        )
    }

    if (!data.length) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-2xl bg-gray-900/60">
                <div className="text-center">
                    <p className="text-gray-400">No snapshot data yet</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Data will appear after the first daily cron job runs.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl bg-gray-900/60 p-4">
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        yAxisId="balance"
                        orientation="left"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                    />
                    <YAxis
                        yAxisId="earnings"
                        orientation="right"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) =>
                            v >= 1000
                                ? `$${(v / 1000).toFixed(1)}k`
                                : `$${v.toFixed(2)}`
                        }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ color: '#9ca3af', fontSize: 13 }}
                    />
                    <Area
                        yAxisId="balance"
                        type="monotone"
                        dataKey="underlyingValue"
                        name="USDC Balance"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#balanceGrad)"
                    />
                    <Area
                        yAxisId="earnings"
                        type="monotone"
                        dataKey="cumulativeEarnings"
                        name="Cumulative Earnings"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#earningsGrad)"
                    />
                    <Bar
                        yAxisId="earnings"
                        dataKey="dailyEarnings"
                        name="Daily Earnings"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}
