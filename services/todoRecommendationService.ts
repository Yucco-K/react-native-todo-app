import {
	collection,
	getDocs,
	limit,
	orderBy,
	query,
	where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { TodoCategory } from "../types/Category";

const TODOS_COLLECTION = "todos";
const HISTORY_COLLECTION = "completedTodoHistory";

type TodoRecommendation = {
	title: string;
	category: TodoCategory;
	message: string;
};

type TimePattern = {
	hour: number; // 0-23
	dayOfWeek: number; // 0-6 (日曜日=0)
	count: number;
};

type TodoPattern = {
	title: string;
	category: TodoCategory;
	timePatterns: TimePattern[];
	averageInterval?: number; // 平均追加間隔（時間単位）
};

/**
 * ユーザーの過去のTODO履歴を分析してパターンを抽出
 */
async function analyzeUserTodoPatterns(): Promise<{
	frequentCategories: Record<TodoCategory, number>;
	frequentTitles: Record<string, number>;
	recentTodos: Array<{
		title: string;
		category: TodoCategory;
		createdAt: Date;
	}>;
	todoPatterns: Map<string, TodoPattern>; // タイトルごとのパターン
	currentHour: number;
	currentDayOfWeek: number;
	currentMonth: number;
}> {
	const userId = auth.currentUser?.uid;
	const now = new Date();

	if (!userId) {
		return {
			frequentCategories: {} as Record<TodoCategory, number>,
			frequentTitles: {},
			recentTodos: [],
			todoPatterns: new Map(),
			currentHour: now.getHours(),
			currentDayOfWeek: now.getDay(),
			currentMonth: now.getMonth() + 1,
		};
	}

	const frequentCategories: Record<TodoCategory, number> = {} as Record<
		TodoCategory,
		number
	>;
	const frequentTitles: Record<string, number> = {};
	const recentTodos: Array<{
		title: string;
		category: TodoCategory;
		createdAt: Date;
	}> = [];
	const todoPatterns = new Map<string, TodoPattern>();
	const allTodos: Array<{
		title: string;
		category: TodoCategory;
		createdAt: Date;
	}> = [];

	// 現在のTODOを分析
	const currentTodosQuery = query(
		collection(db, TODOS_COLLECTION),
		where("userId", "==", userId),
		orderBy("createdAt", "desc"),
		limit(50),
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
		frequentTitles[normalizedTitle] =
			(frequentTitles[normalizedTitle] || 0) + 1;

		// 最近のTODOを記録
		if (recentTodos.length < 20) {
			recentTodos.push({ title, category, createdAt });
		}

		// すべてのTODOを記録（パターン分析用）
		allTodos.push({ title, category, createdAt });
	});

	// 完了済みTODO履歴も分析
	try {
		const historyQuery = query(
			collection(db, HISTORY_COLLECTION),
			where("userId", "==", userId),
			limit(50),
		);

		const historySnapshot = await getDocs(historyQuery);
		historySnapshot.forEach((doc) => {
			const data = doc.data();
			const category = (data.category || "other") as TodoCategory;
			const title = data.title as string;
			const createdAt = data.createdAt?.toDate() || new Date();

			frequentCategories[category] = (frequentCategories[category] || 0) + 1;

			const normalizedTitle = title.toLowerCase().trim();
			frequentTitles[normalizedTitle] =
				(frequentTitles[normalizedTitle] || 0) + 1;

			// すべてのTODOを記録（パターン分析用）
			allTodos.push({ title, category, createdAt });
		});
	} catch (error) {
		console.log("履歴の分析をスキップ:", error);
	}

	// タイムパターンの分析
	allTodos.forEach((todo) => {
		const normalizedTitle = todo.title.toLowerCase().trim();
		const hour = todo.createdAt.getHours();
		const dayOfWeek = todo.createdAt.getDay();

		if (!todoPatterns.has(normalizedTitle)) {
			todoPatterns.set(normalizedTitle, {
				title: todo.title,
				category: todo.category,
				timePatterns: [],
			});
		}

		const pattern = todoPatterns.get(normalizedTitle)!;
		pattern.timePatterns.push({ hour, dayOfWeek, count: 1 });
	});

	// 周期の計算（同じタイトルが2回以上追加されている場合）
	todoPatterns.forEach((pattern, normalizedTitle) => {
		if (pattern.timePatterns.length >= 2) {
			// 作成日時でソート
			const sortedDates = allTodos
				.filter((t) => t.title.toLowerCase().trim() === normalizedTitle)
				.map((t) => t.createdAt.getTime())
				.sort((a, b) => a - b);

			if (sortedDates.length >= 2) {
				// 平均間隔を計算（時間単位）
				const intervals: number[] = [];
				for (let i = 1; i < sortedDates.length; i++) {
					const interval = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60);
					intervals.push(interval);
				}
				const averageInterval =
					intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
				pattern.averageInterval = averageInterval;
			}
		}
	});

	return {
		frequentCategories,
		frequentTitles,
		recentTodos,
		todoPatterns,
		currentHour: now.getHours(),
		currentDayOfWeek: now.getDay(),
		currentMonth: now.getMonth() + 1,
	};
}

