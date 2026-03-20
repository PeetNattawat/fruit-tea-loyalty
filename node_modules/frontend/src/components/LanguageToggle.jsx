import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-all border border-white/30"
    >
      <span className={language === 'th' ? 'font-bold' : 'opacity-60'}>
        TH
      </span>
      <span className="opacity-40">|</span>
      <span className={language === 'en' ? 'font-bold' : 'opacity-60'}>
        EN
      </span>
    </button>
  );
};
