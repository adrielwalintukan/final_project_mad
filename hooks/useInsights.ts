import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useFinancialSummary } from "./useFinancialSummary";
import { generateSmartFinancialInsight } from "../services/gemini";
import { useLanguage } from "../context/LanguageContext";

export interface AIInsight {
  message: string;
  suggestedAction: "create_budget" | "add_transaction" | "view_goals" | "none";
  actionLabel: string;
}

export function useInsights() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get transactions for financial summary
  const transactions = useQuery(api.transactions.getTransactions, user ? { userId: user._id } : "skip") || [];
  const summary = useFinancialSummary(transactions);

  // Get existing insights from database
  const savedInsights = useQuery(api.insights.getInsights, user ? { userId: user._id } : "skip");
  const saveInsightMutation = useMutation(api.insights.saveInsight);

  // The latest daily insight from DB
  const [latestInsight, setLatestInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    if (savedInsights && savedInsights.length > 0) {
      try {
        const parsed = JSON.parse(savedInsights[0].content);
        setLatestInsight(parsed);
      } catch (e) {
        console.error("Failed to parse saved insight content", e);
      }
    }
  }, [savedInsights]);

  const generateNewInsight = useCallback(async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateSmartFinancialInsight(summary, transactions, language);
      const parsed = JSON.parse(result) as AIInsight;
      
      // Save to database
      await saveInsightMutation({
        userId: user._id,
        content: result,
        type: "daily"
      });
      
      setLatestInsight(parsed);
      return parsed;
    } catch (err: any) {
      setError(err.message || "Failed to generate AI insight");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [user, summary, transactions, saveInsightMutation]);

  return {
    latestInsight,
    isGenerating,
    error,
    generateNewInsight,
    summary,
    hasTransactions: transactions.length > 0
  };
}
