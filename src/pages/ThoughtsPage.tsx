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
import { EditModal } from '../components/ui/EditModal';
import { smartEditItem } from '../utils/smartEdit';

export const ThoughtsPage: React.FC = () => {
  const { t } = useLanguage();
  const { showUndo } = useToast();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingThought, setEditingThought] = useState<Thought | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
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

  const handleEditThought = (thought: Thought) => {
    setEditingThought(thought);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingThought) return;
    
    try {
      const result = await smartEditItem(editingThought, 'thought', content);
      setEditModalOpen(false);
      setEditingThought(null);
      
      if (result.converted) {
        showUndo(`생각이 ${getTypeName(result.newType!)}로 변환되었습니다`, () => {});
      }
    } catch (error) {
      console.error('Failed to update thought:', error);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'todo': return '할 일';
      case 'radiology': return '영상의학';
      case 'investment': return '투자';
      default: return type;
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

  const handleCardClick = (thoughtId: string) => {
    if (isSelectionMode) {
      setSelectedCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(thoughtId)) {
          newSet.delete(thoughtId);
          if (newSet.size === 0) {
            setIsSelectionMode(false);
          }
        } else {
          newSet.add(thoughtId);
        }
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;

    if (!window.confirm(`선택한 ${selectedCards.size}개의 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedCards).map(id =>
        dataService.softDeleteThought(id)
      );
      const undoFunctions = await Promise.all(deletePromises);

      showUndo(`${selectedCards.size}개의 생각이 삭제되었습니다`, () => {
        undoFunctions.forEach(undo => undo());
      });

      setSelectedCards(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to delete selected thoughts:', error);
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedCards(new Set());
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center">
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
            {isSelectionMode && (
              <div className="flex items-center space-x-3">
                <span className="text-white text-sm sm:text-base">
                  {selectedCards.size}개 선택됨
                </span>
                <button
                  onClick={exitSelectionMode}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedCards.size === 0}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 rounded-lg text-sm transition-colors"
                >
                  삭제 ({selectedCards.size})
                </button>
              </div>
            )}
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
                          if (!isSelectionMode) {
                            setIsSelectionMode(true);
                            setSelectedCards(new Set([thought.id]));
                          }
                        }, { threshold: 500 });
                      
                        return (
                          <div
                            key={thought.id}
                            className={`card card-hover relative group transform transition-transform duration-200 ${
                              swipeGesture.isDragging ?
                                swipeGesture.swipeDirection === 'left' ? 'bg-red-50 border-red-200' :
                                swipeGesture.swipeDirection === 'right' ? 'bg-blue-50 border-blue-200' : ''
                                : ''
                            } ${
                              isSelectionMode && selectedCards.has(thought.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                            }`}
                            style={{
                              transform: swipeGesture.isDragging ?
                                `translateX(${Math.min(Math.max(swipeGesture.getSwipeDistance(), -150), 150)}px)` :
                                'translateX(0)'
                            }}
                            onClick={() => handleCardClick(thought.id)}
                            {...(isSelectionMode ? {} : swipeGesture.swipeHandlers)}
                            {...longPress.handlers}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  {isSelectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedCards.has(thought.id)}
                                      onChange={() => handleCardClick(thought.id)}
                                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isSelectionMode) {
                                        setSelectedItemId(thought.id);
                                        setCategoryModalOpen(true);
                                      }
                                    }}
                                    className="badge hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                                    title="카테고리 변경"
                                  >
                                    💭 생각
                                  </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditThought(thought)}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-blue-600 p-1"
                                    aria-label="Edit thought"
                                    title="수정"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteThought(thought.id)}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                                    aria-label="Delete thought"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-start justify-between">
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
                              </div>
                              
                              {/* Date at bottom right */}
                              <div className="flex justify-end mt-4">
                                <div className="text-xs text-gray-500">
                                  {formatDate(thought.createdAt)}
                                </div>
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
      
      <EditModal
        isOpen={editModalOpen}
        title="생각 수정"
        initialContent={editingThought?.content || ''}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditModalOpen(false);
          setEditingThought(null);
        }}
      />
    </div>
  );
};