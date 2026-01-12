import React, { useState } from 'react';
import { improvePrompt } from '../services/geminiService';
import { GeneratedImage } from '../types';

interface VeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: GeneratedImage;
}

export const VeoModal: React.FC<VeoModalProps> = ({ isOpen, onClose, originalImage }) => {
  const [prompt, setPrompt] = useState(originalImage.prompt);
  const [isImproving, setIsImproving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleImprove = async () => {
    if (!prompt.trim() || isImproving) return;
    
    setIsImproving(true);
    try {
      const enhanced = await improvePrompt(prompt, undefined, 'video'); // Add 'video' type
      setPrompt(enhanced);
    } catch (err) {
      console.error("Improvement failed", err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Veo 3 Video Prompt</h2>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Prepare your prompt for Image-to-Video
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-6 mb-6">
             <div className="w-1/3 aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
               <img src={originalImage.url} alt="Source" className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video Prompt</label>
                  <button 
                    type="button" 
                    onClick={handleImprove}
                    disabled={isImproving}
                    className={`text-[10px] font-bold text-white flex items-center gap-1 hover:text-gray-300 transition-all border border-gray-700 px-3 py-1.5 rounded ${isImproving ? 'animate-pulse bg-gray-800' : 'bg-gray-900'}`}
                  >
                    <svg className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    {isImproving ? 'AI IMPROVING...' : 'AI IMPROVE FOR VIDEO'}
                  </button>
                </div>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 p-4 bg-black border border-gray-700 focus:border-white outline-none transition-all resize-none text-white text-sm placeholder-gray-700 leading-relaxed font-mono rounded"
                  placeholder="Describe the motion and action for the video..."
                />
             </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800 gap-3">
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-2 rounded"
            >
              {isCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  COPIED!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  COPY PROMPT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
