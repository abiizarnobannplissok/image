import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-red-900/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mb-4 mx-auto border border-red-900/30">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-white text-center mb-2">Delete {count} Images?</h2>
          <p className="text-xs text-gray-400 text-center font-mono leading-relaxed mb-6">
            This action cannot be undone. These images will be permanently removed from your local storage.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-gray-400 hover:text-white border border-gray-800 hover:bg-gray-900 rounded transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-3 text-xs font-bold bg-red-600 text-white hover:bg-red-700 border border-transparent rounded transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
