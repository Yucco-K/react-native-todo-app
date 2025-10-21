import { useTheme } from "@/contexts/ThemeContext";
import { predictCategory } from "@/services/aiCategoryService";
import { notifyTodoAdded } from "@/services/notificationService";
import { generateTodoRecommendations } from "@/services/todoRecommendationService";
import { createTodo } from "@/services/todoService";
import type { TodoCategory } from "@/types/Category";
import { CATEGORY_OPTIONS } from "@/types/Category";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	Modal,
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

type AddTodoModalProps = {
	visible: boolean;
	onClose: () => void;
	onSave: () => void;
	organizationId?: string | null;
};

export default function AddTodoModal({
	visible,
	onClose,
	onSave,
	organizationId = null,
}: AddTodoModalProps) {
	const { isDark } = useTheme();
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState<TodoCategory>("other");
	const [isLoading, setIsLoading] = useState(false);
	const [isPredicting, setIsPredicting] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);
	const [recommendations, setRecommendations] = useState<
		Array<{ title: string; category: TodoCategory; message: string }>
	>([]);
	const [isLoadingRecommendations, setIsLoadingRecommendations] =
		useState(false);
	const shownRecommendationsRef = useRef<string[]>([]);

	// おすすめTODOを取得
	const fetchRecommendations = useCallback(async () => {
		setIsLoadingRecommendations(true);
		try {
			// refから最新の表示済みリストを取得
			const newRecs = await generateTodoRecommendations(
				shownRecommendationsRef.current
			);
			setRecommendations(newRecs);
			// 表示済みリストに追加
			const newTitles = newRecs.map((r) => r.title.toLowerCase().trim());
			shownRecommendationsRef.current = [
				...shownRecommendationsRef.current,
				...newTitles,
			];
		} catch (error) {
			console.error("おすすめTODO取得エラー:", error);
			setRecommendations([]);
		} finally {
			setIsLoadingRecommendations(false);
		}
	}, []);

	// モーダルが開いたら初回のおすすめを取得
	useEffect(() => {
		if (visible) {
			// リセット
			shownRecommendationsRef.current = [];
			// 新しいおすすめを取得
			fetchRecommendations();
		}
	}, [visible, fetchRecommendations]);

	// 次の候補を取得
	const handleNextRecommendations = () => {
		fetchRecommendations();
	};

	const handlePredictCategory = async () => {
		if (!title.trim()) {
			Toast.show({
				type: "error",
				text1: "タイトル必須",
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

	const handleSave = async () => {
		const result = todoSchema.safeParse({ title, content });

		if (!result.success) {
			const fieldErrors: { title?: string; content?: string } = {};
			result.error.errors.forEach((err) => {
				if (err.path[0] === "title" || err.path[0] === "content") {
					fieldErrors[err.path[0]] = err.message;
				}
			});
			setErrors(fieldErrors);

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
			await createTodo(title, content, category, organizationId);

			// 組織のTodoの場合は通知を送信
			if (organizationId) {
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
			onClose();
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

	const handleClose = () => {
		// フォームをクリア
		setTitle("");
		setContent("");
		setCategory("other");
		setErrors({});
		onClose();
	};

	const handleSelectRecommendation = async (recommendation: {
		title: string;
		category: TodoCategory;
	}) => {
		console.log("🎯 おすすめTODOをタップ:", recommendation.title);
		try {
			// ワンタップで即座に保存
			console.log("💾 TODOを保存中...", {
				title: recommendation.title,
				category: recommendation.category,
				organizationId,
			});

			await createTodo(
				recommendation.title,
				"", // 内容は空
				recommendation.category,
				organizationId
			);

			console.log("✅ TODO保存成功");

			// 組織のTodoの場合は通知を送信
			if (organizationId) {
				try {
					await notifyTodoAdded(recommendation.title);
				} catch (error) {
					console.error("通知送信エラー:", error);
				}
			}

			// 保存後のコールバックを呼び出す
			console.log("🔄 リスト更新をトリガー");
			onSave?.();

			// おすすめを再取得（常に3件表示されるように）
			console.log("🔄 おすすめを再取得");
			fetchRecommendations();
		} catch (error) {
			console.error("おすすめTODO追加エラー:", error);
			Toast.show({
				type: "error",
				text1: "保存失敗",
				text2: "Todoの保存に失敗しました",
			});
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={handleClose}
		>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View
					className="flex-1 justify-center items-center"
					style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
				>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View
							className="rounded-lg p-6 w-11/12"
							style={{
								maxHeight: "80%",
								backgroundColor: isDark ? "#1f2937" : "#ffffff",
							}}
						>
							<Text
								className="text-3xl font-noto-bold mb-4"
								style={{ color: isDark ? "#f3f4f6" : "#000000" }}
							>
								Todo追加
							</Text>

							<ScrollView
								style={{ maxHeight: 400 }}
								showsVerticalScrollIndicator={false}
							>
								{/* おすすめTODO */}
								{isLoadingRecommendations ? (
									<View className="mb-4 p-3 bg-blue-50 rounded-lg">
										<ActivityIndicator size="small" color="#3b82f6" />
										<Text className="text-center text-blue-600 font-noto-regular text-base mt-2">
											おすすめを読み込み中...
										</Text>
									</View>
								) : recommendations.length > 0 ? (
									<View className="mb-4">
										<Text
											className="font-noto-bold text-lg mb-2"
											style={{ color: isDark ? "#d1d5db" : "#374151" }}
										>
											💡 おすすめTODO（タップで追加）
										</Text>
										{recommendations.map((rec) => (
											<TouchableOpacity
												key={`${rec.title}-${rec.category}`}
												onPress={() => handleSelectRecommendation(rec)}
												className="mb-2 p-3 bg-green-50 rounded-lg border border-green-300"
												activeOpacity={0.7}
											>
												<Text className="text-gray-600 font-noto-regular text-sm mb-1">
													{rec.message}
												</Text>
												<View className="flex-row items-center mt-1">
													<Ionicons
														name="add-circle"
														size={20}
														color="#22c55e"
													/>
													<Text className="ml-2 text-green-700 font-noto-bold text-base">
														{rec.title}
													</Text>
												</View>
											</TouchableOpacity>
										))}
										{/* 次の候補ボタン */}
										<TouchableOpacity
											onPress={handleNextRecommendations}
											className="flex-row items-center justify-center px-5 py-3 bg-gray-100 rounded-lg border border-gray-300"
											activeOpacity={0.7}
										>
											<Ionicons name="refresh" size={20} color="#6b7280" />
											<Text className="ml-2 text-gray-700 font-noto-bold text-base">
												次の候補を見る
											</Text>
										</TouchableOpacity>
									</View>
								) : null}

								{/* タイトル入力 */}
								<View className="mb-3">
									<TextInput
										className="border-2 rounded-md text-lg"
										style={{
											fontFamily: "System",
											lineHeight: undefined,
											paddingVertical: 14,
											paddingHorizontal: 12,
											fontSize: 18,
											borderColor: isDark ? "#4b5563" : "#d1d5db",
											backgroundColor: isDark ? "#374151" : "#ffffff",
											color: isDark ? "#f3f4f6" : "#000000",
										}}
										placeholder="タイトル"
										placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
										value={title}
										onChangeText={setTitle}
										autoFocus={true}
									/>
									{errors.title && (
										<Text className="text-red-500 text-lg mt-1 font-noto-regular">
											{errors.title}
										</Text>
									)}
								</View>

								{/* 内容入力 */}
								<View className="mb-3">
									<TextInput
										className="border-2 rounded-md text-lg"
										style={{
											fontFamily: "System",
											lineHeight: undefined,
											minHeight: 120,
											paddingVertical: 14,
											paddingHorizontal: 12,
											fontSize: 18,
											borderColor: isDark ? "#4b5563" : "#d1d5db",
											backgroundColor: isDark ? "#374151" : "#ffffff",
											color: isDark ? "#f3f4f6" : "#000000",
										}}
										placeholder="内容（任意）"
										placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
										value={content}
										onChangeText={setContent}
										multiline
										numberOfLines={4}
										textAlignVertical="top"
									/>
									{errors.content && (
										<Text className="text-red-500 text-lg mt-1 font-noto-regular">
											{errors.content}
										</Text>
									)}
								</View>

								{/* カテゴリ選択 */}
								<View className="mb-3">
									<Text
										className="font-noto-bold text-lg mb-2"
										style={{ color: isDark ? "#d1d5db" : "#374151" }}
									>
										カテゴリ
									</Text>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										className="mb-2"
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
													className={`font-noto-regular text-base ${
														category === option.value
															? "text-white"
															: "text-gray-700"
													}`}
												>
													{option.icon}{" "}
													<Text
														className={`ml-2 font-noto-bold text-base ${
															category === option.value
																? "text-white"
																: "text-gray-700"
														}`}
													>
														{option.label}
													</Text>
												</Text>
											</TouchableOpacity>
										))}
									</ScrollView>

									{/* AI推測ボタン */}
									<TouchableOpacity
										onPress={handlePredictCategory}
										disabled={isPredicting || !title.trim()}
										className={`flex-row items-center justify-center py-2 px-4 rounded-md border-2 ${
											isPredicting || !title.trim()
												? "bg-gray-200 border-gray-300"
												: "bg-purple-50 border-purple-300"
										}`}
									>
										<Ionicons
											name="sparkles"
											size={18}
											color={
												isPredicting || !title.trim() ? "#9ca3af" : "#9333ea"
											}
										/>
										<Text className="text-gray-700 font-noto-bold text-lg ml-2">
											{isPredicting ? "推測中..." : "AIカテゴリ推測"}
										</Text>
									</TouchableOpacity>
								</View>
							</ScrollView>

							{/* ボタン群 */}
							<View className="flex-row justify-end mt-4 space-x-2">
								<TouchableHighlight
									onPress={handleClose}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-gray-300 rounded-md py-3 mr-2"
									underlayColor="#d1d5db"
								>
									<Text className="text-gray-700 font-noto-bold text-lg text-center">
										キャンセル
									</Text>
								</TouchableHighlight>

								<TouchableHighlight
									onPress={handleSave}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-blue-500 rounded-md py-3"
									underlayColor="#3b82f6"
								>
									{isLoading ? (
										<ActivityIndicator color="white" />
									) : (
										<Text className="text-white font-noto-bold text-lg text-center">
											保存
										</Text>
									)}
								</TouchableHighlight>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
