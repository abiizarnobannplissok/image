# Deployment Guide - Vercel

Panduan lengkap untuk deploy **Nanoo Air Image Generator** ke Vercel.

## Prerequisites

1. Akun [Vercel](https://vercel.com) (gratis)
2. Akun [Supabase](https://supabase.com) (gratis)
3. Repository GitHub sudah ter-setup (https://github.com/abiizarnobannplissok/image)

---

## Step 1: Setup Supabase

### 1.1 Buat Project Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik **"New Project"**
3. Isi detail project:
   - **Name**: `nanoo-air` (atau nama lain)
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih region terdekat (contoh: `Southeast Asia (Singapore)`)
4. Klik **"Create new project"** dan tunggu ~2 menit

### 1.2 Setup Database

1. Buka **SQL Editor** di sidebar
2. Copy-paste SQL berikut dan klik **"Run"**:

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

### 1.3 Setup Storage Bucket

1. Klik **"Storage"** di sidebar
2. Klik **"New bucket"**
3. Isi form:
   - **Name**: `nanoo-images`
   - **Public bucket**: ✅ **CENTANG INI** (penting!)
4. Klik **"Create bucket"**

5. Setelah bucket dibuat, klik bucket `nanoo-images` → tab **"Policies"**
6. Klik **"New Policy"** dan pilih **"For full customization"**
7. Copy-paste 3 policies berikut satu per satu:

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nanoo-images');
```

#### Policy 2: Public Upload Access
```sql
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nanoo-images');
```

#### Policy 3: Public Delete Access
```sql
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'nanoo-images');
```

### 1.4 Dapatkan API Keys

1. Klik **"Settings"** di sidebar → **"API"**
2. Copy **2 values** berikut (kita butuh untuk Vercel):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (key yang panjang)

⚠️ **JANGAN SHARE** keys ini ke publik!

---

## Step 2: Deploy ke Vercel

### 2.1 Import Repository

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"Add New"** → **"Project"**
3. Klik **"Import Git Repository"**
4. Pilih repository: `abiizarnobannplissok/image`
5. Klik **"Import"**

### 2.2 Configure Project

Di halaman konfigurasi:

#### Framework Preset
- **Framework Preset**: Vite
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)

#### Environment Variables

Klik **"Environment Variables"** dan tambahkan 2 variables berikut:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Paste **Project URL** dari Supabase (Step 1.4) |
| `VITE_SUPABASE_ANON_KEY` | Paste **anon/public key** dari Supabase (Step 1.4) |

**Contoh:**
```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg1NzE2MDAsImV4cCI6MjAwNDE0NzYwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Deploy

1. Klik **"Deploy"**
2. Tunggu ~2-3 menit
3. Setelah selesai, klik **"Visit"** untuk buka website

🎉 **Website Anda sudah LIVE!**

---

## Step 3: Testing

### 3.1 Test Generate Image

1. Buka website Vercel Anda
2. Klik **"Add API Key"** → Masukkan Gemini API Key
3. Tulis prompt: `A beautiful sunset over the ocean`
4. Klik **"Run"**
5. Tunggu image ter-generate

### 3.2 Verify Supabase Storage

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Klik project Anda
3. Buka **Storage** → `nanoo-images` → folder `generated-images/`
4. **Harusnya ada file image baru!** (contoh: `abc123.png`)

5. Buka **Table Editor** → table `generated_images`
6. **Harusnya ada record baru** dengan:
   - `id`: ID unik
   - `prompt`: Prompt yang Anda tulis
   - `public_url`: URL image di Supabase Storage
   - `status`: `success`

### 3.3 Test Refresh

1. Refresh halaman website Vercel
2. **Image yang sudah di-generate harusnya MASIH ADA** (tidak hilang)
3. **Tidak ada loading spinner** pada image yang sudah success

**Jika masih ada loading spinner:**
- Buka Developer Console (`F12`)
- Lihat debug logs di Console tab
- Screenshot dan share logs tersebut

---

## Troubleshooting

### ❌ Error: "Supabase credentials not found"

**Penyebab**: Environment variables tidak ter-set di Vercel

**Solusi**:
1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah ada
3. Klik **"Redeploy"** untuk trigger rebuild

### ❌ Error: "new row violates row-level security policy"

**Penyebab**: RLS policies belum dibuat dengan benar

**Solusi**:
1. Buka Supabase Dashboard → Table Editor → `generated_images` → Policies
2. Pastikan ada 3 policies: "Public read access", "Public insert access", "Public delete access"
3. Jika belum ada, jalankan ulang SQL di Step 1.2

### ❌ Error: "Permission denied for storage"

**Penyebab**: Storage bucket bukan public atau policies belum dibuat

**Solusi**:
1. Buka Supabase Dashboard → Storage → `nanoo-images`
2. Klik ⚙️ (Settings) → Pastikan **"Public bucket"** ter-centang
3. Buka tab **"Policies"** → Pastikan ada 3 policies (Step 1.3)

### ❌ Images tidak muncul setelah refresh

**Penyebab**: Kemungkinan browser cache atau localStorage issue

**Solusi**:
1. Hard refresh: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
2. Buka Console (`F12`) → Lihat debug logs
3. Clear localStorage: Jalankan `localStorage.clear()` di Console, lalu refresh
4. Test di Incognito/Private window

### ❌ Build gagal di Vercel

**Penyebab**: Dependency atau build config issue

**Solusi**:
1. Check build logs di Vercel Dashboard
2. Pastikan `package.json` memiliki `"build": "vite build"` di scripts
3. Pastikan semua dependencies ter-install (check `package-lock.json`)

---

## Custom Domain (Optional)

Jika Anda ingin custom domain (contoh: `nanooair.com`):

1. Buka Vercel Dashboard → Project Settings → Domains
2. Klik **"Add"**
3. Masukkan domain Anda
4. Follow instruksi untuk update DNS records
5. Tunggu ~5-10 menit untuk propagation

---

## Update Code

Setiap kali Anda push code baru ke GitHub:

1. Vercel akan **otomatis detect** dan **rebuild**
2. Tidak perlu deploy manual lagi
3. Check deployment status di Vercel Dashboard → Deployments

---

## Environment Variables Cheat Sheet

Untuk development lokal, buat file `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **JANGAN commit** `.env.local` ke GitHub! (sudah ada di `.gitignore`)

---

## Support

Jika ada masalah:

1. Check debug logs di browser Console (`F12`)
2. Check Vercel deployment logs
3. Check Supabase logs (Settings → Logs)
4. Contact support atau share screenshot error

---

**Happy Deploying! 🚀**
