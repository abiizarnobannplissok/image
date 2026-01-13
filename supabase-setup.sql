-- =====================================================
-- NANOO AIR - COMPLETE SUPABASE SETUP SQL
-- =====================================================
-- Copy semua SQL ini dan paste di Supabase SQL Editor
-- Lalu klik "Run" atau tekan Ctrl+Enter
-- =====================================================

-- =====================================================
-- 1. CREATE DATABASE TABLE
-- =====================================================

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

-- =====================================================
-- 2. DATABASE TABLE POLICIES (Public Access)
-- =====================================================

-- Policy: Allow anyone to read images
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

-- =====================================================
-- 3. STORAGE BUCKET POLICIES (Run setelah bucket dibuat)
-- =====================================================
-- CATATAN: Anda harus buat bucket "nanoo-images" dulu secara manual!
-- Cara: Storage → New bucket → Name: nanoo-images → Centang "Public bucket"
--
-- Setelah bucket dibuat, jalankan 3 SQL di bawah ini:
-- =====================================================

-- Policy 1: Allow anyone to read files from storage
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nanoo-images');

-- Policy 2: Allow anyone to upload files to storage
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nanoo-images');

-- Policy 3: Allow anyone to delete files from storage
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'nanoo-images');

-- =====================================================
-- SETUP SELESAI!
-- =====================================================
-- Checklist:
-- ✅ Table "generated_images" created
-- ✅ Index created
-- ✅ RLS enabled
-- ✅ 3 database policies created
-- ✅ Storage bucket "nanoo-images" created (manual)
-- ✅ 3 storage policies created
--
-- Next Steps:
-- 1. Copy Project URL dari Settings → API
-- 2. Copy anon public key dari Settings → API
-- 3. Update Vercel environment variables
-- 4. Redeploy
-- 5. Test!
-- =====================================================
