import type { TodoCategory } from "@/types/Category";
import type { Todo } from "@/types/Todo";
import { getMessageScores } from "./praiseFeedbackService";

// キーワードベースの褒め言葉マップ
const KEYWORD_PRAISE_MAP: Record<string, string[]> = {
	// 仕事関連
	会議: [
		"会議お疲れ様でした！有意義な時間になったことでしょう！",
		"会議完了！重要な議論ができましたね！",
		"ミーティング終了！チームワークが深まりましたね！",
	],
	資料: [
		"資料作成お疲れ様です！きっと素晴らしい仕上がりですね！",
		"資料完成！準備万端で臨めますね！",
		"資料作りお疲れ様！あなたの努力が光ります！",
	],
	メール: [
		"メール対応完了！コミュニケーションバッチリですね！",
		"返信お疲れ様です！スムーズな連携ができましたね！",
		"メール処理完了！デスクがスッキリしましたね！",
	],
	報告: ["報告書完成！しっかりと伝えられましたね！", "報告完了！重要な情報共有ができました！"],
	プレゼン: [
		"プレゼン準備完了！自信を持って臨めますね！",
		"発表の準備ができましたね！素晴らしいパフォーマンスを！",
	],
	// 買い物関連
	買: [
		"お買い物完了！必要なものが手に入りましたね！",
		"ショッピングお疲れ様！良いものが見つかりましたか？",
	],
	購入: ["購入完了！賢いお買い物でしたね！", "買い物ミッション達成！満足のいく選択でしたか？"],
	注文: ["注文完了！届くのが楽しみですね！", "オーダー完了！待ち遠しいですね！"],
	// 勉強関連
	勉強: [
		"勉強お疲れ様！知識が深まりましたね！",
		"学習完了！一歩ずつ成長していますね！",
		"勉強時間確保！継続は力なりです！",
	],
	学習: [
		"学習タイム完了！新しいスキルが身につきましたね！",
		"学びの時間お疲れ様！成長を実感できますか？",
	],
	読書: [
		"読書完了！新しい世界が広がりましたね！",
		"本を読み終えましたね！素晴らしい時間でした！",
		"読書タイム充実！心が豊かになりましたね！",
	],
	本: ["読書完了！知的な時間を過ごせましたね！", "本を読み終えました！感動はありましたか？"],
	復習: ["復習完了！しっかり定着しましたね！", "おさらい完了！理解が深まりました！"],
	// 学校関連
	宿題: [
		"宿題完了！明日の授業も安心ですね！",
		"宿題お疲れ様！よく頑張りましたね！",
		"課題クリア！責任感が素晴らしいです！",
	],
	授業: [
		"授業準備バッチリ！良い学びができそうですね！",
		"授業関連のタスク完了！予習復習は大切ですね！",
	],
	テスト: [
		"テスト準備完了！自信を持って臨めますね！",
		"試験対策お疲れ様！きっと良い結果が出ますよ！",
	],
	提出: ["提出完了！期限を守れましたね！素晴らしい！", "課題提出お疲れ様！きちんとできましたね！"],
	レポート: ["レポート完成！よく調べて書けましたね！", "レポート提出完了！お疲れ様でした！"],
	// 家事関連
	掃除: [
		"お掃除お疲れ様！ピカピカになりましたね！",
		"掃除完了！快適な空間になりました！",
		"クリーニング完了！気持ちいいですね！",
	],
	洗濯: ["洗濯完了！さっぱりしましたね！", "お洗濯お疲れ様！清潔な衣服で快適です！"],
	料理: [
		"お料理お疲れ様！美味しそうですね！",
		"料理完成！愛情たっぷりの一品ですね！",
		"クッキング完了！素敵な食卓になりますね！",
	],
	片付け: ["片付け完了！スッキリしましたね！", "整理整頓お疲れ様！快適な空間に変身！"],
	// プライベート関連
	運動: [
		"運動お疲れ様！体が喜んでいますね！",
		"エクササイズ完了！健康的な一日ですね！",
		"運動達成！リフレッシュできましたか？",
	],
	ジム: ["ジム完了！理想のボディに近づきましたね！", "トレーニングお疲れ様！継続が大切です！"],
	散歩: ["お散歩完了！気分転換できましたか？", "ウォーキングお疲れ様！心身ともにリフレッシュ！"],
	映画: ["映画鑑賞完了！楽しめましたか？", "映画タイム充実！素敵な時間でしたね！"],
	旅行: [
		"旅行の準備完了！楽しい時間になりますように！",
		"旅行計画達成！素敵な思い出を作ってください！",
	],
	// その他
	電話: ["電話完了！大切な人と繋がれましたね！", "通話お疲れ様！良い会話ができましたか？"],
	予約: ["予約完了！楽しみが増えましたね！", "予約取れました！計画が進みましたね！"],
	申請: ["申請完了！手続きお疲れ様でした！", "申請書提出完了！スムーズに進みますように！"],
	病院: ["病院行けましたね！健康第一です！", "通院お疲れ様！体を大切にしてくださいね！"],
};

