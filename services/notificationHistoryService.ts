import { auth, db } from "@/config/firebase";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	where,
} from "firebase/firestore";

export interface NotificationHistory {
	id: string;
	userId: string;
	title: string;
	body: string;
	data?: Record<string, unknown>;
	createdAt: Date;
}

/**
 * 通知履歴を保存
 */
export async function saveNotificationHistory(
	userId: string,
	title: string,
	body: string,
	data?: Record<string, unknown>
): Promise<void> {
	try {
		await addDoc(collection(db, "notificationHistory"), {
			userId,
			title,
			body,
			data: data || {},
			createdAt: new Date(),
		});
		console.log("✅ 通知履歴を保存しました");
	} catch (error) {
		console.error("通知履歴の保存エラー:", error);
		throw error;
	}
}

/**
 * ユーザーの通知履歴を取得
 * （自分が行った操作による通知は除外、リマインド通知は全て表示）
 */
export async function getNotificationHistory(
	userId: string
): Promise<NotificationHistory[]> {
	try {
		const currentUserId = auth.currentUser?.uid;
		if (!currentUserId) {
			return [];
		}

		const q = query(
			collection(db, "notificationHistory"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc")
		);

		const snapshot = await getDocs(q);
		const history: NotificationHistory[] = [];

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const notificationData = data.data || {};

			// Todo操作に関する通知の場合、自分が行った操作による通知は除外
			// ただし、リマインド（reminder）は自分が設定したものでも表示する
			if (
				notificationData.type &&
				[
					"todo_added",
					"todo_updated",
					"todo_deleted",
					"todo_completed",
				].includes(notificationData.type as string) &&
				notificationData.actionUserId
			) {
				// 自分が行った操作による通知は除外
				if (notificationData.actionUserId === currentUserId) {
					continue;
				}
			}

			history.push({
				id: docSnap.id,
				userId: data.userId,
				title: data.title,
				body: data.body,
				data: notificationData,
				createdAt: data.createdAt?.toDate() || new Date(),
			});
		}

		console.log(
			`✅ 通知履歴を取得しました: ${history.length}件（自分が行った操作による通知は除外、リマインド通知は全て表示）`
		);
		return history;
	} catch (error) {
		console.error("通知履歴の取得エラー:", error);
		throw error;
	}
}

/**
 * 通知履歴を削除
 */
export async function deleteNotificationHistory(
	notificationId: string
): Promise<void> {
	try {
		await deleteDoc(doc(db, "notificationHistory", notificationId));
		console.log("✅ 通知履歴を削除しました");
	} catch (error) {
		console.error("通知履歴の削除エラー:", error);
		throw error;
	}
}
