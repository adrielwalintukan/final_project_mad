import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Add a new income or expense transaction.
 * Returns the newly created transaction's ID.
 */
export const addTransaction = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      category: args.category,
      note: args.note,
      createdAt: Date.now(),
    });
    return transactionId;
  },
});

/**
 * Get transactions for a specific user, ordered by most recent first.
 * Returns up to 100 transactions by default.
 */
export const getTransactions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
    return transactions;
  },
});

/**
 * Delete a transaction by its ID.
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.transactionId);
  },
});
