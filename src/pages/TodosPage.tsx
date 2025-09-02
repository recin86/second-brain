import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import type { Todo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import debounce from '../utils/debounce';
import { isTextLong, getPreviewText } from '../utils/textUtils';
import { formatDate } from '../utils/dateUtils';
import { useCardExpansion } from '../hooks/useCardExpansion';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useLongPress } from '../hooks/useLongPress';
import { CategoryChangeModal } from '../components/ui/CategoryChangeModal';

export const TodosPage: React.FC = () => {
  const { t } = useLanguage();
  const { showUndo } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const { toggleCardExpansion, isExpanded } = useCardExpansion();

  useEffect(() => {
    // 실시간으로 Todos 데이터 구독
    const unsubscribe = dataService.subscribeToTodos(setTodos);
    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  const handleToggleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      dataService.updateTodo(id, { isCompleted: !todo.isCompleted });
    }
  };

  const debouncedUpdateTodoRef = useRef(
    debounce((id: string, updates: Partial<Todo>) => {
      dataService.updateTodo(id, updates);
    }, 500) // 500ms debounce delay
  );

  const handleSetDueDate = (todoId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const dueDate = event.target.value ? new Date(event.target.value) : undefined;
    debouncedUpdateTodoRef.current(todoId, { dueDate });
  };

  const handleSetPriority = (todoId: string, currentPriority: Todo['priority']) => {
    const priorities: Todo['priority'][] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    dataService.updateTodo(todoId, { priority: priorities[nextIndex] });
  };

  const handleDeleteTodo = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(t('todos.delete_confirm'))) {
      return;
    }
    
    try {
      const undoFunction = await dataService.softDeleteTodo(id);
      showUndo('할 일이 삭제되었습니다', undoFunction);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!selectedItemId) return;
    
    try {
      switch (newCategory) {
        case 'thought':
          await dataService.convertToThought(selectedItemId, 'todo');
          break;
        case 'investment':
          await dataService.convertToInvestment(selectedItemId, 'todo');
          break;
        case 'radiology':
          await dataService.convertToRadiology(selectedItemId, 'todo');
          break;
      }
      
      setCategoryModalOpen(false);
      setSelectedItemId('');
    } catch (error) {
      console.error('Failed to convert category:', error);
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'pending') return !todo.isCompleted;
    if (filter === 'completed') return todo.isCompleted;
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    return a.isCompleted ? 1 : -1;
  });

  const pendingCount = todos.filter(t => !t.isCompleted).length;
  const completedCount = todos.filter(t => t.isCompleted).length;


  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-600 hover:bg-red-700 text-white border-red-700';
      case 'medium': return 'btn-secondary';  
      case 'low': return 'btn-accent';
      default: return 'text-date';
    }
  };

  const getPriorityLabel = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high': return t('todos.priority.high');
      case 'medium': return t('todos.priority.medium');
      case 'low': return t('todos.priority.low');
      default: return t('todos.priority.medium');
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <div className="bg-primary text-white rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 shadow-lg">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-lg mr-3 sm:mr-4 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{t('todos.title')}</h2>
              <p className="opacity-90 text-sm sm:text-lg">
                {t('todos.subtitle')}
              </p>
            </div>
          </div>
          <div className="bg-white/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex space-x-2 sm:space-x-3 overflow-x-auto">
              {[
                { key: 'all', label: t('todos.all'), count: todos.length },
                { key: 'pending', label: t('todos.pending'), count: pendingCount },
                { key: 'completed', label: t('todos.completed'), count: completedCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                    filter === tab.key
                      ? 'bg-primary text-white shadow-md'
                      : 'text-primary hover:text-primary/80 bg-transparent hover:bg-primary/10'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-primary mb-3">
            {filter === 'completed' ? t('todos.empty_completed') : 
             filter === 'pending' ? t('todos.empty_pending') : 
             t('todos.empty_all')}
          </h3>
          <p className="text-muted text-base">
            {t('todos.empty_subtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTodos.map((todo) => {
            const isLong = isTextLong(todo.content);
            const cardExpanded = isExpanded(todo.id);
            const displayContent = isLong && !cardExpanded 
              ? getPreviewText(todo.content) 
              : todo.content;

            const TodoCard = () => {
              const swipeGesture = useSwipeGesture({
                onSwipeLeft: () => handleDeleteTodo(todo.id, true),
                onSwipeRight: () => {
                  setSelectedItemId(todo.id);
                  setCategoryModalOpen(true);
                },
              }, { threshold: 100, preventScrollOnSwipe: true });

              const longPress = useLongPress(() => {
                setSelectedItemId(todo.id);
                setCategoryModalOpen(true);
              }, { threshold: 500 });
            
              return (
                <div
                  key={todo.id}
                  className={`card card-hover relative group transform transition-transform duration-200 ${
                    todo.isCompleted ? 'opacity-60' : ''
                  } ${
                    swipeGesture.isDragging ? 
                      swipeGesture.swipeDirection === 'left' ? 'bg-red-50 border-red-200' :
                      swipeGesture.swipeDirection === 'right' ? 'bg-blue-50 border-blue-200' : ''
                      : ''
                  }`}
                  style={{
                    transform: swipeGesture.isDragging ? 
                      `translateX(${Math.min(Math.max(swipeGesture.getSwipeDistance(), -150), 150)}px)` : 
                      'translateX(0)'
                  }}
                  {...swipeGesture.swipeHandlers}
                  {...longPress.handlers}
                >
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-muted hover:text-red-600 absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10"
                  aria-label="Delete todo"
                >
                  🗑️
                </button>

                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedItemId(todo.id);
                        setCategoryModalOpen(true);
                      }}
                      className="badge hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                      title="카테고리 변경"
                    >
                      ✅ 할 일
                    </button>
                    <div className="badge">
                      {formatDate(todo.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => handleToggleComplete(todo.id)}
                      className={`flex-shrink-0 w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all mt-1 ${
                        todo.isCompleted
                          ? 'shadow-md'
                          : 'hover:bg-opacity-10'
                      }`}
                      style={todo.isCompleted
                        ? {backgroundColor: '#8ABF92', borderColor: '#8ABF92', color: '#038C3E'}
                        : {borderColor: '#8ABF92', backgroundColor: 'transparent', color: '#8ABF92'}}
                    >
                      {todo.isCompleted && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base font-semibold leading-relaxed mb-3 pr-8 whitespace-pre-line ${
                          todo.isCompleted
                            ? 'line-through text-muted'
                            : 'text-primary'
                        }`}
                      >
                        {displayContent}
                      </p>
                      
                      {isLong && (
                        <button
                          onClick={() => toggleCardExpansion(todo.id)}
                          className="mb-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          {cardExpanded ? '접기' : '...더보기'}
                        </button>
                      )}
                      
                      <div className="flex flex-col space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          {!todo.isCompleted && (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="date"
                                value={todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => handleSetDueDate(todo.id, e)}
                                className="absolute opacity-0 w-0 h-0"
                                aria-label={todo.dueDate ? t('todos.due') : t('todos.add_due')}
                              />
                              <span
                                className={`font-bold px-3 py-1 rounded-xl text-xs flex items-center transition-colors duration-200 cursor-pointer ${
                                  todo.dueDate
                                    ? 'btn-primary'
                                    : 'text-date hover:bg-green-50'
                                }`}
                              >
                                {todo.dueDate
                                  ? `${t('todos.due')}: ${formatDate(todo.dueDate, { year: 'numeric', month: 'short', day: 'numeric' })}`
                                  : t('todos.add_due')}
                              </span>
                            </label>
                          )}
                          <button
                            onClick={() => handleSetPriority(todo.id, todo.priority)}
                            className={`btn px-3 py-1 text-xs ${getPriorityColor(todo.priority)}`}
                            aria-label="Priority change"
                          >
                            {getPriorityLabel(todo.priority)}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
              {/* Swipe indicators */}
              {swipeGesture.isDragging && (
                <>
                  <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl transition-opacity ${
                    swipeGesture.swipeDirection === 'right' ? 'opacity-100' : 'opacity-30'
                  }`}>
                    🔄
                  </div>
                  <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl transition-opacity ${
                    swipeGesture.swipeDirection === 'left' ? 'opacity-100' : 'opacity-30'
                  }`}>
                    🗑️
                  </div>
                </>
              )}
            </div>
            );
          };
          
          return <TodoCard key={todo.id} />;
        })}
        </div>
      )}

      <CategoryChangeModal
        isOpen={categoryModalOpen}
        currentCategory="todo"
        onCategorySelect={handleCategoryChange}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedItemId('');
        }}
      />
    </div>
  );
};