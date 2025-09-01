import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavigationProps {
  activeTab: 'quick' | 'thoughts' | 'todos' | 'radiology' | 'investments' | 'search';
  onTabChange: (tab: 'quick' | 'thoughts' | 'todos' | 'radiology' | 'investments' | 'search') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  
  const tabs = [
    { id: 'quick' as const, label: t('nav.quick'), emoji: '⚡' },
    { id: 'thoughts' as const, label: t('nav.thoughts'), emoji: '💭' },
    { id: 'todos' as const, label: t('nav.todos'), emoji: '✅' },
    { id: 'radiology' as const, label: t('nav.radiology'), emoji: '🔬' },
    { id: 'investments' as const, label: t('nav.investments'), emoji: '💰' },
    { id: 'search' as const, label: t('nav.search'), emoji: '🔍' },
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
      <div className="max-w-7xl mx-auto px-2 sm:px-8">
        {/* 모바일: 가로 스크롤 가능한 탭 */}
        <div className="flex justify-center sm:justify-start overflow-x-auto space-x-2 sm:space-x-3 py-3 sm:py-4 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-shrink-0 
                px-3 py-3 sm:px-8 sm:py-4 
                text-lg sm:text-base 
                font-bold 
                rounded-xl sm:rounded-2xl 
                transition-all duration-300 
                whitespace-nowrap
                min-w-[48px] sm:min-w-auto
                flex items-center justify-center
                ${getTabHoverClass(activeTab === tab.id)}
                ${activeTab === tab.id ? 'shadow-lg' : 'hover:scale-105'}
              `}
              style={getTabStyle(activeTab === tab.id)}
            >
              <span className="block sm:hidden text-xl">{tab.emoji}</span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};