import { ethers } from 'ethers'

// ============================================================
// Aave V3 Ethereum Mainnet — Contract Addresses
// ============================================================

const AETH_USDC = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c' // aEthUSDC
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'

// Aave RAY = 1e27 (all Aave V3 internal math uses 27-decimal precision)
const RAY = ethers.parseUnits('1', 27).toString()

// ============================================================
// Minimal ABIs
// ============================================================

const aTokenABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function scaledBalanceOf(address account) view returns (uint256)',
]

const poolABI = [
    'function getReserveData(address asset) view returns (tuple(uint256 data) data)',
]

// Full reserve data tuple for `getReserveData`
const poolABI2 = [
    `function getReserveData(address asset) view returns (
    uint256 configuration,
    uint128 liquidityIndex,
    uint128 currentLiquidityRate,
    uint128 variableBorrowIndex,
    uint128 currentVariableBorrowRate,
    uint128 currentStableBorrowRate,
    uint40 lastUpdateTimestamp,
    uint16 id,
    address aTokenAddress,
    address stableDebtTokenAddress,
    address variableDebtTokenAddress,
    address interestRateStrategyAddress,
    uint128 accruedToTreasury,
    uint128 unbacked,
    uint128 isolationModeTotalDebt
  )`,
]

// ============================================================
// Provider factory
// ============================================================

function getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.RPC_URL
    if (!rpcUrl) throw new Error('RPC_URL environment variable is not set')
    return new ethers.JsonRpcProvider(rpcUrl)
}

// ============================================================
// Chain queries
// ============================================================

/**
 * Get the scaled (constant) aToken balance for a wallet.
 * This only changes on deposit/withdraw — not with interest.
 */
export async function getScaledBalance(address: string): Promise<bigint> {
    const provider = getProvider()
    const contract = new ethers.Contract(AETH_USDC, aTokenABI, provider)
    return contract.balanceOf(address)
}

/**
 * Get the current liquidityIndex from Aave Pool.getReserveData(USDC).
 * The underlying value = scaledBalance × liquidityIndex / RAY.
 */
export async function getLiquidityIndex(): Promise<bigint> {
    const provider = getProvider()
    const contract = new ethers.Contract(POOL, poolABI2, provider)
    const data = await contract.getReserveData(USDC)
    return BigInt(data.liquidityIndex)
}

/**
 * Calculate the underlying USDC value:
 *   underlying = scaledBalance × liquidityIndex / RAY
 */
export function calcUnderlyingValue(
    scaledBalance: bigint,
    liquidityIndex: bigint,
): bigint {
    return (scaledBalance * liquidityIndex) / BigInt(RAY)
}

/**
 * One-shot: fetch both scaled balance and liquidityIndex, return the underlying value.
 */
export async function getUnderlyingValue(address: string): Promise<{
    scaledBalance: bigint
    liquidityIndex: bigint
    underlyingValue: bigint
}> {
    const [scaledBalance, liquidityIndex] = await Promise.all([
        getScaledBalance(address),
        getLiquidityIndex(),
    ])
    return {
        scaledBalance,
        liquidityIndex,
        underlyingValue: calcUnderlyingValue(scaledBalance, liquidityIndex),
    }
}
