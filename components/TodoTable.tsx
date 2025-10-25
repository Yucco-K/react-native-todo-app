import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { notifyTodoCompleted, notifyTodoDeleted } from "@/services/notificationService";
import { generatePraiseMessage } from "@/services/praiseService";
import {
	deleteExpiredCompletedTodos,
	deleteTodo as deleteTodoService,
	getTodos as getTodosService,
	removeTodoReminder,
	setTodoReminder,
	toggleTodoComplete,
} from "@/services/todoService";
import { getUserStats, incrementCompletedTaskCount } from "@/services/userStatsService";
import type { Todo } from "@/types/Todo";
import EditTodoModal from "./EditTodoModal";
import ReminderModal from "./ReminderModal";
import SearchModal from "./SearchModal";
import TodoItem from "./ui/TodoItem";

type TodoTableProps = {
	refresh?: number;
	organizationId?: string | null;
	isDark?: boolean;
};

export default function TodoTable({
	refresh,
	organizationId = null,
	isDark = false,
}: TodoTableProps) {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState<Todo[]>([]);
	const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
	const [reminderTodo, setReminderTodo] = useState<Todo | null>(null);
	const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);

	const getTodos = useCallback(async () => {
		setLoading(true);
		try {
			// 期限切れのTodoを自動削除
			const deletedCount = await deleteExpiredCompletedTodos();

			// Todoリストを取得
			const todos = await getTodosService(organizationId);
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
							errorMessage = "Firestoreに接続できません。インターネット接続を確認してください。";
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
	}, [organizationId]);

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

				// 褒め言葉を生成（ユーザーフィードバックを考慮）
				const praiseMessage = await generatePraiseMessage(todo, userStats);

				// ランダムなテーマインデックスを生成（0-24の25種類）
				const randomThemeIndex = Math.floor(Math.random() * 25);

				console.log("🎨 新しいテーマ:", randomThemeIndex, "褒め言葉:", praiseMessage);

				// 前のトーストを確実に消してから新しいトーストを表示
				Toast.hide();

				// 少し待ってから新しいトーストを表示（Toastが完全にクリアされるまで）
				setTimeout(() => {
					Toast.show({
						type: "praise",
						text1: "✨ タスク完了おめでとう！✨",
						text2: praiseMessage,
						visibilityTime: 4000,
						props: {
							themeIndex: randomThemeIndex,
							category: todo.category, // フィードバック用にカテゴリを渡す
							key: `praise-${Date.now()}-${Math.random()}`, // ユニークキー
						},
					});
				}, 100);

				// ユーザー統計を更新
				await incrementCompletedTaskCount();

				// 組織のTodoの場合はプッシュ通知を送信（他のユーザーに通知）
				if (todo.organizationId) {
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

	const deleteTodo = async (id: string) => {
		try {
			// 削除前にTodoの情報を取得（通知用）
			const todo = data.find((item) => item.id === id);

			await deleteTodoService(id);

			// 組織のTodoの場合は通知を送信
			if (todo?.organizationId) {
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

	const handleSetReminder = (todo: Todo) => {
		setReminderTodo(todo);
		setIsReminderModalVisible(true);
	};

	const handleSaveReminder = async (todoId: string, remindAt: Date) => {
		try {
			await setTodoReminder(todoId, remindAt);
			await getTodos();
			Toast.show({
				type: "success",
				text1: "リマインド設定完了",
				text2: `${remindAt.toLocaleString()}に通知します`,
			});
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "リマインド設定失敗",
				text2: "リマインドの設定に失敗しました",
			});
			throw error;
		}
	};

	const handleRemoveReminder = async (todoId: string) => {
		try {
			await removeTodoReminder(todoId);
			await getTodos();
			Toast.show({
				type: "success",
				text1: "リマインド削除完了",
				text2: "リマインドを削除しました",
			});
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "リマインド削除失敗",
				text2: "リマインドの削除に失敗しました",
			});
			throw error;
		}
	};

	useEffect(() => {
		getTodos();
	}, [getTodos]);

	// refreshプロップが変更されたときに再取得
	useEffect(() => {
		if (refresh !== undefined) {
			getTodos();
		}
	}, [refresh, getTodos]);

	return (
		<View className="flex-1">
			<View
				className="flex-row py-3 px-2 border-b-2 border-t-2 items-center"
				style={{
					backgroundColor: isDark ? "#374151" : "#f9fafb",
					borderColor: isDark ? "#4b5563" : "#9ca3af",
				}}
			>
				<View style={{ width: 32 }} className="mr-2" />
				<Text
					className="flex-1 font-noto-bold text-lg"
					style={{ color: isDark ? "#f3f4f6" : "#000000" }}
				>
					Todo
				</Text>
				{/* 検索アイコンボタン */}
				<TouchableOpacity onPress={() => setIsSearchModalVisible(true)} className="p-2">
					<Ionicons name="search" size={24} color={isDark ? "#60a5fa" : "#3b82f6"} />
				</TouchableOpacity>
			</View>
			{isLoading ? (
				<View className="py-4">
					<ActivityIndicator />
				</View>
			) : data.length === 0 ? (
				<View className="py-8 items-center">
					<Text
						className="font-noto-regular text-xl"
						style={{ color: isDark ? "#d1d5db" : "#9ca3af" }}
					>
						Todoはまだありません
					</Text>
					<Text
						className="font-noto-regular text-lg mt-2"
						style={{ color: isDark ? "#d1d5db" : "#9ca3af" }}
					>
						右下のボタンから新しいTodoを作成できます
					</Text>
				</View>
			) : (
				<FlatList
					data={data}
					renderItem={({ item }: { item: Todo }) => (
						<TodoItem
							{...item}
							onToggleComplete={toggleComplete}
							onEdit={handleEdit}
							onDelete={deleteTodo}
							onSetReminder={handleSetReminder}
							isDark={isDark}
						/>
					)}
					keyExtractor={(item: Todo) => item.id.toString()}
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
			<ReminderModal
				visible={isReminderModalVisible}
				todo={reminderTodo}
				onClose={() => setIsReminderModalVisible(false)}
				onSave={handleSaveReminder}
				onRemove={handleRemoveReminder}
			/>
			<SearchModal
				visible={isSearchModalVisible}
				onClose={() => setIsSearchModalVisible(false)}
				data={data}
				onToggleComplete={toggleComplete}
				onEdit={handleEdit}
				onDelete={deleteTodo}
				onSetReminder={handleSetReminder}
				isDark={isDark}
			/>
		</View>
	);
}
