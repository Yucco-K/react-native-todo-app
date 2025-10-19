import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { TodoCategory } from "../types/Category";
import { TODO_CATEGORIES } from "../types/Category";

const TODOS_COLLECTION = "todos";
const HISTORY_COLLECTION = "completedTodoHistory";

type TodoRecommendation = {
	title: string;
	category: TodoCategory;
	message: string;
};

/**
 * ユーザーの過去のTODO履歴を分析してパターンを抽出
 */
async function analyzeUserTodoPatterns(): Promise<{
	frequentCategories: Record<TodoCategory, number>;
	frequentTitles: Record<string, number>;
	recentTodos: Array<{ title: string; category: TodoCategory; createdAt: Date }>;
}> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		return {
			frequentCategories: {} as Record<TodoCategory, number>,
			frequentTitles: {},
			recentTodos: [],
		};
	}

	const frequentCategories: Record<TodoCategory, number> = {} as Record<TodoCategory, number>;
	const frequentTitles: Record<string, number> = {};
	const recentTodos: Array<{ title: string; category: TodoCategory; createdAt: Date }> = [];

	// 現在のTODOを分析
	const currentTodosQuery = query(
		collection(db, TODOS_COLLECTION),
		where("userId", "==", userId),
		orderBy("createdAt", "desc"),
		limit(50)
	);

	const currentSnapshot = await getDocs(currentTodosQuery);
	currentSnapshot.forEach((doc) => {
		const data = doc.data();
		const category = (data.category || "other") as TodoCategory;
		const title = data.title as string;
		const createdAt = data.createdAt?.toDate() || new Date();

		// カテゴリの頻度をカウント
		frequentCategories[category] = (frequentCategories[category] || 0) + 1;

		// タイトルの頻度をカウント（正規化）
		const normalizedTitle = title.toLowerCase().trim();
		frequentTitles[normalizedTitle] = (frequentTitles[normalizedTitle] || 0) + 1;

		// 最近のTODOを記録
		if (recentTodos.length < 20) {
			recentTodos.push({ title, category, createdAt });
		}
	});

	// 完了済みTODO履歴も分析
	try {
		const historyQuery = query(
			collection(db, HISTORY_COLLECTION),
			where("userId", "==", userId),
			limit(50)
		);

		const historySnapshot = await getDocs(historyQuery);
		historySnapshot.forEach((doc) => {
			const data = doc.data();
			const category = (data.category || "other") as TodoCategory;
			const title = data.title as string;

			frequentCategories[category] = (frequentCategories[category] || 0) + 1;

			const normalizedTitle = title.toLowerCase().trim();
			frequentTitles[normalizedTitle] = (frequentTitles[normalizedTitle] || 0) + 1;
		});
	} catch (error) {
		console.log("履歴の分析をスキップ:", error);
	}

	return { frequentCategories, frequentTitles, recentTodos };
}

/**
 * カテゴリごとのおすすめTODOテンプレート
 */
const CATEGORY_TEMPLATES: Record<TodoCategory, string[]> = {
	work: ["会議の準備", "メール返信", "資料作成", "週次レポート", "タスクの整理"],
	shopping: ["食材の買い出し", "日用品の補充", "お米の購入", "飲み物の補充"],
	housework: ["掃除", "洗濯", "料理の下ごしらえ", "ゴミ出し", "片付け"],
	study: ["英語の勉強", "資格試験の勉強", "読書", "オンライン講座"],
	school: ["宿題", "レポート作成", "授業の予習", "テスト勉強"],
	personal: ["運動", "趣味の時間", "友達と会う", "映画鑑賞"],
	other: ["電話をかける", "予約を取る", "書類の整理"],
};

/**
 * ユーザーフレンドリーなメッセージを生成
 */
