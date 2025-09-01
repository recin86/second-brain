import type { Thought, Todo, RadiologyNote, Investment } from '../types';

const THOUGHTS_KEY = 'second-brain-thoughts';
const TODOS_KEY = 'second-brain-todos';
const RADIOLOGY_KEY = 'second-brain-radiology';
const INVESTMENTS_KEY = 'second-brain-investments';

export const storage = {
  // Thoughts
  getThoughts(): Thought[] {
    const data = localStorage.getItem(THOUGHTS_KEY);
    if (!data) return [];
    const thoughts = JSON.parse(data);
    return thoughts.map((thought: any) => ({ ...thought, createdAt: new Date(thought.createdAt) }));
  },

  saveThoughts(thoughts: Thought[]): void {
    localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts));
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
    const data = localStorage.getItem(TODOS_KEY);
    if (!data) return [];
    const todos = JSON.parse(data);
    return todos.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    }));
  },

  saveTodos(todos: Todo[]): void {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
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
    const data = localStorage.getItem(RADIOLOGY_KEY);
    if (!data) return [];
    const notes = JSON.parse(data);
    return notes.map((note: any) => ({ ...note, createdAt: new Date(note.createdAt) }));
  },

  saveRadiologyNotes(notes: RadiologyNote[]): void {
    localStorage.setItem(RADIOLOGY_KEY, JSON.stringify(notes));
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
    const data = localStorage.getItem(INVESTMENTS_KEY);
    if (!data) return [];
    const investments = JSON.parse(data);
    return investments.map((investment: any) => ({ ...investment, createdAt: new Date(investment.createdAt) }));
  },

  saveInvestments(investments: Investment[]): void {
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
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