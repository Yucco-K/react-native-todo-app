import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import {
	notifyTodoCompleted,
	notifyTodoDeleted,
} from "@/services/notificationService";
import { generatePraiseMessage } from "@/services/praiseService";
import {
	deleteTodo as deleteTodoService,
	deleteExpiredCompletedTodos,
	getTodos as getTodosService,
	toggleTodoComplete,
	toggleTodoShared,
} from "@/services/todoService";
import {
	getUserStats,
	incrementCompletedTaskCount,
} from "@/services/userStatsService";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import EditTodoModal from "./EditTodoModal";
import SearchModal from "./SearchModal";
import TodoItem from "./ui/TodoItem";

type TodoTableProps = {
	refresh?: number;
	isShared?: boolean;
};

export default function TodoTable({
	refresh,
	isShared = false,
}: TodoTableProps) {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState<Todo[]>([]);
	const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
	const { triggerRefresh } = useTodoRefresh();

	const getTodos = useCallback(async () => {
		setLoading(true);
		try {
			// 期限切れのTodoを自動削除
			const deletedCount = await deleteExpiredCompletedTodos();
			
			// Todoリストを取得
			const todos = await getTodosService(isShared);
			setData(todos);
			
			// 削除があった場合はログ出力（本番環境ではトーストを表示しない）
			if (deletedCount > 0 && __DEV__) {
				console.log(`🗑️ ${deletedCount}件の完了済みTodoを自動削除しました`);
			}
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
	}, [isShared]);

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

			// 完了処理を実行
			await toggleTodoComplete(id, todo.completed);

			// 未完了 → 完了の場合、褒め言葉を表示
			if (!todo.completed) {
				// ユーザー統計を取得
				const userStats = await getUserStats();

				// 褒め言葉を生成
				const praiseMessage = generatePraiseMessage(todo, userStats);

				// ランダムなテーマインデックスを生成（0-24の25種類）
				const randomThemeIndex = Math.floor(Math.random() * 25);

				console.log(
					"🎨 新しいテーマ:",
					randomThemeIndex,
					"褒め言葉:",
					praiseMessage
				);

				// 前のトーストを確実に消してから新しいトーストを表示
				Toast.hide();

				// 少し待ってから新しいトーストを表示（Toastが完全にクリアされるまで）
				setTimeout(() => {
					Toast.show({
						type: "praise",
						text1: "✨ タスク完了おめでとう！✨",
						text2: praiseMessage,
						visibilityTime: 2000,
						props: {
							themeIndex: randomThemeIndex,
							key: `praise-${Date.now()}-${Math.random()}`, // ユニークキー
						},
					});
				}, 100);

				// ユーザー統計を更新
				await incrementCompletedTaskCount();

				// 共有Todoの場合はプッシュ通知を送信（他のユーザーに通知）
				if (todo.shared) {
					try {
						await notifyTodoCompleted(todo.title);
					} catch (error) {
						console.error("完了通知送信エラー:", error);
					}
				}
			}

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

	const toggleShare = async (id: string, currentShared: boolean) => {
		try {
			await toggleTodoShared(id, currentShared);

			// Toast.show({
			// 	type: "success",
			// 	text1: currentShared ? "個人用に変更" : "共有に変更",
			// 	text2: currentShared ? "My Listに移動しました" : "Sharedに移動しました",
			// 	visibilityTime: 3000,
			// });

			// グローバルにリフレッシュをトリガー（両方のタブで即座に反映）
			triggerRefresh();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "更新失敗",
				text2: "共有状態の更新に失敗しました",
			});
		}
	};

	const deleteTodo = async (id: string) => {
		try {
			// 削除前にTodoの情報を取得（通知用）
			const todo = data.find((item) => item.id === id);

			await deleteTodoService(id);

			// 共有Todoの場合は通知を送信
			if (todo?.shared) {
				try {
					await notifyTodoDeleted(todo.title);
				} catch (error) {
					console.error("通知送信エラー:", error);
				}
		}

		// Toast.show({
		// 	type: "success",
		// 	text1: "削除成功",
		// 	text2: "Todoを削除しました",
		// });

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
			<View className="flex-row py-3 px-2 border-b-2 border-t-2 border-gray-400 items-center bg-gray-50">
				<View style={{ width: 32 }} className="mr-2" />
				<Text className="flex-1 font-noto-bold text-lg">Todo</Text>
				{/* 検索アイコンボタン */}
				<TouchableOpacity
					onPress={() => setIsSearchModalVisible(true)}
					className="p-2"
				>
					<Ionicons name="search" size={24} color="#3b82f6" />
				</TouchableOpacity>
			</View>
			{isLoading ? (
				<View className="py-4">
					<ActivityIndicator />
				</View>
			) : data.length === 0 ? (
				<View className="py-8 items-center">
					<Text className="text-gray-400 font-noto-regular text-xl">
						{isShared ? "共有Todoはまだありません" : "Todoはまだありません"}
					</Text>
					<Text className="text-gray-400 font-noto-regular text-lg mt-2">
						{isShared
							? "上のフォームから共有Todoを作成できます"
							: "上のフォームから新しいTodoを作成できます"}
					</Text>
				</View>
			) : (
				<FlatList
					data={data}
					renderItem={({ item }) => (
						<TodoItem
							{...item}
							onToggleComplete={toggleComplete}
							onToggleShared={toggleShare}
							onEdit={handleEdit}
							onDelete={deleteTodo}
							showShareToggle={!isShared}
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
			<SearchModal
				visible={isSearchModalVisible}
				onClose={() => setIsSearchModalVisible(false)}
				data={data}
				onToggleComplete={toggleComplete}
				onToggleShared={toggleShare}
				onEdit={handleEdit}
				onDelete={deleteTodo}
				showShareToggle={!isShared}
			/>
		</View>
	);
}
