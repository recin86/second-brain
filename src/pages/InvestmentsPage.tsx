import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { Investment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatDate } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';

export const InvestmentsPage: React.FC = () => {
  const { t } = useLanguage();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toggleCardExpansion, isExpanded } = useCardExpansion();

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      const data = await dataService.getInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Failed to load investments:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteInvestment = async (id: string) => {
    if (window.confirm(t('investments.delete_confirm'))) {
      try {
        await dataService.deleteInvestment(id);
        setInvestments(prev => prev.filter(inv => inv.id !== id));
      } catch (error) {
        console.error('Failed to delete investment:', error);
      }
    }
  };

  const filteredInvestments = investments.filter(investment =>
    investment.content.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <div className="bg-primary text-white rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 shadow-lg">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-lg mr-3 sm:mr-4 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{t('investments.title')}</h2>
              <p className="opacity-90 text-sm sm:text-lg">
                {t('investments.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="bg-white/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('investments.search')}
                className="w-full px-4 py-3 text-base border-0 bg-transparent focus:outline-none placeholder-gray-400 text-primary"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xl text-muted">🔍</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-semibold">
          {searchTerm ? `검색 결과 (${filteredInvestments.length}${t('investments.count')})` : `전체 (${investments.length}${t('investments.count')})`}
        </h2>
      </div>

      {filteredInvestments.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center">
            <span className="text-2xl sm:text-4xl">💰</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">
            {searchTerm ? t('search.no_results') : t('investments.empty_all')}
          </h3>
          <p className="text-muted text-base sm:text-lg px-4">
            {searchTerm ? t('search.no_results_subtitle') : t('investments.empty_subtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInvestments.map((investment) => {
            const isLong = isTextLong(investment.content);
            const cardExpanded = isExpanded(investment.id);
            const displayContent = isLong && !cardExpanded 
              ? getPreviewText(investment.content) 
              : investment.content;
            
            return (
              <div
                key={investment.id}
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
                          onClick={() => toggleCardExpansion(investment.id)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          {cardExpanded ? '접기' : '...더보기'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteInvestment(investment.id)}
                      className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-red-600 p-1"
                      aria-label="Delete investment"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800">
                      💰 {t('type.investment')}
                    </span>
                  </div>
                  
                  <div className="badge ml-auto">
                    {formatDate(investment.createdAt)}
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