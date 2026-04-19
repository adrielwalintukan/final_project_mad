import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useMemo } from "react";
import { v } from "convex/values";
import { Id } from "../convex/_generated/dataModel";

export function useDashboardData() {
  const { user } = useAuth();
  const userId = user?._id as Id<"users">;

  // We skip queries if userId is not ready yet by passing "skip"
  const transactionsRaw = useQuery(api.transactions.getTransactions, userId ? { userId } : "skip");
  const goalsRaw = useQuery(api.goals.getGoals, userId ? { userId } : "skip");
  const insightsRaw = useQuery(api.insights.getInsights, userId ? { userId } : "skip");

  const isLoading =
    transactionsRaw === undefined || goalsRaw === undefined || insightsRaw === undefined;

  const data = useMemo(() => {
    if (isLoading) {
      return {
        balance: 0,
        totalIncome: 0,
        totalExpense: 0,
        transactions: [],
        goals: [],
        insight: null,
        totalInsights: 0,
        savingsRate: "0.0",
        isEmpty: true,
      };
    }

    const transactions = transactionsRaw || [];
    const goals = goalsRaw || [];
    const insights = insightsRaw || [];

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        totalExpense += tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const isEmpty = transactions.length === 0;

    // Use the latest insight if available
    const insight = insights.length > 0 ? insights[0] : null;

    const savingsRate = totalIncome > 0 
      ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) 
      : "0.0";

    return {
      balance,
      totalIncome,
      totalExpense,
      transactions,
      goals,
      insight,
      totalInsights: insights.length,
      savingsRate,
      isEmpty,
    };
  }, [transactionsRaw, goalsRaw, insightsRaw, isLoading]);

  return {
    ...data,
    isLoading,
  };
}
