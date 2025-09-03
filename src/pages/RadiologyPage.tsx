import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import type { RadiologyNote } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatDate } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useLongPress } from '../hooks/useLongPress';
import { CategoryChangeModal } from '../components/ui/CategoryChangeModal';
import { EditModal } from '../components/ui/EditModal';
import { smartEditItem } from '../utils/smartEdit';

export const RadiologyPage: React.FC = () => {
  const { t } = useLanguage();
  const { showUndo } = useToast();
  const [notes, setNotes] = useState<RadiologyNote[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<RadiologyNote | null>(null);
  const { toggleCardExpansion, isExpanded } = useCardExpansion();

  useEffect(() => {
    const unsubscribe = dataService.subscribeToRadiologyNotes(setNotes);
    return () => unsubscribe();
  }, []);

  const subtags = useMemo(() => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      note.tags
        .filter(tag => tag !== '#rad')
        .forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (selectedTag === 'all') return notes;
    return notes.filter(note => note.tags.includes(selectedTag));
  }, [notes, selectedTag]);

  const getTagCount = (tag: string) => {
    return notes.filter(note => note.tags.includes(tag)).length;
  };


  const handleEditNote = (note: RadiologyNote) => {
    setEditingNote(note);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingNote) return;
    
    try {
      const result = await smartEditItem(editingNote, 'radiology', content);
      setEditModalOpen(false);
      setEditingNote(null);
      
      if (result.converted) {
        showUndo(`영상의학 노트가 ${getTypeName(result.newType!)}로 변환되었습니다`, () => {});
      }
    } catch (error) {
      console.error('Failed to update radiology note:', error);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'thought': return '생각';
      case 'todo': return '할 일';
      case 'investment': return '투자';
      default: return type;
    }
  };

  const handleDelete = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(t('radiology.delete_confirm'))) {
      return;
    }
    
    try {
      const undoFunction = await dataService.softDeleteRadiologyNote(id);
      showUndo('영상의학 노트가 삭제되었습니다', undoFunction);
    } catch (error) {
      console.error('Failed to delete radiology note:', error);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!selectedItemId) return;
    
    try {
      switch (newCategory) {
        case 'thought':
          await dataService.convertToThought(selectedItemId, 'radiology');
          break;
        case 'todo':
          await dataService.convertToTodo(selectedItemId, 'radiology');
          break;
        case 'investment':
          await dataService.convertToInvestment(selectedItemId, 'radiology');
          break;
      }
      
      setCategoryModalOpen(false);
      setSelectedItemId('');
    } catch (error) {
      console.error('Failed to convert category:', error);
    }
  };


  const formatTagForDisplay = (tag: string) => {
    return tag.startsWith('#') ? tag.slice(1) : tag;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <div className="bg-primary text-white rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 shadow-lg">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-lg mr-3 sm:mr-4 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🔬</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{t('radiology.title')}</h2>
              <p className="opacity-90 text-sm sm:text-lg">
                {t('radiology.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="bg-white/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                  selectedTag === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-primary hover:text-primary/80 bg-transparent hover:bg-primary/10'
                }`}
              >
                {t('radiology.all')} ({notes.length})
              </button>
              {subtags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                    selectedTag === tag
                      ? 'bg-primary text-white shadow-md'
                      : 'text-primary hover:text-primary/80 bg-transparent hover:bg-primary/10'
                  }`}
                >
                  {formatTagForDisplay(tag)} ({getTagCount(tag)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-primary mb-3">
            {selectedTag === 'all' 
              ? t('radiology.empty_all') 
              : t('radiology.empty_tag')}
          </h3>
          <p className="text-muted text-base">
            {t('radiology.empty_subtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredNotes.map((note) => {
            const isLong = isTextLong(note.content);
            const cardExpanded = isExpanded(note.id);
            const displayContent = isLong && !cardExpanded 
              ? getPreviewText(note.content) 
              : note.content;

            const RadiologyCard = () => {
              const swipeGesture = useSwipeGesture({
                onSwipeLeft: () => handleDelete(note.id, true),
                onSwipeRight: () => {
                  setSelectedItemId(note.id);
                  setCategoryModalOpen(true);
                },
              }, { threshold: 100, preventScrollOnSwipe: true });

              const longPress = useLongPress(() => {
                setSelectedItemId(note.id);
                setCategoryModalOpen(true);
              }, { threshold: 500 });
            
              return (
                <div
                  key={note.id}
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
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          setSelectedItemId(note.id);
                          setCategoryModalOpen(true);
                        }}
                        className="badge hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                        title="카테고리 변경"
                      >
                        🔬 영상의학
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-blue-600 p-1"
                          aria-label="Edit note"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                          aria-label="Delete note"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-8">
                        <p className="text-base leading-relaxed font-medium text-primary whitespace-pre-line">
                          {displayContent}
                        </p>
                        
                        {isLong && (
                          <button
                            onClick={() => toggleCardExpansion(note.id)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            {cardExpanded ? '접기' : '...더보기'}
                          </button>
                        )}
                      </div>
                    </div>
                  
                    {note.tags.filter(tag => tag !== '#rad').length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.tags
                          .filter(tag => tag !== '#rad')
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="badge"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                    
                    {/* Date at bottom right */}
                    <div className="flex justify-end mt-4">
                      <div className="text-xs text-gray-500">
                        {formatDate(note.createdAt)}
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
            
            return <RadiologyCard key={note.id} />;
          })}
        </div>
      )}

      <CategoryChangeModal
        isOpen={categoryModalOpen}
        currentCategory="radiology"
        onCategorySelect={handleCategoryChange}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedItemId('');
        }}
      />
      
      <EditModal
        isOpen={editModalOpen}
        title="영상의학 노트 수정"
        initialContent={editingNote?.content || ''}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditModalOpen(false);
          setEditingNote(null);
        }}
      />
    </div>
  );
};