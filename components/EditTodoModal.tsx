import { useTheme } from "@/contexts/ThemeContext";
import { AICategoryError, predictCategory } from "@/services/aiCategoryService";
import { notifyTodoUpdated } from "@/services/notificationService";
import { updateTodo } from "@/services/todoService";
import type { TodoCategory } from "@/types/Category";
import { CATEGORY_OPTIONS } from "@/types/Category";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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

type EditTodoModalProps = {
	visible: boolean;
	todo: Todo | null;
	onClose: () => void;
	onSave: () => void;
};

export default function EditTodoModal({
	visible,
	todo,
	onClose,
	onSave,
}: EditTodoModalProps) {
	const { isDark } = useTheme();
	const [title, setTitle] = useState(todo?.title || "");
	const [content, setContent] = useState(todo?.content || "");
	const [category, setCategory] = useState<TodoCategory>(
		todo?.category || "other"
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isPredicting, setIsPredicting] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);

	React.useEffect(() => {
		if (todo) {
			setTitle(todo.title);
			setContent(todo.content);
			setCategory(todo.category || "other");
			setErrors({});
		}
	}, [todo]);

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

			// カスタムエラーの場合、ユーザーフレンドリーなメッセージを表示
			if (error instanceof AICategoryError) {
				Toast.show({
					type: "error",
					text1: error.message,
					text2: error.userMessage,
					visibilityTime: 5000, // レート制限メッセージは長めに表示
				});
			} else {
				Toast.show({
					type: "error",
					text1: "AI推測失敗",
					text2: "カテゴリの推測に失敗しました。手動で選択してください。",
				});
			}
		} finally {
			setIsPredicting(false);
		}
	};

	const handleSave = async () => {
		if (!todo) return;

			title: todo.title,
			organizationId: todo.organizationId,
			shared: todo.shared,
		});

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

			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "入力内容を確認してください",
			});
			return;
		}

		setErrors({});
		setIsLoading(true);

		try {
			await updateTodo(todo.id, {
				title,
				content,
				category,
				completed: todo.completed,
				shared: todo.shared,
			});

			// 組織のTodoの場合は通知を送信
			if (todo.organizationId) {
					title,
					organizationId: todo.organizationId,
				});
				try {
					await notifyTodoUpdated(title);
				} catch (error) {
				}
			}

			// Toast.show({
			// 	type: "success",
			// 	text1: "更新成功",
			// 	text2: "Todoを更新しました",
			// });

			onSave();
			onClose();
		} catch (error) {
			Toast.show({
				type: "error",
				text1: "更新失敗",
				text2: "Todoの更新に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View className="flex-1 justify-center items-center bg-black/75">
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
								Todo編集
							</Text>

							<View className="mb-4">
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
									multiline
									textAlignVertical="top"
								/>
								{errors.title && (
									<Text className="text-red-500 text-lg mt-1 font-noto-regular">
										{errors.title}
									</Text>
								)}
							</View>

							<View className="mb-4">
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
							<View className="mb-4">
								<Text
									className="font-noto-bold text-lg mb-2"
									style={{ color: isDark ? "#d1d5db" : "#374151" }}
								>
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
												className={`font-noto-regular text-base ${
													category === option.value
														? "text-white"
														: "text-gray-700"
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
										className={`ml-2 font-noto-bold text-base ${
											isPredicting || !title.trim()
												? "text-gray-400"
												: "text-purple-600"
										}`}
									>
										{isPredicting ? "AI推測中..." : "AIでカテゴリを推測"}
									</Text>
								</TouchableOpacity>
							</View>

							<View className="flex-row justify-end mt-4 space-x-2">
								<TouchableHighlight
									onPress={onClose}
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
