import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createVault = mutation({
  args: {
    userWallet: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const vaultId = await ctx.db.insert("vaults", {
      userWallet: args.userWallet,
      amount: args.amount,
      lockedUntil: Date.now() + 180 * 24 * 60 * 60 * 1000, // 180 days
      status: "active",
      yieldEarned: 0,
    });
    return vaultId;
  },
});

export const unlockVault = mutation({
  args: {
    userWallet: v.string(),
  },
  handler: async (ctx, args) => {
    const vault = await ctx.db
      .query("vaults")
      .withIndex("by_user", (q) => q.eq("userWallet", args.userWallet))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (vault) {
      await ctx.db.patch(vault._id, {
        status: "unlocked",
      });
    }
  },
});

export const getVault = query({
  args: { userWallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vaults")
      .withIndex("by_user", (q) => q.eq("userWallet", args.userWallet))
      .order("desc")
      .first();
  },
});
