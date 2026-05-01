import { useMemo } from 'react';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  largestExpenseCategory: string | null;
  currentWeekExpense: number;
  previousWeekExpense: number;
  categoryTotals: Record<string, number>;
  expenseChangePercentage: number | null; // Positive means increased spending, Negative means decreased
}

export function useFinancialSummary(transactions: any[]): FinancialSummary {
  return useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    // For largest category
    const categoryTotals: Record<string, number> = {};
    
    // For weekly comparison
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).getTime();
    
    let currentWeekExpense = 0;
    let previousWeekExpense = 0;

    transactions.forEach(tx => {
      const isExpense = tx.type === "expense";
      const isIncome = tx.type === "income";
      
      if (isIncome) totalIncome += tx.amount;
      if (isExpense) totalExpense += tx.amount;
      
      if (isExpense) {
        // Accumulate by category
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        
        // Accumulate weekly stats
        if (tx.createdAt >= oneWeekAgo) {
          currentWeekExpense += tx.amount;
        } else if (tx.createdAt >= twoWeeksAgo && tx.createdAt < oneWeekAgo) {
          previousWeekExpense += tx.amount;
        }
      }
    });

    // Find largest category
    let largestExpenseCategory = null;
    let maxCatAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxCatAmount) {
        maxCatAmount = amt;
        largestExpenseCategory = cat;
      }
    }

    // Calculate percentage change
    let expenseChangePercentage = null;
    if (previousWeekExpense > 0) {
      expenseChangePercentage = ((currentWeekExpense - previousWeekExpense) / previousWeekExpense) * 100;
    } else if (currentWeekExpense > 0) {
      expenseChangePercentage = 100; // went from 0 to something
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      largestExpenseCategory,
      currentWeekExpense,
      previousWeekExpense,
      categoryTotals,
      expenseChangePercentage
    };
  }, [transactions]);
}
