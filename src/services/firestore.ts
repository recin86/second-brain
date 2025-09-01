import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../config/firebase';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';

// Firestore에서 가져온 데이터를 로컬 타입으로 변환
const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp && timestamp.seconds) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  }
  return new Date(timestamp);
};

// Firestore 컬렉션 경로 생성
const getUserCollectionPath = (userId: string, collectionName: string) => {
  return `users/${userId}/${collectionName}`;
};

export class FirestoreService {
  private userId: string;

  constructor(user: User) {
    this.userId = user.uid;
  }

  // Thoughts CRUD
  async getThoughts(): Promise<Thought[]> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'thoughts'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as Thought[];
  }

  async addThought(content: string): Promise<Thought> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'thoughts'));
    const thoughtData = {
      content: content.trim(),
      tags: [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, thoughtData);
    
    // 생성된 문서 반환
    const newDoc = await getDoc(docRef);
    return {
      id: newDoc.id,
      ...newDoc.data(),
      createdAt: convertFirestoreTimestamp(newDoc.data()?.createdAt)
    } as Thought;
  }

  async deleteThought(thoughtId: string): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'thoughts'), thoughtId);
    await deleteDoc(docRef);
  }

  // Todos CRUD
  async getTodos(): Promise<Todo[]> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'todos'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt),
      dueDate: doc.data().dueDate ? convertFirestoreTimestamp(doc.data().dueDate) : undefined
    })) as Todo[];
  }

  async addTodo(content: string, dueDate?: Date): Promise<Todo> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'todos'));
    const todoData = {
      content: content.trim(),
      isCompleted: false,
      priority: 'medium' as const,
      createdAt: serverTimestamp(),
      ...(dueDate && { dueDate: Timestamp.fromDate(dueDate) })
    };

    const docRef = await addDoc(collectionRef, todoData);
    
    const newDoc = await getDoc(docRef);
    return {
      id: newDoc.id,
      ...newDoc.data(),
      createdAt: convertFirestoreTimestamp(newDoc.data()?.createdAt)
    } as Todo;
  }

  async updateTodo(todoId: string, updates: Partial<Todo>): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'todos'), todoId);
    const updateData = { ...updates };
    
    // Date 객체를 Timestamp로 변환
    if (updateData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
    }
    
    await updateDoc(docRef, updateData);
  }

  async deleteTodo(todoId: string): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'todos'), todoId);
    await deleteDoc(docRef);
  }

  async getTodoById(todoId: string): Promise<Todo | null> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'todos'), todoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertFirestoreTimestamp(data.createdAt),
      dueDate: data.dueDate ? convertFirestoreTimestamp(data.dueDate) : undefined
    } as Todo;
  }

  // Radiology Notes CRUD
  async getRadiologyNotes(): Promise<RadiologyNote[]> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'radiology'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as RadiologyNote[];
  }

  async addRadiologyNote(content: string, tags: string[]): Promise<RadiologyNote> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'radiology'));
    const noteData = {
      content: content.trim(),
      tags,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, noteData);
    
    const newDoc = await getDoc(docRef);
    return {
      id: newDoc.id,
      ...newDoc.data(),
      createdAt: convertFirestoreTimestamp(newDoc.data()?.createdAt)
    } as RadiologyNote;
  }

  async deleteRadiologyNote(noteId: string): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'radiology'), noteId);
    await deleteDoc(docRef);
  }

  async getRadiologyNotesByTag(tag: string): Promise<RadiologyNote[]> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'radiology'));
    const q = query(
      collectionRef,
      where('tags', 'array-contains', tag.toLowerCase()),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as RadiologyNote[];
  }

  // 실시간 구독 (Real-time subscriptions)
  subscribeToThoughts(callback: (thoughts: Thought[]) => void) {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'thoughts'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const thoughts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as Thought[];
      callback(thoughts);
    });
  }

  subscribeToTodos(callback: (todos: Todo[]) => void) {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'todos'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const todos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt),
        dueDate: doc.data().dueDate ? convertFirestoreTimestamp(doc.data().dueDate) : undefined
      })) as Todo[];
      callback(todos);
    });
  }

  subscribeToRadiologyNotes(callback: (notes: RadiologyNote[]) => void) {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'radiology'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as RadiologyNote[];
      callback(notes);
    });
  }

  // Investments CRUD
  async getInvestments(): Promise<Investment[]> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'investments'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirestoreTimestamp(doc.data().createdAt)
    })) as Investment[];
  }

  async addInvestment(content: string): Promise<Investment> {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'investments'));
    const newInvestment = {
      content: content.trim(),
      tags: [],
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collectionRef, newInvestment);
    
    return {
      id: docRef.id,
      content: content.trim(),
      tags: [],
      createdAt: new Date()
    };
  }

  async deleteInvestment(id: string): Promise<void> {
    const docRef = doc(db, getUserCollectionPath(this.userId, 'investments'), id);
    await deleteDoc(docRef);
  }

  subscribeToInvestments(callback: (investments: Investment[]) => void) {
    const collectionRef = collection(db, getUserCollectionPath(this.userId, 'investments'));
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const investments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertFirestoreTimestamp(doc.data().createdAt)
      })) as Investment[];
      callback(investments);
    });
  }
}