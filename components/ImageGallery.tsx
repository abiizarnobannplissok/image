
import React from 'react';
import { GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onExpandImage: (image: GeneratedImage) => void;
  onVeoImage: (image: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  columns?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  onExpandImage, 
  onVeoImage, 
  onDeleteImage,
  isSelectionMode,
  selectedIds,
  onToggleSelection,
  columns = 2
}) => {
  if (images.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-none bg-black/20">
        <div className="w-12 h-12 border border-gray-700 flex items-center justify-center mb-4 bg-gray-900/50">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">No Images Yet</p>
      </div>
    );
  }

  const gridColsClass = columns === 1 
    ? 'grid-cols-1' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

  return (
    <div className={`grid ${gridColsClass} gap-4 pb-10`}>
      {images.map((img) => (
        <ImageCard 
          key={img.id} 
          image={img} 
          onExpand={() => onExpandImage(img)} 
          onVeo={() => onVeoImage(img)}
          onDelete={() => onDeleteImage(img.id)}
          isSelectionMode={isSelectionMode}
          isSelected={selectedIds.has(img.id)}
          onToggleSelection={() => onToggleSelection(img.id)}
        />
      ))}
    </div>
  );
};
