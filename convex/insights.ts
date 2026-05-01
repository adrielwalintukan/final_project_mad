import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const getInsights = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("insights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const getInsightsDashboardData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(500);

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(50);

    let totalExpense = 0;
    let totalIncome = 0;
    let lifestyle = 0;
    let essentials = 0;
    let growth = 0;

    // Category-level tracking
    const categorySpending: Record<string, number> = {};

    // This month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let thisMonthExpense = 0;
    let thisMonthIncome = 0;
    let lastMonthExpense = 0;
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        totalExpense += tx.amount;
        const cat = tx.category.toLowerCase();

        // Category accumulator
        const catKey = tx.category;
        categorySpending[catKey] = (categorySpending[catKey] || 0) + tx.amount;

        // Classify into groups
        if (cat.includes("food") || cat.includes("grocery") || cat.includes("rent") || cat.includes("bills") || cat.includes("health")) {
          essentials += tx.amount;
        } else if (cat.includes("invest") || cat.includes("saving")) {
          growth += tx.amount;
        } else {
          lifestyle += tx.amount;
        }

        // Monthly tracking
        if (tx.createdAt >= thisMonthStart) thisMonthExpense += tx.amount;
        if (tx.createdAt >= lastMonthStart && tx.createdAt < thisMonthStart) lastMonthExpense += tx.amount;
      } else if (tx.type === "income") {
        totalIncome += tx.amount;
        if (tx.createdAt >= thisMonthStart) thisMonthIncome += tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const hasData = transactions.length > 0;

    // Savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

    // Monthly change
    const monthlyChange = lastMonthExpense > 0
      ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100)
      : 0;

    // Top spending category
    let topCategory = "Belum ada";
    let topCategoryAmount = 0;
    Object.entries(categorySpending).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategory = cat;
        topCategoryAmount = amt;
      }
    });

    // Goals summary
    const activeGoals = goals.filter(g => (g.status || "active") === "active").length;
    const totalGoalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalGoalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const goalProgress = totalGoalTarget > 0 ? (totalGoalSaved / totalGoalTarget * 100) : 0;

    return {
      performancePercentage: savingsRate.toFixed(1),
      monthlyExpenseChange: monthlyChange.toFixed(1),
      spendingMetrics: {
        total: totalExpense,
        breakdown: [
          { label: "Lifestyle", amount: lifestyle, color: "#0d631b" },
          { label: "Essentials", amount: essentials, color: "#4c56af" },
          { label: "Growth", amount: growth, color: "#923357" },
        ],
      },
      quickStats: [
        {
          id: "savings_rate",
          icon: "account-balance-wallet",
          iconBg: "#e8f5e9",
          iconColor: "#0d631b",
          title: "Rasio Tabungan",
          value: savingsRate.toFixed(1) + "%",
          subtitle: "dari total pemasukan",
          trend: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "ok" : "warning",
        },
        {
          id: "monthly_trend",
          icon: "trending-up",
          iconBg: monthlyChange <= 0 ? "#e8f5e9" : "#fce4ec",
          iconColor: monthlyChange <= 0 ? "#0d631b" : "#c62828",
          title: "Tren Pengeluaran",
          value: (monthlyChange > 0 ? "+" : "") + monthlyChange.toFixed(1) + "%",
          subtitle: "vs. bulan lalu",
          trend: monthlyChange <= 0 ? "good" : "warning",
        },
        {
          id: "top_category",
          icon: "category",
          iconBg: "#fff3e0",
          iconColor: "#e65100",
          title: "Kategori Teratas",
          value: topCategory,
          subtitle: hasData ? "Rp " + topCategoryAmount.toLocaleString("id-ID") : "Belum ada data",
          trend: "neutral",
        },
        {
          id: "goal_progress",
          icon: "flag",
          iconBg: "#e0e0ff",
          iconColor: "#4c56af",
          title: "Progress Target",
          value: activeGoals > 0 ? goalProgress.toFixed(0) + "%" : "0 Target",
          subtitle: activeGoals > 0 ? activeGoals + " target aktif" : "Buat target pertama",
          trend: goalProgress >= 50 ? "good" : "neutral",
        },
      ],
      balance,
      thisMonthIncome,
      thisMonthExpense,
      totalTransactions: transactions.length,
    };
  },
});
