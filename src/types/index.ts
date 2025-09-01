export interface Thought {
  id: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

export interface RadiologyNote {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
}

export interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  dueDate?: Date;
}

export interface Investment {
  id: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

export interface AppStore {
  thoughts: Thought[];
  todos: Todo[];
  radiologyNotes: RadiologyNote[];
  investments: Investment[];
}