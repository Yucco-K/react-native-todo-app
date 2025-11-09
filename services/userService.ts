import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

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

		// 通知をOFFにする場合、プッシュトークンも削除
		if (!enabled) {
			await setDoc(
				userRef,
				{
					notificationEnabled: enabled,
					pushToken: null, // プッシュトークンを削除
					updatedAt: new Date(),
				},
				{ merge: true },
			);
			console.log(`✅ 通知設定をOFFにし、プッシュトークンを削除しました`);
		} else {
			// 通知をONにする場合は、notificationEnabledのみ更新
			// （プッシュトークンは次回アプリ起動時に再登録される）
			await setDoc(
				userRef,
				{
					notificationEnabled: enabled,
					updatedAt: new Date(),
				},
				{ merge: true },
			);
			console.log(`✅ 通知設定をONにしました（プッシュトークンは次回起動時に再登録されます）`);
		}
	} catch (error) {
		console.error("Error setting notification enabled:", error);
		throw error;
	}
}

/**
 * ユーザーのアバターURLを取得
 */
export async function getUserAvatarUrl(): Promise<string | null> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return null;
		}

		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			return data.avatarUrl || null;
		}

		return null;
	} catch (error) {
		console.error("Error getting user avatar URL:", error);
		return null;
	}
}

/**
 * ユーザーのアバターURLを保存
 */
export async function saveUserAvatarUrl(avatarUrl: string): Promise<void> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		const userRef = doc(db, "users", userId);
		await setDoc(
			userRef,
			{
				avatarUrl: avatarUrl.trim(),
				updatedAt: new Date(),
			},
			{ merge: true },
		);
	} catch (error) {
		console.error("Error saving user avatar URL:", error);
		throw error;
	}
}

/**
 * 指定されたユーザーIDのアバターURLを取得
 */
export async function getUserAvatarUrlById(userId: string): Promise<string | null> {
	try {
		console.log(`🔍 getUserAvatarUrlById: ユーザーID ${userId} のアバターを取得中...`);
		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			console.log(`✅ ユーザー ${userId} のデータ:`, data);
			console.log(`📸 アバターURL:`, data.avatarUrl || "なし");
			return data.avatarUrl || null;
		}

		console.log(`❌ ユーザー ${userId} のドキュメントが存在しません`);
		return null;
	} catch (error) {
		console.error("Error getting user avatar URL by ID:", error);
		return null;
	}
}

/**
 * アバター画像をFirebase Storageにアップロード
 */
export async function uploadAvatarImage(imageUri: string): Promise<string> {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		console.log("📤 アバター画像をアップロード中...", imageUri);

		// 画像をBlobに変換
		const response = await fetch(imageUri);
		const blob = await response.blob();

		// Firebase Storageのパスを作成
		const filename = `avatar_${userId}_${Date.now()}.jpg`;
		const storageRef = ref(storage, `avatars/${userId}/${filename}`);

		// アップロード
		await uploadBytes(storageRef, blob);

		// ダウンロードURLを取得
		const downloadURL = await getDownloadURL(storageRef);
		console.log("✅ アバター画像のアップロード完了:", downloadURL);

		return downloadURL;
	} catch (error) {
		console.error("❌ アバター画像のアップロードエラー:", error);
		throw error;
	}
}

/**
 * 古いアバター画像をFirebase Storageから削除
 */
export async function deleteOldAvatarImage(avatarUrl: string): Promise<void> {
	try {
		// Firebase StorageのURLかチェック
		if (!avatarUrl.includes("firebasestorage.googleapis.com")) {
			console.log("🔍 ローカルURIまたは外部URL - 削除スキップ");
			return; // ローカルURIや外部URLは削除しない
		}

		const userId = auth.currentUser?.uid;
		if (!userId) {
			return;
		}

		// URLからパスを抽出
		const urlObj = new URL(avatarUrl);
		const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
		if (!pathMatch) {
			console.log("⚠️ パスの抽出に失敗 - 削除スキップ");
			return;
		}

		const filePath = decodeURIComponent(pathMatch[1]);
		const storageRef = ref(storage, filePath);

		// 削除
		await deleteObject(storageRef);
		console.log("🗑️ 古いアバター画像を削除しました:", filePath);
	} catch (error) {
		console.error("古いアバター画像の削除エラー:", error);
		// エラーが発生しても続行（画像が既に削除されている可能性がある）
	}
}
