import { httpsCallable } from "firebase/functions";
import { functions } from "@/config/firebase";
import type { TodoCategory } from "@/types/Category";

/**
 * ✅ セキュリティ対応完了：Firebase Cloud Functions経由でAI機能を使用
 *
 * セキュリティ改善：
 * - OpenAI APIキーはサーバーサイド（Cloud Functions）で安全に管理
 * - クライアントからAPIキーが漏洩するリスクを完全に排除
 * - レート制限: 1ユーザーあたり1日10回まで
 *
 * 詳細は SECURITY_GUIDE.md を参照してください
 */

/**
 * AIカテゴリ推測エラーのカスタムエラークラス
 */
export class AICategoryError extends Error {
	constructor(
		message: string,
		public readonly userMessage: string,
		public readonly code?: string,
	) {
		super(message);
		this.name = "AICategoryError";
	}
}

export async function predictCategory(title: string, content: string): Promise<TodoCategory> {
	try {
		if (!title.trim()) {
			return "other";
		}

		// Firebase Cloud Functionを呼び出し
		const predictCategoryFn = httpsCallable<
			{ title: string; content: string },
			{ category: TodoCategory }
		>(functions, "predictCategory");

		console.log(`🤖 AIカテゴリ推測を開始: "${title}"`);

		// タイムアウト処理（7秒）
		const timeoutPromise = new Promise<{ data: { category: TodoCategory } }>((_, reject) => {
			setTimeout(() => {
				reject(new Error("AI推測がタイムアウトしました（7秒）"));
			}, 7000);
		});

		// Cloud Functionの呼び出しとタイムアウトを競争させる
		const result = await Promise.race([predictCategoryFn({ title, content }), timeoutPromise]);

		const category = result.data.category;
		console.log(`✅ AIカテゴリ推測成功: "${title}" → ${category}`);

		return category;
	} catch (error: unknown) {
		// エラーハンドリング
		const errorCode = (error as { code?: string; message?: string }).code;
		const errorMessage = (error as { message?: string }).message;

		// タイムアウトエラーの場合は"other"を返す
		if (errorMessage?.includes("タイムアウト")) {
			console.warn("⏱️ AI推測がタイムアウトしました（7秒） → カテゴリを「その他」に設定");
			return "other";
		}

		if (errorCode === "functions/unauthenticated") {
			console.error("❌ 認証エラー: ログインが必要です");
			throw new AICategoryError(
				"認証エラー",
				"ログインが必要です。再度ログインしてください。",
				errorCode,
			);
		} else if (errorCode === "functions/resource-exhausted") {
			console.warn("⚠️ レート制限: 1日の上限に達しました");
			throw new AICategoryError(
				"レート制限",
				"AI推測の1日の上限（100回）に達しました。明日再度お試しください。",
				errorCode,
			);
		} else if (errorCode === "functions/internal") {
			console.error("❌ サーバーエラー:", errorMessage);
			throw new AICategoryError(
				"サーバーエラー",
				"サーバーで問題が発生しました。しばらくしてから再度お試しください。",
				errorCode,
			);
		} else {
			console.error("❌ AIカテゴリ推測エラー:", error);
			throw new AICategoryError(
				"AI推測エラー",
				"AI推測に失敗しました。手動でカテゴリを選択してください。",
				"unknown",
			);
		}
	}
}
