import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- CONVERSATIONS ---

export const startConversation = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatbot_conversations", {
      userId: args.userId,
      title: args.title,
      model: args.model,
      updatedAt: Date.now(),
    });
  },
});

export const listConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("chatbot_conversations") },
  handler: async (ctx, args) => {
    // Delete all messages first
    const messages = await ctx.db
      .query("chatbot_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete conversation
    await ctx.db.delete(args.conversationId);
  },
});

// --- MESSAGES ---

export const saveMessage = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("chatbot_conversations"),
    role: v.union(v.literal("user"), v.literal("model")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatbot_messages", {
      userId: args.userId,
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, { updatedAt: Date.now() });

    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.optional(v.id("chatbot_conversations")) },
  handler: async (ctx, args) => {
    if (!args.conversationId) return [];
    const conversationId = args.conversationId;
    return await ctx.db
      .query("chatbot_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
  },
});
