import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavigationProps {
  activeTab: 'quick' | 'thoughts' | 'todos' | 'radiology' | 'search';
  onTabChange: (tab: 'quick' | 'thoughts' | 'todos' | 'radiology' | 'search') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  
  const tabs = [
    { id: 'quick' as const, label: t('nav.quick') },
    { id: 'thoughts' as const, label: t('nav.thoughts') },
    { id: 'todos' as const, label: t('nav.todos') },
    { id: 'radiology' as const, label: t('nav.radiology') },
    { id: 'search' as const, label: t('nav.search') },
  ];

  const getTabStyle = (isActive: boolean) => {
    if (isActive) {
      return {backgroundColor: '#4EA66D', color: '#F2E0D0'};
    }
    return {color: '#4EA66D', backgroundColor: 'transparent'};
  };

  const getTabHoverClass = (isActive: boolean) => {
    if (isActive) return 'shadow-lg';
    return 'hover:bg-green-200/20';
  };

  return (
    <nav className="bg-white/70 backdrop-blur-md sticky top-0 z-50" style={{borderBottom: '1px solid rgba(78, 166, 109, 0.2)'}}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex space-x-3 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-8 py-4 text-base font-bold rounded-2xl transition-all duration-300 hover:scale-105 ${getTabHoverClass(activeTab === tab.id)}`}
              style={getTabStyle(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};