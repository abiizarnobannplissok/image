# 🚀 PANDUAN SETUP - LANGKAH DEMI LANGKAH

**Pilih salah satu:**
- ⭐ **Option A**: Deploy langsung ke Vercel (RECOMMENDED - paling cepat)
- **Option B**: Setup lokal dulu untuk testing

---

## ⭐ OPTION A: DEPLOY LANGSUNG KE VERCEL (RECOMMENDED)

**Waktu: ~15 menit** ⏱️

### STEP 1: Setup Supabase (10 menit)

#### 1.1 Buat Project Supabase
1. Buka https://app.supabase.com
2. Login/Sign up (pakai GitHub lebih cepat)
3. Klik **"New Project"**
4. Isi:
   - **Organization**: Pilih existing atau buat baru
   - **Name**: `nanoo-air` (atau nama lain yang Anda suka)
   - **Database Password**: Buat password kuat (SIMPAN password ini!)
   - **Region**: `Southeast Asia (Singapore)` atau terdekat
5. Klik **"Create new project"**
6. **TUNGGU ~2-3 menit** sampai project ready (ada loading bar)

#### 1.2 Setup Database Table
1. Setelah project ready, klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Copy-paste SQL ini ke editor:

```sql
-- Create table for generated images metadata
CREATE TABLE IF NOT EXISTS generated_images (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_images_timestamp 
ON generated_images(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read images (public access)
CREATE POLICY "Public read access" 
ON generated_images 
FOR SELECT 
USING (true);

-- Policy: Allow anyone to insert images
CREATE POLICY "Public insert access" 
ON generated_images 
FOR INSERT 
WITH CHECK (true);

-- Policy: Allow anyone to delete images
CREATE POLICY "Public delete access" 
ON generated_images 
FOR DELETE 
USING (true);
```

4. Klik **"Run"** (atau tekan `Ctrl+Enter`)
5. Harusnya muncul "Success. No rows returned"

#### 1.3 Setup Storage Bucket
1. Klik **"Storage"** di sidebar kiri
2. Klik **"New bucket"**
3. Isi:
   - **Name**: `nanoo-images` (HARUS PERSIS INI!)
   - **Public bucket**: ✅ **CENTANG/CHECK INI** (PENTING!)
4. Klik **"Create bucket"**

5. Klik bucket `nanoo-images` yang baru dibuat
6. Klik tab **"Policies"**
7. Klik **"New Policy"** → **"For full customization"**
8. Copy-paste SQL ini (satu per satu, total 3 policies):

**Policy 1:**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nanoo-images');
```
Klik **"Review"** → **"Save policy"**

**Policy 2:**
```sql
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nanoo-images');
```
Klik **"Review"** → **"Save policy"**

**Policy 3:**
```sql
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'nanoo-images');
```
Klik **"Review"** → **"Save policy"**

#### 1.4 Copy API Keys (PENTING!)
1. Klik **"Settings"** di sidebar kiri
2. Klik **"API"**
3. **COPY 2 VALUES INI** (kita butuh nanti):
   - **Project URL**: Contoh `https://abcdefgh.supabase.co`
   - **anon public key**: Key yang panjang, mulai dengan `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

✅ **STEP 1 SELESAI!** Supabase sudah ready.

---

### STEP 2: Deploy ke Vercel (5 menit)

#### 2.1 Login ke Vercel
1. Buka https://vercel.com/login
2. Login dengan **GitHub** (recommended)

#### 2.2 Import Project
1. Di Vercel Dashboard, klik **"Add New"** → **"Project"**
2. Klik **"Import Git Repository"**
3. Cari repository: `abiizarnobannplissok/image`
4. Klik **"Import"**

#### 2.3 Configure Build Settings
Di halaman configure:

**Framework Preset**: `Vite` (harusnya auto-detect)

**Root Directory**: `./` (default, jangan diubah)

**Build Command**: `npm run build` (default, jangan diubah)

**Output Directory**: `dist` (default, jangan diubah)

#### 2.4 Add Environment Variables (PENTING!)
Scroll ke bawah ke section **"Environment Variables"**

Klik **"Add"** dan masukkan **2 variables** ini:

**Variable 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Paste **Project URL** dari Supabase (Step 1.4)
- Contoh: `https://abcdefgh.supabase.co`

