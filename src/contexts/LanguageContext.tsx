import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ko: {
    // Header
    'header.title': 'Second Brain',
    'header.subtitle': '빠른 기록, 스마트한 관리',
    
    // Navigation
    'nav.quick': '빠른 입력',
    'nav.thoughts': '내 생각',
    'nav.todos': '내 할 일',
    'nav.radiology': '영상의학',
    'nav.investments': '내 투자',
    'nav.search': '검색',
    
    // Quick Input
    'quick.title': '무엇을 기록할까요?',
    'quick.subtitle': '생각이나 할 일을 자유롭게 적어보세요',
    'quick.placeholder': '여기에 입력하세요... (할 일은 끝에 ;, 투자는 끝에 \' 추가)',
    'quick.hint': '💡 Shift+Enter로 줄바꿈, Enter로 저장',
    'quick.saving': '저장 중...',
    'quick.save': 'Enter로 저장',
    'quick.auto_classified': '자동으로 분류됩니다',
    'quick.recent': '최근 기록',
    'quick.recent_subtitle': '방금 전에 기록한 내용들을 확인해보세요',
    
    // Thoughts
    'thoughts.title': '내 생각',
    'thoughts.subtitle': '기록한 모든 생각들을 확인하고 검색해보세요',
    'thoughts.search': '생각 검색...',
    'thoughts.empty': '아직 기록된 생각이 없어요',
    'thoughts.empty_subtitle': '빠른 입력에서 생각을 기록해보세요!',
    'thoughts.count': '개',
    'thoughts.expand': '펼치기',
    'thoughts.collapse': '접기',
    'thoughts.delete_confirm': '정말 이 생각을 삭제하시겠습니까?',
    
    // Todos
    'todos.title': '내 할 일',
    'todos.subtitle': '등록한 모든 할 일을 관리하고 완료 상태를 추적하세요',
    'todos.all': '전체',
    'todos.pending': '미완료',
    'todos.completed': '완료',
    'todos.empty_all': '아직 등록된 할 일이 없어요',
    'todos.empty_completed': '완료된 할 일이 없어요',
    'todos.empty_pending': '미완료 할 일이 없어요',
    'todos.empty_subtitle': '빠른 입력에서 끝에 ;을 붙여 할 일을 등록해보세요!',
    'todos.due': '마감',
    'todos.add_due': '마감일 추가 📅',
    'todos.priority.high': '중요',
    'todos.priority.medium': '보통',
    'todos.priority.low': '여유',
    'todos.delete_confirm': '정말 이 할 일을 삭제하시겠습니까?',
    
    // Radiology
    'radiology.title': '영상의학',
    'radiology.subtitle': '태그별로 정리된 영상의학 노트',
    'radiology.all': '전체',
    'radiology.empty_all': '아직 영상의학 노트가 없어요',
    'radiology.empty_tag': '해당 태그의 노트가 없어요',
    'radiology.empty_subtitle': '빠른 입력에서 #Rad 태그를 추가해보세요!',
    'radiology.delete_confirm': '정말 이 노트를 삭제하시겠습니까?',
    
    // Investments
    'investments.title': '내 투자',
    'investments.subtitle': '투자 관련 기록들을 확인하고 관리하세요',
    'investments.search': '투자 기록 검색...',
    'investments.empty_all': '아직 투자 기록이 없어요',
    'investments.empty_subtitle': '빠른 입력에서 끝에 \'를 붙여 투자 기록을 등록해보세요!',
    'investments.count': '개',
    'investments.delete_confirm': '정말 이 투자 기록을 삭제하시겠습니까?',
    
    // Search
    'search.title': '검색',
    'search.subtitle': '모든 노트, 할 일, 영상의학 기록을 검색하세요',
    'search.placeholder': '모든 내용 검색...',
    'search.filters': '필터',
    'search.recent': '최근 검색',
    'search.no_results': '검색 결과가 없습니다',
    'search.no_results_subtitle': '다른 키워드를 시도하거나 필터를 조정해보세요',
    'search.start_searching': '검색을 시작하세요',
    'search.start_searching_subtitle': '키워드를 입력하여 모든 기록을 검색할 수 있습니다',
    'search.type': '타입',
    'search.status': '상태',
    'search.priority': '우선순위',
    'search.all': '전체',
    'search.pending': '미완료',
    'search.completed': '완료',
    'search.high': '높음',
    'search.medium': '보통',
    'search.low': '낮음',
    'search.thoughts': '생각',
    'search.tasks': '할 일',
    'search.radiology': '영상의학',
    'search.results': '개 결과',
    'search.searching': '검색 중...',
    
    // Common
    'type.thought': '생각',
    'type.todo': '할 일',
    'type.radiology': '영상의학',
    'type.investment': '투자',
    'classification.thought': '생각으로 저장됩니다',
    'classification.todo': '할 일로 저장됩니다',
    'classification.investment': '투자로 저장됩니다',
  },
  en: {
    // Header
    'header.title': 'Second Brain',
    'header.subtitle': 'Quick Notes, Smart Management',
    
    // Navigation
    'nav.quick': 'Quick Input',
    'nav.thoughts': 'My Thoughts',
    'nav.todos': 'My Tasks',
    'nav.radiology': 'Radiology',
    'nav.investments': 'My Investments',
    'nav.search': 'Search',
    
    // Quick Input
    'quick.title': 'What would you like to record?',
    'quick.subtitle': 'Feel free to jot down thoughts or tasks',
    'quick.placeholder': 'Type here... (add ; for tasks, \' for investments)',
    'quick.hint': '💡 Shift+Enter for new line, Enter to save',
    'quick.saving': 'Saving...',
    'quick.save': 'Press Enter to save',
    'quick.auto_classified': 'Will be automatically classified',
    'quick.recent': 'Recent Entries',
    'quick.recent_subtitle': 'Check out what you just recorded',
    
    // Thoughts
    'thoughts.title': 'My Thoughts',
    'thoughts.subtitle': 'View and search all your recorded thoughts',
    'thoughts.search': 'Search thoughts...',
    'thoughts.empty': 'No thoughts recorded yet',
    'thoughts.empty_subtitle': 'Start recording thoughts in Quick Input!',
    'thoughts.count': 'items',
    'thoughts.expand': 'Expand',
    'thoughts.collapse': 'Collapse',
    'thoughts.delete_confirm': 'Are you sure you want to delete this thought?',
    
    // Todos
    'todos.title': 'My Tasks',
    'todos.subtitle': 'Manage all your tasks and track their completion status',
    'todos.all': 'All',
    'todos.pending': 'Pending',
    'todos.completed': 'Completed',
    'todos.empty_all': 'No tasks registered yet',
    'todos.empty_completed': 'No completed tasks',
    'todos.empty_pending': 'No pending tasks',
    'todos.empty_subtitle': 'Add ; at the end in Quick Input to register a task!',
    'todos.due': 'Due',
    'todos.add_due': 'Add due date 📅',
    'todos.priority.high': 'High',
    'todos.priority.medium': 'Medium',
    'todos.priority.low': 'Low',
    'todos.delete_confirm': 'Are you sure you want to delete this task?',
    
    // Radiology
    'radiology.title': 'Radiology',
    'radiology.subtitle': 'Radiology notes organized by tags',
    'radiology.all': 'All',
    'radiology.empty_all': 'No radiology notes yet',
    'radiology.empty_tag': 'No notes with this tag',
    'radiology.empty_subtitle': 'Add #Rad tag in Quick Input to create radiology notes!',
    'radiology.delete_confirm': 'Are you sure you want to delete this note?',
    
    // Investments
    'investments.title': 'My Investments',
    'investments.subtitle': 'View and manage your investment records',
    'investments.search': 'Search investment records...',
    'investments.empty_all': 'No investment records yet',
    'investments.empty_subtitle': 'Add \' at the end in Quick Input to create investment records!',
    'investments.count': 'items',
    'investments.delete_confirm': 'Are you sure you want to delete this investment record?',
    
    // Search
    'search.title': 'Search',
    'search.subtitle': 'Search across all your notes, tasks, and radiology entries',
    'search.placeholder': 'Search everything...',
    'search.filters': 'Filters',
    'search.recent': 'Recent Searches',
    'search.no_results': 'No results found',
    'search.no_results_subtitle': 'Try different keywords or adjust your filters',
    'search.start_searching': 'Start searching',
    'search.start_searching_subtitle': 'Enter keywords to search across all your records',
    'search.type': 'Type',
    'search.status': 'Status',
    'search.priority': 'Priority',
    'search.all': 'All',
    'search.pending': 'Pending',
    'search.completed': 'Completed',
    'search.high': 'High',
    'search.medium': 'Medium',
    'search.low': 'Low',
    'search.thoughts': 'Thoughts',
    'search.tasks': 'Tasks',
    'search.radiology': 'Radiology',
    'search.results': ' results',
    'search.searching': 'Searching...',
    
    // Common
    'type.thought': 'Thought',
    'type.todo': 'Task',
    'type.radiology': 'Radiology',
    'type.investment': 'Investment',
    'classification.thought': 'Will be saved as a thought',
    'classification.todo': 'Will be saved as a task',
    'classification.investment': 'Will be saved as an investment',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};