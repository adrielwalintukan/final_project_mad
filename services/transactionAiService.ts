export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface ExtractedTransaction {
  amount: number;
  category: string;
  type: "expense" | "income";
  note: string;
  insight?: string;
}

const SYSTEM_PROMPT = `
Kamu adalah asisten keuangan pintar. Tugasmu adalah mendengarkan pesan suara pengguna (atau membaca teks terjemahannya) terkait transaksi keuangan, dan mengekstrak informasi berikut:
1. Nominal uang (amount): Angka bulat (contoh: 50000).
2. Kategori (category): Harus salah satu dari pengeluaran: ["Food", "Transport", "Shopping", "Rent", "Fun", "Health", "Bills"] atau pemasukan: ["Salary", "Bonus", "Freelance", "Investment", "Business", "Gift", "Other"]. Pilih yang paling masuk akal.
3. Tipe (type): "expense" (pengeluaran) atau "income" (pemasukan).
4. Catatan (note): Nama toko, barang, atau deskripsi singkat (contoh: "Beli bensin", "Makan siang KFC", "Gaji bulanan").
5. Insight: Berikan satu kalimat singkat (max 2 kalimat) berupa feedback atau saran lucu/profesional terhadap transaksi tersebut. (contoh: "Wah, makan siang mewah nih! Jangan lupa sisihkan buat nabung ya.")

PENTING: Jika kamu TIDAK MENDENGAR apapun atau file audio kosong, KEMBALIKAN JSON dengan amount 0, note "Suara tidak jelas", dan insight "Tolong ulangi suaranya". JANGAN PERNAH MENGARANG TRANSAKSI SENDIRI.

Keluarkan output HANYA dalam format JSON valid tanpa markdown (tanpa \`\`\`json).
Contoh output:
{
  "amount": 50000,
  "category": "Food",
  "type": "expense",
  "note": "Makan siang KFC",
  "insight": "Wah, makan siang mewah nih! Jangan lupa sisihkan buat nabung ya."
}
`;

export async function extractTransactionFromAudio(
  base64Audio: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key");
  }

  // Gunakan Gemini 3.1 Flash Lite Preview (sesuai ketersediaan token pengguna)
  let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
        ],
      },
    ],
  };

  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  let data = await response.json();

  // Jika model sibuk (503), fallback ke gemini-2.5-flash-lite
  if (!response.ok && response.status === 503) {
    console.warn("Model sibuk, menggunakan fallback ke gemini-2.5-flash-lite...");
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    data = await response.json();
  }

  if (!response.ok) {
    console.error("Gemini API Error:", data);
    throw new Error(data.error?.message || "Failed to parse audio with Gemini.");
  }

  let candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidate) {
    throw new Error("No response generated from Gemini API.");
  }

  candidate = candidate.trim();
  if (candidate.startsWith("```json")) {
    candidate = candidate.replace(/^```json/g, "").replace(/```$/g, "").trim();
  } else if (candidate.startsWith("```")) {
    candidate = candidate.replace(/^```/g, "").replace(/```$/g, "").trim();
  }

  try {
    const parsedData = JSON.parse(candidate);
    return parsedData as ExtractedTransaction;
  } catch (error) {
    console.error("Failed to parse JSON from Gemini:", candidate);
    throw new Error("Invalid JSON format returned from AI.");
  }
}
