import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new savings goal.
 */
export const createGoal = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    icon: v.optional(v.string()),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const goalId = await ctx.db.insert("goals", {
      userId: args.userId,
      title: args.title,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      icon: args.icon ?? "savings",
      status: "active",
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
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const newAmount = Math.max(0, args.currentAmount);
    const isCompleted = newAmount >= goal.targetAmount;

    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
      status: isCompleted ? "completed" : "active",
    });
  },
});

/**
 * Add savings to a goal (delta-based).
 */
export const addSavings = mutation({
  args: {
    goalId: v.id("goals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const newAmount = Math.max(0, goal.currentAmount + args.amount);
    const isCompleted = newAmount >= goal.targetAmount;

    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
      status: isCompleted ? "completed" : "active",
    });
  },
});

/**
 * Update goal details (title, target, deadline, icon).
 */
export const updateGoal = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    deadline: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const goal = await ctx.db.get(goalId);
    if (!goal) throw new Error("Goal not found");

    // Build patch object with only defined fields
    const patch: Record<string, any> = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.targetAmount !== undefined) patch.targetAmount = updates.targetAmount;
    if (updates.deadline !== undefined) patch.deadline = updates.deadline;
    if (updates.icon !== undefined) patch.icon = updates.icon;

    // Re-check completion status if target changed
    if (updates.targetAmount !== undefined) {
      patch.status = goal.currentAmount >= updates.targetAmount ? "completed" : "active";
    }

    await ctx.db.patch(goalId, patch);
  },
});

/**
 * Delete a goal.
 */
export const deleteGoal = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});
