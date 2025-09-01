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
    return thoughts.map((thought: any) => ({
      ...thought,
      createdAt: new Date(thought.createdAt),
    }));
  },

  saveThoughts(thoughts: Thought[]): void {
    localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts));
  },

  addThought(content: string): Thought {
    const thoughts = this.getThoughts();
    const newThought: Thought = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date(),
      tags: [],
    };
    
    thoughts.unshift(newThought);
    this.saveThoughts(thoughts);
    return newThought;
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

  addTodo(content: string): Todo {
    const todos = this.getTodos();
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      content: content.trim(),
      isCompleted: false,
      priority: 'medium',
      createdAt: new Date(),
    };
    
    todos.unshift(newTodo);
    this.saveTodos(todos);
    return newTodo;
  },

  toggleTodo(id: string): void {
    const todos = this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.isCompleted = !todo.isCompleted;
      this.saveTodos(todos);
    }
  },

  updateTodoDueDate(id: string, dueDate: Date | undefined): void {
    const todos = this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.dueDate = dueDate;
      this.saveTodos(todos);
    }
  },

  updateTodoPriority(id: string, priority: Todo['priority']): void {
    const todos = this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.priority = priority;
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
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
    }));
  },

  saveRadiologyNotes(notes: RadiologyNote[]): void {
    localStorage.setItem(RADIOLOGY_KEY, JSON.stringify(notes));
  },

  addRadiologyNote(content: string, tags: string[]): RadiologyNote {
    const notes = this.getRadiologyNotes();
    const newNote: RadiologyNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      tags,
      createdAt: new Date(),
    };
    
    notes.unshift(newNote);
    this.saveRadiologyNotes(notes);
    return newNote;
  },

  deleteRadiologyNote(id: string): void {
    let notes = this.getRadiologyNotes();
    notes = notes.filter(note => note.id !== id);
    this.saveRadiologyNotes(notes);
  },

  getRadiologyNotesByTag(tag: string): RadiologyNote[] {
    const notes = this.getRadiologyNotes();
    return notes.filter(note => note.tags.includes(tag.toLowerCase()));
  },

  getAllRadiologySubtags(): string[] {
    const notes = this.getRadiologyNotes();
    const allTags = new Set<string>();
    
    notes.forEach(note => {
      const radIndex = note.tags.findIndex(tag => tag === '#rad');
      if (radIndex !== -1) {
        // #rad 이후의 태그들만 수집
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
    return investments.map((investment: any) => ({
      ...investment,
      createdAt: new Date(investment.createdAt),
    }));
  },

  saveInvestments(investments: Investment[]): void {
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
  },

  addInvestment(content: string): Investment {
    const investments = this.getInvestments();
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date(),
      tags: [],
    };
    
    investments.unshift(newInvestment);
    this.saveInvestments(investments);
    return newInvestment;
  },

  deleteInvestment(id: string): void {
    let investments = this.getInvestments();
    investments = investments.filter(investment => investment.id !== id);
    this.saveInvestments(investments);
  },
};