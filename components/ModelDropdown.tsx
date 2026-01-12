import React, { useState, useRef, useEffect } from 'react';
import { ImageModel, IMAGE_MODELS } from '../types';

interface ModelDropdownProps {
  value: ImageModel;
  onChange: (value: ImageModel) => void;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconForModel = (modelId: ImageModel) => {
    if (modelId.includes('flash') || modelId.includes('fast')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (modelId.includes('ultra')) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
    }
    if (modelId.includes('imagen')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <polyline points="21,15 16,10 5,21" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  };

  const currentModel = IMAGE_MODELS.find(m => m.id === value) || IMAGE_MODELS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black border border-gray-700 text-white text-xs p-2.5 flex items-center justify-between hover:border-white transition-all outline-none rounded-none"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-500">
            {getIconForModel(value)}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-mono">{currentModel.label}</span>
            <span className="text-[9px] text-gray-500">{currentModel.description}</span>
          </div>
        </div>
        <svg 
          className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[#0a0a0a] border border-gray-700 shadow-xl max-h-60 overflow-auto">
          {IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-colors
                ${value === model.id 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
            >
              <div className={value === model.id ? 'text-black' : 'text-gray-600'}>
                {getIconForModel(model.id)}
              </div>
              <div className="flex flex-col items-start flex-1">
                <span>{model.label}</span>
                <span className={`text-[9px] ${value === model.id ? 'text-gray-600' : 'text-gray-500'}`}>
                  {model.description}
                </span>
              </div>
              {value === model.id && (
                <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
