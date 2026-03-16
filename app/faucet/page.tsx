'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion } from 'framer-motion';
import { Droplets, Clock, CheckCircle2, ExternalLink, Users, Database, Wallet } from 'lucide-react';

const MUSDC_MINT = new PublicKey("3z3HMHkx62jfywybKKhjtLEWeTd6PMoDAW13FF5u5jZr");

export default function FaucetPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; tx?: string; error?: string } | null>(null);
  
  const stats = useQuery(api.faucet.getStats);
  const recentClaims = useQuery(api.faucet.getRecentClaims);
  const lastClaim = useQuery(api.faucet.getLastClaim, publicKey ? { wallet: publicKey.toBase58() } : "skip");

  useEffect(() => {
    if (publicKey) {
      updateBalance();
      const interval = setInterval(updateBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  const updateBalance = async () => {
    if (!publicKey) return;
    try {
      const ata = await getAssociatedTokenAddress(MUSDC_MINT, publicKey);
      const account = await getAccount(connection, ata);
      setBalance(Number(account.amount) / 10**6);
    } catch (e) {
      setBalance(0);
    }
  };

  const handleClaim = async () => {
    if (!publicKey) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/faucet/musdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() })
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, tx: data.txSignature });
        updateBalance();
      } else {
        setResult({ error: data.error === 'cooldown' ? 'Cooldown active. Try again tomorrow.' : data.error });
      }
    } catch (e) {
      setResult({ error: 'Failed to claim' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-primary/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black italic text-primary uppercase tracking-tighter">Meridian Faucet</h1>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Institutional Grade Devnet Liquidity</p>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-primary/5 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-primary/60 uppercase">Devnet Live</span>
             </div>
          </div>
        </div>

        {/* Hero Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="meridian-card bg-primary text-white p-12 relative overflow-hidden shadow-2xl"
        >
            <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Daily Allocation</p>
                    <h2 className="text-7xl font-mono font-black italic tracking-tighter">1,000 <span className="text-3xl text-white/30">mUSDC</span></h2>
                    <p className="text-xs font-bold text-white/40 uppercase">Limit: One claim per wallet every 24 hours</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4">
                    {!connected ? (
                        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase text-white/60">Connect wallet to claim tokens</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Your Wallet Balance</p>
                                <div className="flex items-center gap-2">
                                    <Wallet size={14} className="text-secondary" />
                                    <p className="text-xl font-mono font-bold">{balance.toLocaleString()} mUSDC</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleClaim}
                                disabled={loading || !connected}
                                className="bg-secondary text-primary px-10 py-5 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-3"
                            >
                                {loading ? 'Processing...' : 'Request Tokens'}
                                <Droplets size={18} />
                            </button>
                        </>
                    )}
                </div>

                {result?.success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[#0B7B5E] bg-white px-4 py-3 rounded-xl w-fit">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase">Success!</span>
                        <a href={`https://explorer.solana.com/tx/${result.tx}?cluster=devnet`} target="_blank" className="hover:underline">
                            <ExternalLink size={14} />
                        </a>
                    </motion.div>
                )}

                {result?.error && (
                    <div className="text-red-300 text-[10px] font-black uppercase px-2">{result.error}</div>
                )}
            </div>
            <Droplets className="absolute -bottom-20 -right-20 opacity-5 text-white" size={400} />
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="meridian-card p-6 bg-white space-y-4">
                <Database className="text-primary/20" size={24} />
                <div>
                    <p className="text-2xl font-mono font-black italic tracking-tighter text-primary">
                        {stats?.totalDistributed.toLocaleString() || '0'}
                    </p>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Total mUSDC Distributed</p>
                </div>
            </div>
            <div className="meridian-card p-6 bg-white space-y-4">
                <Users className="text-primary/20" size={24} />
                <div>
                    <p className="text-2xl font-mono font-black italic tracking-tighter text-primary">
                        {stats?.uniqueClaimants || '0'}
                    </p>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Unique Protocol Users</p>
                </div>
            </div>
            <div className="meridian-card p-6 bg-white space-y-4 border-l-4 border-l-secondary">
                <Clock className="text-secondary" size={24} />
                <div>
                    <p className="text-[10px] font-black text-primary uppercase italic">Next Claim Window</p>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-tighter">
                        {lastClaim ? 'Available in ~24h' : 'Available Now'}
                    </p>
                </div>
            </div>
        </div>

        {/* Recent Claims Table */}
        <div className="meridian-card bg-white overflow-hidden">
            <div className="bg-[#F7F8FA] p-4 border-b-2 border-primary/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live protocol Feed // Recent Claims</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 text-[9px] font-black text-muted uppercase">
                            <th className="p-4">Wallet</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-primary/70">
                        {recentClaims?.map((claim, i) => (
                            <tr key={i} className="border-b border-primary/5 hover:bg-[#F7F8FA]">
                                <td className="p-4 font-mono">{claim.wallet.slice(0, 4)}...{claim.wallet.slice(-4)}</td>
                                <td className="p-4 text-right font-mono">1,000 mUSDC</td>
                                <td className="p-4 text-right text-muted">{new Date(claim.claimedAt).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}
