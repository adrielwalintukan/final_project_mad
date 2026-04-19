import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table — supports email and Google auth
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    provider: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Transactions table — income & expense records
  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "type"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // Savings goals table
  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // AI-powered financial insights
  insights: defineTable({
    userId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("daily"), v.literal("weekly")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "type"]),
});
