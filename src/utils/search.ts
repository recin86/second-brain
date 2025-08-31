import type { Thought, Todo, RadiologyNote } from '../types';

// 통합 검색 결과 타입
export interface SearchResult {
  id: string;
  content: string;
  type: 'thought' | 'todo' | 'radiology';
  createdAt: Date;
  matchScore: number;
  highlightedContent: string;
  metadata?: {
    isCompleted?: boolean;
    priority?: string;
    dueDate?: Date;
    tags?: string[];
  };
}

// 검색 필터 옵션
export interface SearchFilters {
  type?: 'all' | 'thought' | 'todo' | 'radiology';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  completedStatus?: 'all' | 'completed' | 'pending';
  priority?: 'all' | 'high' | 'medium' | 'low';
}

// 텍스트 하이라이팅
export const highlightText = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// 정규식 특수문자 이스케이프
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 매칭 점수 계산
const calculateMatchScore = (content: string, query: string): number => {
  if (!query.trim()) return 0;
  
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 완전 일치
  if (lowerContent.includes(lowerQuery)) {
    // 시작 부분 일치 시 더 높은 점수
    if (lowerContent.startsWith(lowerQuery)) return 100;
    // 단어 시작 부분 일치
    if (lowerContent.includes(' ' + lowerQuery)) return 90;
    // 일반 포함
    return 80;
  }
  
  // 부분 일치 점수
  const queryWords = lowerQuery.split(' ').filter(word => word.length > 0);
  let matchCount = 0;
  
  queryWords.forEach(word => {
    if (lowerContent.includes(word)) {
      matchCount++;
    }
  });
  
  return queryWords.length > 0 ? (matchCount / queryWords.length) * 70 : 0;
};

// 통합 검색 함수
export const searchAll = (
  thoughts: Thought[],
  todos: Todo[],
  radiologyNotes: RadiologyNote[],
  query: string,
  filters: SearchFilters = {}
): SearchResult[] => {
  if (!query.trim() && !hasActiveFilters(filters)) return [];
  
  const results: SearchResult[] = [];
  
  // Thoughts 검색
  if (filters.type === 'all' || filters.type === 'thought' || !filters.type) {
    thoughts.forEach(thought => {
      const score = calculateMatchScore(thought.content, query);
      if (score > 0 || hasActiveFilters(filters)) {
        if (matchesFilters(thought, 'thought', filters)) {
          results.push({
            id: thought.id,
            content: thought.content,
            type: 'thought',
            createdAt: thought.createdAt,
            matchScore: score,
            highlightedContent: highlightText(thought.content, query),
            metadata: {
              tags: thought.tags
            }
          });
        }
      }
    });
  }
  
  // Todos 검색
  if (filters.type === 'all' || filters.type === 'todo' || !filters.type) {
    todos.forEach(todo => {
      const score = calculateMatchScore(todo.content, query);
      if (score > 0 || hasActiveFilters(filters)) {
        if (matchesFilters(todo, 'todo', filters)) {
          results.push({
            id: todo.id,
            content: todo.content,
            type: 'todo',
            createdAt: todo.createdAt,
            matchScore: score,
            highlightedContent: highlightText(todo.content, query),
            metadata: {
              isCompleted: todo.isCompleted,
              priority: todo.priority,
              dueDate: todo.dueDate
            }
          });
        }
      }
    });
  }
  
  // Radiology Notes 검색
  if (filters.type === 'all' || filters.type === 'radiology' || !filters.type) {
    radiologyNotes.forEach(note => {
      const score = calculateMatchScore(note.content, query);
      if (score > 0 || hasActiveFilters(filters)) {
        if (matchesFilters(note, 'radiology', filters)) {
          results.push({
            id: note.id,
            content: note.content,
            type: 'radiology',
            createdAt: note.createdAt,
            matchScore: score,
            highlightedContent: highlightText(note.content, query),
            metadata: {
              tags: note.tags
            }
          });
        }
      }
    });
  }
  
  // 점수순으로 정렬
  return results.sort((a, b) => {
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

// 필터 조건 확인
const hasActiveFilters = (filters: SearchFilters): boolean => {
  return !!(
    filters.dateRange ||
    filters.tags?.length ||
    (filters.completedStatus && filters.completedStatus !== 'all') ||
    (filters.priority && filters.priority !== 'all')
  );
};

// 개별 항목이 필터 조건에 맞는지 확인
const matchesFilters = (
  item: Thought | Todo | RadiologyNote,
  itemType: 'thought' | 'todo' | 'radiology',
  filters: SearchFilters
): boolean => {
  // 날짜 범위 필터
  if (filters.dateRange) {
    const itemDate = item.createdAt;
    if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
      return false;
    }
  }
  
  // 태그 필터
  if (filters.tags?.length) {
    const itemTags = 'tags' in item ? item.tags : [];
    const hasMatchingTag = filters.tags.some(filterTag =>
      itemTags.some(itemTag => itemTag.toLowerCase().includes(filterTag.toLowerCase()))
    );
    if (!hasMatchingTag) return false;
  }
  
  // Todo 특정 필터
  if (itemType === 'todo' && 'isCompleted' in item) {
    const todo = item as Todo;
    
    // 완료 상태 필터
    if (filters.completedStatus === 'completed' && !todo.isCompleted) return false;
    if (filters.completedStatus === 'pending' && todo.isCompleted) return false;
    
    // 우선순위 필터
    if (filters.priority && filters.priority !== 'all' && todo.priority !== filters.priority) {
      return false;
    }
  }
  
  return true;
};

// 검색 히스토리 관리
export class SearchHistory {
  private static readonly STORAGE_KEY = 'search-history';
  private static readonly MAX_HISTORY = 10;
  
  static getHistory(): string[] {
    const history = localStorage.getItem(this.STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  }
  
  static addToHistory(query: string): void {
    if (!query.trim()) return;
    
    let history = this.getHistory();
    
    // 중복 제거
    history = history.filter(item => item !== query);
    
    // 최신 검색어를 맨 앞에 추가
    history.unshift(query);
    
    // 최대 개수 제한
    if (history.length > this.MAX_HISTORY) {
      history = history.slice(0, this.MAX_HISTORY);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }
  
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}