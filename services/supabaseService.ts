
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedImage } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Image sharing will be disabled.');
  console.warn('   - VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.warn('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
} else {
  console.log('✅ Supabase credentials loaded');
  console.log('   - URL:', supabaseUrl);
  console.log('   - Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  
  supabase.storage.from('nanoo-images').list('', { limit: 1 })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Supabase Storage connection test FAILED:', error);
      } else {
        console.log('✅ Supabase Storage connection test PASSED');
      }
    });
}

/**
 * Upload image to Supabase Storage and save metadata to database
 * @param image Generated image data
 * @returns Success status
 */
export const uploadImageToSupabase = async (image: GeneratedImage): Promise<boolean> => {
  console.log('🔍 Starting Supabase upload for image:', image.id);
  console.log('   - Supabase configured:', !!supabase);
  console.log('   - Image URL exists:', !!image.url);
  console.log('   - Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('   - Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  if (!supabase || !image.url) {
    console.error('❌ Supabase upload BLOCKED:');
    console.error('   - Supabase client:', supabase ? 'OK' : 'MISSING');
    console.error('   - Image URL:', image.url ? 'OK' : 'MISSING');
    return false;
  }

  try {
    console.log('📦 Converting base64 to blob...');
    const base64Data = image.url.split(',')[1];
    if (!base64Data) {
      console.error('❌ Failed to extract base64 data from URL');
      return false;
    }
    
    const mimeType = image.url.match(/data:([^;]+);/)?.[1] || 'image/png';
    const blob = base64ToBlob(base64Data, mimeType);
    console.log('   - Blob size:', blob.size, 'bytes');
    console.log('   - MIME type:', mimeType);
    
    const fileExtension = mimeType.split('/')[1];
    const fileName = `${image.id}.${fileExtension}`;
    const filePath = `generated-images/${fileName}`;
    console.log('   - Upload path:', filePath);

    console.log('☁️ Uploading to Supabase Storage bucket "nanoo-images"...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nanoo-images')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ STORAGE UPLOAD FAILED:', {
        message: uploadError.message,
        name: uploadError.name
      });
      console.error('Full error object:', JSON.stringify(uploadError, null, 2));
      return false;
    }
    
    console.log('✅ Storage upload successful:', uploadData);

    console.log('🔗 Generating public URL...');
    const { data: urlData } = supabase.storage
      .from('nanoo-images')
      .getPublicUrl(filePath);
    console.log('   - Public URL:', urlData.publicUrl);

    console.log('💾 Saving metadata to database...');
    const dbRecord = {
      id: image.id,
      prompt: image.prompt,
      aspect_ratio: image.aspectRatio,
      timestamp: image.timestamp,
      status: image.status,
      storage_path: filePath,
      public_url: urlData.publicUrl
    };
    console.log('   - Database record:', dbRecord);
    
    const { error: dbError } = await supabase
      .from('generated_images')
      .insert([dbRecord]);

    if (dbError) {
      console.error('❌ DATABASE INSERT FAILED:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      });
      console.error('Full error object:', JSON.stringify(dbError, null, 2));
      return false;
    }

    console.log('✅✅✅ Image fully uploaded to Supabase:', image.id);
    return true;
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR during Supabase upload:');
    console.error('   - Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   - Error message:', error instanceof Error ? error.message : String(error));
    console.error('   - Full error:', error);
    if (error instanceof Error && error.stack) {
      console.error('   - Stack trace:', error.stack);
    }
    return false;
  }
};

/**
 * Fetch all images from Supabase database
 * @returns Array of generated images
 */
export const fetchImagesFromSupabase = async (): Promise<GeneratedImage[]> => {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      return [];
    }

    // Map database records to GeneratedImage type
    const images: GeneratedImage[] = (data || []).map(record => ({
      id: record.id,
      url: record.public_url,
      prompt: record.prompt,
      aspectRatio: record.aspect_ratio,
      timestamp: record.timestamp,
      status: record.status as 'pending' | 'success' | 'error',
      errorMessage: record.error_message
    }));

    console.log(`📥 Fetched ${images.length} images from Supabase`);
    return images;
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return [];
  }
};

/**
 * Delete image from Supabase Storage and database
 * @param imageId Image ID to delete
 * @returns Success status
 */
export const deleteImageFromSupabase = async (imageId: string): Promise<boolean> => {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  try {
    // Get storage path from database
    const { data: imageData, error: fetchError } = await supabase
      .from('generated_images')
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      console.error('Error fetching image data:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('nanoo-images')
      .remove([imageData.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return false;
    }

    console.log('🗑️ Image deleted from Supabase:', imageId);
    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    return false;
  }
};

/**
 * Helper function to convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}
