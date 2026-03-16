import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrder = mutation({
  args: {
    orderId: v.string(),
    userWallet: v.string(),
    merchantWallet: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      orderId: args.orderId,
      userWallet: args.userWallet,
      merchantWallet: args.merchantWallet,
      totalAmount: args.totalAmount,
      installmentAmount: args.installmentAmount,
      paidCount: 1, // First installment paid on checkout
      status: "active",
      createdAt: now,
    });

    // Create 3 installments
    for (let i = 0; i < 3; i++) {
      await ctx.db.insert("installments", {
        orderId: args.orderId,
        index: i,
        amount: args.installmentAmount,
        dueDate: now + i * 30 * 24 * 60 * 60 * 1000,
        status: i === 0 ? "paid" : "pending",
      });
    }

    return orderId;
  },
});

export const updateInstallment = mutation({
  args: {
    orderId: v.string(),
    index: v.number(),
    txSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const installment = await ctx.db
      .query("installments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("index"), args.index))
      .first();

    if (installment) {
      await ctx.db.patch(installment._id, {
        status: "paid",
        txSignature: args.txSignature,
      });
    }

    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (order) {
      const newPaidCount = order.paidCount + 1;
      await ctx.db.patch(order._id, {
        paidCount: newPaidCount,
        status: newPaidCount >= 3 ? "completed" : "active",
      });
    }
  },
});

export const getOrdersByMerchant = query({
  args: { merchantWallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_merchant", (q) => q.eq("merchantWallet", args.merchantWallet))
      .order("desc")
      .collect();
  },
});
