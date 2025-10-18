import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export type UserStats = {
	totalCompletedTasks: number;
	lastCompletedAt?: Date;
};

/**
 * ユーザーの統計情報を取得
 */
export async function getUserStats(): Promise<UserStats> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return { totalCompletedTasks: 0 };
		}

		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (!userDoc.exists()) {
			return { totalCompletedTasks: 0 };
		}

		const data = userDoc.data();
		return {
			totalCompletedTasks: data.totalCompletedTasks || 0,
			lastCompletedAt: data.lastCompletedAt?.toDate(),
		};
	} catch (error) {
		console.error("Error getting user stats:", error);
		return { totalCompletedTasks: 0 };
	}
}

/**
 * タスク完了時にユーザー統計を更新
 */
export async function incrementCompletedTaskCount(): Promise<void> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return;
		}

		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		const currentStats: UserStats = userDoc.exists()
			? {
					totalCompletedTasks: userDoc.data().totalCompletedTasks || 0,
					lastCompletedAt: userDoc.data().lastCompletedAt?.toDate(),
				}
			: { totalCompletedTasks: 0 };

		// 統計情報を更新
		if (userDoc.exists()) {
			await updateDoc(userRef, {
				totalCompletedTasks: currentStats.totalCompletedTasks + 1,
				lastCompletedAt: new Date(),
			});
		} else {
			await setDoc(userRef, {
				totalCompletedTasks: 1,
				lastCompletedAt: new Date(),
			});
		}
	} catch (error) {
		console.error("Error updating user stats:", error);
	}
}
