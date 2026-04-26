interface Message {
  role: "user" | "model";
  content: string;
}

export interface ModelOption {
  id: string;
  label: string;
  modelName: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "flash-lite", label: "Gemini 3.1 Flash Lite", modelName: "gemini-3.1-flash-lite-preview" },
  { id: "flash", label: "Gemini 2.5 Flash", modelName: "gemini-2.5-flash" },
  { id: "gemma", label: "Gemma 4 26B", modelName: "gemma-3-27b-it" },
];

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY1;

function buildSystemPrompt(financialContext: any): string {
  return `Kamu adalah "Atelier Finance AI", asisten keuangan pribadi yang modern, cerdas, dan penuh energi 🚀. Kamu terintegrasi dalam aplikasi DailyBoost AI.

KEPRIBADIAN:
- Ahli, profesional, namun tetap ramah dan suportif (seperti coach finansial pribadi).
- Senang membantu pengguna mencapai kebebasan finansial.
- Menggunakan bahasa yang elegan namun mudah dimengerti.

GAYA KOMUNIKASI:
- Modern & Lively: Gunakan emoji yang relevan (💰, 📉, 📈, ✨, 🚀) secara pas untuk membuat percakapan terasa hidup.
- Terstruktur: Gunakan penomoran dengan emoji hijau seperti 🟢 1., 🟢 2. untuk daftar atau langkah-langkah.
- Visual: Gunakan simbol seperti 🟢 atau ✅ untuk menandai hal positif, dan ⚠️ untuk peringatan.
- Fokus Data: Selalu gunakan data keuangan pengguna yang diberikan dalam konteks untuk memberikan jawaban yang spesifik.

KONTEKS KEUANGAN PENGGUNA SAAT INI:
- Saldo: Rp ${financialContext.balance?.toLocaleString("id-ID") || "0"}
- Total Pemasukan: Rp ${financialContext.totalIncome?.toLocaleString("id-ID") || "0"}
- Total Pengeluaran: Rp ${financialContext.totalExpense?.toLocaleString("id-ID") || "0"}
- Jumlah Target Tabungan: ${financialContext.goalsCount || 0}
- Ringkasan Transaksi Terakhir: ${financialContext.recentTransactionsSummary || "Belum ada"}

ATURAN:
1. Berikan saran yang bisa langsung dilakukan (actionable).
2. Jangan bertele-tele. Langsung ke poin utama.
3. Selalu jawab dalam Bahasa Indonesia yang natural dan modern.
4. JANGAN gunakan tanda ** (bold markdown). Gunakan teks biasa saja karena sistem akan membersihkannya.`;
}

export async function sendMessageToChatbot(
  messages: Message[],
  financialContext: any,
  modelName?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY1");
  }

  const selectedModel = modelName || AVAILABLE_MODELS[0].modelName;
  const systemPrompt = buildSystemPrompt(financialContext);

  // Build the conversation. System instruction goes first as a "user" turn,
  // followed by a placeholder "model" acknowledgment, then the real conversation.
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Saya mengerti. Saya siap membantu sebagai Atelier Finance AI." }] },
    ...messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Chatbot API Error:", data);
      // Auto-fallback to Gemini 2.5 Flash on failure
      if (selectedModel !== "gemini-2.5-flash") {
        console.warn(`Model ${selectedModel} failed, falling back to gemini-2.5-flash`);
        return await callModel("gemini-2.5-flash", contents);
      }
      throw new Error(data.error?.message || "Gagal mendapatkan respons dari AI");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Respons kosong dari AI");

    // Strip any ** markdown that might slip through
    return text.replace(/\*\*/g, "").replace(/\*/g, "");
  } catch (error) {
    console.error("Chatbot Service Error:", error);
    throw error;
  }
}

async function callModel(modelName: string, contents: any[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Fallback model juga gagal");
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Fallback respons kosong");
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}
