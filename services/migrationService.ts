import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * 既存のTodoにsharedフィールドを追加するマイグレーション
 */
export const migrateTodosAddSharedField = async (): Promise<{
	success: boolean;
	updated: number;
	skipped: number;
	error?: string;
}> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		console.log("🔄 マイグレーション開始: sharedフィールドを追加");

		// すべてのTodoを取得（フィルタなし）
		const querySnapshot = await getDocs(collection(db, "todos"));

		let updated = 0;
		let skipped = 0;

		for (const docSnapshot of querySnapshot.docs) {
			const data = docSnapshot.data();

			// 既にsharedフィールドがある場合はスキップ
			if ("shared" in data) {
				skipped++;
				continue;
			}

			// 自分のTodoのみ更新
			if (data.userId === userId) {
				const todoRef = doc(db, "todos", docSnapshot.id);
				await updateDoc(todoRef, {
					shared: false, // デフォルトで個人用に設定
				});
				updated++;
				console.log(`✅ 更新: ${docSnapshot.id}`);
			} else {
				skipped++;
			}
		}

		console.log(`✅ マイグレーション完了: ${updated}件更新, ${skipped}件スキップ`);

		return {
			success: true,
			updated,
			skipped,
		};
	} catch (error) {
		console.error("❌ マイグレーションエラー:", error);
		return {
			success: false,
			updated: 0,
			skipped: 0,
			error: error instanceof Error ? error.message : "不明なエラー",
		};
	}
};
