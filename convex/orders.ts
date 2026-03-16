import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    await ctx.db.insert("orders", {
      ...args,
      paidCount: 1, // First installment paid on checkout
      status: "active",
      createdAt: now,
      nextDueDate: now + 30 * 24 * 60 * 60 * 1000,
      txSignatures: [],
    });

    // Create installment schedule
    for (let i = 0; i < 3; i++) {
        await ctx.db.insert("installments", {
            orderId: args.orderId,
            index: i + 1,
            amount: args.installmentAmount,
            dueDate: now + i * 30 * 24 * 60 * 60 * 1000,
            status: i === 0 ? "paid" : "pending",
            paidAt: i === 0 ? now : undefined,
        });
    }
  },
});

export const updateInstallment = mutation({
  args: { orderId: v.string(), index: v.number(), txSignature: v.string() },
  handler: async (ctx, args) => {
    const installment = await ctx.db
      .query("installments")
      .withIndex("by_order", q => q.eq("orderId", args.orderId))
      .filter(q => q.eq(q.field("index"), args.index))
      .first();

    if (installment) {
        await ctx.db.patch(installment._id, {
            status: "paid",
            paidAt: Date.now(),
            txSignature: args.txSignature,
        });
    }

    const order = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("orderId"), args.orderId))
      .first();

    if (order) {
        const newPaidCount = order.paidCount + 1;
        await ctx.db.patch(order._id, {
            paidCount: newPaidCount,
            status: newPaidCount >= 3 ? "complete" : "active",
            nextDueDate: newPaidCount >= 3 ? 0 : Date.now() + 30 * 24 * 60 * 60 * 1000,
            txSignatures: [...order.txSignatures, args.txSignature],
        });
    }
  },
});

export const getOrdersByMerchant = query({
  args: { merchantWallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_merchant", q => q.eq("merchantWallet", args.merchantWallet))
      .order("desc")
      .collect();
  },
});
