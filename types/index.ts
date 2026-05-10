// Types for the Aave yield tracker

export interface BalanceSnapshot {
    id: string;
    address: string;
    snapshot_date: string; // ISO date
    scaled_balance: string; // big number as string (ethers returns bigint)
    liquidity_index: string;
    underlying_value: string;
    created_at: string;
}

export interface ChartDataPoint {
    date: string; // formatted date string e.g. "05-10"
    underlyingValue: number;
    cumulativeEarnings: number;
}

export interface SnapshotsResponse {
    snapshots: BalanceSnapshot[];
    firstUnderlyingValue: number;
}
