import React, { useState, useEffect, useMemo } from 'react';
import { QuickInput } from '../components/forms/QuickInput';
import { dataService } from '../services/dataService';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatTime } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';
import { CategoryChangeModal } from '../components/ui/CategoryChangeModal';
import { APP_CONSTANTS, TYPE_ICONS, UI_CONSTANTS } from '../constants';

type RecentEntry = (Thought | Todo | RadiologyNote | Investment) & {
  entryType: 'thought' | 'todo' | 'radiology' | 'investment';
};

export const QuickPage: React.FC = () => {
  const { t } = useLanguage();
  const { toggleCardExpansion, isExpanded } = useCardExpansion();
  
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [radiologyNotes, setRadiologyNotes] = useState<RadiologyNote[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<'thought' | 'todo' | 'radiology' | 'investment'>('thought');

  useEffect(() => {
    const unsubThoughts = dataService.subscribeToThoughts(setThoughts);
    const unsubTodos = dataService.subscribeToTodos(setTodos);
    const unsubRadiology = dataService.subscribeToRadiologyNotes(setRadiologyNotes);
    const unsubInvestments = dataService.subscribeToInvestments(setInvestments);

    return () => {
      unsubThoughts();
      unsubTodos();
      unsubRadiology();
      unsubInvestments();
    };
  }, []);

  const recentEntries = useMemo(() => {
    const allThoughts = thoughts.map(e => ({ ...e, entryType: 'thought' as const }));
    const allTodos = todos.map(e => ({ ...e, entryType: 'todo' as const }));
    const allRadiology = radiologyNotes.map(e => ({ ...e, entryType: 'radiology' as const }));
    const allInvestments = investments.map(e => ({ ...e, entryType: 'investment' as const }));

    return [...allThoughts, ...allTodos, ...allRadiology, ...allInvestments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, APP_CONSTANTS.RECENT_ENTRIES_LIMIT);
  }, [thoughts, todos, radiologyNotes, investments]);

  const getEntryIcon = (entry: RecentEntry) => {
    switch (entry.entryType) {
      case 'todo':
        return (entry as Todo).isCompleted ? TYPE_ICONS.TODO_COMPLETED : TYPE_ICONS.TODO_PENDING;
      case 'thought':
        return TYPE_ICONS.THOUGHT;
      case 'radiology':
        return TYPE_ICONS.RADIOLOGY;
      case 'investment':
        return TYPE_ICONS.INVESTMENT;
      default:
        return TYPE_ICONS.DEFAULT;
    }
  };

  const getEntryType = (entry: RecentEntry) => {
    switch (entry.entryType) {
      case 'todo':
        return t('type.todo');
      case 'thought':
        return t('type.thought');
      case 'radiology':
        return t('type.radiology');
      case 'investment':
        return t('type.investment');
      default:
        return '';
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!selectedItemId) return;
    
    try {
      switch (newCategory) {
        case 'thought':
          if (selectedItemType !== 'thought') {
            await dataService.convertToThought(selectedItemId, selectedItemType as 'todo' | 'investment' | 'radiology');
          }
          break;
        case 'todo':
          if (selectedItemType !== 'todo') {
            await dataService.convertToTodo(selectedItemId, selectedItemType as 'thought' | 'investment' | 'radiology');
          }
          break;
        case 'investment':
          if (selectedItemType !== 'investment') {
            await dataService.convertToInvestment(selectedItemId, selectedItemType as 'thought' | 'todo' | 'radiology');
          }
          break;
        case 'radiology':
          if (selectedItemType !== 'radiology') {
            await dataService.convertToRadiology(selectedItemId, selectedItemType as 'thought' | 'todo' | 'investment');
          }
          break;
      }
      
      setCategoryModalOpen(false);
      setSelectedItemId('');
      setSelectedItemType('thought');
    } catch (error) {
      console.error('Failed to convert category:', error);
    }
  };

  const handleCategoryButtonClick = (entry: RecentEntry) => {
    setSelectedItemId(entry.id);
    setSelectedItemType(entry.entryType);
    setCategoryModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-8 py-4 sm:py-8">
      <QuickInput />
      
      {recentEntries.length > 0 && (
        <div className="px-4 sm:px-0">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              {t('quick.recent')}
            </h3>
            <p className="text-gray-500 text-base sm:text-lg font-medium">
              {t('quick.recent_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {recentEntries.map((entry) => {
              const isLong = isTextLong(entry.content);
              const entryExpanded = isExpanded(entry.id);
              const displayContent = isLong && !entryExpanded 
                ? getPreviewText(entry.content) 
                : entry.content;
              
              return (
                <div
                  key={entry.id}
                  className="card card-hover"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => handleCategoryButtonClick(entry)}
                        className="badge hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                        title="카테고리 변경"
                      >
                        {getEntryIcon(entry)} {getEntryType(entry)}
                      </button>
                      <span className="badge">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-base leading-relaxed text-primary font-medium whitespace-pre-line">
                        {displayContent}
                      </p>
                      
                      {isLong && (
                        <button
                          onClick={() => toggleCardExpansion(entry.id)}
                          className={UI_CONSTANTS.EXPAND_BUTTON_CLASSES}
                        >
                          {entryExpanded ? '접기' : '...더보기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CategoryChangeModal
        isOpen={categoryModalOpen}
        currentCategory={selectedItemType}
        onCategorySelect={handleCategoryChange}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedItemId('');
          setSelectedItemType('thought');
        }}
      />
    </div>
  );
};