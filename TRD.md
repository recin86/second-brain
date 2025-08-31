# Second Brain 웹앱 개발 요구사항 정의서 (TRD)

## 1. 개발 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Second Brain 웹앱
- **개발 기간**: 6주 (MVP 2주 + 고도화 4주)
- **개발 방식**: 단계별 애자일 개발
- **버전 관리**: Git + GitHub

### 1.2 기술 스택

#### 1.2.1 프론트엔드
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **상태 관리**: Zustand
- **라우팅**: React Router v6
- **UI 컴포넌트**: Headless UI + 커스텀 컴포넌트
- **아이콘**: Lucide React

#### 1.2.2 백엔드 & 클라우드
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Vercel
- **External API**: Google Calendar API

#### 1.2.3 개발 도구
- **Package Manager**: pnpm
- **Linter**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library
- **Type Checking**: TypeScript strict mode

## 2. 시스템 아키텍처

### 2.1 전체 구조
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │────│   Firebase       │────│  Google API     │
│   (Vercel)      │    │   (Firestore +   │    │  (Calendar)     │
│                 │    │    Auth)         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2.2 데이터 플로우
1. 사용자 입력 → React 상태 → Zustand Store
2. 분류 로직 → Firebase Firestore 저장
3. 할 일 데이터 → Google Calendar API 동기화

### 2.3 폴더 구조
```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── forms/          # 폼 관련 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── services/           # API 및 외부 서비스
│   ├── firebase.ts
│   ├── googleCalendar.ts
│   └── api.ts
├── stores/             # Zustand 상태 관리
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
├── constants/          # 상수 정의
└── styles/             # 전역 스타일
```

## 3. 기술 요구사항

### 3.1 데이터 모델

#### 3.1.1 User
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  preferences: {
    theme: 'light' | 'dark';
    autoSyncCalendar: boolean;
  };
}
```

#### 3.1.2 Thought (생각)
```typescript
interface Thought {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isArchived: boolean;
}
```

#### 3.1.3 Todo (할 일)
```typescript
interface Todo {
  id: string;
  userId: string;
  content: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Timestamp;
  googleEventId?: string;  // Google Calendar 연동용
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### 3.2 API 설계

#### 3.2.1 Firebase Firestore Collections
- `/users/{userId}` - 사용자 정보
- `/thoughts/{thoughtId}` - 생각 데이터
- `/todos/{todoId}` - 할 일 데이터

#### 3.2.2 주요 서비스 함수
```typescript
// Firebase 서비스
interface FirebaseService {
  // 인증
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  
  // 생각 관리
  addThought(content: string, tags?: string[]): Promise<string>;
  getThoughts(userId: string, month?: string): Promise<Thought[]>;
  updateThought(id: string, updates: Partial<Thought>): Promise<void>;
  deleteThought(id: string): Promise<void>;
  
  // 할 일 관리
  addTodo(content: string, priority?: string): Promise<string>;
  getTodos(userId: string, completed?: boolean): Promise<Todo[]>;
  updateTodo(id: string, updates: Partial<Todo>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
}

// Google Calendar 서비스
interface CalendarService {
  createEvent(todo: Todo): Promise<string>;
  updateEvent(eventId: string, todo: Todo): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  syncTodos(todos: Todo[]): Promise<void>;
}
```

### 3.3 상태 관리 구조

#### 3.3.1 Zustand Stores
```typescript
// 사용자 상태
interface UserStore {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// 생각 상태
interface ThoughtStore {
  thoughts: Thought[];
  isLoading: boolean;
  addThought: (content: string) => Promise<void>;
  getThoughts: (month?: string) => Promise<void>;
  updateThought: (id: string, updates: Partial<Thought>) => Promise<void>;
  deleteThought: (id: string) => Promise<void>;
}

// 할 일 상태
interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  addTodo: (content: string) => Promise<void>;
  getTodos: () => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}
```

## 4. 핵심 기능 구현 사양

### 4.1 빠른 입력 컴포넌트

#### 4.1.1 기술 요구사항
- **입력 감지**: `onChange` 이벤트로 실시간 분류 표시
- **분류 로직**: 문자열 끝 문자 체크 (`content.endsWith(';')`)
- **키보드 처리**: Enter키로 저장, Shift+Enter로 줄바꿈
- **자동 포커스**: `useEffect`로 페이지 로드 시 포커스

#### 4.1.2 구현 예시
```typescript
const QuickInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isTodo = input.trimEnd().endsWith(';');
  
  const handleSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await submitEntry(input);
      setInput('');
    }
  };
  
  // ... 구현 계속
};
```

### 4.2 분류 및 저장 로직

#### 4.2.1 분류 함수
```typescript
const classifyAndSave = async (content: string): Promise<void> => {
  const trimmed = content.trim();
  
  if (trimmed.endsWith(';')) {
    // 할 일로 분류
    const todoContent = trimmed.slice(0, -1).trim();
    await addTodo(todoContent);
    await syncToGoogleCalendar(todoContent);
  } else {
    // 생각으로 분류
    await addThought(trimmed);
  }
};
```

### 4.3 Google Calendar 연동

#### 4.3.1 OAuth 설정
- **Client ID**: Google Cloud Console에서 발급
- **Scope**: `https://www.googleapis.com/auth/calendar`
- **Redirect URI**: Vercel 도메인 설정

#### 4.3.2 API 호출 구조
```typescript
const createCalendarEvent = async (todo: Todo): Promise<string> => {
  const event = {
    summary: todo.content,
    start: {
      dateTime: new Date().toISOString(),
      timeZone: 'Asia/Seoul',
    },
    end: {
      dateTime: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
      timeZone: 'Asia/Seoul',
    },
  };
  
  const response = await gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
  
  return response.result.id;
};
```

## 5. 성능 및 최적화

### 5.1 성능 목표
- **초기 로딩**: 2초 이내 (First Contentful Paint)
- **입력 응답**: 100ms 이내
- **검색 성능**: 500ms 이내

### 5.2 최적화 전략

#### 5.2.1 코드 분할
```typescript
// 페이지별 lazy loading
const ThoughtsPage = lazy(() => import('./pages/ThoughtsPage'));
const TodosPage = lazy(() => import('./pages/TodosPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
```

#### 5.2.2 캐싱 전략
- **React Query**: 서버 상태 캐싱 및 동기화
- **Service Worker**: 오프라인 캐싱
- **Firestore Offline**: 로컬 캐시 활용

#### 5.2.3 번들 최적화
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore'],
          calendar: ['googleapis'],
        },
      },
    },
  },
});
```

## 6. 보안 및 인증

### 6.1 Firebase Security Rules

#### 6.1.1 Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 접근 가능
    match /thoughts/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /todos/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 6.2 환경 변수 관리
```env
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_GOOGLE_CLIENT_ID=your_client_id
```

## 7. 테스트 전략

### 7.1 테스트 유형

#### 7.1.1 Unit Testing
- **컴포넌트 테스트**: React Testing Library
- **유틸 함수 테스트**: Vitest
- **커버리지 목표**: 80% 이상

#### 7.1.2 Integration Testing
- **Firebase 연동 테스트**: Firebase Emulator
- **Google Calendar API 테스트**: Mock API

#### 7.1.3 E2E Testing
- **사용자 플로우 테스트**: Playwright
- **주요 시나리오**: 입력 → 분류 → 저장 → 조회

### 7.2 테스트 스크립트
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

## 8. 배포 및 DevOps

### 8.1 CI/CD 파이프라인

#### 8.1.1 GitHub Actions
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v0.1
```

