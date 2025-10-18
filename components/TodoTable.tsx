import {
	deleteTodo as deleteTodoService,
	getTodos as getTodosService,
	toggleTodoComplete,
} from "@/services/todoService";
import type { Todo } from "@/types/Todo";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import EditTodoModal from "./EditTodoModal";
import TodoItem from "./ui/TodoItem";

type TodoTableProps = {
	refresh?: number;
};

export default function TodoTable({ refresh }: TodoTableProps) {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState<Todo[]>([]);
	const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
	const [isModalVisible, setIsModalVisible] = useState(false);

	const getTodos = useCallback(async () => {
		setLoading(true);
		try {
			const todos = await getTodosService();
			setData(todos);
		} catch (error) {
			console.error("Todo取得エラー:", error);
			let errorMessage = "Todoの読み込みに失敗しました";

			if (error && typeof error === "object") {
				if ("code" in error) {
					switch (error.code) {
						case "permission-denied":
							errorMessage =
								"アクセス権限がありません。Firestoreのセキュリティルールを確認してください。";
							break;
						case "failed-precondition":
							errorMessage =
								"インデックスが必要です。Firestore Consoleでインデックスを作成してください。";
							break;
						case "unavailable":
							errorMessage =
								"Firestoreに接続できません。インターネット接続を確認してください。";
							break;
						default:
							errorMessage = `読み込みエラー: ${error.code}`;
					}
				}

				if ("message" in error && typeof error.message === "string") {
					console.error("詳細:", error.message);
					if (__DEV__) {
						errorMessage += `\n\n[開発モード] ${error.message}`;
					}
				}
			}

			Toast.show({
				type: "error",
				text1: "読み込み失敗",
				text2: errorMessage,
				visibilityTime: 8000,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	const handleEdit = (todo: Todo) => {
		setEditingTodo(todo);
		setIsModalVisible(true);
	};

	const handleCloseModal = () => {
		setIsModalVisible(false);
		setEditingTodo(null);
	};

	const handleSaveEdit = () => {
		getTodos();
	};

	const toggleComplete = async (id: string) => {
		try {
			// 現在のTodoを取得
			const todo = data.find((item) => item.id === id);
			if (!todo) return;

			await toggleTodoComplete(id, todo.completed);

			// リストを再取得
			getTodos();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "更新失敗",
				text2: "ステータスの更新に失敗しました",
			});
		}
	};

	const deleteTodo = async (id: string) => {
		try {
			await deleteTodoService(id);

			Toast.show({
				type: "success",
				text1: "削除成功",
				text2: "Todoを削除しました",
			});

			// リストを再取得
			getTodos();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "削除失敗",
				text2: "Todoの削除に失敗しました",
			});
		}
	};

	useEffect(() => {
		if (refresh !== undefined) {
			getTodos();
		}
	}, [refresh, getTodos]);
	return (
		<View className="flex-1">
			<View className="flex flex-row py-2 border-b-2 border-t-2 border-gray-400 items-center">
				<View style={{ width: 40 }} />
				<Text className="flex-1 text-center font-noto-bold">タイトル</Text>
				<Text className="flex-1 text-center font-noto-bold">内容</Text>
				<Text style={{ width: 110 }} className="text-center font-noto-bold">
					操作
				</Text>
			</View>
			{isLoading ? (
				<View className="py-4">
					<ActivityIndicator />
				</View>
			) : (
				<FlatList
					data={data}
					renderItem={({ item }) => (
						<TodoItem
							{...item}
							onToggleComplete={toggleComplete}
							onEdit={handleEdit}
							onDelete={deleteTodo}
						/>
					)}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={{ paddingBottom: 20 }}
					showsVerticalScrollIndicator={true}
				/>
			)}
			<EditTodoModal
				visible={isModalVisible}
				todo={editingTodo}
				onClose={handleCloseModal}
				onSave={handleSaveEdit}
			/>
		</View>
	);
}
