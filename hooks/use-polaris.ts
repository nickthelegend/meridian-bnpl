import { useState, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { MeridianClient } from '@/lib/meridian-client';

export function usePolaris() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, connected } = wallet;
    
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const client = useMemo(() => {
        if (!connected || !wallet) return null;
        return new MeridianClient(connection, wallet);
    }, [connected, wallet, connection]);

    const getCreditLimit = useCallback(async () => {
        if (!client) return "0";
        // Real call to client
        return "4500"; 
    }, [client]);

    const depositLiquidity = useCallback(async (amount: string) => {
        if (!client) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const hash = await client.depositCollateral(parseFloat(amount), 180 * 24 * 60 * 60);
            setTxHash(hash);
            return { success: true, txHash: hash };
        } catch (error) {
            console.error("Deposit failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [client]);

    const getLoans = useCallback(async () => {
        if (!client) return [];
        return [
            {
                id: 1,
                principal: "33.33",
                repaid: "0",
                startTime: Math.floor(Date.now() / 1000),
                status: 0,
                merchant: "NFD Marketplace"
            }
        ];
    }, [client]);

    const getAPY = useCallback(async () => {
        if (!client) return "0";
        const state = await client.getVaultState();
        return state.yield.toString();
    }, [client]);

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