/**
 * カテゴリごとのおすすめTODOテンプレート
 */
const CATEGORY_TEMPLATES: Record<TodoCategory, string[]> = {
	work: [
		"会議の準備",
		"メール返信",
		"資料作成",
		"週次レポート",
		"タスクの整理",
	],
	shopping: ["食材の買い出し", "日用品の補充", "お米の購入", "飲み物の補充"],
	housework: ["掃除", "洗濯", "料理の下ごしらえ", "ゴミ出し", "片付け"],
	study: ["英語の勉強", "資格試験の勉強", "読書", "オンライン講座"],
	school: ["宿題", "レポート作成", "授業の予習", "テスト勉強"],
	personal: ["運動", "趣味の時間", "友達と会う", "映画鑑賞"],
	other: ["電話をかける", "予約を取る", "書類の整理"],
};

/**
 * 周期を人間が読みやすい形式に変換
 */
function formatInterval(hours: number): string {
	if (hours < 24) {
		return `${Math.round(hours)}時間`;
	} else if (hours < 24 * 7) {
		const days = Math.round(hours / 24);
		return `${days}日`;
	} else if (hours < 24 * 30) {
		const weeks = Math.round(hours / (24 * 7));
		return `${weeks}週間`;
	} else {
		const months = Math.round(hours / (24 * 30));
		return `${months}ヶ月`;
	}
}

/**
 * ユーザーフレンドリーなメッセージを生成（時系列パターンを考慮）
 */
function generateFriendlyMessage(
	category: TodoCategory,
	title: string,
	options?: {
		isPeriodicTask?: boolean;
		interval?: number;
		matchesTimePattern?: boolean;
		matchesDayOfWeek?: boolean;
	},
): string {
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

	// 周期的なタスクの場合、特別なメッセージを使用
	if (options?.isPeriodicTask && options?.interval) {
		const intervalStr = formatInterval(options.interval);
		const periodicMessages = [
			`いつもの{title}、そろそろ${intervalStr}ぶりではないですか？`,
			`前回から${intervalStr}経ちました。{title}の時間ですね⏰`,
			`${intervalStr}ごとの{title}、忘れていませんか？`,
		];
		const template =
			periodicMessages[Math.floor(Math.random() * periodicMessages.length)];
		return template.replace("{title}", title);
	}

	// 時間帯や曜日が一致する場合、特別なメッセージ
	if (options?.matchesTimePattern || options?.matchesDayOfWeek) {
		const timingMessages = [
			`この時間はいつも{title}をしていますね！`,
			`いつもこの時間に{title}をされてますね💡`,
			`タイミングぴったり！{title}はいかがですか？`,
		];
		const template =
			timingMessages[Math.floor(Math.random() * timingMessages.length)];
		return template.replace("{title}", title);
	}

	// 通常のメッセージ
	const categoryMessages = messages[category] || messages.other;
	const template =
		categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
	return template.replace("{title}", title);
}

/**
 * おすすめTODOを生成
 */
export async function generateTodoRecommendations(): Promise<
	TodoRecommendation[]