function generateFriendlyMessage(category: TodoCategory, title: string): string {
	const messages: Record<TodoCategory, string[]> = {
		work: [
			"仕事が忙しいですね。そろそろ{title}はいかがですか？",
			"お仕事頑張ってますね！{title}も忘れずに✨",
			"そろそろ{title}の時間かもしれません💼",
		],
		shopping: [
			"そろそろ{title}が必要な頃では？🛒",
			"いつもの{title}、忘れていませんか？",
			"{title}、そろそろストックが切れる頃かも？",
		],
		housework: [
			"お家のメンテナンス、{title}はいかがですか？🏠",
			"そろそろ{title}の時間かもしれませんね",
			"{title}、やっておくとスッキリしますよ✨",
		],
		study: [
			"継続は力なり！{title}はいかがですか？📚",
			"学びの時間、{title}はどうでしょう？",
			"そろそろ{title}で自己投資を💡",
		],
		school: [
			"学校のこと、{title}は大丈夫ですか？📖",
			"そろそろ{title}をやっておきませんか？",
			"{title}、期限は大丈夫ですか？",
		],
		personal: [
			"自分の時間も大切に。{title}はいかがですか？💖",
			"リフレッシュに{title}はどうでしょう？",
			"そろそろ{title}で気分転換しませんか？",
		],
		other: [
			"そろそろ{title}はいかがですか？",
			"{title}、思い出しましたか？💭",
			"{title}も忘れずに！",
		],
	};

	const categoryMessages = messages[category] || messages.other;
	const template = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
	return template.replace("{title}", title);
}

/**
 * おすすめTODOを生成
 */
export async function generateTodoRecommendations(): Promise<TodoRecommendation[]> {
	try {
		const { frequentCategories, frequentTitles, recentTodos } = await analyzeUserTodoPatterns();

		const recommendations: TodoRecommendation[] = [];

		// データが少ない場合は空の配列を返す
		if (Object.keys(frequentCategories).length === 0) {
			return [];
		}

		// 1. 最頻出カテゴリを特定
		const sortedCategories = Object.entries(frequentCategories)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 2); // 上位2カテゴリ

		// 2. 各カテゴリからおすすめを生成
		for (const [category, _count] of sortedCategories) {
			const cat = category as TodoCategory;
			const templates = CATEGORY_TEMPLATES[cat] || [];

			// テンプレートからランダムに1つ選択
			if (templates.length > 0) {
				const title = templates[Math.floor(Math.random() * templates.length)];
				
				// 既に最近追加されていないかチェック
				const recentlyAdded = recentTodos.some(
					(todo) =>
						todo.title.toLowerCase().includes(title.toLowerCase()) ||
						title.toLowerCase().includes(todo.title.toLowerCase())
				);

				if (!recentlyAdded) {
					recommendations.push({
						title,
						category: cat,
						message: generateFriendlyMessage(cat, title),
					});
				}
			}
		}

		// 3. 頻繁に追加されるタイトルからも提案（最大1つ）
		const sortedTitles = Object.entries(frequentTitles)
			.filter(([, count]) => count >= 2) // 2回以上追加されたもの
			.sort(([, a], [, b]) => b - a)
			.slice(0, 1);

		for (const [title, _count] of sortedTitles) {
			// 最近追加されていないかチェック
			const recentlyAdded = recentTodos.some(
				(todo) =>
					todo.createdAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && // 7日以内
					todo.title.toLowerCase() === title
			);

			if (!recentlyAdded && recommendations.length < 3) {
				// カテゴリを推測
				const matchingRecent = recentTodos.find(
					(todo) => todo.title.toLowerCase() === title
				);
				const category = matchingRecent?.category || "other";

				recommendations.push({
					title: title.charAt(0).toUpperCase() + title.slice(1), // 先頭を大文字に
					category,
					message: `いつもの「${title}」、そろそろ必要ですか？`,
				});
			}
		}

		// 最大3件に制限
		return recommendations.slice(0, 3);
	} catch (error) {
		console.error("おすすめTODO生成エラー:", error);
		return [];
	}
}

