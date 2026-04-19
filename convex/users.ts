import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new user.
 * Returns the newly created user's ID.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });
    return userId;
  },
});

/**
 * Get a user by their ID.
 */
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Updates a user's photo using a storage ID
 */
export const updatePhoto = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")),
    photoUrlToSave: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let newPhotoUrl = args.photoUrlToSave;

    // If a storage ID is provided, it means a file was uploaded, resolve its URL
    if (args.storageId) {
      newPhotoUrl = await ctx.storage.getUrl(args.storageId) || undefined;
    }

    if (newPhotoUrl) {
      await ctx.db.patch(args.userId, { photoUrl: newPhotoUrl });
    }
    
    return newPhotoUrl;
  },
});
