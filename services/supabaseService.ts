
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedImage } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Image sharing will be disabled.');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload image to Supabase Storage and save metadata to database
 * @param image Generated image data
 * @returns Success status
 */
export const uploadImageToSupabase = async (image: GeneratedImage): Promise<boolean> => {
  if (!supabase || !image.url) {
    console.warn('Supabase not configured or image URL missing');
    return false;
  }

  try {
    // Convert base64 to blob
    const base64Data = image.url.split(',')[1];
    const mimeType = image.url.match(/data:([^;]+);/)?.[1] || 'image/png';
    const blob = base64ToBlob(base64Data, mimeType);
    
    // Generate unique filename
    const fileExtension = mimeType.split('/')[1];
    const fileName = `${image.id}.${fileExtension}`;
    const filePath = `generated-images/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('nanoo-images')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return false;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('nanoo-images')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('generated_images')
      .insert([{
        id: image.id,
        prompt: image.prompt,
        aspect_ratio: image.aspectRatio,
        timestamp: image.timestamp,
        status: image.status,
        storage_path: filePath,
        public_url: urlData.publicUrl
      }]);

    if (dbError) {
      console.error('Database insert error:', dbError);
      return false;
    }

    console.log('✅ Image uploaded to Supabase:', image.id);
    return true;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
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
