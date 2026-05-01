# 🚀 DailyBoost AI - Smart Financial Assistant

**DailyBoost AI** adalah aplikasi manajemen keuangan cerdas berbasis AI yang membantu Anda mengelola pengeluaran, menetapkan target tabungan, dan mendapatkan saran finansial yang personal. Dibangun menggunakan teknologi terbaru: **Expo**, **Convex**, dan **Google Gemini 3.1 AI**.

---

## ✨ Fitur Unggulan

### 🤖 AI-Powered Capabilities
- **AI Receipt Scanner**: Ekstraksi data otomatis dari foto struk belanja menggunakan Computer Vision.
- **AI Voice Transaction**: Input transaksi instan melalui perintah suara (Multimodal Audio).
- **AI Smart Insight**: Analisis harian otomatis yang memberikan saran finansial berdasarkan perilaku belanja.
- **Atelier AI Financial Advisor**: Chatbot interaktif yang memahami data keuangan Anda untuk konsultasi finansial.

### 💰 Financial Management
- **Intelligent Dashboard**: Pantau saldo, pemasukan, dan pengeluaran secara real-time.
- **Budgeting System**: Atur limit pengeluaran per kategori untuk mencegah pemborosan.
- **Savings Goals**: Tetapkan target tabungan dan pantau progress pencapaiannya secara visual.
- **History & Analytics**: Riwayat transaksi lengkap dengan grafik distribusi pengeluaran.

### 🛡️ User Experience & Security
- **OAuth 2.0 Secure Login**: Masuk aman menggunakan Akun Google.
- **Real-time Sync**: Data tersinkronisasi secara instan di semua perangkat melalui Convex Cloud.
- **Smart Undo System**: Fitur "Batal Hapus" instan untuk mencegah kehilangan data yang tidak disengaja.
- **Custom Profile**: Personalisasi akun dengan foto profil yang tersimpan di cloud storage.

---

## 🛠️ Tech Stack

- **Frontend**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 50+)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Convex](https://convex.dev/) (Real-time Backend-as-a-Service)
- **AI Engine**: [Google Gemini 3.1 Flash Lite](https://ai.google.dev/) (Multimodal Vision & Audio)
- **Navigation**: Expo Router (File-based Routing)
- **Icons**: Lucide React & Vector Icons

---

## 🚀 Cara Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/username/final-project-mad.git
cd final-project-mad
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori dan masukkan key berikut:
```env
EXPO_PUBLIC_CONVEX_URL=your_convex_url
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Jalankan Backend (Convex)
Pastikan Anda sudah login ke Convex CLI dan jalankan server dev:
```bash
npx convex dev
```

### 5. Jalankan Aplikasi (Expo)
Buka terminal baru dan jalankan Expo Go:
```bash
npx expo start
```
Scan QR Code menggunakan aplikasi **Expo Go** di HP Anda (Android/iOS).

---

## 📁 Struktur Folder Utama

```text
├── app/               # Expo Router (Pages & Layouts)
├── components/        # Reusable UI Components
├── context/           # React Context (Auth, Language, App State)
├── convex/            # Backend Functions & Database Schema
├── hooks/             # Custom React Hooks (Data Fetching)
├── services/          # AI Services Integration (Gemini)
├── utils/             # Helper Functions (Formatting, Dates)
└── assets/            # Images, Fonts, and Icons
```

---

## 📝 Catatan Pengembangan
Proyek ini dikembangkan menggunakan metodologi **Agile (Iterative & Incremental)**, memastikan setiap fitur diuji secara mendalam dan dioptimalkan untuk pengalaman pengguna terbaik.

---

**Dibuat oleh Adriel Walintukan - Proyek Akhir Mobile Application Development**
