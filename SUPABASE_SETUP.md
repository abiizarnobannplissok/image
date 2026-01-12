# Supabase Setup Instructions

Ikuti langkah-langkah berikut untuk mengonfigurasi Supabase Storage dan Database untuk NanooAir.

## 1. Setup Database Table

Buka **SQL Editor** di dashboard Supabase Anda, kemudian jalankan SQL berikut:

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

-- Policy: Allow anyone to delete images (optional, sesuaikan dengan kebutuhan)
CREATE POLICY "Public delete access" 
ON generated_images 
FOR DELETE 
USING (true);
```

## 2. Setup Storage Bucket

### Langkah 2.1: Buat Storage Bucket
1. Buka **Storage** di dashboard Supabase
2. Klik **"New bucket"**
3. Nama bucket: `nanoo-images`
4. **Public bucket**: ✅ **CENTANG** (agar gambar bisa diakses publik)
5. Klik **"Create bucket"**

### Langkah 2.2: Setup Storage Policies
Setelah bucket dibuat, klik bucket `nanoo-images`, lalu buka tab **"Policies"**.

Buat 3 policies berikut:

#### Policy 1: Public Read Access (SELECT)
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nanoo-images');
```

#### Policy 2: Public Upload Access (INSERT)
```sql
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nanoo-images');
```

#### Policy 3: Public Delete Access (DELETE) - Optional
```sql
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'nanoo-images');
```

## 3. Verifikasi Setup

Setelah semua setup selesai, verifikasi:

### ✅ Checklist:
- [ ] Table `generated_images` sudah dibuat
- [ ] Index pada `timestamp` sudah dibuat
- [ ] RLS (Row Level Security) sudah enabled
- [ ] 3 RLS policies untuk table sudah dibuat (SELECT, INSERT, DELETE)
- [ ] Storage bucket `nanoo-images` sudah dibuat sebagai **public bucket**
- [ ] 3 Storage policies sudah dibuat (SELECT, INSERT, DELETE)

## 4. Testing

Setelah setup selesai:
1. Jalankan `npm run dev`
2. Generate image baru
3. Check di Supabase Dashboard:
   - **Storage** → `nanoo-images` → harusnya ada folder `generated-images/`
   - **Table Editor** → `generated_images` → harusnya ada record baru

## Troubleshooting

### Error: "new row violates row-level security policy"
- Pastikan RLS policies sudah dibuat dengan benar
- Cek policies di Table Editor → `generated_images` → Policies

### Error: "Permission denied for storage"
- Pastikan bucket `nanoo-images` dibuat sebagai **public bucket**
- Cek storage policies di Storage → `nanoo-images` → Policies

### Images tidak muncul
- Cek console browser untuk error
- Verifikasi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env.local`
- Restart dev server setelah update `.env.local`

## Notes

- **localStorage tetap digunakan** untuk menyimpan foto lama yang sudah di-generate sebelumnya
- Foto baru akan otomatis tersimpan ke Supabase dan terlihat oleh semua user
- Foto lama di localStorage tidak akan hilang dan tetap terlihat
