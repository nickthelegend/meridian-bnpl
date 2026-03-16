"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Zap,
  History,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Droplets
} from "lucide-react"

import { LandingPage } from "@/components/landing-page"
import { usePrivy } from "@privy-io/react-auth"
import { usePolaris } from "@/hooks/use-polaris"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"

export default function Page() {
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address

  const { getCreditLimit, getLoans, musdcBalance, loading: polarisLoading } = usePolaris()
  const transactions = useQuery(api.merchants.listTransactions, { userAddress: address }) ?? []

  const [realStats, setRealStats] = useState({
    limit: 200,
    used: 0,
    available: 200,
    pct: 0,
    nextDue: "N/A",
    minDue: "0.00"
  })

  useEffect(() => {
    if (authenticated) {
      const updateStats = async () => {
        try {
          const limit = await getCreditLimit()
          const loans = await getLoans()

          let totalUsed = 0
          let earliestNextDue = "N/A"
          let minDue = 0

          loans.forEach((l: any) => {
            if (l.status === 0) { // Active
              const outstanding = parseFloat(l.principal) - parseFloat(l.repaid)
              totalUsed += outstanding
              minDue += outstanding * 0.25

              const dueDate = new Date(l.startTime * 1000 + 14 * 24 * 60 * 60 * 1000)
              earliestNextDue = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
          })

          const totalLimit = parseFloat(limit) + totalUsed
          const available = parseFloat(limit)
          const usagePct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0

          setRealStats({
            limit: totalLimit,
            used: totalUsed,
            available: available,
            pct: usagePct,
            nextDue: earliestNextDue,
            minDue: minDue.toFixed(2)
          })
        } catch (e) {
          console.error("Failed to update terminal stats:", e)
        }
      }
      updateStats()
    }
  }, [authenticated, address, getCreditLimit, getLoans, transactions])

  if (!authenticated) {
    return <LandingPage />
  }

  const { limit: total, used, available, pct } = realStats

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-display">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-4xl font-black italic text-primary uppercase tracking-tighter">My Account</h2>
            <div className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-secondary/20">
                Verified Hub
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] italic">Meridian Institutional Credit // Devnet</p>
        </div>
        
        <Link href="/faucet" className="group">
            <div className="bg-white border border-primary/5 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                    <Droplets size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-muted uppercase tracking-wider">Available mUSDC</p>
                    <p className="text-xl font-mono font-bold text-primary">{musdcBalance.toLocaleString()} <span className="text-[10px] opacity-40">mUSDC</span></p>
                </div>
                <ChevronRight className="text-primary/20 group-hover:translate-x-1 transition-transform" size={16} />
            </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Credit Terminal */}
        <div className="lg:col-span-8 space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="meridian-card p-10 relative overflow-hidden bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-2 italic">Available Liquidity</div>
                  <div className="text-6xl font-mono font-black tracking-tighter text-primary italic">
                    ${available.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-[#0B7B5E] rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">System Limit: ${total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-center">
                <div className="flex justify-between items-end">
                  <div className="text-[10px] text-muted font-black uppercase tracking-[0.2em] italic">Utilization</div>
                  <div className="text-lg font-mono font-bold text-[#0B7B5E]">{pct}%</div>
                </div>
                <div className="h-4 bg-[#F7F8FA] rounded-full overflow-hidden border border-primary/5 p-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black text-muted uppercase tracking-tighter">
                  <span className="flex items-center gap-1.5"><TrendingUp size={10}/> Debt: ${(used).toFixed(2)}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={10}/> Safety Buffer: ${available.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-primary/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted uppercase italic">Next Settlement</p>
                  <p className="text-lg font-bold text-primary">{realStats.nextDue}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted uppercase italic">Minimum Due</p>
                  <p className="text-lg font-bold text-[#0B7B5E]">${realStats.minDue}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted uppercase italic">APR Rating</p>
                  <p className="text-lg font-bold text-primary">0.00% <span className="text-[8px] text-muted font-normal uppercase">Tier A</span></p>
               </div>
            </div>

            <Image 
                src="/logos/meridian-mark.svg" 
                alt="" width={300} height={300} 
                className="absolute -bottom-20 -right-20 opacity-[0.02] pointer-events-none" 
            />
          </motion.div>

          {/* Partner Grid */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] italic px-2">Ecosystem Partners</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4">
              {[
                { name: "Zomato", logo: "/logos/zomato.svg" },
                { name: "Swiggy", logo: "/logos/swiggy.png" },
                { name: "Uber", logo: "/logos/uber.svg" },
                { name: "Netflix", logo: "/logos/netflix.svg" },
                { name: "Spotify", logo: "/logos/spotify.svg" },
                { name: "Google", logo: "/logos/google.svg" },
                { name: "Microsoft", logo: "/logos/microsoft.svg" },
                { name: "Amazon", logo: "/logos/amazon.svg" },
                { name: "Apple", logo: "/logos/apple.png" },
              ].map((partner, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-white border border-primary/5 flex items-center justify-center grayscale hover:grayscale-0 hover:border-primary/20 transition-all cursor-pointer p-3 shadow-sm group"
                >
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={24}
                    height={24}
                    className="object-contain group-hover:scale-110 transition-transform"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions & Activity */}
        <div className="lg:col-span-4 space-y-8">
          <div className="meridian-card p-8 space-y-4 bg-primary text-white border-none shadow-xl">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Quick Terminal</h3>
            <Link href="/checkout" className="block">
              <Button className="w-full bg-white hover:bg-white/90 text-primary font-black py-7 rounded-xl flex items-center justify-center gap-3 group italic uppercase text-xs">
                <Zap className="w-4 h-4 fill-primary group-hover:scale-110 transition-transform" />
                <span>Initialize Checkout</span>
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
                <Link href="/transactions">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white font-black py-6 rounded-xl text-[10px] uppercase italic">
                        <History className="w-3 h-3 mr-2" /> History
                    </Button>
                </Link>
                <Link href="/limits">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white font-black py-6 rounded-xl text-[10px] uppercase italic">
                        <ArrowUpRight className="w-3 h-3 mr-2" /> Expand
                    </Button>
                </Link>
            </div>
          </div>

          <div className="meridian-card p-8 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic underline decoration-secondary decoration-2 underline-offset-4">Activity Stream</div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-muted uppercase">
                Realtime
                <div className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
              </div>
            </div>

            <div className="space-y-8 flex-grow">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx: any, i: number) => (
                  <div key={i} className="flex gap-4 group cursor-pointer relative">
                    <div className="w-0.5 bg-primary/5 group-hover:bg-secondary transition-colors absolute -left-4 top-0 bottom-0" />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black tracking-wider uppercase text-primary flex items-center gap-2">
                        TX_{i+102} // AUTH
                        {tx.category === 'repayment' && <span className="text-[8px] bg-[#0B7B5E]/10 text-[#0B7B5E] px-1.5 py-0.5 rounded font-black italic">REPAY</span>}
                      </div>
                      <div className="text-xs font-bold text-muted uppercase tracking-tight">
                        {tx.title} <span className="text-primary/20 mx-1">/</span> <span className="text-primary">-${parseFloat(tx.amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="ml-auto text-[9px] font-black text-muted/40 uppercase whitespace-nowrap italic">
                      {formatDistanceToNow(new Date(tx._creationTime), { addSuffix: true })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-20 space-y-4">
                  <div className="w-12 h-12 border-2 border-dashed border-primary rounded-full flex items-center justify-center">
                    <History className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Waiting for signal...</span>
                </div>
              )}
            </div>

            <Link href="/transactions" className="mt-8 pt-6 border-t border-primary/5 text-[9px] font-black text-primary/40 uppercase hover:text-secondary transition-colors flex items-center gap-2 group italic">
              Access Full Ledger
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
