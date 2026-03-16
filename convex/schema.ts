import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(),
    creditScore: v.number(),
    lastUpdated: v.number(),
  }).index("by_wallet", ["walletAddress"]),

  vaults: defineTable({
    userWallet: v.string(),
    amount: v.number(),
    lockedUntil: v.number(),
    status: v.string(), // "active" | "unlocked"
    yieldEarned: v.number(),
  }).index("by_user", ["userWallet"]),

  orders: defineTable({
    orderId: v.string(),
    userWallet: v.string(),
    merchantWallet: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
    paidCount: v.number(),
    status: v.string(), // "active" | "completed" | "defaulted"
    createdAt: v.number(),
  })
    .index("by_order_id", ["orderId"])
    .index("by_merchant", ["merchantWallet"])
    .index("by_user", ["userWallet"]),

  installments: defineTable({
    orderId: v.string(),
    index: v.number(),
    amount: v.number(),
    dueDate: v.number(),
    status: v.string(), // "pending" | "paid"
    txSignature: v.optional(v.string()),
  }).index("by_order", ["orderId"]),

  merchants: defineTable({
    merchantWallet: v.string(),
    name: v.string(),
    totalGMV: v.number(),
    activeOrders: v.number(),
    defaultRate: v.number(),
    settledAmount: v.number(),
  }).index("by_wallet", ["merchantWallet"]),

  faucetClaims: defineTable({
    wallet: v.string(),
    amount: v.number(),
    claimedAt: v.number(),
    txSignature: v.string(),
  }).index("by_wallet", ["wallet"]),
});
