import type { User } from 'firebase/auth';
import { storage } from '../utils/storage';
import { FirestoreService } from './firestore';
import { DataMigration } from '../utils/dataMigration';
import type { Thought, Todo, RadiologyNote } from '../types';

import { getIsGoogleSignedIn, createEvent } from './googleCalendar';

// 통합 데이터 서비스 클래스
export class DataService {
  private firestoreService: FirestoreService | null = null;
  private migration: DataMigration | null = null;
  private user: User | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // 온라인 상태 모니터링
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline');
    });
  }

  // 사용자 인증 후 Firebase 서비스 초기화
  async initializeWithUser(user: User): Promise<void> {
    this.user = user;
    this.firestoreService = new FirestoreService(user);
    this.migration = new DataMigration(user);

    // 데이터 마이그레이션이 필요한지 확인
    if (await this.migration.needsMigration()) {
      console.log('🔄 Migration needed, starting...');
      await this.migration.migrateLocalDataToFirebase();
    }

    // Firebase에서 최신 데이터로 로컬 동기화
    if (this.isOnline) {
      try {
        await this.migration.syncFirebaseToLocal();
      } catch (error) {
        console.warn('Initial sync failed, will use local data:', error);
      }
    }
  }

  // Thoughts 관리
  async getThoughts(): Promise<Thought[]> {
    if (this.firestoreService && this.isOnline) {
      try {
        return await this.firestoreService.getThoughts();
      } catch (error) {
        console.warn('Failed to get thoughts from Firebase, using local:', error);
      }
    }
    return storage.getThoughts();
  }

  async addThought(content: string): Promise<Thought> {
    // 로컬에 먼저 저장 (즉시 반응)
    const localThought = storage.addThought(content);

    // 온라인이고 Firebase 사용 가능하면 클라우드에도 저장
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addThought(content);
      } catch (error) {
        console.warn('Failed to save thought to Firebase, saved locally only:', error);
      }
    }

    return localThought;
  }

  async deleteThought(id: string): Promise<void> {
    // 로컬에서 먼저 삭제
    storage.deleteThought(id);

    // Firebase에서도 삭제 시도
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.deleteThought(id);
      } catch (error) {
        console.warn('Failed to delete thought from Firebase:', error);
      }
    }
  }

  // Todos 관리
  async getTodos(): Promise<Todo[]> {
    if (this.firestoreService && this.isOnline) {
      try {
        return await this.firestoreService.getTodos();
      } catch (error) {
        console.warn('Failed to get todos from Firebase, using local:', error);
      }
    }
    return storage.getTodos();
  }

  async addTodo(content: string): Promise<Todo> {
    const localTodo = storage.addTodo(content);

    if (this.firestoreService && this.isOnline) {
      try {
        const newTodo = await this.firestoreService.addTodo(content);
        // 캘린더 연동 로직
        if (getIsGoogleSignedIn()) {
          try {
            const calendarEvent: any = await createEvent(content);
            await this.firestoreService.updateTodo(newTodo.id, { googleEventId: calendarEvent.id });
          } catch (error) {
            console.error('Failed to create Google Calendar event:', error);
          }
        }
      } catch (error) {
        console.warn('Failed to save todo to Firebase:', error);
      }
    }
    }

    return localTodo;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    // 로컬 업데이트
    if (updates.hasOwnProperty('isCompleted')) {
      storage.toggleTodo(id);
    }
    if (updates.dueDate !== undefined) {
      storage.updateTodoDueDate(id, updates.dueDate);
    }
    if (updates.priority) {
      storage.updateTodoPriority(id, updates.priority);
    }

    // Firebase 업데이트
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.updateTodo(id, updates);
      } catch (error) {
        console.warn('Failed to update todo in Firebase:', error);
      }
    }
  }

  async deleteTodo(id: string): Promise<void> {
    storage.deleteTodo(id);

    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.deleteTodo(id);
      } catch (error) {
        console.warn('Failed to delete todo from Firebase:', error);
      }
    }
  }

  // Radiology Notes 관리
  async getRadiologyNotes(): Promise<RadiologyNote[]> {
    if (this.firestoreService && this.isOnline) {
      try {
        return await this.firestoreService.getRadiologyNotes();
      } catch (error) {
        console.warn('Failed to get radiology notes from Firebase:', error);
      }
    }
    return storage.getRadiologyNotes();
  }

  async addRadiologyNote(content: string, tags: string[]): Promise<RadiologyNote> {
    const localNote = storage.addRadiologyNote(content, tags);

    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addRadiologyNote(content, tags);
      } catch (error) {
        console.warn('Failed to save radiology note to Firebase:', error);
      }
    }

    return localNote;
  }

  async deleteRadiologyNote(id: string): Promise<void> {
    storage.deleteRadiologyNote(id);

    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.deleteRadiologyNote(id);
      } catch (error) {
        console.warn('Failed to delete radiology note from Firebase:', error);
      }
    }
  }

  async getRadiologyNotesByTag(tag: string): Promise<RadiologyNote[]> {
    if (this.firestoreService && this.isOnline) {
      try {
        return await this.firestoreService.getRadiologyNotesByTag(tag);
      } catch (error) {
        console.warn('Failed to get radiology notes by tag from Firebase:', error);
      }
    }
    return storage.getRadiologyNotesByTag(tag);
  }

  getAllRadiologySubtags(): string[] {
    return storage.getAllRadiologySubtags();
  }

  // 실시간 구독 (Firebase 사용 시)
  subscribeToThoughts(callback: (thoughts: Thought[]) => void) {
    if (this.firestoreService && this.isOnline) {
      return this.firestoreService.subscribeToThoughts(callback);
    }
    
    // 오프라인이나 Firebase 미사용 시 로컬 데이터로 한 번 호출
    callback(storage.getThoughts());
    return () => {}; // 빈 unsubscribe 함수
  }

  subscribeToTodos(callback: (todos: Todo[]) => void) {
    if (this.firestoreService && this.isOnline) {
      return this.firestoreService.subscribeToTodos(callback);
    }
    
    callback(storage.getTodos());
    return () => {};
  }

  subscribeToRadiologyNotes(callback: (notes: RadiologyNote[]) => void) {
    if (this.firestoreService && this.isOnline) {
      return this.firestoreService.subscribeToRadiologyNotes(callback);
    }
    
    callback(storage.getRadiologyNotes());
    return () => {};
  }

  // 동기화 상태 확인
  isUsingFirebase(): boolean {
    return this.firestoreService !== null && this.isOnline;
  }

  getConnectionStatus(): string {
    if (!this.user) return 'Not signed in';
    if (!this.isOnline) return 'Offline (using local storage)';
    if (this.firestoreService) return 'Online (synced with cloud)';
    return 'Local only';
  }
}

// 전역 데이터 서비스 인스턴스
export const dataService = new DataService();