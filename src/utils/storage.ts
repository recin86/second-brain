import type { Thought, Todo, RadiologyNote, Investment } from '../types';
import { STORAGE_KEYS } from '../constants';

// 타입 가드 함수들
const isValidThought = (obj: unknown): obj is Thought => {
  return typeof obj === 'object' && obj !== null && 
         'id' in obj && 'content' in obj && 'createdAt' in obj && 'tags' in obj;
};

const isValidTodo = (obj: unknown): obj is Todo => {
  return typeof obj === 'object' && obj !== null && 
         'id' in obj && 'content' in obj && 'isCompleted' in obj && 'priority' in obj;
};

export const storage = {
  // Thoughts
  getThoughts(): Thought[] {
    const data = localStorage.getItem(STORAGE_KEYS.THOUGHTS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(isValidThought)
          .map(thought => ({ ...thought, createdAt: new Date(thought.createdAt) }));
      }
    } catch (error) {
      console.warn('Failed to parse thoughts from localStorage:', error);
    }
    return [];
  },

  saveThoughts(thoughts: Thought[]): void {
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(thoughts));
  },

  addThought(thought: Thought): void {
    const thoughts = this.getThoughts();
    thoughts.unshift(thought);
    this.saveThoughts(thoughts);
  },

  deleteThought(id: string): void {
    let thoughts = this.getThoughts();
    thoughts = thoughts.filter(thought => thought.id !== id);
    this.saveThoughts(thoughts);
  },

  // Todos
  getTodos(): Todo[] {
    const data = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(isValidTodo)
          .map(todo => ({
            ...todo,
            createdAt: new Date(todo.createdAt),
            dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          }));
      }
    } catch (error) {
      console.warn('Failed to parse todos from localStorage:', error);
    }
    return [];
  },

  saveTodos(todos: Todo[]): void {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  },

  addTodo(todo: Todo): void {
    const todos = this.getTodos();
    todos.unshift(todo);
    this.saveTodos(todos);
  },

  updateTodo(id: string, updates: Partial<Todo>): void {
    const todos = this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates };
      this.saveTodos(todos);
    }
  },

  deleteTodo(id: string): void {
    let todos = this.getTodos();
    todos = todos.filter(todo => todo.id !== id);
    this.saveTodos(todos);
  },

  // Radiology Notes
  getRadiologyNotes(): RadiologyNote[] {
    const data = localStorage.getItem(STORAGE_KEYS.RADIOLOGY);
    if (!data) return [];
    const notes = JSON.parse(data);
    return notes.map((note: any) => ({ ...note, createdAt: new Date(note.createdAt) }));
  },

  saveRadiologyNotes(notes: RadiologyNote[]): void {
    localStorage.setItem(STORAGE_KEYS.RADIOLOGY, JSON.stringify(notes));
  },

  addRadiologyNote(note: RadiologyNote): void {
    const notes = this.getRadiologyNotes();
    notes.unshift(note);
    this.saveRadiologyNotes(notes);
  },

  deleteRadiologyNote(id: string): void {
    let notes = this.getRadiologyNotes();
    notes = notes.filter(note => note.id !== id);
    this.saveRadiologyNotes(notes);
  },

  getAllRadiologySubtags(): string[] {
    const notes = this.getRadiologyNotes();
    const allTags = new Set<string>();
    notes.forEach(note => {
      const radIndex = note.tags.findIndex(tag => tag === '#rad');
      if (radIndex !== -1) {
        note.tags.slice(radIndex + 1).forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  },

  // Investments
  getInvestments(): Investment[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    if (!data) return [];
    const investments = JSON.parse(data);
    return investments.map((investment: any) => ({ ...investment, createdAt: new Date(investment.createdAt) }));
  },

  saveInvestments(investments: Investment[]): void {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  },

  addInvestment(investment: Investment): void {
    const investments = this.getInvestments();
    investments.unshift(investment);
    this.saveInvestments(investments);
  },

  deleteInvestment(id: string): void {
    let investments = this.getInvestments();
    investments = investments.filter(investment => investment.id !== id);
    this.saveInvestments(investments);
  },
};