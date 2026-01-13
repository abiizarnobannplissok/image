# 🔧 Troubleshooting Supabase Upload Issues

## ⚠️ Problem: Images NOT Uploading to Supabase

If images appear on the device where they were generated but **NOT on other devices**, this means Supabase Storage upload is failing.

---

## 🔍 Step 1: Run Diagnostic Test (CRITICAL)

We've created a diagnostic tool to test your Supabase connection:

1. **Open the diagnostic tool**:
   - Open file: `test-supabase-upload.html` in your browser
   - Or navigate to: `https://your-vercel-app.vercel.app/test-supabase-upload.html` (after deploying)

2. **Run the test**:
   - Credentials are pre-filled
   - Click **"Run Full Diagnostic Test"**
   - Wait for all 7 tests to complete

3. **Check results**:
   - Look for **RED errors** (❌)
   - Screenshot the entire log output
   - Share the screenshot for debugging

### What the Diagnostic Tests:

| Test | Purpose |
|------|---------|
| 1. Storage Bucket Connection | Verifies you can connect to Supabase |
| 2. List Files in Bucket | Checks bucket permissions |
| 3. Upload Test Image | **CRITICAL** - Tests if upload actually works |
| 4. Get Public URL | Verifies public URL generation |
| 5. Verify File Exists | Confirms file is in storage |
| 6. Database Connection | Tests database access |
| 7. Database Insert | Tests metadata saving |

---

## 🔍 Step 2: Check Browser Console for Errors

When you generate a new image on the website:

1. **Open Developer Tools**:
   - Press `F12` (Windows/Linux)
   - Press `Cmd + Option + I` (Mac)

2. **Go to Console tab**

3. **Generate a new image** and watch for logs:
   - Look for lines starting with 🔍, ☁️, ❌
   - **Screenshot any RED errors**

### Expected Console Output (Success):

```
✅ Supabase credentials loaded
✅ Supabase client initialized successfully
✅ Supabase Storage connection test PASSED
🔍 Starting Supabase upload for image: abc123...
📦 Converting base64 to blob...
   - Blob size: 245678 bytes
☁️ Uploading to Supabase Storage bucket "nanoo-images"...
✅ Storage upload successful
🔗 Generating public URL...
💾 Saving metadata to database...
✅✅✅ Image fully uploaded to Supabase: abc123
```

### Common Error Patterns:

#### ❌ Error 1: "Supabase credentials not found"

```
⚠️ Supabase credentials not found. Image sharing will be disabled.
   - VITE_SUPABASE_URL: MISSING
```

**Solution**: 
- Environment variables not set in Vercel
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Redeploy** (important!)

#### ❌ Error 2: "Upload error: new row violates row-level security policy"

```
❌ STORAGE UPLOAD FAILED: new row violates row-level security policy
```

**Solution**:
- Storage policies are incorrect or missing
- Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** section "Storage Policies"
- Run the SQL commands again

#### ❌ Error 3: "Bucket not found"

```
❌ STORAGE UPLOAD FAILED: Bucket not found
```

**Solution**:
- Bucket `nanoo-images` doesn't exist
- Go to Supabase Dashboard → Storage
- Create bucket named `nanoo-images`
- Set to **Public**

#### ❌ Error 4: "Database insert error: permission denied"

```
❌ DATABASE INSERT FAILED: permission denied for table generated_images
```

**Solution**:
- RLS policies not configured
- Run the SQL from **[supabase-setup.sql](./supabase-setup.sql)**

---

## 🔍 Step 3: Verify Supabase Dashboard

### Check Storage Bucket:

1. Go to **Supabase Dashboard** → **Storage**
2. Click on bucket `nanoo-images`
3. **Look for folder `generated-images/`**:
   - ✅ **If folder exists**: Upload is working! Check database
   - ❌ **If folder MISSING**: Storage upload is failing (see errors above)

### Check Database:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Open table `generated_images`
3. **Look for recent entries**:
   - ✅ **If entries exist**: Database working! Check storage
   - ❌ **If no entries**: Database insert failing (check RLS policies)

---

## 🔍 Step 4: Verify Environment Variables in Production

Check if Vercel loaded the environment variables correctly:

1. **Open your deployed website**
2. **Open browser console** (F12)
3. **Run this command**:
   ```javascript
   console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
   ```

**Expected output**:
```
VITE_SUPABASE_URL: https://hxlwmbyvsumnfezmkfac.supabase.co
```

**If you see `undefined`**:
- Environment variables NOT loaded
- Go to Vercel → Settings → Environment Variables
- Make sure variables are set for **Production** environment
- **Redeploy** the project

---

## 🔧 Quick Fixes Checklist

Try these in order:

### Fix 1: Hard Redeploy on Vercel

Environment variables might not be loaded:

1. Go to **Vercel Dashboard** → Your Project
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Select **"Use existing Build Cache"** = OFF
5. Click **"Redeploy"**

### Fix 2: Verify Storage Policies

Run this SQL in **Supabase SQL Editor**:

```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

You should see **3 policies** for bucket `nanoo-images`.

**If missing**, run **[supabase-setup.sql](./supabase-setup.sql)** again.

### Fix 3: Make Bucket Public (Again)

Sometimes bucket becomes private accidentally:

1. Go to **Supabase Dashboard** → **Storage**
2. Click **gear icon** next to `nanoo-images`
3. Make sure **"Public bucket"** is checked
4. Click **"Save"**

### Fix 4: Recreate Storage Policies

Delete and recreate storage policies:

```sql
-- Delete existing policies (if any)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- Recreate policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nanoo-images');

CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nanoo-images');

CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'nanoo-images');
```

---

## 📊 Understanding the Upload Flow

Here's what happens when you generate an image:

```
1. Generate Image with Gemini API
   ↓
2. Save to localStorage (immediate, always works)
   ↓
3. Convert base64 → Blob
   ↓
4. Upload Blob to Supabase Storage (nanoo-images/generated-images/abc123.png)
   ↓ (if successful)
5. Get public URL from Storage
   ↓
6. Save metadata to Database (generated_images table)
   ↓ (if successful)
7. Image now visible on ALL devices ✅
```

**If step 4 fails** → Image only on current device
**If step 6 fails** → File in storage, but not in database (won't load on refresh)

---

## 🆘 Still Not Working?

If you've tried all steps above and images still don't upload:

### What to Share for Help:

1. **Screenshot of diagnostic test results** (`test-supabase-upload.html`)
2. **Screenshot of browser console** when generating image (with errors visible)
3. **Screenshot of Supabase Storage dashboard** (showing bucket contents)
4. **Screenshot of Vercel environment variables** (Settings → Environment Variables)
5. **Output of this SQL query**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

### Common Root Causes:

| Symptom | Likely Cause |
|---------|--------------|
| Console shows "Supabase not configured" | Environment variables not set in Vercel |
| Console shows "Upload error: policy" | Storage RLS policies missing/wrong |
| Console shows "Bucket not found" | Bucket name mismatch or doesn't exist |
| Folder `generated-images/` doesn't exist | Upload step failing (check policies) |
| Database empty but folder has files | Database insert failing (check table policies) |

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows **"✅✅✅ Image fully uploaded to Supabase"**
2. ✅ Folder `generated-images/` exists in Storage bucket
3. ✅ Table `generated_images` has new entries
4. ✅ Images load on different devices
5. ✅ Images persist after clearing localStorage

---

**Last Updated**: January 13, 2026
