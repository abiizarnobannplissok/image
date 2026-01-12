import React, { useRef } from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onExpand: (image: GeneratedImage) => void;
  onVeo: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onExpand, 
  onVeo, 
  onDelete,
  isSelectionMode, 
  isSelected, 
  onToggleSelection 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  // Force HTTPS mode features for both HTTP and HTTPS
  const [isHttps] = React.useState(() => true);

  // Convert aspect ratio string to Tailwind class
  const getAspectRatioClass = (aspectRatio: string) => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video'; // 16:9
      case '9:16':
        return 'aspect-[9/16]';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      default:
        return 'aspect-square'; // fallback
    }
  };

  const handleCopyImage = async (e?: React.MouseEvent | MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!image.url || isCopied) return;

    // Try clipboard API first, with fallback for HTTP
    try {
      // Convert data URL to blob if needed
      let blob: Blob;
      
      if (image.url.startsWith('data:')) {
        // Data URL - convert to blob
        const base64Response = await fetch(image.url);
        blob = await base64Response.blob();
      } else {
        // Regular URL - fetch as blob
        const response = await fetch(image.url);
        blob = await response.blob();
      }
      
      // Ensure it's an image type
      if (!blob.type.startsWith('image/')) {
        // Force image/png type
        blob = new Blob([blob], { type: 'image/png' });
      }
      
      // Try clipboard API if available
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        
        console.log('Image copied successfully as blob:', blob.type);
        
        // Visual feedback - change icon to checkmark
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } else {
        // Fallback: Open image in new tab for manual copy
        window.open(image.url, '_blank');
        
        // Visual feedback
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      
      // Fallback: Open image in new tab for manual copy
      window.open(image.url, '_blank');
      
      // Visual feedback
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const onDragStart = (e: React.DragEvent) => {
    if (!image.url) return;
    
    // Set drag data
    e.dataTransfer.setData('text/plain', image.url);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: image.id,
      url: image.url,
      prompt: image.prompt
    }));
    
    // Visual feedback
    if (cardRef.current) {
      cardRef.current.style.opacity = '0.5';
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (cardRef.current) {
      cardRef.current.style.opacity = '1';
    }
  };

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(image.id);
    } else if (image.status === 'success' && image.url) {
      onExpand(image);
    }
  };

  const handleVeoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image.status === 'success' && image.url) {
      onVeo(image);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(image.id);
  };

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-gray-900 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer ${
        isSelectionMode ? (isSelected ? 'ring-2 ring-blue-500 border-blue-500' : '') : ''
      }`}
      onClick={handleCardClick}
      draggable={image.status === 'success' && !!image.url}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'bg-gray-800 border-gray-600'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isSelectionMode && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {image.status === 'success' && image.url && (
            <>
              <button
                onClick={handleCopyImage}
                className="p-1.5 bg-black/70 hover:bg-black/90 border border-gray-600 text-white text-xs transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={handleVeoClick}
                className="p-1.5 bg-black/70 hover:bg-black/90 border border-gray-600 text-white text-xs transition-colors"
                title="Generate video with Veo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
              </button>
            </>
          )}
          <button
            onClick={handleDeleteClick}
            className="p-1.5 bg-red-900/70 hover:bg-red-900/90 border border-red-700 text-red-200 text-xs transition-colors"
            title="Delete image"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Image Content */}
      <div className={getAspectRatioClass(image.aspectRatio)}>
        {image.status === 'pending' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="text-xs text-gray-400">Generating...</span>
            </div>
          </div>
        )}
        
        {image.status === 'error' && (
          <div className="w-full h-full flex items-center justify-center bg-red-900/20 border border-red-800">
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-xs text-red-300">{image.errorMessage || 'Generation failed'}</span>
            </div>
          </div>
        )}
        
        {image.status === 'success' && image.url && (
          <img 
            src={image.url} 
            alt={image.prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      {/* Prompt Text */}
      <div className="p-3 border-t border-gray-700">
        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
          {image.prompt}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-500 font-mono">
            {image.aspectRatio}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {new Date(image.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};
