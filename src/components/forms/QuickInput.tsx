import React, { useState, useRef, useEffect } from 'react';
import { classifyInput } from '../../utils/classifier';
import type { ClassificationResult } from '../../utils/classifier';
import { dataService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickInputProps {
  onEntryAdded?: () => void;
}

export const QuickInput: React.FC<QuickInputProps> = ({ onEntryAdded }) => {
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

  const handleSubmit = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (!input.trim() || isSubmitting) return;

      setIsSubmitting(true);
      
      try {
        const result = classifyInput(input);
        
        if (result.type === 'todo') {
          await dataService.addTodo(result.content, result.dueDate);
        } else if (result.type === 'radiology') {
          await dataService.addRadiologyNote(result.content, result.tags || []);
        } else {
          await dataService.addThought(result.content);
        }
        
        setInput('');
        setClassification(null);
        onEntryAdded?.();
        
        // 포커스 유지
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
        
      } catch (error) {
        console.error('Failed to save entry:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="card-header mb-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-6 tracking-tight">
            {t('quick.title')}
          </h2>
        </div>
        
        <div className="card-content">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleSubmit}
            placeholder={t('quick.placeholder')}
            className="w-full min-h-[120px] p-0 text-xl border-0 bg-transparent focus:outline-none resize-none placeholder-gray-400 font-normal leading-relaxed text-primary"
            disabled={isSubmitting}
          />
        </div>
        
                {classification && (
          <div className="text-left text-sm text-white mt-2">
            {classification.icon} {classification.statusMessage}
          </div>
        )}
        
        {isSubmitting && (
          <div className="flex items-center justify-center pt-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm">{t('quick.saving')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};