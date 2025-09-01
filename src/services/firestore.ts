import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../config/firebase';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';

const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp && timestamp.seconds) return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  return new Date(timestamp);
};

const getUserCollectionPath = (userId: string, collectionName: string) => {
  return `users/${userId}/${collectionName}`;
};

export class FirestoreService {
  private userId: string;

  constructor(user: User) {
    this.userId = user.uid;
  }

  // Thoughts
  async getThoughts(): Promise<Thought[]> {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'thoughts')), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as Thought[];
  }

  async addThought(thought: Thought): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'thoughts'), thought.id);
    const { id, ...thoughtData } = thought;
    await setDoc(docRef, { ...thoughtData, createdAt: serverTimestamp() });
  }

  async deleteThought(thoughtId: string): Promise<void> {
    await deleteDoc(doc(db, getUserCollectionPath(this.userId, 'thoughts'), thoughtId));
  }

  // Todos
  async getTodos(): Promise<Todo[]> {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'todos')), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt),
      dueDate: doc.data().dueDate ? convertFirestoreTimestamp(doc.data().dueDate) : undefined
    })) as Todo[];
  }

  async addTodo(todo: Todo): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'todos'), todo.id);
    const { id, ...todoData } = todo;
    
    // undefined 값들을 필터링
    const cleanTodoData: any = { ...todoData, createdAt: serverTimestamp() };
    if (cleanTodoData.dueDate === undefined) {
      delete cleanTodoData.dueDate;
    }
    if (cleanTodoData.googleEventId === undefined) {
      delete cleanTodoData.googleEventId;
    }
    
    await setDoc(docRef, cleanTodoData);
  }

  async updateTodo(todoId: string, updates: Partial<Todo>): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'todos'), todoId);
    const updateData: any = { ...updates };
    
    // undefined 값들을 필터링하고 dueDate를 Timestamp로 변환
    if (updateData.dueDate === undefined) {
      delete updateData.dueDate;
    } else if (updateData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
    }
    
    if (updateData.googleEventId === undefined) {
      delete updateData.googleEventId;
    }
    
    await updateDoc(docRef, updateData);
  }

  async deleteTodo(todoId: string): Promise<void> {
    await deleteDoc(doc(db, getUserCollectionPath(this.userId, 'todos'), todoId));
  }

  async getTodoById(todoId: string): Promise<Todo | null> {
    const docSnap = await getDoc(doc(db, getUserCollectionPath(this.userId, 'todos'), todoId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertFirestoreTimestamp(data.createdAt),
      dueDate: data.dueDate ? convertFirestoreTimestamp(data.dueDate) : undefined
    } as Todo;
  }

  // Radiology Notes
  async getRadiologyNotes(): Promise<RadiologyNote[]> {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'radiology')), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as RadiologyNote[];
  }

  async addRadiologyNote(note: RadiologyNote): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'radiology'), note.id);
    const { id, ...noteData } = note;
    await setDoc(docRef, { ...noteData, createdAt: serverTimestamp() });
  }

  async deleteRadiologyNote(noteId: string): Promise<void> {
    await deleteDoc(doc(db, getUserCollectionPath(this.userId, 'radiology'), noteId));
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'investments')), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as Investment[];
  }

  async addInvestment(investment: Investment): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'investments'), investment.id);
    const { id, ...investmentData } = investment;
    await setDoc(docRef, { ...investmentData, createdAt: serverTimestamp() });
  }

  async deleteInvestment(id: string): Promise<void> {
    await deleteDoc(doc(db, getUserCollectionPath(this.userId, 'investments'), id));
  }

  // Subscriptions
  subscribeToThoughts(callback: (thoughts: Thought[]) => void) {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'thoughts')), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const thoughts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as Thought[];
      callback(thoughts);
    });
  }

  subscribeToTodos(callback: (todos: Todo[]) => void) {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'todos')), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const todos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt),
        dueDate: doc.data().dueDate ? convertFirestoreTimestamp(doc.data().dueDate) : undefined
      })) as Todo[];
      callback(todos);
    });
  }

  subscribeToRadiologyNotes(callback: (notes: RadiologyNote[]) => void) {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'radiology')), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as RadiologyNote[];
      callback(notes);
    });
  }

  subscribeToInvestments(callback: (investments: Investment[]) => void) {
    const q = query(collection(db, getUserCollectionPath(this.userId, 'investments')), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const investments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as Investment[];
      callback(investments);
    });
  }
}
