export interface ExtractedTransaction {
  amount: number;
  category: string;
  note: string;
  type: "expense" | "income";
  insight?: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Prompt khusus untuk memproses gambar struk belanja
const RECEIPT_SYSTEM_PROMPT = `
Kamu adalah asisten keuangan AI cerdas. Tugasmu adalah membaca gambar struk/nota belanja dan mengekstrak datanya menjadi format JSON yang sangat terstruktur.

ATURAN WAJIB:
1. Nominal (amount): Ambil total belanja akhir (Grand Total) dalam angka bulat (hilangkan Rp, titik, koma). Contoh: 50000.
2. Kategori (category): Tentukan kategori pengeluaran berdasarkan nama toko atau barang yang paling dominan di struk. Pilih salah satu dari kategori ini (WAJIB bahasa Inggris):
   - Food
   - Transport
   - Shopping
   - Entertainment
   - Health
   - Bills
   - Education
   - Other
3. Tipe (type): Selalu "expense" (pengeluaran) untuk struk belanja.
4. Catatan (note): Ambil nama toko atau 1-2 barang utama yang dibeli (contoh: "Indomaret - Beli camilan", "Makan siang KFC", "Shell Bensin").
5. Insight: Berikan satu kalimat singkat (max 2 kalimat) berupa feedback atau saran lucu/profesional terhadap struk tersebut. (contoh: "Wah, jajan terus nih! Jangan lupa sisihkan buat nabung ya.")

PENTING: Jika gambar tidak terlihat seperti struk atau tidak terbaca sama sekali, KEMBALIKAN JSON dengan amount 0, note "Struk tidak jelas", dan insight "Tolong foto struknya lebih jelas". JANGAN MENGARANG NOMINAL.

Keluarkan output HANYA dalam format JSON valid tanpa markdown (tanpa \`\`\`json).
Contoh output:
{
  "amount": 150000,
  "category": "Food",
  "note": "HokBen - Makan malam",
  "type": "expense",
  "insight": "Makan enak boleh, tapi ingat budget bulanan ya!"
}
`;

export async function extractTransactionFromImage(
  base64Image: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key");
  }

  // Gunakan Gemini 3.1 Flash Lite Preview untuk kecepatan dan efisiensi, atau 2.5 Flash Lite
  let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: RECEIPT_SYSTEM_PROMPT,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Rendah agar AI fokus pada akurasi ekstraksi teks dari struk
      responseMimeType: "application/json",
    },
  };

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok && response.status === 503) {
      console.warn("Model sibuk, menggunakan fallback ke gemini-2.5-flash-lite...");
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON
    const cleanText = textRes.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as ExtractedTransaction;
  } catch (error) {
    console.error("Image Parsing Error:", error);
    throw error;
  }
}
