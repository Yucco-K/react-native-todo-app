import { createTodo } from "@/services/todoService";
import { useState } from "react";
import { Text, TextInput, TouchableHighlight, View } from "react-native";
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
		.min(1, "内容を入力してください")
		.max(200, "内容は200文字以内で入力してください"),
});

type TodoFormProps = {
	onSave?: () => void;
};

export default function TodoForm({ onSave }: TodoFormProps) {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);

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
			await createTodo(title, content);

			// フォームをクリア
			setTitle("");
			setContent("");

			// 成功トーストを表示
			Toast.show({
				type: "success",
				text1: "保存成功",
				text2: "Todoを保存しました",
			});

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
		<View className="space-y-2 mb-2">
			<View>
				<TextInput
					className="border-2 border-gray-300 rounded-md p-2"
					placeholder="タイトル"
					value={title}
					onChangeText={setTitle}
				/>
				{errors.title && (
					<Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
				)}
			</View>
			<View>
				<TextInput
					className="border-2 border-gray-300 rounded-md p-2"
					placeholder="内容"
					value={content}
					onChangeText={setContent}
				/>
				{errors.content && (
					<Text className="text-red-500 text-sm mt-1">{errors.content}</Text>
				)}
			</View>
			<TouchableHighlight
				onPress={createTodos}
				disabled={isLoading}
				activeOpacity={0.5}
				className="bg-black rounded-md p-2"
				underlayColor="gray"
			>
				<Text className="text-white text-center font-noto-bold">
					{isLoading ? "保存中..." : "保存"}
				</Text>
			</TouchableHighlight>
		</View>
	);
}
