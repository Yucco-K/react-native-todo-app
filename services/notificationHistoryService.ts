import { db } from "@/config/firebase";
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
 */
export async function getNotificationHistory(
	userId: string
): Promise<NotificationHistory[]> {
	try {
		const q = query(
			collection(db, "notificationHistory"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc")
		);

		const snapshot = await getDocs(q);
		const history: NotificationHistory[] = [];

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			history.push({
				id: docSnap.id,
				userId: data.userId,
				title: data.title,
				body: data.body,
				data: data.data || {},
				createdAt: data.createdAt?.toDate() || new Date(),
			});
		}

		console.log(`✅ 通知履歴を取得しました: ${history.length}件`);
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