// カテゴリ別の一般的な褒め言葉
const CATEGORY_PRAISE: Record<TodoCategory, string[]> = {
	work: [
		"仕事のタスク、お疲れ様でした！一つ片付いて、すっきりしましたね！",
		"仕事がはかどっていますね！素晴らしい集中力です！",
		"完了！これで次のステップに進めますね！",
		"業務完了！プロフェッショナルな仕事ぶりです！",
		"タスク達成！キャリアアップに繋がりますね！",
	],
	shopping: [
		"買い物のタスク、完了！これで準備万端ですね！",
		"お買い物お疲れ様でした！必要なものが揃いましたね！",
		"買い物リスト制覇！買い忘れも防げましたね！",
		"ショッピング完了！賢いお買い物でしたね！",
	],
	personal: [
		"プライベートのタスク、完了！充実した時間を過ごせそうですね！",
		"自分のための時間、大切にできましたね！素晴らしい！",
		"完了！リフレッシュできましたか？",
		"プライベートタイム確保！心が満たされましたね！",
		"自分磨き完了！輝いていますよ！",
	],
	study: [
		"勉強のタスク、完了！知識が一つ増えましたね！",
		"学習お疲れ様でした！着実にスキルアップしています！",
		"完了！努力が実を結びますように！",
		"学びの時間お疲れ様！成長を実感できますね！",
		"勉強完了！未来への投資ですね！",
	],
	school: [
		"学校のタスク、完了！よく頑張りましたね！",
		"宿題完了！これで明日も安心ですね！",
		"授業準備お疲れ様！きっと良い結果が出ますよ！",
		"提出物完了！責任を果たしましたね！素晴らしい！",
		"学校のタスククリア！充実した学生生活ですね！",
	],
	housework: [
		"家事のタスク、お疲れ様でした！快適な空間になりましたね！",
		"家事完了！すっきりした環境で過ごせますね！",
		"お疲れ様です！家族も喜びますね！",
		"ハウスキーピング完了！居心地が良くなりました！",
		"家事達成！素敵な住まいですね！",
	],
	other: [
		"タスク完了！お疲れ様でした！",
		"完了！次のタスクも頑張りましょう！",
		"お見事！また一つ達成しましたね！",
		"ミッション完了！順調ですね！",
	],
};

// 一般的な褒め言葉
const GENERAL_PRAISE = [
	"お見事！タスク完了です！",
	"一つ片付きましたね！素晴らしい！",
	"ナイス完了！この勢いで次のタスクも！",
	"やりましたね！着実に進んでいます！",
	"完了！順調に進んでいますね！",
	"達成おめでとうございます！",
	"素晴らしい！また一歩前進しましたね！",
	"完璧！その調子で頑張りましょう！",
];

