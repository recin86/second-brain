import type { User } from 'firebase/auth';
import { storage } from '../utils/storage';
import { FirestoreService } from './firestore';
import { DataMigration } from '../utils/dataMigration';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';
import type { GoogleCalendarEvent } from '../types/google';
import { getIsGoogleSignedIn, createEvent, updateEvent, deleteEvent } from './googleCalendar';

class DataService {
  private firestoreService: FirestoreService | null = null;
  private migration: DataMigration | null = null;
  private isOnline: boolean = navigator.onLine;
  private deletedItems: Map<string, { type: string; data: any; timestamp: number }> = new Map();

  constructor() {
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  async initializeWithUser(user: User): Promise<void> {
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
    this.notifyThoughtsListeners();
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
    this.notifyTodosListeners();
    
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.addTodo(newTodo);
        if (getIsGoogleSignedIn() && dueDate) {
          const calendarEvent = await createEvent(content, dueDate) as GoogleCalendarEvent;
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
    this.notifyRadiologyListeners();
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
    this.notifyInvestmentsListeners();
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
    this.notifyThoughtsListeners();
    if (this.firestoreService) await this.firestoreService.deleteThought(id);
  }

  async getTodos(): Promise<Todo[]> {
    return this.firestoreService ? this.firestoreService.getTodos() : storage.getTodos();
  }

  async updateThought(id: string, updates: Partial<Thought>): Promise<void> {
    storage.updateThought(id, updates);
    this.notifyThoughtsListeners();
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.updateThought(id, updates);
      } catch (error) {
        console.warn('Failed to update thought in Firebase', error);
      }
    }
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    storage.updateTodo(id, updates);
    this.notifyTodosListeners();
    if (this.firestoreService) {
      if (getIsGoogleSignedIn() && updates.hasOwnProperty('dueDate')) {
        const currentTodo = await this.firestoreService.getTodoById(id);
        if (currentTodo) {
          const { googleEventId, content } = currentTodo;
          const newDueDate = updates.dueDate;
          try {
            if (newDueDate && !googleEventId) {
              const newEvent = await createEvent(content, newDueDate) as GoogleCalendarEvent;
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
    this.notifyTodosListeners();
    if (this.firestoreService) await this.firestoreService.deleteTodo(id);
  }

  async getRadiologyNotes(): Promise<RadiologyNote[]> {
    return this.firestoreService ? this.firestoreService.getRadiologyNotes() : storage.getRadiologyNotes();
  }

  async updateRadiologyNote(id: string, updates: Partial<RadiologyNote>): Promise<void> {
    storage.updateRadiologyNote(id, updates);
    this.notifyRadiologyListeners();
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.updateRadiologyNote(id, updates);
      } catch (error) {
        console.warn('Failed to update radiology note in Firebase', error);
      }
    }
  }

  async deleteRadiologyNote(id: string): Promise<void> {
    storage.deleteRadiologyNote(id);
    this.notifyRadiologyListeners();
    if (this.firestoreService) await this.firestoreService.deleteRadiologyNote(id);
  }

  getAllRadiologySubtags(): string[] {
    return storage.getAllRadiologySubtags();
  }

  async getInvestments(): Promise<Investment[]> {
    return this.firestoreService ? this.firestoreService.getInvestments() : storage.getInvestments();
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<void> {
    storage.updateInvestment(id, updates);
    this.notifyInvestmentsListeners();
    if (this.firestoreService && this.isOnline) {
      try {
        await this.firestoreService.updateInvestment(id, updates);
      } catch (error) {
        console.warn('Failed to update investment in Firebase', error);
      }
    }
  }

  async deleteInvestment(id: string): Promise<void> {
    storage.deleteInvestment(id);
    this.notifyInvestmentsListeners();
    if (this.firestoreService) await this.firestoreService.deleteInvestment(id);
  }

  // Subscriptions
  private thoughtsListeners: Set<(thoughts: Thought[]) => void> = new Set();
  
  subscribeToThoughts(callback: (thoughts: Thought[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToThoughts(callback);
    
    // For local storage mode, maintain a list of listeners
    this.thoughtsListeners.add(callback);
    callback(storage.getThoughts());
    
    return () => {
      this.thoughtsListeners.delete(callback);
    };
  }
  
  private notifyThoughtsListeners() {
    if (this.thoughtsListeners.size > 0) {
      const thoughts = storage.getThoughts();
      this.thoughtsListeners.forEach(callback => callback(thoughts));
    }
  }

  private todosListeners: Set<(todos: Todo[]) => void> = new Set();
  
  subscribeToTodos(callback: (todos: Todo[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToTodos(callback);
    
    this.todosListeners.add(callback);
    callback(storage.getTodos());
    
    return () => {
      this.todosListeners.delete(callback);
    };
  }
  
  private notifyTodosListeners() {
    if (this.todosListeners.size > 0) {
      const todos = storage.getTodos();
      this.todosListeners.forEach(callback => callback(todos));
    }
  }

  private radiologyListeners: Set<(notes: RadiologyNote[]) => void> = new Set();
  
  subscribeToRadiologyNotes(callback: (notes: RadiologyNote[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToRadiologyNotes(callback);
    
    this.radiologyListeners.add(callback);
    callback(storage.getRadiologyNotes());
    
    return () => {
      this.radiologyListeners.delete(callback);
    };
  }
  
  private notifyRadiologyListeners() {
    if (this.radiologyListeners.size > 0) {
      const notes = storage.getRadiologyNotes();
      this.radiologyListeners.forEach(callback => callback(notes));
    }
  }

  private investmentsListeners: Set<(investments: Investment[]) => void> = new Set();
  
  subscribeToInvestments(callback: (investments: Investment[]) => void) {
    if (this.firestoreService) return this.firestoreService.subscribeToInvestments(callback);
    
    this.investmentsListeners.add(callback);
    callback(storage.getInvestments());
    
    return () => {
      this.investmentsListeners.delete(callback);
    };
  }
  
  private notifyInvestmentsListeners() {
    if (this.investmentsListeners.size > 0) {
      const investments = storage.getInvestments();
      this.investmentsListeners.forEach(callback => callback(investments));
    }
  }

  // Soft delete for undo functionality
  async softDeleteThought(id: string): Promise<() => Promise<void>> {
    const thought = storage.getThoughts().find(t => t.id === id);
    if (!thought) throw new Error('Thought not found');

    // Store for potential restoration
    this.deletedItems.set(id, { 
      type: 'thought', 
      data: thought, 
      timestamp: Date.now() 
    });

    // Delete from storage
    await this.deleteThought(id);

    // Return undo function
    return async () => {
      const deletedItem = this.deletedItems.get(id);
      if (deletedItem && deletedItem.type === 'thought') {
        storage.addThought(deletedItem.data);
        this.notifyThoughtsListeners();
        if (this.firestoreService && this.isOnline) {
          try {
            await this.firestoreService.addThought(deletedItem.data);
          } catch (error) {
            console.warn('Failed to restore thought to Firebase', error);
          }
        }
        this.deletedItems.delete(id);
      }
    };
  }

  async softDeleteTodo(id: string): Promise<() => Promise<void>> {
    const todo = storage.getTodos().find(t => t.id === id);
    if (!todo) throw new Error('Todo not found');

    this.deletedItems.set(id, { 
      type: 'todo', 
      data: todo, 
      timestamp: Date.now() 
    });

    await this.deleteTodo(id);

    return async () => {
      const deletedItem = this.deletedItems.get(id);
      if (deletedItem && deletedItem.type === 'todo') {
        storage.addTodo(deletedItem.data);
        if (this.firestoreService && this.isOnline) {
          try {
            await this.firestoreService.addTodo(deletedItem.data);
          } catch (error) {
            console.warn('Failed to restore todo to Firebase', error);
          }
        }
        this.deletedItems.delete(id);
      }
    };
  }

  async softDeleteRadiologyNote(id: string): Promise<() => Promise<void>> {
    const note = storage.getRadiologyNotes().find(n => n.id === id);
    if (!note) throw new Error('Radiology note not found');

    this.deletedItems.set(id, { 
      type: 'radiology', 
      data: note, 
      timestamp: Date.now() 
    });

    await this.deleteRadiologyNote(id);

    return async () => {
      const deletedItem = this.deletedItems.get(id);
      if (deletedItem && deletedItem.type === 'radiology') {
        storage.addRadiologyNote(deletedItem.data);
        if (this.firestoreService && this.isOnline) {
          try {
            await this.firestoreService.addRadiologyNote(deletedItem.data);
          } catch (error) {
            console.warn('Failed to restore radiology note to Firebase', error);
          }
        }
        this.deletedItems.delete(id);
      }
    };
  }

  async softDeleteInvestment(id: string): Promise<() => Promise<void>> {
    const investment = storage.getInvestments().find(i => i.id === id);
    if (!investment) throw new Error('Investment not found');

    this.deletedItems.set(id, { 
      type: 'investment', 
      data: investment, 
      timestamp: Date.now() 
    });

    await this.deleteInvestment(id);

    return async () => {
      const deletedItem = this.deletedItems.get(id);
      if (deletedItem && deletedItem.type === 'investment') {
        storage.addInvestment(deletedItem.data);
        if (this.firestoreService && this.isOnline) {
          try {
            await this.firestoreService.addInvestment(deletedItem.data);
          } catch (error) {
            console.warn('Failed to restore investment to Firebase', error);
          }
        }
        this.deletedItems.delete(id);
      }
    };
  }

  // Category conversion functions
  async convertToThought(id: string, fromType: 'todo' | 'investment' | 'radiology'): Promise<void> {
    let sourceData: any;
    
    switch (fromType) {
      case 'todo':
        sourceData = storage.getTodos().find(t => t.id === id);
        if (sourceData) await this.deleteTodo(id);
        break;
      case 'investment':
        sourceData = storage.getInvestments().find(i => i.id === id);
        if (sourceData) await this.deleteInvestment(id);
        break;
      case 'radiology':
        sourceData = storage.getRadiologyNotes().find(n => n.id === id);
        if (sourceData) await this.deleteRadiologyNote(id);
        break;
    }

    if (sourceData) {
      await this.addThought(sourceData.content);
    }
  }

  async convertToTodo(id: string, fromType: 'thought' | 'investment' | 'radiology'): Promise<void> {
    let sourceData: any;
    
    switch (fromType) {
      case 'thought':
        sourceData = storage.getThoughts().find(t => t.id === id);
        if (sourceData) await this.deleteThought(id);
        break;
      case 'investment':
        sourceData = storage.getInvestments().find(i => i.id === id);
        if (sourceData) await this.deleteInvestment(id);
        break;
      case 'radiology':
        sourceData = storage.getRadiologyNotes().find(n => n.id === id);
        if (sourceData) await this.deleteRadiologyNote(id);
        break;
    }

    if (sourceData) {
      await this.addTodo(sourceData.content);
    }
  }

  async convertToInvestment(id: string, fromType: 'thought' | 'todo' | 'radiology'): Promise<void> {
    let sourceData: any;
    
    switch (fromType) {
      case 'thought':
        sourceData = storage.getThoughts().find(t => t.id === id);
        if (sourceData) await this.deleteThought(id);
        break;
      case 'todo':
        sourceData = storage.getTodos().find(t => t.id === id);
        if (sourceData) await this.deleteTodo(id);
        break;
      case 'radiology':
        sourceData = storage.getRadiologyNotes().find(n => n.id === id);
        if (sourceData) await this.deleteRadiologyNote(id);
        break;
    }

    if (sourceData) {
      await this.addInvestment(sourceData.content);
    }
  }

  async convertToRadiology(id: string, fromType: 'thought' | 'todo' | 'investment'): Promise<void> {
    let sourceData: any;
    
    switch (fromType) {
      case 'thought':
        sourceData = storage.getThoughts().find(t => t.id === id);
        if (sourceData) await this.deleteThought(id);
        break;
      case 'todo':
        sourceData = storage.getTodos().find(t => t.id === id);
        if (sourceData) await this.deleteTodo(id);
        break;
      case 'investment':
        sourceData = storage.getInvestments().find(i => i.id === id);
        if (sourceData) await this.deleteInvestment(id);
        break;
    }

    if (sourceData) {
      await this.addRadiologyNote(sourceData.content, ['#rad']);
    }
  }

  // Clean up old deleted items (called periodically)
  cleanupOldDeletedItems(maxAge: number = 5 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, item] of this.deletedItems.entries()) {
      if (now - item.timestamp > maxAge) {
        this.deletedItems.delete(id);
      }
    }
  }
}

export const dataService = new DataService();