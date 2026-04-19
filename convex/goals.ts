import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new savings goal.
 * Returns the newly created goal's ID.
 */
export const createGoal = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const goalId = await ctx.db.insert("goals", {
      userId: args.userId,
      title: args.title,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      deadline: args.deadline,
      createdAt: Date.now(),
    });
    return goalId;
  },
});

/**
 * Get all savings goals for a specific user, most recent first.
 */
export const getGoals = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    return goals;
  },
});

/**
 * Update the current saved amount for a goal.
 * Pass the new total currentAmount (not a delta).
 */
export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("goals"),
    currentAmount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      currentAmount: args.currentAmount,
    });
  },
});
