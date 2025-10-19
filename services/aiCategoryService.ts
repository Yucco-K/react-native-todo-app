import type { TodoCategory } from "@/types/Category";
import OpenAI from "openai";

const getOpenAIClient = () => {
	const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

	if (!apiKey || apiKey === "your_openai_api_key_here") {
		throw new Error("OpenAI APIキーが設定されていません");
	}

	return new OpenAI({
		apiKey,
		dangerouslyAllowBrowser: true,
	});
};

export async function predictCategory(
	title: string,
	content: string
): Promise<TodoCategory> {
	try {
		if (!title.trim()) {
			return "other";
		}

		const client = getOpenAIClient();

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

		const response = await client.chat.completions.create({
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

		const validCategories: TodoCategory[] = [
			"work",
			"shopping",
			"personal",
			"study",
			"school",
			"housework",
			"other",
		];

		if (
			predictedCategory &&
			validCategories.includes(predictedCategory as TodoCategory)
		) {
			console.log(`✅ AIカテゴリ推測: "${title}" → ${predictedCategory}`);
			return predictedCategory as TodoCategory;
		}

		console.warn(`⚠️ AIが無効なカテゴリを返しました: ${predictedCategory}`);
		return "other";
	} catch (error) {
		console.error("❌ AIカテゴリ推測エラー:", error);
		return "other";
	}
}
