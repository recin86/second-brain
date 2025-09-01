import type { User } from 'firebase/auth';
import { storage } from '../utils/storage';
import { FirestoreService } from './firestore';
import { DataMigration } from '../utils/dataMigration';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';
import { getIsGoogleSignedIn, createEvent, updateEvent, deleteEvent } from './googleCalendar';

class DataService {
  private firestoreService: FirestoreService | null = null;
  private migration: DataMigration | null = null;
  private user: User | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  async initializeWithUser(user: User): Promise<void> {
    this.user = user;
    this.firestoreService = new FirestoreService(user);
    this.migration = new DataMigration(user);

    if (await this.migration.needsMigration()) {
      await this.migration.migrateLocalDataToFirebase();
    }

    if (this.isOnline) {
      try {
        await this.migration.syncFirebaseToLocal();
      } catch (error) {
        console.warn('Initial sync failed, will use local data:', error);
      }
    }
  }

  // Thoughts
  async addThought(content: string): Promise<void> {
    const newThought: Thought = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date(),
      tags: [],
    };
    storage.addThought(newThought);
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addThought(newThought);
      } catch (error) {
        console.warn('Failed to save thought to Firebase', error);
      }
    }
  }

  // Todos
  async addTodo(content: string, dueDate?: Date): Promise<void> {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      content: content.trim(),
      isCompleted: false,
      priority: 'medium',
      createdAt: new Date(),
      dueDate,
    };
    
    storage.addTodo(newTodo);
    
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addTodo(newTodo);
        if (getIsGoogleSignedIn() && dueDate) {
          const calendarEvent: any = await createEvent(content, dueDate);
          await this.updateTodo(newTodo.id, { googleEventId: calendarEvent.id });
        }
      } catch (error) {
        console.warn('Failed to save todo to Firebase', error);
      }
    }
  }

  // Radiology Notes
  async addRadiologyNote(content: string, tags: string[]): Promise<void> {
    const newNote: RadiologyNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      tags,
      createdAt: new Date(),
    };
    storage.addRadiologyNote(newNote);
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addRadiologyNote(newNote);
      } catch (error) {
        console.warn('Failed to save radiology note to Firebase', error);
      }
    }
  }

  // Investments
  async addInvestment(content: string): Promise<void> {
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date(),
      tags: [],
    };
    storage.addInvestment(newInvestment);
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addInvestment(newInvestment);
      } catch (error) {
        console.warn('Failed to save investment to Firebase', error);
      }
    }
  }

  // --- Generic Getters, Deleters, Updaters ---

  async getThoughts(): Promise<Thought[]> {
    return this.firestoreService ? this.firestoreService.getThoughts() : storage.getThoughts();
  }

  async deleteThought(id: string): Promise<void> {
    storage.deleteThought(id);
    if (this.firestoreService) await this.firestoreService.deleteThought(id);
  }

  async getTodos(): Promise<Todo[]> {
    return this.firestoreService ? this.firestoreService.getTodos() : storage.getTodos();
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    storage.updateTodo(id, updates);
    if (this.firestoreService) {
      if (getIsGoogleSignedIn() && updates.hasOwnProperty('dueDate')) {
        const currentTodo = await this.firestoreService.getTodoById(id);
        if (currentTodo) {
          const { googleEventId, content } = currentTodo;
          const newDueDate = updates.dueDate;
          try {
            if (newDueDate && !googleEventId) {
              const newEvent: any = await createEvent(content, newDueDate);
              updates.googleEventId = newEvent.id;
            } else if (newDueDate && googleEventId) {
              await updateEvent(googleEventId, content, newDueDate);
            } else if (!newDueDate && googleEventId) {
              await deleteEvent(googleEventId);
              updates.googleEventId = '';
            }
          } catch (error) {
            console.error('Google Calendar sync failed during update:', error);
          }
        }
      }
      await this.firestoreService.updateTodo(id, updates);
    }
  }

  async deleteTodo(id: string): Promise<void> {
    storage.deleteTodo(id);
    if (this.firestoreService) await this.firestoreService.deleteTodo(id);
  }

  async getRadiologyNotes(): Promise<RadiologyNote[]> {
    return this.firestoreService ? this.firestoreService.getRadiologyNotes() : storage.getRadiologyNotes();
  }

  async deleteRadiologyNote(id: string): Promise<void> {
    storage.deleteRadiologyNote(id);
    if (this.firestoreService) await this.firestoreService.deleteRadiologyNote(id);
  }

  getAllRadiologySubtags(): string[] {
    return storage.getAllRadiologySubtags();
  }

  async getInvestments(): Promise<Investment[]> {
    return this.firestoreService ? this.firestoreService.getInvestments() : storage.getInvestments();
  }

  async deleteInvestment(id: string): Promise<void> {
    storage.deleteInvestment(id);
    if (this.firestoreService) await this.firestoreService.deleteInvestment(id);
  }

  // Subscriptions
  subscribeToThoughts(callback: (thoughts: Thought[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToThoughts(callback);
    callback(storage.getThoughts());
    return () => {};
  }

  subscribeToTodos(callback: (todos: Todo[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToTodos(callback);
    callback(storage.getTodos());
    return () => {};
  }

  subscribeToRadiologyNotes(callback: (notes: RadiologyNote[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToRadiologyNotes(callback);
    callback(storage.getRadiologyNotes());
    return () => {};
  }

  subscribeToInvestments(callback: (investments: Investment[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToInvestments(callback);
    callback(storage.getInvestments());
    return () => {};
  }
}

export const dataService = new DataService();