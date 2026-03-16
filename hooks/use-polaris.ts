import { useState, useCallback, useMemo, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { MeridianClient } from '@/lib/meridian-client';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { MUSDC } from '@/lib/tokens';

export function usePolaris() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, connected } = wallet;
    
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [musdcBalance, setMusdcBalance] = useState<number>(0);

    const client = useMemo(() => {
        if (!connected || !wallet) return null;
        return new MeridianClient(connection, wallet);
    }, [connected, wallet, connection]);

    const updateMUSDCBalance = useCallback(async () => {
        if (!publicKey) return;
        try {
            const ata = await getAssociatedTokenAddress(MUSDC.mint, publicKey);
            const account = await getAccount(connection, ata);
            setMusdcBalance(Number(account.amount) / 10**MUSDC.decimals);
        } catch (e) {
            setMusdcBalance(0);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        if (connected) {
            updateMUSDCBalance();
            const interval = setInterval(updateMUSDCBalance, 5000);
            return () => clearInterval(interval);
        }
    }, [connected, updateMUSDCBalance]);

    const getCreditLimit = useCallback(async () => {
        if (!client) return "0";
        return "4500"; 
    }, [client]);

    const depositLiquidity = useCallback(async (amount: string) => {
        if (!client) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const hash = await client.depositCollateral(parseFloat(amount), 180 * 24 * 60 * 60);
            setTxHash(hash);
            await updateMUSDCBalance();
            return { success: true, txHash: hash };
        } catch (error) {
            console.error("Deposit failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [client, updateMUSDCBalance]);

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
        musdcBalance,
        depositLiquidity,
        getCreditLimit,
        getLoans,
        getAPY,
        authenticated: connected,
        address: publicKey?.toBase58(),
        connection,
        publicKey,
        updateMUSDCBalance
    };
}
