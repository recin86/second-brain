import React from 'react';

interface LanguageToggleProps {
  language: 'ko' | 'en';
  onLanguageChange: (language: 'ko' | 'en') => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onLanguageChange('ko')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
          language === 'ko' 
            ? 'bg-white/90 text-primary shadow-md' 
            : 'text-primary/70 hover:text-primary hover:bg-white/10'
        }`}
      >
        한국어
      </button>
      <div className="w-px h-4 bg-primary/30"></div>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
          language === 'en' 
            ? 'bg-white/90 text-primary shadow-md' 
            : 'text-primary/70 hover:text-primary hover:bg-white/10'
        }`}
      >
        English
      </button>
    </div>
  );
};