**Variable 2:**
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Paste **anon public key** dari Supabase (Step 1.4)
- Contoh: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg1NzE2MDAsImV4cCI6MjAwNDE0NzYwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Environment**: Pilih **"Production"** (default)

#### 2.5 Deploy!
1. Klik **"Deploy"**
2. **TUNGGU ~2-3 menit** (ada loading animation)
3. Setelah selesai, akan muncul konfetti 🎉
4. Klik **"Visit"** untuk buka website Anda

✅ **WEBSITE ANDA SUDAH LIVE!** 🚀

---

### STEP 3: Test Website (2 menit)

1. **Buka website Vercel Anda**
2. Klik **"Add API Key"**
3. Masukkan **Gemini API Key** Anda
   - Belum punya? Buat di: https://aistudio.google.com/apikey
4. Pilih model: **Nano Banana 🍌** (paling cepat untuk testing)
5. Tulis prompt: `A beautiful sunset over the ocean`
6. Klik **"Run"**
7. Tunggu ~10-20 detik
8. **Image harusnya muncul!** ✅

#### Verify di Supabase:
1. Buka Supabase Dashboard → **Storage** → `nanoo-images`
2. Klik folder `generated-images/`
3. **Harusnya ada file `.png` baru!** ✅
4. Klik file → Preview image

5. Buka **Table Editor** → table `generated_images`
6. **Harusnya ada record baru!** ✅

#### Test Refresh:
1. **Refresh halaman website** (`F5`)
2. **Image harusnya masih ada** (tidak hilang)
3. **Tidak ada loading spinner** pada image yang sudah success

✅ **SEMUA WORKING!** 🎉

---

## OPTION B: SETUP LOKAL UNTUK TESTING

**Waktu: ~10 menit**

### STEP 1: Setup Supabase
Ikuti **STEP 1** dari Option A di atas (sama persis)

### STEP 2: Setup Environment Lokal
1. Buka terminal di folder project
2. Buat file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` dengan text editor:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Ganti dengan credentials dari Supabase (Step 1.4)
5. Save file

### STEP 3: Run Development Server
```bash
npm install
npm run dev
```

Open browser: http://localhost:5173

Test generate image seperti di Option A Step 3

---

## ❓ PERTANYAAN UMUM

### "Saya pilih yang mana?"
**Jawab**: Pilih **Option A** (deploy ke Vercel). Lebih cepat dan langsung live di internet!

### "Saya harus punya Gemini API Key?"
**Jawab**: Ya, gratis. Buat di https://aistudio.google.com/apikey (perlu Google account)

### "Berapa biaya Supabase + Vercel?"
**Jawab**: **GRATIS!** Kedua platform punya free tier yang cukup besar.

### "Kalau ada error gimana?"
**Jawab**: 
1. Screenshot error message
2. Buka browser Console (`F12` → Console tab)
3. Screenshot logs
4. Share ke saya

### "Supabase saya sudah ada, tapi lupa setup apa saja"
**Jawab**: Cek checklist di bawah ini ⬇️

---

## ✅ VERIFICATION CHECKLIST

Jika Anda **sudah punya Supabase** tapi tidak yakin sudah setup dengan benar:

### Check Database:
- [ ] Buka Supabase → **Table Editor**
- [ ] Ada table `generated_images`? ✅
- [ ] Klik table → Tab **"Policies"**
- [ ] Ada 3 policies (Public read, insert, delete)? ✅

### Check Storage:
- [ ] Buka Supabase → **Storage**
- [ ] Ada bucket `nanoo-images`? ✅
- [ ] Bucket settings → **"Public bucket"** ter-centang? ✅
- [ ] Tab **"Policies"** → Ada 3 policies? ✅

### Jika ada yang belum ✅:
Ikuti **STEP 1** di Option A untuk re-setup yang kurang

---

## 🆘 BUTUH BANTUAN?

Kalau masih bingung, kasih tahu saya:
1. "Saya mau deploy ke Vercel" → Follow Option A
2. "Saya mau test lokal dulu" → Follow Option B
3. "Saya sudah punya Supabase tapi lupa setup apa" → Check verification checklist
4. "Saya stuck di step X" → Kasih tahu step mana yang error

---

**Pilihan saya untuk Anda: OPTION A** ⭐
Langsung deploy ke Vercel, paling cepat dan hasilnya langsung live!
