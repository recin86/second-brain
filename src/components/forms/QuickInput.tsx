import React, { useState, useRef, useEffect, useCallback } from 'react';
import { classifyInput } from '../../utils/classifier';
import type { ClassificationResult } from '../../utils/classifier';
import { dataService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickInputProps {}

export const QuickInput: React.FC<QuickInputProps> = React.memo(() => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (input.trim()) {
      setClassification(classifyInput(input));
    } else {
      setClassification(null);
    }
  }, [input]);

  const handleSubmit = async (e?: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e) {
      if (e.key === 'Enter' && e.shiftKey) {
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
      } else if (e.key !== 'Enter') {
        return;
      }
    }

    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const result = classifyInput(input);
      
      if (result.type === 'todo') {
        await dataService.addTodo(result.content, result.dueDate);
      } else if (result.type === 'radiology') {
        await dataService.addRadiologyNote(result.content, result.tags || []);
      } else if (result.type === 'investment') {
        await dataService.addInvestment(result.content);
      } else {
        await dataService.addThought(result.content);
      }
      
      setInput('');
      setClassification(null);
      
      // 포커스를 더 확실하게 유지
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(0, 0);
        }
      });
      
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = async () => {
    await handleSubmit();
    // 버튼 클릭 후에도 포커스 유지
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    });
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return (
    <div className="px-0 sm:px-0 mb-6 sm:mb-8">
      <div className="bg-primary rounded-xl sm:rounded-3xl p-3 sm:p-8 shadow-lg border border-transparent mx-2 sm:mx-0">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 tracking-tight text-white">
              {t('quick.title')}
            </h2>
          </div>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleSubmit}
              placeholder={t('quick.placeholder')}
              className="w-full min-h-[100px] sm:min-h-[120px] p-4 text-base sm:text-xl border border-transparent bg-gray-100 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder-gray-500 font-normal leading-relaxed"
              disabled={isSubmitting}
              rows={3}
            />
            
            <button
              onClick={handleButtonClick}
              disabled={!input.trim() || isSubmitting}
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-10 h-10 sm:w-12 sm:h-12 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg submit-button-green"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg 
                  className="w-5 h-5 sm:w-6 sm:h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              )}
            </button>
          </div>
          
          {classification && (
            <div className="text-left text-sm sm:text-base text-white/80 bg-white/10 px-3 py-2 rounded-lg">
              <span className="text-lg mr-2">{classification.icon}</span>
              {classification.statusMessage}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
});
