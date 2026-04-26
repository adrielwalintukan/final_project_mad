import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Deletes all financial records for a user (transactions, goals, insights, budgets, ai_logs).
 */
export const resetUserData = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Delete Transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }

    // 2. Delete Goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const goal of goals) {
      await ctx.db.delete(goal._id);
    }

    // 3. Delete Insights
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const insight of insights) {
      await ctx.db.delete(insight._id);
    }

    // 4. Delete Budgets
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const budget of budgets) {
      await ctx.db.delete(budget._id);
    }

    // 5. Delete AI Logs
    const aiLogs = await ctx.db
      .query("ai_logs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const log of aiLogs) {
      await ctx.db.delete(log._id);
    }

    return { success: true };
  },
});
