import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Password Hashing Helpers (SHA-256 via Web Crypto API) ───

async function hashPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase() + ":dailyboost:" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  email: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, email);
  return computedHash === storedHash;
}

// ─── Auth Functions ───

/**
 * Register a new user with email and password.
 */
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const password = args.password;

    if (!name) throw new Error("Name is required.");
    if (!email || !email.includes("@")) throw new Error("A valid email is required.");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

    // Check duplicate
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) throw new Error("An account with this email already exists.");

    const passwordHash = await hashPassword(password, email);

    const userId = await ctx.db.insert("users", {
      name,
      email,
      passwordHash,
      provider: "email",
      createdAt: Date.now(),
    });

    return {
      _id: userId,
      name,
      email,
      createdAt: Date.now(),
    };
  },
});

/**
 * Login a user with email and password.
 */
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const password = args.password;

    if (!email || !password) throw new Error("Email and password are required.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Invalid email or password.");

    // Google-only accounts can't login with password
    if (user.provider === "google" && !user.passwordHash) {
      throw new Error("This account uses Google sign-in. Please use the Google button.");
    }

    if (!user.passwordHash) throw new Error("Invalid email or password.");

    const isValid = await verifyPassword(password, email, user.passwordHash);
    if (!isValid) throw new Error("Invalid email or password.");

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Login or register with Google.
 */
export const loginWithGoogle = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();

    if (!email || !name) throw new Error("Name and email are required.");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) {
      if (args.photoUrl && args.photoUrl !== existingUser.photoUrl) {
        await ctx.db.patch(existingUser._id, { photoUrl: args.photoUrl });
      }
      return {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        createdAt: existingUser.createdAt,
      };
    }

    const userId = await ctx.db.insert("users", {
      name,
      email,
      photoUrl: args.photoUrl,
      provider: "google",
      createdAt: Date.now(),
    });

    return {
      _id: userId,
      name,
      email,
      createdAt: Date.now(),
    };
  },
});

/**
 * Get current user by ID.
 */
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Reset password — find user by email, update passwordHash.
 */
export const resetPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const newPassword = args.newPassword;

    if (!email || !email.includes("@")) throw new Error("A valid email is required.");
    if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("No account found with this email.");

    const passwordHash = await hashPassword(newPassword, email);
    await ctx.db.patch(user._id, { passwordHash, provider: "email" });

    return { success: true };
  },
});
