import {
	addDoc,
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { TodoCategory } from "../types/Category";
import type { Todo } from "../types/Todo";

const COLLECTION_NAME = "todos";

/**
 * Todoを取得（自分のTodoまたは共有Todo）
 */
export const getTodos = async (isShared: boolean = false): Promise<Todo[]> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const q = query(
			collection(db, COLLECTION_NAME),
			where("userId", "==", userId),
			where("shared", "==", isShared),
			orderBy("createdAt", "desc")
		);
		const querySnapshot = await getDocs(q);

		const todos: Todo[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			todos.push({
				id: doc.id,
				userId: data.userId,
				title: data.title,
				content: data.content,
				completed: data.completed,
				shared: data.shared,
				category: data.category || "other",
				createdAt: data.createdAt?.toDate(),
				completedAt: data.completedAt?.toDate(),
				completedBy: data.completedBy,
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
	content: string,
	category: TodoCategory = "other",
	isShared: boolean = false
): Promise<string> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const docRef = await addDoc(collection(db, COLLECTION_NAME), {
			userId,
			title,
			content,
			category,
			completed: false,
			shared: isShared,
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
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const todoRef = doc(db, COLLECTION_NAME, id);
		if (currentCompleted) {
			// 完了 → 未完了：completedAtとcompletedByを削除
			await updateDoc(todoRef, {
				completed: false,
				completedAt: deleteField(),
				completedBy: deleteField(),
			});
		} else {
			// 未完了 → 完了：completedAtとcompletedByを設定
			await updateDoc(todoRef, {
				completed: true,
				completedAt: new Date(),
				completedBy: userId,
			});
		}
	} catch (error) {
		console.error("Error toggling todo:", error);
		throw error;
	}
};

/**
 * Todoの共有状態をトグル
 */
export const toggleTodoShared = async (
	id: string,
	currentShared: boolean
): Promise<void> => {
	try {
		await updateTodo(id, { shared: !currentShared });
	} catch (error) {
		console.error("Error toggling todo shared:", error);
		throw error;
	}
};

/**
 * 完了後48時間経過したTodoを自動削除
 */
export const deleteExpiredCompletedTodos = async (): Promise<number> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return 0;
		}

		// 現在時刻から48時間前を計算
		const fortyEightHoursAgo = new Date();
		fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

		// 自分の完了済みTodoを取得
		const q = query(
			collection(db, COLLECTION_NAME),
			where("userId", "==", userId),
			where("completed", "==", true)
		);
		const querySnapshot = await getDocs(q);

		let deletedCount = 0;
		const deletePromises: Promise<void>[] = [];

		querySnapshot.forEach((document) => {
			const data = document.data();
			const completedAt = data.completedAt?.toDate();

			// 完了日時が48時間以上前の場合、削除対象
			if (completedAt && completedAt < fortyEightHoursAgo) {
				deletePromises.push(deleteDoc(doc(db, COLLECTION_NAME, document.id)));
				deletedCount++;
				console.log(`🗑️ 期限切れTodo削除: "${data.title}" (完了: ${completedAt.toLocaleDateString()})`);
			}
		});

		// 一括削除を実行
		await Promise.all(deletePromises);

		if (deletedCount > 0) {
			console.log(`✅ ${deletedCount}件の期限切れTodoを削除しました`);
		}

		return deletedCount;
	} catch (error) {
		console.error("Error deleting expired todos:", error);
		throw error;
	}
};
