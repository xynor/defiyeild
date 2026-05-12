// Types for the Aave yield tracker

export interface BalanceSnapshot {
    id: string;
    address: string;
    snapshot_date: string; // ISO date
    balance: string; // aEthUSDC balanceOf (bigint as string, 6 decimals)
    created_at: string;
}

export interface ChartDataPoint {
    date: string; // formatted date string e.g. "05-10"
    underlyingValue: number;
    cumulativeEarnings: number;
    dailyEarnings: number; // day-over-day earnings change
}

export interface SnapshotsResponse {
    snapshots: BalanceSnapshot[];
    firstBalance: number;
    currentBalance: string | null; // on-chain live balance
}
