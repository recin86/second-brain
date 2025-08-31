import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import { searchAll, SearchHistory, type SearchResult, type SearchFilters } from '../utils/search';
import type { Thought, Todo, RadiologyNote } from '../types';

export const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // 데이터 상태
  const [allThoughts, setAllThoughts] = useState<Thought[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [allRadiologyNotes, setAllRadiologyNotes] = useState<RadiologyNote[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [thoughts, todos, radiologyNotes] = await Promise.all([
          dataService.getThoughts(),
          dataService.getTodos(),
          dataService.getRadiologyNotes()
        ]);
        
        setAllThoughts(thoughts);
        setAllTodos(todos);
        setAllRadiologyNotes(radiologyNotes);
      } catch (error) {
        console.error('Failed to load data for search:', error);
      }
    };

    loadData();
    setSearchHistory(SearchHistory.getHistory());
  }, []);

  // 검색 실행
  const performSearch = useCallback(() => {
    if (!query.trim() && !hasActiveFilters(filters)) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const searchResults = searchAll(
        allThoughts,
        allTodos,
        allRadiologyNotes,
        query,
        filters
      );
      
      setResults(searchResults);
      
      // 검색 히스토리에 추가
      if (query.trim()) {
        SearchHistory.addToHistory(query);
        setSearchHistory(SearchHistory.getHistory());
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, allThoughts, allTodos, allRadiologyNotes]);

  // 검색어 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const hasActiveFilters = (filters: SearchFilters): boolean => {
    return !!(
      (filters.type && filters.type !== 'all') ||
      filters.dateRange ||
      filters.tags?.length ||
      (filters.completedStatus && filters.completedStatus !== 'all') ||
      (filters.priority && filters.priority !== 'all')
    );
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'thought': return '💭';
      case 'todo': return '✅';
      case 'radiology': return '🏥';
      default: return '📝';
    }
  };

  const getResultTypeName = (type: string) => {
    switch (type) {
      case 'thought': return t('type.thought');
      case 'todo': return t('type.todo');
      case 'radiology': return 'Radiology';
      default: return 'Note';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setFilters({ type: 'all' });
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <div className="card-header mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-white/25 rounded-lg mr-4 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t('search.title')}</h2>
              <p className="opacity-90 text-lg">
                {t('search.subtitle')}
              </p>
            </div>
          </div>
          
          {/* 검색창 */}
          <div className="card-content mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-muted">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="flex-1 text-lg border-0 bg-transparent focus:outline-none placeholder-gray-400 text-primary"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="text-muted hover:text-primary"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* 필터 토글 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'} text-sm`}
              >
                {showFilters ? '🔽' : '🔼'} {t('search.filters')}
                {hasActiveFilters(filters) && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <div className="text-sm text-muted">
                {loading ? t('search.searching') : `${results.length}${t('search.results')}`}
              </div>
            </div>
          </div>
          
          {/* 고급 필터 */}
          {showFilters && (
            <div className="card-content mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 타입 필터 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">{t('search.type')}</label>
                  <select
                    value={filters.type || 'all'}
                    onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">{t('search.all')}</option>
                    <option value="thought">{t('search.thoughts')}</option>
                    <option value="todo">{t('search.tasks')}</option>
                    <option value="radiology">{t('search.radiology')}</option>
                  </select>
                </div>
                
                {/* 완료 상태 필터 (Todo용) */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">{t('search.status')}</label>
                  <select
                    value={filters.completedStatus || 'all'}
                    onChange={(e) => setFilters({...filters, completedStatus: e.target.value as any})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">{t('search.all')}</option>
                    <option value="pending">{t('search.pending')}</option>
                    <option value="completed">{t('search.completed')}</option>
                  </select>
                </div>
                
                {/* 우선순위 필터 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">{t('search.priority')}</label>
                  <select
                    value={filters.priority || 'all'}
                    onChange={(e) => setFilters({...filters, priority: e.target.value as any})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">{t('search.all')}</option>
                    <option value="high">{t('search.high')}</option>
                    <option value="medium">{t('search.medium')}</option>
                    <option value="low">{t('search.low')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 검색 히스토리 */}
        {!query && searchHistory.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-primary mb-3">{t('search.recent')}</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(historyItem)}
                  className="badge hover:bg-primary/20 cursor-pointer transition-colors"
                >
                  {historyItem}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className="card card-hover">
              <div className="flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span>{getResultIcon(result.type)}</span>
                    <span className="badge">{getResultTypeName(result.type)}</span>
                  </div>
                  <span className="text-xs text-muted">{formatDate(result.createdAt)}</span>
                </div>
                
                {/* 내용 */}
                <div 
                  className="text-base leading-relaxed text-primary mb-3"
                  dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                />
                
                {/* 메타데이터 */}
                {result.metadata && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {result.metadata.isCompleted !== undefined && (
                      <span className={`badge ${result.metadata.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {result.metadata.isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    )}
                    {result.metadata.priority && result.metadata.priority !== 'medium' && (
                      <span className={`badge ${
                        result.metadata.priority === 'high' ? 'bg-red-100 text-red-800' :
                        result.metadata.priority === 'low' ? 'bg-blue-100 text-blue-800' : ''
                      }`}>
                        {result.metadata.priority}
                      </span>
                    )}
                    {result.metadata.tags?.map((tag, index) => (
                      <span key={index} className="badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : query || hasActiveFilters(filters) ? (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-primary mb-3">
            {t('search.no_results')}
          </h3>
          <p className="text-muted text-base">
            {t('search.no_results_subtitle')}
          </p>
        </div>
      ) : (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-primary mb-3">
            {t('search.start_searching')}
          </h3>
          <p className="text-muted text-base">
            {t('search.start_searching_subtitle')}
          </p>
        </div>
      )}
    </div>
  );
};