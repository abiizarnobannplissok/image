
import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio, ImageModel } from '../types';
import { improvePrompt } from '../services/geminiService';
import { CustomDropdown } from './CustomDropdown';
import { ModelDropdown } from './ModelDropdown';

interface GeneratorFormProps {
  onGenerate: (prompt: string, aspectRatio: AspectRatio, model: ImageModel, referenceImages?: string[]) => void;
  hasApiKey: boolean;
}

const RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, hasApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [model, setModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  const [isBrieflyLoading, setIsBrieflyLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>(Array(14).fill(''));
  const [dragActive, setDragActive] = useState<number | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>(Array(14).fill(null));
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const [tempPastedImage, setTempPastedImage] = useState<string>('');
  const [pasteAreaText, setPasteAreaText] = useState<string>('');

  // Calculate how many slots to show (minimum 2, maximum 14)
  const visibleSlots = Math.min(
    14,
    Math.max(
      2,
      referenceImages.findIndex(img => img === '') === -1 
        ? 14 
        : referenceImages.findIndex(img => img === '') + 1
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsBrieflyLoading(true);
      const activeReferences = referenceImages.filter(img => img !== '');
      onGenerate(prompt, aspectRatio, model, activeReferences.length > 0 ? activeReferences : undefined);
      
      setPrompt('');
      setTimeout(() => setIsBrieflyLoading(false), 500);
    }
  };

  const handleImprove = async () => {
    if (!prompt.trim() || isImproving) return;
    
    setIsImproving(true);
    try {
      const enhanced = await improvePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Improvement failed", err);
    } finally {
      setIsImproving(false);
    }
  };

  const processFile = (file: File, index: number) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setReferenceImages(prev => {
        const newRefs = [...prev];
        newRefs[index] = base64;
        return newRefs;
      });
    };
    reader.readAsDataURL(file);
  };

  const [clipboardSupported, setClipboardSupported] = useState(false);
  // Force HTTPS mode features for both HTTP and HTTPS
  const [isHttps] = useState(() => true);

  useEffect(() => {
    // Force clipboard support to true for both HTTP and HTTPS
    setClipboardSupported(true);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      console.log('Paste event detected on DOCUMENT', e);
      const clipboardData = e.clipboardData;
      if (!clipboardData) {
        console.log('No clipboard data found');
        return;
      }

      const items = Array.from(clipboardData.items);
      console.log('Clipboard items:', items);
      
      const imageItem = items.find(item => item.type.startsWith('image/'));

      if (imageItem) {
        console.log('Image item found:', imageItem.type);
        e.preventDefault();
        e.stopPropagation();

        const file = imageItem.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const base64 = loadEvent.target?.result as string;
            if (!base64) return;
            
            // Automatically add to next available slot
            setReferenceImages(prev => {
              const emptyIndex = prev.findIndex(img => img === '');
              
              if (emptyIndex !== -1) {
                const newRefs = [...prev];
                newRefs[emptyIndex] = base64;
                return newRefs;
              } else {
                // If no slots available, show in temp area
                setTempPastedImage(base64);
                return prev;
              }
            });
          };
          reader.readAsDataURL(file);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && tempPastedImage) {
        e.preventDefault();
        
        // Replace the last slot when all slots are full
        setReferenceImages(prev => {
          const newRefs = [...prev];
          newRefs[13] = tempPastedImage;
          return newRefs;
        });
        
        setTempPastedImage('');
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [referenceImages]);

  const handleClipboardButton = async () => {
    try {
      // Try clipboard API first
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const file = new File([blob], 'pasted-image.png', { type });
              
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                if (!base64) return;
                
                // Automatically add to next available slot
                setReferenceImages(prev => {
                  const emptyIndex = prev.findIndex(img => img === '');
                  
                  if (emptyIndex !== -1) {
                    const newRefs = [...prev];
                    newRefs[emptyIndex] = base64;
                    return newRefs;
                  } else {
                    // If no slots available, show in temp area
                    setTempPastedImage(base64);
                    return prev;
                  }
                });
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        }
      }
      
      // Fallback: Show instruction for manual paste
      alert('No image found in clipboard.\n\n✅ You can paste images:\n• Click the paste area and press Ctrl+V (or Cmd+V)\n• Or drag & drop generated cards directly to slots\n• Or use file upload buttons');
    } catch (error) {
      console.error('Clipboard access failed:', error);
      // Fallback: Show instruction for manual paste
      alert('Clipboard access failed.\n\n✅ You can still paste images:\n• Click the paste area and press Ctrl+V (or Cmd+V)\n• Or drag & drop generated cards directly to slots\n• Or use file upload buttons');
    }
  };

  const onDrag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(index);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const onDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    // Check if it's a file drop
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], index);
      return;
    }
    
    // Check if it's an image URL drop (from generated card)
    const imageUrl = e.dataTransfer.getData('image/url') || e.dataTransfer.getData('text/plain');
    if (imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('http'))) {
      // Directly use the base64 or URL
      setReferenceImages(prev => {
        const newRefs = [...prev];
        newRefs[index] = imageUrl;
        return newRefs;
      });
    }
  };

  const removeReference = (index: number) => {
    const newRefs = [...referenceImages];
    newRefs[index] = '';
    setReferenceImages(newRefs);
  };

  const triggerInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-mono">
      {!isHttps && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-none">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-[10px] text-yellow-200">
              <p className="font-bold mb-1">HTTP MODE - Limited Clipboard Features</p>
              <p className="text-yellow-300/80">
                ✅ Paste works: Click paste area + Ctrl+V | ✅ Drag & Drop cards works | ⚠️ Direct clipboard button disabled
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ratio</label>
          <CustomDropdown 
            value={aspectRatio}
            onChange={setAspectRatio}
            options={RATIOS}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Model</label>
          <ModelDropdown 
            value={model}
            onChange={setModel}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prompt</label>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleImprove}
              disabled={isImproving || !prompt.trim()}
              className={`text-[10px] font-bold text-white flex items-center gap-1 hover:text-gray-300 transition-all border border-gray-700 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed ${isImproving ? 'animate-pulse bg-gray-800' : ''}`}
            >
              <svg className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              {isImproving ? 'ANALYZING...' : 'IMPROVE'}
            </button>
            <button 
              type="button" 
              onClick={() => setPrompt('')}
              className="text-[10px] font-bold text-gray-500 hover:text-white border border-gray-800 px-2 py-1"
            >
              CLEAR
            </button>
          </div>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="w-full h-32 p-4 bg-black/50 border border-gray-700 focus:border-white outline-none transition-all resize-none text-white text-sm placeholder-gray-700 leading-relaxed rounded-none"
        />
      </div>

      <button
        type="submit"
        disabled={isBrieflyLoading || !prompt.trim()}
        className="w-full py-4 bg-white text-black font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed active:scale-[0.98] rounded-none"
      >
        {isBrieflyLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            SENDING TO QUEUE...
          </span>
        ) : (
          'RUN GENERATION'
        )}
      </button>

      <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Reference Images (Drag & Drop)</label>
              <span className="text-[9px] text-gray-600">
                {isDeleteMode 
                  ? <span className="text-red-400 font-bold animate-pulse">🗑️ DELETE MODE ACTIVE - Click image to remove</span>
                  : "💡 Drag images to other tabs | Right-click to delete | Paste Ctrl+V"
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                className={`text-[10px] font-bold px-2 py-1 border transition-all flex items-center gap-1 ${isDeleteMode ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-transparent border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600'}`}
                title={isDeleteMode ? "Exit Delete Mode" : "Enter Delete Mode to remove images"}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleteMode ? "DONE" : "DELETE"}
              </button>
              {model.startsWith('imagen-') && (
                <span className="text-[9px] text-yellow-500 font-mono">⚠ Imagen models don't support reference images</span>
              )}
            </div>
          </div>
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 ${model.startsWith('imagen-') ? 'opacity-40 pointer-events-none' : ''}`}>
          {Array.from({ length: visibleSlots }).map((_, index) => {
            const getLabel = (idx: number) => {
              if (idx === 0) return 'Primary';
              if (idx === 1) return 'Secondary';
              return `Ref ${idx + 1}`;
            };

            return (
              <div 
                key={index}
                onDragEnter={(e) => !referenceImages[index] && onDrag(e, index)}
                onDragOver={(e) => {
                  if (!referenceImages[index]) {
                    onDrag(e, index);
                  } else {
                    e.preventDefault();
                  }
                }}
                onDragLeave={(e) => !referenceImages[index] && onDrag(e, index)}
                onDrop={(e) => !referenceImages[index] && onDrop(e, index)}
                onClick={() => {
                  if (isDeleteMode && referenceImages[index]) {
                    removeReference(index);
                  } else if (!referenceImages[index]) {
                    triggerInput(index);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (referenceImages[index]) {
                    if (window.confirm("Remove this reference image?")) {
                       removeReference(index);
                    }
                  }
                }}
                className={`group relative aspect-[4/3] border transition-all flex flex-col items-center justify-center overflow-hidden
                  ${referenceImages[index] ? 'border-gray-700 cursor-grab active:cursor-grabbing' : 'border-dashed border-gray-800 hover:border-gray-500 bg-gray-950/20 cursor-pointer'}
                  ${dragActive === index ? 'border-white bg-white/5 scale-[1.02]' : ''}
                  ${isDeleteMode && referenceImages[index] ? 'ring-2 ring-red-500/50 cursor-pointer !border-red-500' : ''}
                `}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={(el) => (fileInputRefs.current[index] = el)}
                  accept="image/*"
                  onChange={(e) => e.target.files && processFile(e.target.files[0], index)}
                />
                
                {referenceImages[index] ? (
                  <>
                    <img 
                      src={referenceImages[index]} 
                      alt={`Ref ${index}`} 
                      className={`w-full h-full object-cover select-none ${isDeleteMode ? 'opacity-70 grayscale' : ''}`}
                      draggable={!isDeleteMode}
                      onDragStart={(e) => {
                        if (isDeleteMode) {
                          e.preventDefault();
                          return;
                        }
                        e.stopPropagation();
                        
                        const img = e.currentTarget;
                        e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
                        
                        e.dataTransfer.setData('text/uri-list', referenceImages[index]);
                        e.dataTransfer.setData('text/plain', referenceImages[index]);
                        e.dataTransfer.setData('text/html', `<img src="${referenceImages[index]}" />`);
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    {isDeleteMode && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="bg-red-900/80 text-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-red-500/50">
                           TAP TO DELETE
                         </div>
                      </div>
                    )}
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pointer-events-none transition-opacity duration-300 ${isDeleteMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                      <span className="text-[9px] text-white flex items-center justify-center gap-1 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Drag to other tab
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mb-2 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-600 group-hover:text-gray-400">
                      {getLabel(index)}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <div
              ref={pasteAreaRef}
              contentEditable
              suppressContentEditableWarning
              tabIndex={0}
              onInput={(e) => {
                setPasteAreaText(e.currentTarget.textContent || '');
              }}
              className="flex-1 p-3 bg-black/30 border border-gray-800 text-xs transition-colors rounded-none font-mono flex items-center justify-center gap-2 focus:border-white focus:bg-black/50 outline-none text-white min-h-[48px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:text-center"
              data-placeholder={
                isHttps 
                  ? 'Paste image (Ctrl+V) anywhere or Drag & Drop cards here...' 
                  : 'Click here & Paste (Ctrl+V) or Drag generated cards here...'
              }
            >
              {tempPastedImage && (
                <div className="inline-flex items-center gap-2">
                  <div className="relative w-12 h-12 border border-yellow-400 flex-shrink-0">
                    <img src={tempPastedImage} alt="Pasted preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempPastedImage('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-yellow-400 font-bold whitespace-nowrap">⚠️ All slots full - Press Enter to replace last slot</span>
                </div>
              )}
            </div>
          </div>
          {clipboardSupported && (
            <button
              type="button"
              onClick={handleClipboardButton}
              className="px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-white transition-colors rounded-none whitespace-nowrap"
            >
              PASTE FROM CLIPBOARD
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
