import React, { useState, useEffect } from 'react';
import { QuickInput } from '../components/forms/QuickInput';
import { storage } from '../utils/storage';
import type { Thought, Todo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const QuickPage: React.FC = () => {
  const { t } = useLanguage();
  const [recentEntries, setRecentEntries] = useState<(Thought | Todo)[]>([]);

  const loadRecentEntries = () => {
    const thoughts = storage.getThoughts().slice(0, 3);
    const todos = storage.getTodos().slice(0, 3);
    
    const allEntries = [...thoughts, ...todos]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    
    setRecentEntries(allEntries);
  };

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const handleEntryAdded = () => {
    loadRecentEntries();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const getEntryIcon = (entry: Thought | Todo) => {
    if ('isCompleted' in entry) {
      return entry.isCompleted ? '✅' : '⏰';
    }
    return '💭';
  };

  const getEntryType = (entry: Thought | Todo) => {
    return 'isCompleted' in entry ? t('type.todo') : t('type.thought');
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <QuickInput onEntryAdded={handleEntryAdded} />
      
      {recentEntries.length > 0 && (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              {t('quick.recent')}
            </h3>
            <p className="text-gray-500 text-lg font-medium">
              {t('quick.recent_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentEntries.map((entry) => {
              const isThought = getEntryType(entry) === '생각';
              return (
                <div
                  key={entry.id}
                  className="card card-hover"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="badge">
                        {getEntryIcon(entry)} {getEntryType(entry)}
                      </div>
                      <span className="badge">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-base leading-relaxed text-primary font-medium">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};