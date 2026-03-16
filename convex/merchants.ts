import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerMerchant = mutation({
  args: { merchantWallet: v.string(), businessName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("merchants", {
      ...args,
      totalGMV: 0,
      activeOrders: 0,
      settledAmount: 0,
      defaultRate: 0,
      createdAt: Date.now(),
    });
  },
});

export const getMerchantStats = query({
  args: { merchantWallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("merchants")
      .withIndex("by_wallet", q => q.eq("merchantWallet", args.merchantWallet))
      .first();
  },
});

export const updateGMV = mutation({
  args: { merchantWallet: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_wallet", q => q.eq("merchantWallet", args.merchantWallet))
      .first();
    if (merchant) {
      await ctx.db.patch(merchant._id, {
        totalGMV: merchant.totalGMV + args.amount,
        activeOrders: merchant.activeOrders + 1,
      });
    }
  },
});
