import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import type { Thought } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const ThoughtsPage: React.FC = () => {
  const { t } = useLanguage();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialThoughts = storage.getThoughts();
    setThoughts(initialThoughts);
    // 모든 월을 기본적으로 열린 상태로 설정
    const initialExpandedState: Record<string, boolean> = {};
    initialThoughts.forEach(thought => {
      const monthKey = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long'
      }).format(thought.createdAt);
      initialExpandedState[monthKey] = true;
    });
    setExpandedMonths(initialExpandedState);
  }, []);

  const filteredThoughts = thoughts.filter(thought =>
    thought.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const groupedThoughts = filteredThoughts.reduce((acc, thought) => {
    const monthKey = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long'
    }).format(thought.createdAt);
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(thought);
    return acc;
  }, {} as Record<string, Thought[]>);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <div className="card-header mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-white/25 rounded-lg mr-4 flex items-center justify-center">
              <span className="text-2xl">💭</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t('thoughts.title')}</h2>
              <p className="opacity-90 text-lg">
                {t('thoughts.subtitle')}
              </p>
            </div>
          </div>
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-muted">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('thoughts.search')}
                className="w-full text-lg border-0 bg-transparent focus:outline-none placeholder-gray-400 text-primary"
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
                    {monthThoughts.map((thought) => (
                      <div
                        key={thought.id}
                        className="card card-hover relative group"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <p className="text-base leading-relaxed font-medium text-primary pr-8">
                              {thought.content}
                            </p>
                            <button
                              onClick={() => {
                                if (window.confirm(t('thoughts.delete_confirm'))) {
                                  storage.deleteThought(thought.id);
                                  setThoughts(storage.getThoughts());
                                }
                              }}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                              aria-label="Delete thought"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="badge ml-auto">
                            {formatDate(thought.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};