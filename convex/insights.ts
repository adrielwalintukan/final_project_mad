import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save a new AI-generated financial insight.
 * Returns the newly created insight's ID.
 */
export const saveInsight = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const insightId = await ctx.db.insert("insights", {
      userId: args.userId,
      content: args.content,
      type: args.type,
      createdAt: Date.now(),
    });
    return insightId;
  },
});

/**
 * Get insights for a specific user, most recent first.
 * Returns up to 50 insights by default.
 */
export const getInsights = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    return insights;
  },
});
