import { useState, useCallback, useMemo } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { CONTRACTS, NETWORKS } from '@/lib/contracts';
import { yoVault } from '@/lib/yo-vault';

export function usePolaris() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet, connected } = useWallet();
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getCreditLimit = useCallback(async () => {
        if (!publicKey) return "0";
        try {
            // Simulated credit engine query
            // In real app, would query the Meridian program account state
            return "200"; 
        } catch (e) {
            console.error("Fetch credit limit failed:", e);
            return "0";
        }
    }, [publicKey]);

    const depositLiquidity = useCallback(async (amount: string) => {
        if (!publicKey || !wallet) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            console.log(`[MERIDIAN] Initiating collateral lock on Solana...`);
            
            // 1. Lock collateral in YO Vault
            const result = await yoVault.depositCollateral(
                connection,
                wallet,
                parseFloat(amount),
                CONTRACTS.USDC
            );

            if (result.success) {
                setTxHash(result.txHash);
                return result;
            }
        } catch (error) {
            console.error("Solana Deposit failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [publicKey, wallet, connection]);

    const getLoans = useCallback(async () => {
        if (!publicKey) return [];
        // Fetch active BNPL orders from Solana Program state
        return [
            {
                id: 1,
                principal: "33.33",
                repaid: "0",
                startTime: Math.floor(Date.now() / 1000),
                status: 0, // Active
                merchant: "Shopify Store"
            }
        ];
    }, [publicKey]);

    const getAPY = useCallback(async () => {
        return await yoVault.getAccruedYield(publicKey?.toBase58() || "");
    }, [publicKey]);

    return {
        loading,
        txHash,
        depositLiquidity,
        getCreditLimit,
        getLoans,
        getAPY,
        authenticated: connected,
        address: publicKey?.toBase58(),
        connection,
        publicKey
    };
}