// 特別な状況の褒め言葉
const SPECIAL_PRAISE = {
	first: [
		"おめでとうございます！最初のタスク完了ですね！素晴らしいスタートです！",
		"やったー！初めてのタスク完了！この調子でどんどん進みましょう！",
		"記念すべき第一歩！これからが楽しみですね！",
	],
	longAbandoned: [
		"このタスク、ようやく終止符が打たれましたね！達成感もひとしおでしょう！",
		"大変お待たせしました！ついにこのタスクを完了させましたね！",
		"放置していたタスクを片付けた！スッキリしましたね！",
		"長期戦お疲れ様！ついに完了させましたね！",
	],
	moderateAbandoned: [
		"数日越しのタスク、完了！よく取り組めました！",
		"少し時間がかかりましたが、無事完了！お疲れ様でした！",
		"粘り強く取り組んで完了！素晴らしいですね！",
	],
	frequent: [
		"今日も絶好調！次々とタスクを片付けていますね！",
		"ハイペース！素晴らしい集中力です！",
		"どんどん進んでいますね！この調子です！",
		"絶好調！生産性が高いですね！",
	],
	returning: [
		"お久しぶりのタスク完了ですね！ナイスカムバック！",
		"また戻ってきてくれて嬉しいです！完了おめでとう！",
		"復活！また始められて素晴らしいですね！",
	],
};

/**
 * ランダムに褒め言葉を選ぶヘルパー関数
 */
