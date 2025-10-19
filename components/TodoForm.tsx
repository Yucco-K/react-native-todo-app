import { predictCategory } from "@/services/aiCategoryService";
import { notifyTodoAdded } from "@/services/notificationService";
import { createTodo } from "@/services/todoService";
import type { TodoCategory } from "@/types/Category";
import { CATEGORY_OPTIONS } from "@/types/Category";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	ScrollView,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";

// バリデーションスキーマ
const todoSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルを入力してください")
		.max(50, "タイトルは50文字以内で入力してください"),
	content: z
		.string()
		.max(200, "内容は200文字以内で入力してください")
		.optional()
		.or(z.literal("")),
});

type TodoFormProps = {
	onSave?: () => void;
	isShared?: boolean;
};

export default function TodoForm({ onSave, isShared = false }: TodoFormProps) {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState<TodoCategory>("other");
	const [isLoading, setIsLoading] = useState(false);
	const [isPredicting, setIsPredicting] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);

	const handlePredictCategory = async () => {
		if (!title.trim()) {
			Toast.show({
				type: "error",
				text1: "タイトルを入力してください",
				text2: "カテゴリを推測するにはタイトルが必要です",
			});
			return;
		}

		setIsPredicting(true);
		try {
			const predicted = await predictCategory(title, content);
			setCategory(predicted);
			// Toast.show({
			// 	type: "success",
			// 	text1: "AI推測完了",
			// 	text2: `カテゴリ: ${CATEGORY_OPTIONS.find((c) => c.value === predicted)?.label || "その他"}`,
			// });
		} catch (error) {
			console.error("カテゴリ推測エラー:", error);
			Toast.show({
				type: "error",
				text1: "AI推測失敗",
				text2: "カテゴリの推測に失敗しました",
			});
		} finally {
			setIsPredicting(false);
		}
	};

	const createTodos = async () => {
		// バリデーション
		const result = todoSchema.safeParse({ title, content });

		if (!result.success) {
			const fieldErrors: { title?: string; content?: string } = {};
			result.error.errors.forEach((err) => {
				if (err.path[0] === "title" || err.path[0] === "content") {
					fieldErrors[err.path[0]] = err.message;
				}
			});
			setErrors(fieldErrors);

			// エラートーストを表示
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "入力内容を確認してください",
			});
			return;
		}

		// バリデーション成功、エラーをクリア
		setErrors({});
		setIsLoading(true);
		try {
			await createTodo(title, content, category, isShared);

			// 共有Todoの場合は通知を送信
			if (isShared) {
				try {
					await notifyTodoAdded(title);
				} catch (error) {
					console.error("通知送信エラー:", error);
				}
			}

			// フォームをクリア
			setTitle("");
			setContent("");
			setCategory("other");

		// 成功トーストを表示
		// Toast.show({
		// 	type: "success",
		// 	text1: "保存成功",
		// 	text2: "Todoを保存しました",
		// });

			// 保存後のコールバックを呼び出す
			onSave?.();
		} catch (error) {
			console.error(error);
			// エラートーストを表示
			Toast.show({
				type: "error",
				text1: "保存失敗",
				text2: "Todoの保存に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View className="space-y-2 mb-4">
				<View>
					<TextInput
						className="border-2 border-gray-300 rounded-md p-3 text-base font-noto-regular"
						placeholder="タイトル"
						placeholderTextColor="#9ca3af"
						value={title}
						onChangeText={setTitle}
						autoFocus={true}
					/>
					{errors.title && (
						<Text className="text-red-500 text-base mt-1 font-noto-regular">
							{errors.title}
						</Text>
					)}
				</View>
				<View className="mt-3">
					<TextInput
						className="border-2 border-gray-300 rounded-md p-3 text-base font-noto-regular"
						placeholder="内容（任意）"
						placeholderTextColor="#9ca3af"
						value={content}
						onChangeText={setContent}
						multiline
						numberOfLines={3}
						textAlignVertical="top"
					/>
					{errors.content && (
						<Text className="text-red-500 text-base mt-1 font-noto-regular">
							{errors.content}
						</Text>
					)}
				</View>

				{/* カテゴリ選択 */}
				<View className="mt-3">
					<Text className="text-gray-700 font-noto-bold text-base mb-2">
						カテゴリ
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="flex-row"
					>
						{CATEGORY_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.value}
								onPress={() => setCategory(option.value)}
								className={`mr-2 px-4 py-2 rounded-full border-2 ${
									category === option.value
										? "bg-blue-500 border-blue-500"
										: "bg-white border-gray-300"
								}`}
							>
								<Text
									className={`font-noto-regular text-sm ${
										category === option.value ? "text-white" : "text-gray-700"
									}`}
								>
									{option.icon} {option.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* AI推測ボタン */}
					<TouchableOpacity
						onPress={handlePredictCategory}
						disabled={isPredicting || !title.trim()}
						className={`mt-3 flex-row items-center justify-center py-2 px-4 rounded-md border-2 ${
							isPredicting || !title.trim()
								? "bg-gray-100 border-gray-300"
								: "bg-purple-50 border-purple-500"
						}`}
					>
						{isPredicting ? (
							<ActivityIndicator size="small" color="#9333ea" />
						) : (
							<Ionicons name="sparkles" size={18} color="#9333ea" />
						)}
						<Text
							className={`ml-2 font-noto-bold text-sm ${
								isPredicting || !title.trim()
									? "text-gray-400"
									: "text-purple-600"
							}`}
						>
							{isPredicting ? "AI推測中..." : "AIでカテゴリを推測"}
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableHighlight
					onPress={createTodos}
					disabled={isLoading}
					activeOpacity={0.5}
					className="bg-black rounded-md p-3 mt-4"
					underlayColor="gray"
				>
					<Text className="text-white text-center font-noto-bold text-base">
						{isLoading ? "保存中..." : "保存"}
					</Text>
				</TouchableHighlight>
			</View>
		</TouchableWithoutFeedback>
	);
}
