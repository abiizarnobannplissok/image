import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '../types';

interface CustomDropdownProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  options: { label: string; value: AspectRatio }[];
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, onChange, options }) => {
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

  const getIconForRatio = (ratio: AspectRatio) => {
    const baseClass = "border border-current";
    switch (ratio) {
      case '1:1': return <div className={`${baseClass} w-3 h-3`} />;
      case '3:4': return <div className={`${baseClass} w-3 h-4`} />;
      case '4:3': return <div className={`${baseClass} w-4 h-3`} />;
      case '9:16': return <div className={`${baseClass} w-2.5 h-4`} />;
      case '16:9': return <div className={`${baseClass} w-4 h-2.5`} />;
      default: return <div className={`${baseClass} w-3 h-3`} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black border border-gray-700 text-white text-xs p-2.5 flex items-center justify-between hover:border-white transition-all outline-none rounded-none"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-500">
            {getIconForRatio(value)}
          </div>
          <span className="font-mono">{value}</span>
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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-colors
                ${value === option.value 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
            >
              <div className={value === option.value ? 'text-black' : 'text-gray-600'}>
                {getIconForRatio(option.value)}
              </div>
              <span>{option.label}</span>
              {value === option.value && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
