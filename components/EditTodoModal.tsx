import type { Todo } from "@/types/Todo";
import { updateTodo } from "@/services/todoService";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableHighlight, View } from "react-native";
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
	const [title, setTitle] = useState(todo?.title || "");
	const [content, setContent] = useState(todo?.content || "");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);

	React.useEffect(() => {
		if (todo) {
			setTitle(todo.title);
			setContent(todo.content);
			setErrors({});
		}
	}, [todo]);

	const handleSave = async () => {
		if (!todo) return;

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
				completed: todo.completed,
			});

			Toast.show({
				type: "success",
				text1: "更新成功",
				text2: "Todoを更新しました",
			});

			onSave();
			onClose();
		} catch (error) {
			console.error(error);
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
			transparent={true}
			animationType="fade"
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-center items-center bg-black/50">
				<View className="bg-white rounded-lg p-6 w-5/6 max-w-md">
					<Text className="text-xl font-noto-bold mb-4">Todo編集</Text>

					<View className="mb-4">
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

					<View className="mb-4">
						<TextInput
							className="border-2 border-gray-300 rounded-md p-2"
							placeholder="内容"
							value={content}
							onChangeText={setContent}
							multiline
							numberOfLines={3}
						/>
						{errors.content && (
							<Text className="text-red-500 text-sm mt-1">
								{errors.content}
							</Text>
						)}
					</View>

					<View className="flex-row justify-end space-x-2">
						<TouchableHighlight
							onPress={onClose}
							disabled={isLoading}
							activeOpacity={0.5}
							className="bg-gray-300 rounded-md px-4 py-2 mr-2"
							underlayColor="#d1d5db"
						>
							<Text className="text-gray-700 font-noto-bold">キャンセル</Text>
						</TouchableHighlight>

						<TouchableHighlight
							onPress={handleSave}
							disabled={isLoading}
							activeOpacity={0.5}
							className="bg-blue-500 rounded-md px-4 py-2"
							underlayColor="#3b82f6"
						>
							<Text className="text-white font-noto-bold">
								{isLoading ? "保存中..." : "保存"}
							</Text>
						</TouchableHighlight>
					</View>
				</View>
			</View>
		</Modal>
	);
}
