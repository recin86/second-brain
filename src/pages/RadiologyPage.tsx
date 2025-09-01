import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import type { RadiologyNote } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatDate } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';

export const RadiologyPage: React.FC = () => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<RadiologyNote[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const { toggleCardExpansion, isExpanded } = useCardExpansion();

  useEffect(() => {
    const unsubscribe = dataService.subscribeToRadiologyNotes(setNotes);
    return () => unsubscribe();
  }, []);

  const subtags = useMemo(() => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      const radIndex = note.tags.findIndex(tag => tag === '#rad');
      if (radIndex !== -1) {
        note.tags.slice(radIndex + 1).forEach(tag => allTags.add(tag));
      }
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


  const handleDelete = (id: string) => {
    if (window.confirm(t('radiology.delete_confirm'))) {
      dataService.deleteRadiologyNote(id);
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
            
            return (
              <div
                key={note.id}
                className="card card-hover relative group"
              >
                <div className="flex flex-col">
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
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                      aria-label="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          tag === '#rad' 
                            ? 'bg-green-100 text-green-800' 
                            : 'badge'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="badge ml-auto">
                    {formatDate(note.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};