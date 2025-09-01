// 앱 설정 상수
export const APP_CONSTANTS = {
  NAME: 'Second Brain',
  VERSION: '1.0.0',
  RECENT_ENTRIES_LIMIT: 5,
  TEXT_PREVIEW_LINES: 5,
  DEBOUNCE_DELAY: 500,
  LOADING_SPINNER_DELAY: 100,
} as const;

// UI 상수
export const UI_CONSTANTS = {
  CARD_GRID_CLASSES: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  CARD_HOVER_CLASSES: 'card card-hover relative group',
  BUTTON_PRIMARY_CLASSES: 'btn btn-primary',
  BUTTON_OUTLINE_CLASSES: 'btn btn-outline',
  EXPAND_BUTTON_CLASSES: 'mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors',
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  THOUGHTS: 'second-brain-thoughts',
  TODOS: 'second-brain-todos',
  RADIOLOGY: 'second-brain-radiology',
  INVESTMENTS: 'second-brain-investments',
  MIGRATION_PREFIX: 'migration-completed-',
} as const;

// 타입별 아이콘
export const TYPE_ICONS = {
  THOUGHT: '💭',
  TODO_COMPLETED: '✅',
  TODO_PENDING: '⏰',
  RADIOLOGY: '🩺',
  INVESTMENT: '💰',
  DEFAULT: '📝',
  APP_LOGO: '🧠',
} as const;