function getRandomMessage(messages: string[]): string {
	return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * タイトルと内容からキーワードを検出して褒め言葉を収集
 */
function findKeywordPraises(text: string): string[] {
	const praises: string[] = [];
	const lowerText = text.toLowerCase();

	// すべてのキーワードをチェック
	for (const [keyword, messages] of Object.entries(KEYWORD_PRAISE_MAP)) {
		if (text.includes(keyword) || lowerText.includes(keyword.toLowerCase())) {
			praises.push(...messages);
		}
	}

	return praises;
}

/**
 * タスク完了時の褒め言葉を生成（ユーザーフィードバックを考慮）
 * @param todo 完了したタスク
 * @param userStats ユーザーの統計情報
 * @returns 褒め言葉
 */
export async function generatePraiseMessage(
	todo: Todo,
	userStats: {
		totalCompletedTasks: number;
		lastCompletedAt?: Date;
	},
): Promise<string> {
	const now = new Date();
	const candidateMessages: string[] = [];

	// メッセージごとのスコアを取得（like: +1, dislike: -1）
	const messageScores = await getMessageScores();

	// createdAtがない場合は現在時刻を使用（新しいタスク扱い）
	let createdAt = now;
	if (todo.createdAt) {
		// Dateオブジェクトかどうかをチェック
		createdAt = todo.createdAt instanceof Date ? todo.createdAt : new Date(todo.createdAt);
	}

	// 1. 初回完了（優先度最高、即リターン）
	if (userStats.totalCompletedTasks === 0) {
		return getRandomMessage(SPECIAL_PRAISE.first);
	}

	// 2. タイトルと内容からキーワードベースの褒め言葉を検索（最優先）
	const keywordPraises = [
		...findKeywordPraises(todo.title),
		...findKeywordPraises(todo.content || ""),
	];

	if (keywordPraises.length > 0) {
		// キーワードに該当する褒め言葉が見つかった場合、それを優先的に候補に追加
		candidateMessages.push(...keywordPraises);
		console.log(`📝 キーワードマッチ: ${keywordPraises.length}件 (タイトル: "${todo.title}")`);
	}

	// 3. 放置されていたタスク
	const daysSinceCreation = Math.floor(
		(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (daysSinceCreation >= 7) {
		candidateMessages.push(...SPECIAL_PRAISE.longAbandoned);
	} else if (daysSinceCreation >= 3) {
		candidateMessages.push(...SPECIAL_PRAISE.moderateAbandoned);
	}

	// 4. 完了頻度
	if (userStats.lastCompletedAt) {
		const hoursSinceLastCompletion =
			(now.getTime() - userStats.lastCompletedAt.getTime()) / (1000 * 60 * 60);

		// 24時間以内に複数完了（頻繁）
		if (hoursSinceLastCompletion < 24) {
			candidateMessages.push(...SPECIAL_PRAISE.frequent);
		}

		// 1週間以上ぶりの完了
		if (hoursSinceLastCompletion > 24 * 7) {
			candidateMessages.push(...SPECIAL_PRAISE.returning);
		}
	}

	// 5. カテゴリ別の褒め言葉
	if (todo.category && CATEGORY_PRAISE[todo.category as TodoCategory]) {
		candidateMessages.push(...CATEGORY_PRAISE[todo.category as TodoCategory]);
	}

	// 6. 一般的な褒め言葉
	candidateMessages.push(...GENERAL_PRAISE);

	// 7. スコアベースのメッセージ選択（緩やかな重み付け）
	// スコアが-3以下（3回以上dislike）のメッセージのみ除外
	const EXCLUSION_THRESHOLD = -3;
	const filteredMessages = candidateMessages.filter(
		(msg) => !messageScores[msg] || messageScores[msg] > EXCLUSION_THRESHOLD,
	);

	if (filteredMessages.length === 0) {
		// すべてのメッセージが除外された場合は、候補から選択
		console.log("⚠️ すべてのメッセージが除外されたため、候補から選択");
		return getRandomMessage(candidateMessages);
	}

	// スコアに基づいて緩やかに重み付けされた選択を行う
	const weightedMessages: string[] = [];
	filteredMessages.forEach((msg) => {
		const score = messageScores[msg] || 0;

		// スコアに応じて出現頻度を調整（多様性を重視）
		if (score >= 3) {
			// スコア+3以上: × 2倍（最大5倍まで）
			const weight = Math.min(score * 2, 5);
			for (let i = 0; i < weight; i++) {
				weightedMessages.push(msg);
			}
			console.log(`👍👍 大人気メッセージ: "${msg}" (スコア: ${score}, 重み: ${weight})`);
		} else if (score === 2) {
			// スコア+2: × 1.8倍（約2回）
			weightedMessages.push(msg);
			if (Math.random() < 0.8) {
				weightedMessages.push(msg);
			}
			console.log(`👍 人気メッセージ: "${msg}" (スコア: ${score}, 重み: ~1.8)`);
		} else if (score === 1) {
			// スコア+1: × 1.5倍（約1.5回）
			weightedMessages.push(msg);
			if (Math.random() < 0.5) {
				weightedMessages.push(msg);
			}
			console.log(`👍 好評メッセージ: "${msg}" (スコア: ${score}, 重み: ~1.5)`);
		} else if (score === 0) {
			// 無反応: 1回（基準）
			weightedMessages.push(msg);
		} else if (score === -1) {
			// スコア-1: × 0.8倍（80%の確率）
			if (Math.random() < 0.8) {
				weightedMessages.push(msg);
			}
			console.log(`👎 やや低評価: "${msg}" (スコア: ${score}, 重み: ~0.8)`);
		} else if (score === -2) {
			// スコア-2: × 0.5倍（50%の確率）
			if (Math.random() < 0.5) {
				weightedMessages.push(msg);
			}
			console.log(`👎👎 低評価: "${msg}" (スコア: ${score}, 重み: ~0.5)`);
		}
	});

	// 重み付けされたメッセージからランダムに選択
	const selectedMessage =
		weightedMessages.length > 0
			? getRandomMessage(weightedMessages)
			: getRandomMessage(filteredMessages);

	const score = messageScores[selectedMessage] || 0;
	console.log(`💬 選択された褒め言葉: "${selectedMessage}" (スコア: ${score})`);

	return selectedMessage;
}
