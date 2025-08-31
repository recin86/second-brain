import type { User } from 'firebase/auth';
import { storage } from './storage';
import { FirestoreService } from '../services/firestore';
import type { Thought, Todo, RadiologyNote } from '../types';

export class DataMigration {
  private firestoreService: FirestoreService;
  private user: User;

  constructor(user: User) {
    this.user = user;
    this.firestoreService = new FirestoreService(user);
  }

  // 로컬 데이터를 Firebase로 마이그레이션
  async migrateLocalDataToFirebase(): Promise<{
    thoughts: number;
    todos: number;
    radiologyNotes: number;
  }> {
    console.log('🔄 Starting data migration to Firebase...');
    
    const migrationCounts = {
      thoughts: 0,
      todos: 0,
      radiologyNotes: 0
    };

    try {
      // 1. Thoughts 마이그레이션
      const localThoughts = storage.getThoughts();
      console.log(`📝 Found ${localThoughts.length} thoughts to migrate`);
      
      for (const thought of localThoughts) {
        await this.firestoreService.addThought(thought.content);
        migrationCounts.thoughts++;
      }

      // 2. Todos 마이그레이션
      const localTodos = storage.getTodos();
      console.log(`✅ Found ${localTodos.length} todos to migrate`);
      
      for (const todo of localTodos) {
        const newTodo = await this.firestoreService.addTodo(todo.content);
        
        // 완료 상태, 우선순위, 마감일 업데이트
        if (todo.isCompleted !== false || todo.priority !== 'medium' || todo.dueDate) {
          await this.firestoreService.updateTodo(newTodo.id, {
            isCompleted: todo.isCompleted,
            priority: todo.priority,
            dueDate: todo.dueDate
          });
        }
        
        migrationCounts.todos++;
      }

      // 3. Radiology Notes 마이그레이션
      const localRadiologyNotes = storage.getRadiologyNotes();
      console.log(`🏥 Found ${localRadiologyNotes.length} radiology notes to migrate`);
      
      for (const note of localRadiologyNotes) {
        await this.firestoreService.addRadiologyNote(note.content, note.tags);
        migrationCounts.radiologyNotes++;
      }

      console.log('✅ Migration completed successfully!', migrationCounts);
      
      // 마이그레이션 완료 후 로컬 데이터 백업 표시
      this.markMigrationCompleted();
      
      return migrationCounts;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Firebase에서 로컬로 데이터 동기화 (백업용)
  async syncFirebaseToLocal(): Promise<void> {
    console.log('📥 Syncing Firebase data to local storage...');
    
    try {
      // Firestore에서 최신 데이터 가져오기
      const [thoughts, todos, radiologyNotes] = await Promise.all([
        this.firestoreService.getThoughts(),
        this.firestoreService.getTodos(),
        this.firestoreService.getRadiologyNotes()
      ]);

      // 로컬 스토리지 업데이트
      storage.saveThoughts(thoughts);
      storage.saveTodos(todos);
      storage.saveRadiologyNotes(radiologyNotes);
      
      console.log('✅ Local sync completed');
    } catch (error) {
      console.error('❌ Local sync failed:', error);
      throw error;
    }
  }

  // 마이그레이션 완료 상태 확인
  isMigrationCompleted(): boolean {
    return localStorage.getItem(`migration-completed-${this.user.uid}`) === 'true';
  }

  // 마이그레이션 완료 표시
  private markMigrationCompleted(): void {
    localStorage.setItem(`migration-completed-${this.user.uid}`, 'true');
  }

  // 마이그레이션이 필요한지 확인
  async needsMigration(): Promise<boolean> {
    if (this.isMigrationCompleted()) {
      return false;
    }

    // 로컬에 데이터가 있는지 확인
    const hasLocalData = 
      storage.getThoughts().length > 0 ||
      storage.getTodos().length > 0 ||
      storage.getRadiologyNotes().length > 0;

    if (!hasLocalData) {
      this.markMigrationCompleted();
      return false;
    }

    // Firebase에 이미 데이터가 있는지 확인
    try {
      const [thoughts, todos, radiologyNotes] = await Promise.all([
        this.firestoreService.getThoughts(),
        this.firestoreService.getTodos(),
        this.firestoreService.getRadiologyNotes()
      ]);

      const hasFirebaseData = 
        thoughts.length > 0 ||
        todos.length > 0 ||
        radiologyNotes.length > 0;

      // Firebase에 데이터가 있으면 마이그레이션 불필요
      if (hasFirebaseData) {
        this.markMigrationCompleted();
        return false;
      }

      return hasLocalData;
    } catch (error) {
      console.warn('Could not check Firebase data, assuming migration needed');
      return hasLocalData;
    }
  }
}