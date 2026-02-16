
import React, { useEffect, useState } from 'react';
import { GeneratedImage } from '../types';

// Mobile-responsive fullscreen modal with scrolling support v2.1
interface ImageModalProps {
  image: GeneratedImage;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    // Prevent body scroll on mobile
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleDownload = async () => {
    if (!image.url || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Fetch the image to handle cross-origin downloads
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      // Create a temporary blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nanooair-${image.id}.png`;
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(image.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!image.url) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-white transition-colors z-[60] bg-black/80 p-2 rounded-full"
      >
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="min-h-screen flex items-start md:items-center justify-center p-4 md:p-10">
        <div 
          className="relative w-full max-w-7xl flex flex-col md:flex-row bg-black border border-gray-800 shadow-2xl my-4 md:my-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 flex items-center justify-center bg-gray-950 p-4">
            <img 
              src={image.url} 
              alt={image.prompt} 
              className="w-full h-auto max-h-[50vh] md:max-h-[80vh] object-contain"
            />
          </div>
          
          <div className="w-full md:w-80 p-6 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-800 bg-black font-mono">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Metadata</h4>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white">ID: {image.id.toUpperCase()}</span>
                <span className="text-[10px] text-white">RATIO: {image.aspectRatio}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prompt</h4>
              <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-sm max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{image.prompt}"
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest text-center hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </span>
                ) : (
                  'Download Asset'
                )}
              </button>
              <button 
                onClick={onClose}
                className="w-full py-3 border border-gray-700 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-white hover:text-white transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
