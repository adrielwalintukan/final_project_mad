import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Create a new budget ───
export const createBudget = mutation({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    monthlyLimit: v.number(),
    month: v.string(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if budget for same category/month/year already exists
    const query = ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) =>
        q
          .eq("userId", args.userId)
          .eq("month", args.month)
          .eq("year", args.year)
      );
      
    const existing = await query.collect();
    
    // Filter by category to prevent duplicate category budgets per month
    const duplicate = existing.find(b => b.category === args.category);
    if (duplicate) {
      throw new Error(`Budget already exists for this category in ${args.month} ${args.year}`);
    }

    const budgetId = await ctx.db.insert("budgets", {
      userId: args.userId,
      category: args.category,
      monthlyLimit: args.monthlyLimit,
      month: args.month,
      year: args.year,
      createdAt: Date.now(),
    });

    return budgetId;
  },
});

// ─── Get all budgets for a user ───
export const getBudgets = query({
  args: {
    userId: v.id("users"),
    month: v.optional(v.string()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("budgets").withIndex("by_user", (q) => q.eq("userId", args.userId));

    const allBudgets = await q.collect();

    // Filter by month/year if provided
    return allBudgets.filter((budget) => {
      if (args.month && budget.month !== args.month) return false;
      if (args.year && budget.year !== args.year) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── Update an existing budget ───
export const updateBudget = mutation({
  args: {
    budgetId: v.id("budgets"),
    monthlyLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.budgetId);
    if (!existing) {
      throw new Error("Budget not found");
    }

    await ctx.db.patch(args.budgetId, {
      monthlyLimit: args.monthlyLimit,
    });

    return true;
  },
});
