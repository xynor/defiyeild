import { ethers } from 'ethers'

// ============================================================
// Aave V3 Ethereum Mainnet — aEthUSDC
// ============================================================

const AETH_USDC = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c'

const aTokenABI = [
    'function balanceOf(address account) view returns (uint256)',
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
// Chain query
// ============================================================

/**
 * Get the aEthUSDC balance for a wallet.
 * aToken.balanceOf already returns the interest-bearing underlying value.
 */
export async function getBalance(address: string): Promise<bigint> {
    const provider = getProvider()
    const contract = new ethers.Contract(AETH_USDC, aTokenABI, provider)
    return contract.balanceOf(address)
}
