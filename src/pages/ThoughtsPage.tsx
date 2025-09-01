import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { Thought } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatDate, getMonthKey } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useLongPress } from '../hooks/useLongPress';
import { CategoryChangeModal } from '../components/ui/CategoryChangeModal';

export const ThoughtsPage: React.FC = () => {
  const { t } = useLanguage();
  const { showUndo } = useToast();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const { toggleCardExpansion, isExpanded } = useCardExpansion();

  useEffect(() => {
    const unsubscribe = dataService.subscribeToThoughts((updatedThoughts) => {
      setThoughts(updatedThoughts);
      // 모든 월을 기본적으로 열린 상태로 설정
      const initialExpandedState: Record<string, boolean> = {};
      updatedThoughts.forEach(thought => {
        const monthKey = getMonthKey(thought.createdAt);
        initialExpandedState[monthKey] = true;
      });
      setExpandedMonths(prev => ({ ...prev, ...initialExpandedState }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredThoughts = thoughts.filter(thought =>
    thought.content.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleDeleteThought = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(t('thoughts.delete_confirm'))) {
      return;
    }
    
    try {
      const undoFunction = await dataService.softDeleteThought(id);
      showUndo('생각이 삭제되었습니다', undoFunction);
    } catch (error) {
      console.error('Failed to delete thought:', error);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!selectedItemId) return;
    
    try {
      switch (newCategory) {
        case 'todo':
          await dataService.convertToTodo(selectedItemId, 'thought');
          break;
        case 'investment':
          await dataService.convertToInvestment(selectedItemId, 'thought');
          break;
        case 'radiology':
          await dataService.convertToRadiology(selectedItemId, 'thought');
          break;
      }
      
      setCategoryModalOpen(false);
      setSelectedItemId('');
    } catch (error) {
      console.error('Failed to convert category:', error);
    }
  };

  const groupedThoughts = filteredThoughts.reduce((acc, thought) => {
    const monthKey = getMonthKey(thought.createdAt);
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(thought);
    return acc;
  }, {} as Record<string, Thought[]>);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <div className="bg-primary text-white rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 shadow-lg">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-lg mr-3 sm:mr-4 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">💭</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{t('thoughts.title')}</h2>
              <p className="opacity-90 text-sm sm:text-lg">
                {t('thoughts.subtitle')}
              </p>
            </div>
          </div>
          <div className="bg-white/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex items-center space-x-3">
              <span className="text-muted text-lg sm:text-xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('thoughts.search')}
                className="w-full text-base sm:text-lg border-0 bg-transparent focus:outline-none placeholder-gray-400 text-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedThoughts).length === 0 ? (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-primary mb-3">
            {t('thoughts.empty')}
          </h3>
          <p className="text-muted text-base">
            {t('thoughts.empty_subtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedThoughts)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([month, monthThoughts]) => (
              <div key={month}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold mr-2 text-primary">
                    {month}
                  </h3>
                  <span className="badge">
                    {monthThoughts.length}{t('thoughts.count')}
                  </span>
                  <button
                    onClick={() => setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }))}
                    className="ml-4 btn-outline p-2 rounded-lg"
                    aria-label={expandedMonths[month] ? t('thoughts.collapse') : t('thoughts.expand')}
                  >
                    {expandedMonths[month] ? '🔼' : '🔽'}
                  </button>
                </div>
                {expandedMonths[month] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthThoughts.map((thought) => {
                      const isLong = isTextLong(thought.content);
                      const cardExpanded = isExpanded(thought.id);
                      const displayContent = isLong && !cardExpanded 
                        ? getPreviewText(thought.content) 
                        : thought.content;

                      const ThoughtCard = () => {
                        const swipeGesture = useSwipeGesture({
                          onSwipeLeft: () => handleDeleteThought(thought.id, true),
                          onSwipeRight: () => {
                            setSelectedItemId(thought.id);
                            setCategoryModalOpen(true);
                          },
                        }, { threshold: 100, preventScrollOnSwipe: true });

                        const longPress = useLongPress(() => {
                          setSelectedItemId(thought.id);
                          setCategoryModalOpen(true);
                        }, { threshold: 500 });
                      
                        return (
                          <div
                            key={thought.id}
                            className={`card card-hover relative group transform transition-transform duration-200 ${
                              swipeGesture.isDragging ? 
                                swipeGesture.swipeDirection === 'left' ? 'bg-red-50 border-red-200' :
                                swipeGesture.swipeDirection === 'right' ? 'bg-blue-50 border-blue-200' : ''
                                : ''
                            }`}
                            style={{
                              transform: swipeGesture.isDragging ? 
                                `translateX(${Math.min(Math.max(swipeGesture.getSwipeDistance(), -150), 150)}px)` : 
                                'translateX(0)'
                            }}
                            {...swipeGesture.swipeHandlers}
                            {...longPress.handlers}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-start justify-between mb-4">
                                <div className="pr-8 flex-1">
                                  <p className="text-base leading-relaxed font-medium text-primary whitespace-pre-line">
                                    {displayContent}
                                  </p>
                                  
                                  {isLong && (
                                    <button
                                      onClick={() => toggleCardExpansion(thought.id)}
                                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                    >
                                      {cardExpanded ? '접기' : '...더보기'}
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteThought(thought.id)}
                                  className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                                  aria-label="Delete thought"
                                >
                                  🗑️
                                </button>
                              </div>
                              <div className="badge ml-auto">
                                {formatDate(thought.createdAt)}
                              </div>
                            </div>

                            {/* Swipe indicators */}
                            {swipeGesture.isDragging && (
                              <>
                                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl transition-opacity ${
                                  swipeGesture.swipeDirection === 'right' ? 'opacity-100' : 'opacity-30'
                                }`}>
                                  🔄
                                </div>
                                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl transition-opacity ${
                                  swipeGesture.swipeDirection === 'left' ? 'opacity-100' : 'opacity-30'
                                }`}>
                                  🗑️
                                </div>
                              </>
                            )}
                          </div>
                        );
                      };
                      
                      return <ThoughtCard key={thought.id} />;
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <CategoryChangeModal
        isOpen={categoryModalOpen}
        currentCategory="thought"
        onCategorySelect={handleCategoryChange}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedItemId('');
        }}
      />
    </div>
  );
};