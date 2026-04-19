import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Save a new AI insight or interaction log ───
export const saveAiLog = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // e.g. "daily_insight", "saving_tip"
    prompt: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("ai_logs", {
      userId: args.userId,
      type: args.type,
      prompt: args.prompt,
      response: args.response,
      createdAt: Date.now(),
    });

    return logId;
  },
});

// ─── Get AI logs for a user ───
export const getAiLogs = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.string()), // Optionally filter by a specific type of AI log
    limit: v.optional(v.number()), // To restrict history size returned
  },
  handler: async (ctx, args) => {
    let q;

    if (args.type) {
      q = ctx.db
        .query("ai_logs")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", args.userId).eq("type", args.type as string)
        );
    } else {
      q = ctx.db
        .query("ai_logs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    const logs = await q.order("desc").collect();
    
    if (args.limit && args.limit > 0) {
      return logs.slice(0, args.limit);
    }
    
    return logs;
  },
});
