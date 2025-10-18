import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Todo } from "../types/Todo";

const COLLECTION_NAME = "todos";

// Todo型（Firestoreから取得した際の型）
type FirestoreTodo = Omit<Todo, "id"> & {
	createdAt: Date;
};

/**
 * すべてのTodoを取得
 */
export const getTodos = async (): Promise<Todo[]> => {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
		const querySnapshot = await getDocs(q);

		const todos: Todo[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data() as FirestoreTodo;
			todos.push({
				id: doc.id,
				title: data.title,
				content: data.content,
				completed: data.completed,
			});
		});

		return todos;
	} catch (error) {
		console.error("Error getting todos:", error);
		throw error;
	}
};

/**
 * 新しいTodoを作成
 */
export const createTodo = async (
	title: string,
	content: string
): Promise<string> => {
	try {
		const docRef = await addDoc(collection(db, COLLECTION_NAME), {
			title,
			content,
			completed: false,
			createdAt: new Date(),
		});
		return docRef.id;
	} catch (error) {
		console.error("Error creating todo:", error);
		throw error;
	}
};

/**
 * Todoを更新
 */
export const updateTodo = async (
	id: string,
	updates: Partial<Omit<Todo, "id">>
): Promise<void> => {
	try {
		const todoRef = doc(db, COLLECTION_NAME, id);
		await updateDoc(todoRef, updates);
	} catch (error) {
		console.error("Error updating todo:", error);
		throw error;
	}
};

/**
 * Todoを削除
 */
export const deleteTodo = async (id: string): Promise<void> => {
	try {
		const todoRef = doc(db, COLLECTION_NAME, id);
		await deleteDoc(todoRef);
	} catch (error) {
		console.error("Error deleting todo:", error);
		throw error;
	}
};

/**
 * Todoの完了状態をトグル
 */
export const toggleTodoComplete = async (
	id: string,
	currentCompleted: boolean
): Promise<void> => {
	try {
		await updateTodo(id, { completed: !currentCompleted });
	} catch (error) {
		console.error("Error toggling todo:", error);
		throw error;
	}
};

