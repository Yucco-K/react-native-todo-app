import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

admin.initializeApp();

// Secret Manager から API キーを取得
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * AIカテゴリ推測 Cloud Function
 *
 * セキュリティ:
 * - 認証済みユーザーのみ呼び出し可能
 * - レート制限: 1ユーザーあたり1日10回まで
 * - OpenAI APIキーはサーバーサイドで安全に管理
 */
export const predictCategory = functions
	.region("asia-northeast1") // 東京リージョン（低レイテンシ）
	.runWith({
		secrets: ["OPENAI_API_KEY"], // Secret Manager のシークレットを指定
	})
	.https.onCall(async (data, context) => {
		// 認証チェック
		if (!context.auth) {
			throw new functions.https.HttpsError(
				"unauthenticated",
				"ユーザー認証が必要です"
			);
		}

		const { title, content } = data;

		// バリデーション
		if (!title || typeof title !== "string") {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"タイトルが必要です"
			);
		}

		if (title.length > 100) {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"タイトルが長すぎます"
			);
		}

		// レート制限チェック（Firestoreで実装）
		const userId = context.auth.uid;
		const today = new Date().toISOString().split("T")[0];
		const rateLimitDoc = admin
			.firestore()
			.collection("rateLimits")
			.doc(`${userId}_${today}`);

		try {
			const rateLimitData = await rateLimitDoc.get();
			const requestCount = rateLimitData.data()?.count || 0;

			// 開発用: 1日100回まで（本番環境では10回に戻すことを推奨）
			if (requestCount >= 100) {
				throw new functions.https.HttpsError(
					"resource-exhausted",
					"1日の上限（100回）に達しました。明日再度お試しください。"
				);
			}

			// OpenAI API呼び出し（Secret Manager から安全に取得）
			const apiKey = openaiApiKey.value();
			if (!apiKey) {
				console.error("OpenAI APIキーが設定されていません");
				throw new functions.https.HttpsError(
					"internal",
					"サーバー設定エラー: OpenAI APIキーが設定されていません"
				);
			}

			const openai = new OpenAI({
				apiKey: apiKey,
			});

			const categoryDescriptions = `
- work: 仕事関連のタスク（会議、資料作成、プロジェクト管理など）
- shopping: 買い物関連のタスク（購入、注文、買い出しなど）
- personal: プライベート関連のタスク（趣味、運動、旅行、映画など）
- study: 勉強・学習関連のタスク（読書、資格勉強、学習、復習など）
- school: 学校関連のタスク（授業、宿題、テスト、提出物など）
- housework: 家事関連のタスク（掃除、洗濯、料理、片付けなど）
- other: その他のタスク
			`.trim();

			const prompt = `
あなたはタスク管理アプリのアシスタントです。
以下のタスクを最も適切なカテゴリに分類してください。

タスクのタイトル: ${title}
タスクの内容: ${content || "（内容なし）"}

利用可能なカテゴリ:
${categoryDescriptions}

カテゴリ名（work, shopping, personal, study, school, housework, other）のみを返してください。
他の説明は不要です。
			`.trim();

			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content:
							"あなたはタスクを分類する専門家です。カテゴリ名のみを返してください。",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.3,
				max_tokens: 10,
			});

			const predictedCategory = response.choices[0]?.message?.content
				?.trim()
				.toLowerCase();

			const validCategories = [
				"work",
				"shopping",
				"personal",
				"study",
				"school",
				"housework",
				"other",
			];

			let finalCategory = "other";
			if (predictedCategory && validCategories.includes(predictedCategory)) {
				finalCategory = predictedCategory;
				console.log(`✅ AIカテゴリ推測成功: "${title}" → ${predictedCategory}`);
			} else {
				console.warn(`⚠️ AIが無効なカテゴリを返しました: ${predictedCategory}`);
			}

			// レート制限カウンターを更新
			await rateLimitDoc.set(
				{
					count: requestCount + 1,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			);

			return { category: finalCategory };
		} catch (error) {
			console.error("❌ AIカテゴリ推測エラー:", error);

			// Firebase Functionsのエラーの場合はそのまま投げる
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}

			// その他のエラーは汎用エラーとして返す
			throw new functions.https.HttpsError("internal", "AI推測に失敗しました");
		}
	});
