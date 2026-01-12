import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uinqxiwkjqmjeknzftmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbnF4aXdranFtamVrbnpmdG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjQyNjUsImV4cCI6MjA4MDg0MDI2NX0.kYmJ6HRLhB7A8Oil4SoMd0b7A7Bw8KuOOMeQguSmM8c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n');

  console.log('1. Checking database table "generated_images"...');
  const { data: tableData, error: tableError } = await supabase
    .from('generated_images')
    .select('*')
    .limit(1);

  if (tableError) {
    if (tableError.message.includes('relation') || tableError.message.includes('does not exist')) {
      console.log('❌ Table "generated_images" NOT FOUND\n');
      console.log('📝 You need to run this SQL in Supabase SQL Editor:\n');
      console.log('---SQL START---');
      console.log(`CREATE TABLE IF NOT EXISTS generated_images (
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

CREATE INDEX IF NOT EXISTS idx_generated_images_timestamp 
ON generated_images(timestamp DESC);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON generated_images FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON generated_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete access" ON generated_images FOR DELETE USING (true);`);
      console.log('---SQL END---\n');
    } else {
      console.log(`❌ Error checking table: ${tableError.message}\n`);
    }
  } else {
    console.log(`✅ Table "generated_images" exists (${tableData?.length || 0} records)\n`);
  }

  console.log('2. Checking storage bucket "nanoo-images"...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.log(`❌ Error checking buckets: ${bucketError.message}\n`);
  } else {
    const nanooImagesBucket = buckets.find(b => b.name === 'nanoo-images');
    if (nanooImagesBucket) {
      console.log(`✅ Bucket "nanoo-images" exists (Public: ${nanooImagesBucket.public})\n`);
      
      if (!nanooImagesBucket.public) {
        console.log('⚠️  WARNING: Bucket is NOT public! You need to:');
        console.log('   1. Go to Supabase Storage -> nanoo-images');
        console.log('   2. Click Settings icon');
        console.log('   3. Enable "Public bucket"\n');
      }

      console.log('3. Checking storage policies...');
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testPath = `test-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from('nanoo-images')
        .upload(testPath, testFile);

      if (uploadError) {
        console.log(`❌ Upload test failed: ${uploadError.message}`);
        console.log('\n📝 You need to create storage policies in Supabase:');
        console.log('   Go to Storage -> nanoo-images -> Policies tab\n');
        console.log('---SQL START---');
        console.log(`CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'nanoo-images');
CREATE POLICY "Public upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nanoo-images');
CREATE POLICY "Public delete access" ON storage.objects FOR DELETE USING (bucket_id = 'nanoo-images');`);
        console.log('---SQL END---\n');
      } else {
        console.log('✅ Storage policies working correctly\n');
        
        await supabase.storage.from('nanoo-images').remove([testPath]);
      }
    } else {
      console.log('❌ Bucket "nanoo-images" NOT FOUND\n');
      console.log('📝 You need to:');
      console.log('   1. Go to Supabase Storage');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: nanoo-images');
      console.log('   4. ✅ Check "Public bucket"');
      console.log('   5. Click "Create bucket"\n');
    }
  }

  console.log('\n🎯 Next steps:');
  console.log('   1. Fix any ❌ issues above');
  console.log('   2. Deploy to Vercel with environment variables');
  console.log('   3. Test image generation\n');
}

verifySetup().catch(console.error);
