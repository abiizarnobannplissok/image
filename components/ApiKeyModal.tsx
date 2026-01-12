import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
      setKey('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Enter Gemini API Key</h2>
          <p className="text-sm text-gray-400 mb-6">
            To use Nanoo Air, you need to provide your own Google Gemini API key. 
            Your key is stored locally in your browser.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors font-mono text-sm"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!key.trim()}
                className="px-6 py-2 text-xs font-bold bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                SAVE KEY
              </button>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 text-center">
            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Get one from Google AI Studio</a>
          </p>
        </div>
      </div>
    </div>
  );
};
