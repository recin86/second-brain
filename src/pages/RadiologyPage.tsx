import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import type { RadiologyNote } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const RadiologyPage: React.FC = () => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<RadiologyNote[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [subtags, setSubtags] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = storage.getRadiologyNotes();
    const allSubtags = storage.getAllRadiologySubtags();
    setNotes(allNotes);
    setSubtags(allSubtags);
  };

  const filteredNotes = selectedTag === 'all' 
    ? notes 
    : storage.getRadiologyNotesByTag(selectedTag);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
              {subtags.map(tag => {
                const tagCount = storage.getRadiologyNotesByTag(tag).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                      selectedTag === tag
                        ? 'bg-primary text-white shadow-md'
                        : 'text-primary hover:text-primary/80 bg-transparent hover:bg-primary/10'
                    }`}
                  >
                    {formatTagForDisplay(tag)} ({tagCount})
                  </button>
                );
              })}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="card card-hover relative group"
            >
              <div className="flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-base leading-relaxed font-medium text-primary pr-8">
                    {note.content}
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm(t('radiology.delete_confirm'))) {
                        storage.deleteRadiologyNote(note.id);
                        loadNotes();
                      }
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                    aria-label="Delete note"
                  >
                    🗑️
                  </button>
                </div>
                
                {/* Tags */}
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
          ))}
        </div>
      )}
    </div>
  );
};