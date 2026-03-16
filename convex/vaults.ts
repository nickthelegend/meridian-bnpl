import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createVault = mutation({
  args: { userWallet: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vaults", {
      userWallet: args.userWallet,
      collateralAmount: args.amount,
      yieldEarned: 0,
      lockStatus: "locked",
      createdAt: Date.now(),
    });
  },
});

export const updateYield = mutation({
  args: { userWallet: v.string(), yieldEarned: v.number() },
  handler: async (ctx, args) => {
    const vault = await ctx.db
      .query("vaults")
      .withIndex("by_user", q => q.eq("userWallet", args.userWallet))
      .first();
    if (vault) {
      await ctx.db.patch(vault._id, { yieldEarned: args.yieldEarned });
    }
  },
});

export const unlockVault = mutation({
  args: { userWallet: v.string() },
  handler: async (ctx, args) => {
    const vault = await ctx.db
      .query("vaults")
      .withIndex("by_user", q => q.eq("userWallet", args.userWallet))
      .first();
    if (vault) {
      await ctx.db.patch(vault._id, {
        lockStatus: "unlocked",
        unlockedAt: Date.now(),
      });
    }
  },
});
