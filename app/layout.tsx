import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Aave USDC Yield Tracker',
    description: 'Track your aEthUSDC yield on Aave V3 Ethereum Mainnet',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-950 text-white antialiased">
                {children}
            </body>
        </html>
    )
}
