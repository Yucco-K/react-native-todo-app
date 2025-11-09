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
		console.log("💾 通知履歴を保存中:", {
			userId,
			title,
			"data.type": data?.type,
			"data.actionUserId": data?.actionUserId,
		});

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
		console.log("📥 通知履歴を取得中:", {
			userId,
			currentUserId,
		});

		if (!currentUserId) {
			return [];
		}

		const q = query(
			collection(db, "notificationHistory"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc")
		);

		const snapshot = await getDocs(q);
		console.log(`📥 Firestoreから取得: ${snapshot.docs.length}件`);

		const history: NotificationHistory[] = [];
		let filteredCount = 0;

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const notificationData = data.data || {};

			// Todo操作とグループ操作に関する通知の場合、自分が行った操作による通知は除外
			// ただし、リマインド（reminder）は自分が設定したものでも表示する
			if (
				notificationData.type &&
				[
					"todo_added",
					"todo_updated",
					"todo_deleted",
					"todo_completed",
					"member_joined",
					"member_left",
					"organization_renamed",
					"organization_deleted",
				].includes(notificationData.type as string) &&
				notificationData.actionUserId
			) {
				console.log("🔍 通知履歴フィルタリング判定:", {
					title: data.title,
					type: notificationData.type,
					actionUserId: notificationData.actionUserId,
					currentUserId: currentUserId,
					一致: notificationData.actionUserId === currentUserId,
				});

				// 自分が行った操作による通知は除外
				if (notificationData.actionUserId === currentUserId) {
					console.log(`❌ 自分の操作なので除外: ${data.title}`);
					filteredCount++;
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
			`✅ 通知履歴を取得しました: Firestore=${snapshot.docs.length}件 → フィルタリング後=${history.length}件（除外=${filteredCount}件）`
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
