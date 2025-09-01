import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryOption {
  id: 'thought' | 'todo' | 'investment' | 'radiology';
  label: string;
  icon: string;
  description: string;
}

interface CategoryChangeModalProps {
  isOpen: boolean;
  currentCategory: string;
  onCategorySelect: (category: string) => void;
  onClose: () => void;
}

export const CategoryChangeModal: React.FC<CategoryChangeModalProps> = ({
  isOpen,
  currentCategory,
  onCategorySelect,
  onClose
}) => {
  const { t } = useLanguage();

  const categories: CategoryOption[] = [
    {
      id: 'thought',
      label: t('type.thought'),
      icon: '💭',
      description: '생각이나 아이디어를 기록합니다'
    },
    {
      id: 'todo',
      label: t('type.todo'),
      icon: '✅',
      description: '할 일로 관리하고 완료 상태를 추적합니다'
    },
    {
      id: 'investment',
      label: t('type.investment'),
      icon: '💰',
      description: '투자 관련 정보를 기록합니다'
    },
    {
      id: 'radiology',
      label: t('type.radiology'),
      icon: '🔬',
      description: '영상의학 노트로 태그와 함께 관리합니다'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="bg-primary text-white p-6 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">카테고리 변경</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-light"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-white/90 text-sm mt-2">
            이 항목을 다른 카테고리로 이동하시겠어요?
          </p>
        </div>
        
        <div className="p-6 space-y-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              disabled={category.id === currentCategory}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                category.id === currentCategory
                  ? 'border-primary/30 bg-primary/5 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer'
              }`}
            >
              <div className="flex items-center">
                <div className="text-2xl mr-3">{category.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-primary mb-1">
                    {category.label}
                    {category.id === currentCategory && (
                      <span className="ml-2 text-sm text-gray-500">(현재)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};