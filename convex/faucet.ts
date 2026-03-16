import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const recordClaim = mutation({
  args: {
    wallet: v.string(),
    amount: v.number(),
    txSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const claimId = await ctx.db.insert("faucetClaims", {
      wallet: args.wallet,
      amount: args.amount,
      claimedAt: Date.now(),
      txSignature: args.txSignature,
    });
    return claimId;
  },
});

export const getLastClaim = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("faucetClaims")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .order("desc")
      .first();
  },
});

export const getRecentClaims = query({
  handler: async (ctx) => {
    return await ctx.db.query("faucetClaims").order("desc").take(10);
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const claims = await ctx.db.query("faucetClaims").collect();
    const totalDistributed = claims.reduce((acc, c) => acc + c.amount, 0);
    const uniqueClaimants = new Set(claims.map((c) => c.wallet)).size;
    return {
      totalDistributed,
      uniqueClaimants,
    };
  },
});
