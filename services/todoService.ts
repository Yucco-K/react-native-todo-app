import {
	addDoc,
	collection,
	type DocumentData,
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
 * Todoを取得（組織IDでフィルタリング）
 * @param organizationId - 組織ID（nullの場合は個人用Todoのみ取得）
 */
export const getTodos = async (organizationId: string | null = null): Promise<Todo[]> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		let q: ReturnType<typeof query>;
		if (organizationId) {
			// 組織のTodoを取得
			q = query(
				collection(db, COLLECTION_NAME),
				where("organizationId", "==", organizationId),
				orderBy("createdAt", "desc"),
			);
		} else {
			// 個人用Todoを取得（organizationIdが存在しない）
			q = query(
				collection(db, COLLECTION_NAME),
				where("userId", "==", userId),
				where("organizationId", "==", null),
				orderBy("createdAt", "desc"),
			);
		}

		const querySnapshot = await getDocs(q);

		const todos: Todo[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data() as DocumentData;
			todos.push({
				id: doc.id,
				userId: data.userId,
				title: data.title,
				content: data.content,
				completed: data.completed,
				shared: data.shared || false,
				organizationId: data.organizationId,
				category: data.category || "other",
				createdAt: data.createdAt?.toDate(),
				completedAt: data.completedAt?.toDate(),
				completedBy: data.completedBy,
			});
		});

		console.log("📋 Todo取得結果:", {
			organizationId: organizationId || "null (マイリスト)",
			取得件数: todos.length,
			タイトル一覧: todos.map((t) => t.title),
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
	organizationId: string | null = null,
): Promise<string> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const todoData: any = {
			userId,
			title,
			content,
			category,
			completed: false,
			shared: !!organizationId, // 互換性のため残す
			organizationId: organizationId || null, // 常にフィールドを保存
			createdAt: new Date(),
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), todoData);
		console.log("✅ Firestore保存成功:", {
			id: docRef.id,
			title: todoData.title,
			category: todoData.category,
			organizationId: todoData.organizationId || "null (マイリスト)",
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
export const updateTodo = async (id: string, updates: Partial<Omit<Todo, "id">>): Promise<void> => {
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
export const toggleTodoComplete = async (id: string, currentCompleted: boolean): Promise<void> => {
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
export const toggleTodoShared = async (id: string, currentShared: boolean): Promise<void> => {
	try {
		await updateTodo(id, { shared: !currentShared });
	} catch (error) {
		console.error("Error toggling todo shared:", error);
		throw error;
	}
};

/**
 * 完了後48時間経過したTodoを自動削除（履歴は保存）
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
			where("completed", "==", true),
		);
		const querySnapshot = await getDocs(q);

		let deletedCount = 0;
		const operations: Promise<void>[] = [];

		querySnapshot.forEach((document) => {
			const data = document.data();
			const completedAt = data.completedAt?.toDate();

			// 完了日時が48時間以上前の場合、削除対象
			if (completedAt && completedAt < fortyEightHoursAgo) {
				// AI統計用に完了履歴を保存
				const historyPromise: Promise<void> = addDoc(collection(db, "completedTodoHistory"), {
					userId: data.userId,
					title: data.title,
					category: data.category || "other",
					completedAt: data.completedAt,
					completedBy: data.completedBy,
					createdAt: data.createdAt,
					deletedAt: new Date(), // 削除日時を記録
				}).then(() => {});

				// Todo本体を削除
				const deletePromise = deleteDoc(doc(db, COLLECTION_NAME, document.id));

				operations.push(historyPromise, deletePromise);
				deletedCount++;
				console.log(
					`🗑️ 期限切れTodo削除: "${data.title}" (完了: ${completedAt.toLocaleDateString()})`,
				);
			}
		});

		// 履歴保存と削除を並列実行
		await Promise.all(operations);

		if (deletedCount > 0) {
			console.log(`✅ ${deletedCount}件の期限切れTodoを削除し、履歴を保存しました`);
		}

		return deletedCount;
	} catch (error) {
		console.error("Error deleting expired todos:", error);
		throw error;
	}
};
