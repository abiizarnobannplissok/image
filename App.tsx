
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GeneratorForm } from './components/GeneratorForm';
import { ImageGallery } from './components/ImageGallery';
import { ImageModal } from './components/ImageModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VeoModal } from './components/VeoModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { generateImage } from './services/geminiService';
import { uploadImageToSupabase, fetchImagesFromSupabase, deleteImageFromSupabase } from './services/supabaseService';
import { GeneratedImage, AspectRatio, ImageModel } from './types';

const App: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [veoImage, setVeoImage] = useState<GeneratedImage | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { latestImages, historyImages } = useMemo(() => {
    const sorted = [...images].sort((a, b) => b.timestamp - a.timestamp);
    if (sorted.length === 0) return { latestImages: [], historyImages: [] };

    const limit = 6;
    
    return {
      latestImages: sorted.slice(0, limit),
      historyImages: sorted.slice(limit)
    };
  }, [images]);

  const selectedImagesCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds]);

  // Load from Local Storage and Supabase on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        // 1. Load from localStorage (foto lama)
        const localImages: GeneratedImage[] = [];
        const stored = localStorage.getItem('nanoo_generated_images');
        if (stored) {
          localImages.push(...JSON.parse(stored));
        }

        // 2. Load from Supabase (foto baru & shared)
        const supabaseImages = await fetchImagesFromSupabase();

        // 3. Merge: prioritas Supabase (foto baru), lalu localStorage (foto lama)
        // Gunakan Map untuk deduplicate berdasarkan ID
        const imageMap = new Map<string, GeneratedImage>();
        
        // Masukkan localStorage images dulu (sebagai fallback)
        localImages.forEach(img => imageMap.set(img.id, img));
        
        // Override dengan Supabase images (lebih prioritas)
        supabaseImages.forEach(img => imageMap.set(img.id, img));

        // Convert Map back to array dan sort by timestamp
        const mergedImages = Array.from(imageMap.values())
          .sort((a, b) => b.timestamp - a.timestamp);

        setImages(mergedImages);
        console.log(`📦 Loaded ${localImages.length} from localStorage, ${supabaseImages.length} from Supabase`);
        console.log(`🔍 Image status distribution:`, {
          total: mergedImages.length,
          pending: mergedImages.filter(img => img.status === 'pending').length,
          success: mergedImages.filter(img => img.status === 'success').length,
          error: mergedImages.filter(img => img.status === 'error').length
        });
        
        if (mergedImages.length > 0) {
          console.log('📸 Sample images (first 3):', mergedImages.slice(0, 3).map(img => ({
            id: img.id.substring(0, 8),
            status: img.status,
            hasUrl: !!img.url,
            prompt: img.prompt.substring(0, 30) + '...'
          })));
        }
      } catch (e) {
        console.error("Failed to load images from storage", e);
      }
    };

    loadImages();
  }, []);

  // Save to Local Storage whenever images change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Optimize storage by removing large data for items that have cloud URLs
        const imagesToStore = images.map(img => {
          if (img.status === 'success' && img.url?.startsWith('http')) {
            // Keep it as is if it's already a public URL
            return img;
          }
          // If it's a data URL, we keep it but we might want to limit total count
          return img;
        }).slice(0, 50); // Limit localStorage to most recent 50 to prevent huge strings
        
        localStorage.setItem('nanoo_generated_images', JSON.stringify(imagesToStore));
      } catch (e) {
        console.error("Storage quota exceeded or error", e);
      }
    }, 1000); // Increase debounce to 1s to reduce CPU pressure during active generation

    return () => clearTimeout(timeoutId);
  }, [images]);

  const checkApiKey = useCallback(() => {
    const key = localStorage.getItem('gemini_api_key');
    setHasApiKey(!!key);
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setHasApiKey(true);
    setShowApiKeyModal(false);
  };

  const handleDeleteImage = (id: string) => {
    setImageToDelete(id);
    setDeleteCount(1);
    setShowDeleteModal(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteCount(selectedIds.size);
    setShowDeleteModal(true);
  }, [selectedIds]);

  const confirmDelete = useCallback(async () => {
    if (imageToDelete) {
      // Delete single image
      setImages(prev => prev.filter(img => img.id !== imageToDelete));
      
      // Try to delete from Supabase (background, don't block UI)
      deleteImageFromSupabase(imageToDelete).catch(err => {
        console.warn('Failed to delete from Supabase:', err);
      });
      
      setImageToDelete(null);
    } else {
      // Delete multiple images
      const idsToDelete: string[] = Array.from(selectedIds);
      setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
      
      // Try to delete from Supabase (background)
      idsToDelete.forEach(id => {
        deleteImageFromSupabase(id).catch(err => {
          console.warn(`Failed to delete ${id} from Supabase:`, err);
        });
      });
      
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
    setShowDeleteModal(false);
  }, [imageToDelete, selectedIds]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  }, [isSelectionMode]);

  const handleGenerate = async (prompt: string, aspectRatio: AspectRatio, model: ImageModel, referenceImages?: string[]) => {
    if (!hasApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const generationId = Math.random().toString(36).substr(2, 9);
    
    const pendingImage: GeneratedImage = {
      id: generationId,
      prompt,
      aspectRatio,
      timestamp: Date.now(),
      status: 'pending'
    };

    setImages((prev) => [pendingImage, ...prev]);

    try {
      const imageUrl = await generateImage({ prompt, aspectRatio, model, referenceImages });
      
      const successImage: GeneratedImage = {
        id: generationId,
        prompt,
        aspectRatio,
        timestamp: Date.now(),
        status: 'success',
        url: imageUrl || undefined
      };

      setImages((prev) => 
        prev.map(img => 
          img.id === generationId 
            ? successImage
            : img
        )
      );

      // Upload to Supabase in background (don't block UI)
      if (imageUrl) {
        uploadImageToSupabase(successImage).then(success => {
          if (success) {
            console.log('✅ Successfully uploaded to Supabase');
          } else {
            console.warn('⚠️ Failed to upload to Supabase, only saved locally');
            setImages((prev) => 
              prev.map(img => 
                img.id === generationId 
                  ? { ...img, errorMessage: '⚠️ Saved locally only (Supabase upload failed)' }
                  : img
              )
            );
          }
        }).catch(err => {
          console.error('Supabase upload error:', err);
          setImages((prev) => 
            prev.map(img => 
              img.id === generationId 
                ? { ...img, errorMessage: '⚠️ Saved locally only (Supabase upload error)' }
                : img
            )
          );
        });
      }
    } catch (err: any) {
      console.error(err);
      // Check for authentication related errors
      const isApiKeyError = err.message?.includes("403") || err.message?.includes("API key");
      
      if (isApiKeyError) {
        setHasApiKey(false);
        localStorage.removeItem('gemini_api_key');
        setShowApiKeyModal(true);
      }

      setImages((prev) => 
        prev.map(img => 
          img.id === generationId 
            ? { ...img, status: 'error', errorMessage: isApiKeyError ? "Invalid API Key" : (err.message || "Failed") } 
            : img
        )
      );
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto bg-black border border-gray-800 p-4 md:p-10 rounded-xl shadow-2xl">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-gray-800 pb-8">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-white">
              NANOO AIR<span className="text-gray-500 font-normal"> / BATCH GENERATOR</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">
              Fire multiple prompts without waiting
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSelectionMode ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBatchDelete}
                  disabled={selectedImagesCount === 0}
                  className="px-4 py-2 text-xs font-bold bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  DELETE ({selectedImagesCount})
                </button>
                <button 
                  onClick={toggleSelectionMode}
                  className="px-4 py-2 text-xs font-semibold border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button 
                onClick={toggleSelectionMode}
                className="px-4 py-2 text-xs font-semibold bg-transparent border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center gap-2 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                Select Items
              </button>
            )}
            
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className={`px-4 py-2 text-xs font-semibold border rounded flex items-center gap-2 transition-all ${hasApiKey ? 'bg-white text-black border-white' : 'bg-transparent border-gray-700 text-white hover:bg-gray-800'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
              {hasApiKey ? 'API Active' : 'Add API Key'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                  </svg>
                  INPUT
                </h3>
                <div className="px-3 py-1 bg-gray-900 border border-gray-700 text-[10px] font-bold text-gray-400">
                  NANOO FLASH
                </div>
              </div>
              
              <GeneratorForm 
                onGenerate={handleGenerate} 
                hasApiKey={hasApiKey}
              />
            </div>
          </div>

          <div className="space-y-6 flex flex-col h-full bg-gray-900/10 border border-gray-800/50 p-4 sm:p-6 rounded-none shadow-inner">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 flex-shrink-0">
              <h3 className="text-sm font-black flex items-center gap-2 text-white uppercase tracking-widest">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
                Latest Results
              </h3>
              {latestImages.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-black text-blue-400 bg-blue-900/20 px-2 py-0.5 border border-blue-800/50 uppercase tracking-tighter">
                    Active Preview
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 bg-gray-900/50 px-2 py-0.5 border border-gray-800">
                    {latestImages[0].aspectRatio}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar will-change-scroll pr-1 sm:pr-2 min-h-0">
              <ImageGallery 
                images={latestImages} 
                onExpandImage={setSelectedImage} 
                onVeoImage={setVeoImage}
                onDeleteImage={handleDeleteImage}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                columns={3}
              />
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm font-black flex items-center gap-2 text-white uppercase tracking-widest">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generation History
            </h3>
            <div className="text-[9px] font-mono text-gray-600 bg-black px-2 py-0.5 border border-gray-900">
              {historyImages.length} ITEMS
            </div>
          </div>
          <ImageGallery 
            images={historyImages} 
            onExpandImage={setSelectedImage} 
            onVeoImage={setVeoImage}
            onDeleteImage={handleDeleteImage}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            columns={4}
          />
        </div>

        {/* Minimalist Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex justify-center">
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Powered by Gemini Pro • NanooAir Studio
          </p>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
      />

      {veoImage && (
        <VeoModal
          isOpen={!!veoImage}
          onClose={() => setVeoImage(null)}
          originalImage={veoImage}
        />
      )}

      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        count={deleteCount}
      />
    </main>
  );
};

export default App;
