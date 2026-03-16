import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const registerMerchant = mutation({
  args: {
    merchantWallet: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_wallet", (q) => q.eq("merchantWallet", args.merchantWallet))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("merchants", {
      merchantWallet: args.merchantWallet,
      name: args.name,
      totalGMV: 0,
      activeOrders: 0,
      defaultRate: 0,
      settledAmount: 0,
    });
  },
});

export const updateGMV = mutation({
  args: {
    merchantWallet: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_wallet", (q) => q.eq("merchantWallet", args.merchantWallet))
      .first();

    if (merchant) {
      await ctx.db.patch(merchant._id, {
        totalGMV: merchant.totalGMV + args.amount,
        activeOrders: merchant.activeOrders + 1,
      });
    }
  },
});

export const getMerchantStats = query({
  args: { merchantWallet: v.string() },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_wallet", (q) => q.eq("merchantWallet", args.merchantWallet))
      .first();

    return merchant || {
      totalGMV: 0,
      activeOrders: 0,
      defaultRate: 0,
      settledAmount: 0,
    };
  },
});
