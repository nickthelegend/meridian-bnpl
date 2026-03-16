import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    orderId: v.string(),
    userWallet: v.string(),
    merchantWallet: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
    paidCount: v.number(),
    status: v.string(), // active | complete | overdue
    createdAt: v.number(),
    nextDueDate: v.number(),
    txSignatures: v.array(v.string()),
  }).index("by_user", ["userWallet"])
    .index("by_merchant", ["merchantWallet"]),

  vaults: defineTable({
    userWallet: v.string(),
    collateralAmount: v.number(),
    yieldEarned: v.number(),
    lockStatus: v.string(), // locked | unlocked
    createdAt: v.number(),
    unlockedAt: v.optional(v.number()),
  }).index("by_user", ["userWallet"]),

  creditLines: defineTable({
    userWallet: v.string(),
    creditLimit: v.number(),
    amountDrawn: v.number(),
    interestRate: v.number(),
    netCost: v.number(),
    status: v.string(), // active | repaid
  }).index("by_user", ["userWallet"]),

  merchants: defineTable({
    merchantWallet: v.string(),
    businessName: v.string(),
    totalGMV: v.number(),
    activeOrders: v.number(),
    settledAmount: v.number(),
    defaultRate: v.number(),
    createdAt: v.number(),
  }).index("by_wallet", ["merchantWallet"]),

  installments: defineTable({
    orderId: v.string(),
    index: v.number(),
    amount: v.number(),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    txSignature: v.optional(v.string()),
    status: v.string(), // pending | paid | overdue
  }).index("by_order", ["orderId"]),
});