### 8.2 환경별 배포
- **Development**: 자동 배포 (develop 브랜치)
- **Staging**: PR 미리보기 (Vercel Preview)
- **Production**: 수동 승인 후 배포 (main 브랜치)

## 9. 모니터링 및 로깅

### 9.1 성능 모니터링
- **Vercel Analytics**: 웹 바이탈 추적
- **Firebase Performance**: 앱 성능 모니터링

### 9.2 에러 추적
- **Sentry**: 실시간 에러 모니터링
- **Firebase Crashlytics**: 크래시 리포트

### 9.3 사용자 분석
- **Firebase Analytics**: 사용자 행동 분석
- **Google Analytics 4**: 상세 분석

## 10. 개발 일정

### 10.1 Phase 1: MVP (2주)
- **Week 1**: 프로젝트 설정 + 기본 UI + 분류 로직
- **Week 2**: Firebase 연동 + 기본 CRUD

### 10.2 Phase 2: 클라우드 연동 (1주)
- Firebase Authentication
- 실시간 데이터 동기화

### 10.3 Phase 3: 캘린더 연동 (1주)
- Google Calendar API 연동
- 할 일 자동 동기화

### 10.4 Phase 4: 고도화 (2주)
- 검색 기능 강화
- 성능 최적화
- 테스트 보완

## 11. 위험 관리

### 11.1 기술적 위험
- **Google API 제한**: 백업 저장소 준비
- **Firebase 비용**: 사용량 모니터링 + 알림 설정
- **성능 이슈**: 프로파일링 도구 활용

### 11.2 일정 위험
- **개발 지연**: 우선순위 기반 기능 조정
- **API 변경**: 버전 고정 + 마이그레이션 계획

---

**문서 작성일**: 2025-08-30  
**작성자**: [개발자명]  
**버전**: v1.0  
**검토자**: [PM명]