import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * ユーザーのニックネームを取得
 */
export async function getUserNickname(): Promise<string | null> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return null;
		}

		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			return data.nickname || null;
		}

		return null;
	} catch (error) {
		console.error("Error getting user nickname:", error);
		return null;
	}
}

/**
 * ユーザーのニックネームを保存
 */
export async function saveUserNickname(nickname: string): Promise<void> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const userRef = doc(db, "users", userId);
		await setDoc(
			userRef,
			{
				nickname: nickname.trim(),
				updatedAt: new Date(),
			},
			{ merge: true },
		);
	} catch (error) {
		console.error("Error saving user nickname:", error);
		throw error;
	}
}

/**
 * 指定されたユーザーIDのニックネームを取得
 */
export async function getUserNicknameById(userId: string): Promise<string | null> {
	try {
		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			return data.nickname || null;
		}

		return null;
	} catch (error) {
		console.error("Error getting user nickname by ID:", error);
		return null;
	}
}

/**
 * 通知設定を取得
 */
export async function getNotificationEnabled(): Promise<boolean> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return true; // デフォルトはON
		}

		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			return data.notificationEnabled !== false; // undefinedの場合もtrueとして扱う
		}

		return true;
	} catch (error) {
		console.error("Error getting notification enabled:", error);
		return true;
	}
}

/**
 * 通知設定を保存
 */
export async function setNotificationEnabled(enabled: boolean): Promise<void> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const userRef = doc(db, "users", userId);
		await setDoc(
			userRef,
			{
				notificationEnabled: enabled,
				updatedAt: new Date(),
			},
			{ merge: true },
		);
		console.log(`✅ 通知設定を更新しました: ${enabled ? "ON" : "OFF"}`);
	} catch (error) {
		console.error("Error setting notification enabled:", error);
		throw error;
	}
}
