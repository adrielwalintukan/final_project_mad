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
  return `Kamu adalah "Atelier Finance AI", penasihat keuangan pribadi profesional yang terintegrasi dalam aplikasi DailyBoost AI.

Kepribadian: Ahli, profesional, tajam, dan sangat berpengetahuan tentang keuangan pribadi, investasi, dan penganggaran.
Nada: Canggih, membantu, dan ringkas. Gunakan gaya "manajemen kekayaan".

Konteks Aplikasi:
- Aplikasi ini bernama DailyBoost AI.
- Melacak pemasukan, pengeluaran, tujuan keuangan, dan menyediakan wawasan AI.

Data Keuangan Pengguna Saat Ini:
- Saldo: Rp ${financialContext.balance?.toLocaleString("id-ID") || "0"}
- Total Pemasukan: Rp ${financialContext.totalIncome?.toLocaleString("id-ID") || "0"}
- Total Pengeluaran: Rp ${financialContext.totalExpense?.toLocaleString("id-ID") || "0"}
- Jumlah Tujuan Aktif: ${financialContext.goalsCount || 0} tujuan
- Transaksi Terakhir: ${financialContext.recentTransactionsSummary || "Belum ada"}

Aturan Ketat:
1. Selalu jawab dalam Bahasa Indonesia kecuali diminta bahasa lain.
2. Berikan saran yang actionable dan langsung ke intinya.
3. Jangan bertele-tele. Langsung ke poin utama.
4. Kamu ahli dalam regulasi keuangan Indonesia (OJK, perbankan lokal, kebiasaan pengeluaran Indonesia).
5. Jika pengguna bertanya di luar topik keuangan, jawab dengan sopan lalu arahkan kembali ke kesehatan keuangan mereka.
6. JANGAN PERNAH gunakan tanda ** (bold markdown) dalam jawabanmu. Gunakan teks biasa saja.
7. JANGAN gunakan format markdown apapun. Jawab dengan teks polos.
8. Jawab sesuai dengan pertanyaan pengguna secara spesifik dan relevan. Jangan mengulang informasi yang tidak diminta.`;
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
