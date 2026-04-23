import { FinancialSummary } from "../hooks/useFinancialSummary";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function fetchWithRetry(
  prompt: string,
  model: string,
  apiKey: string,
  retries = 2
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      // If success or a non-retryable error (not 503 or 429), return the response
      if (response.ok || (response.status !== 503 && response.status !== 429)) {
        return response;
      }

      // If we are here, it's 503 or 429. Wait and retry.
      if (i < retries) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s
        await new Promise(res => setTimeout(res, waitTime));
      }
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  throw new Error("Maximum retries reached");
}

export async function generateSmartFinancialInsight(
  summaryData: FinancialSummary,
  recentTransactions: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable. Cannot call Gemini API.");
  }

  // Format the prompt with user's financial contextual data
  const prompt = `
Act as a smart, professional personal finance assistant for an Indonesian platform called "DailyBoost AI".
Analyze the user's recent financial data and provide a personalized financial insight.

Rules to strictly follow:
1. Output MUST be in Indonesian.
2. Output strictly a JSON object using the exact schema below, DO NOT wrap it in markdown block quotes.
3. The "message" field must be extremely concise and TO THE POINT (maximum 3-4 sentences total).
4. NO greetings or introductory phrases. Start immediately with the core insight.
5. NO markdown formatting at all inside the message field.
6. Look at the spending pattern. If a specific category dominates, set "suggestedAction" to "create_budget". If no transactions exist, suggest "add_transaction". If there's plenty of savings, suggest "view_goals". Else set to "none".
7. Make "actionLabel" an actionable short text in Indonesian, e.g. "Buat Budget", "Tambah Transaksi", etc.

EXPECTED JSON SCHEMA:
{
  "message": "<your sharp, actionable financial insight>",
  "suggestedAction": "create_budget" | "add_transaction" | "view_goals" | "none",
  "actionLabel": "<short button label>"
}

Here is the user's data context:
- Total Income: Rp ${summaryData.totalIncome.toLocaleString('id-ID')}
- Total Expense: Rp ${summaryData.totalExpense.toLocaleString('id-ID')}
- Net Balance: Rp ${summaryData.balance.toLocaleString('id-ID')}
- Largest Spending Category: ${summaryData.largestExpenseCategory || "None"}
- Last 7 days expense: Rp ${summaryData.currentWeekExpense.toLocaleString('id-ID')}
- Previous 7 days expense: Rp ${summaryData.previousWeekExpense.toLocaleString('id-ID')}
- Weekly Growth/Drop Percentage: ${summaryData.expenseChangePercentage !== null ? summaryData.expenseChangePercentage.toFixed(1) + '%' : "N/A"}

Recent Transactions Summary (latest 5):
${recentTransactions.slice(0, 5).map(tx => `- ${tx.category}: Rp ${tx.amount.toLocaleString('id-ID')} (${tx.type})`).join("\n")}
`;

  try {
    // Try Primary Model (2.5-flash)
    let response = await fetchWithRetry(prompt, "gemini-3.1-flash-lite-preview", GEMINI_API_KEY);

    // If Primary fails with 503 after retries, try Fallback Model
    if (!response.ok && response.status === 503) {
      console.warn("Primary Gemini 2.5-flash busy, falling back to 1.5-flash...");
      response = await fetchWithRetry(prompt, "gemini-3.1-flash-lite-preview", GEMINI_API_KEY);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error", data);
      throw new Error(data.error?.message || "Failed to generate insight.");
    }

    let candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error("No response generated from Gemini API.");
    }

    // Clean up potentially wrapped markdown (e.g. ```json ... ```)
    candidate = candidate.trim();
    if (candidate.startsWith("```json")) {
      candidate = candidate.replace(/^```json/g, "").replace(/```$/g, "").trim();
    } else if (candidate.startsWith("```")) {
      candidate = candidate.replace(/^```/g, "").replace(/```$/g, "").trim();
    }

    // Attempt to parse to ensure it's valid JSON before returning
    JSON.parse(candidate);

    // Return stringified JSON.
    return candidate;
  } catch (error) {
    console.warn("Smart Financial Insight Generation Error (handled):", error);
    throw error;
  }
}