> {
	try {
		const {
			frequentCategories,
			frequentTitles,
			recentTodos,
			todoPatterns,
			currentHour,
			currentDayOfWeek,
			currentMonth,
		} = await analyzeUserTodoPatterns();

		const recommendations: TodoRecommendation[] = [];
		const now = Date.now();

		// データが少ない場合は空の配列を返す
		if (Object.keys(frequentCategories).length === 0) {
			return [];
		}

		// 0. 周期的なタスクを優先的に提案（時間パターン分析）
		const periodicTasks: Array<{
			title: string;
			category: TodoCategory;
			score: number;
			options: {
				isPeriodicTask: boolean;
				interval?: number;
				matchesTimePattern?: boolean;
				matchesDayOfWeek?: boolean;
			};
		}> = [];

		todoPatterns.forEach((pattern, normalizedTitle) => {
			// 周期が判明しているタスク
			if (pattern.averageInterval) {
				// 最後に追加された時刻を取得
				const lastAdded = recentTodos.find(
					(t) => t.title.toLowerCase().trim() === normalizedTitle,
				);

				if (lastAdded) {
					const hoursSinceLastAdded =
						(now - lastAdded.createdAt.getTime()) / (1000 * 60 * 60);

					// 周期の80%以上経過していれば提案
					if (hoursSinceLastAdded >= pattern.averageInterval * 0.8) {
						let score = 100; // 基本スコア

						// 時間帯が一致する場合、スコアを上げる
						const matchesHour = pattern.timePatterns.some(
							(tp) => Math.abs(tp.hour - currentHour) <= 2,
						);
						if (matchesHour) score += 50;

						// 曜日が一致する場合、スコアを上げる
						const matchesDayOfWeek = pattern.timePatterns.some(
							(tp) => tp.dayOfWeek === currentDayOfWeek,
						);
						if (matchesDayOfWeek) score += 30;

						periodicTasks.push({
							title: pattern.title,
							category: pattern.category,
							score,
							options: {
								isPeriodicTask: true,
								interval: pattern.averageInterval,
								matchesTimePattern: matchesHour,
								matchesDayOfWeek: matchesDayOfWeek,
							},
						});
					}
				}
			} else if (pattern.timePatterns.length >= 2) {
				// 周期は不明だが、時間帯や曜日のパターンがあるタスク
				const matchesHour = pattern.timePatterns.some(
					(tp) => Math.abs(tp.hour - currentHour) <= 2,
				);
				const matchesDayOfWeek = pattern.timePatterns.some(
					(tp) => tp.dayOfWeek === currentDayOfWeek,
				);

				if (matchesHour || matchesDayOfWeek) {
					// 最近追加されていないかチェック（7日以内）
					const recentlyAdded = recentTodos.some(
						(todo) =>
							todo.createdAt.getTime() > now - 7 * 24 * 60 * 60 * 1000 &&
							todo.title.toLowerCase().trim() === normalizedTitle,
					);

					if (!recentlyAdded) {
						let score = 50;
						if (matchesHour) score += 30;
						if (matchesDayOfWeek) score += 20;

						periodicTasks.push({
							title: pattern.title,
							category: pattern.category,
							score,
							options: {
								isPeriodicTask: false,
								matchesTimePattern: matchesHour,
								matchesDayOfWeek: matchesDayOfWeek,
							},
						});
					}
				}
			}
		});

		// スコアでソートして上位を提案
		periodicTasks.sort((a, b) => b.score - a.score);

		for (const task of periodicTasks.slice(0, 2)) {
			recommendations.push({
				title: task.title,
				category: task.category,
				message: generateFriendlyMessage(task.category, task.title, task.options),
			});
		}

		// 既に提案済みのタイトルを記録
		const recommendedTitles = new Set(
			recommendations.map((r) => r.title.toLowerCase().trim()),
		);

		// 1. 最頻出カテゴリからの提案（周期的タスクで埋まっていない場合）
		if (recommendations.length < 3) {
			const sortedCategories = Object.entries(frequentCategories)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 2);

			for (const [category, _count] of sortedCategories) {
				if (recommendations.length >= 3) break;

				const cat = category as TodoCategory;
				const templates = CATEGORY_TEMPLATES[cat] || [];

				if (templates.length > 0) {
					const title = templates[Math.floor(Math.random() * templates.length)];

					// 既に提案済みかチェック
					if (recommendedTitles.has(title.toLowerCase().trim())) continue;

					// 既に最近追加されていないかチェック
					const recentlyAdded = recentTodos.some(
						(todo) =>
							todo.title.toLowerCase().includes(title.toLowerCase()) ||
							title.toLowerCase().includes(todo.title.toLowerCase()),
					);

					if (!recentlyAdded) {
						recommendations.push({
							title,
							category: cat,
							message: generateFriendlyMessage(cat, title),
						});
						recommendedTitles.add(title.toLowerCase().trim());
					}
				}
			}
		}

		console.log(`💡 おすすめTODO生成: ${recommendations.length}件（時間: ${currentHour}時, 曜日: ${currentDayOfWeek}）`);
		
		// 最大3件に制限
		return recommendations.slice(0, 3);
	} catch (error) {
		console.error("おすすめTODO生成エラー:", error);
		return [];
	}
}
collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore"

import { auth, db } from "../config/firebase";
import type { TodoCategory } from "../types/Category";
