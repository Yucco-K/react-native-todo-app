import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { migrateTodosAddSharedField } from "@/services/migrationService";
import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TouchableHighlight,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function MyListScreen() {
	const [isMigrating, setIsMigrating] = useState(false);
	const { user, logout } = useAuth();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();

	const handleSave = () => {
		triggerRefresh();
	};

	const handleMigration = async () => {
		setIsMigrating(true);
		try {
			const result = await migrateTodosAddSharedField();

			if (result.success) {
				Toast.show({
					type: "success",
					text1: "更新完了",
					text2: `${result.updated}件のTodoを更新しました`,
					visibilityTime: 4000,
				});
				// リストを更新
				triggerRefresh();
			} else {
				Toast.show({
					type: "error",
					text1: "更新失敗",
					text2: result.error || "不明なエラー",
					visibilityTime: 4000,
				});
			}
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "マイグレーションに失敗しました",
			});
		} finally {
			setIsMigrating(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			Toast.show({
				type: "success",
				text1: "ログアウト",
				text2: "ログアウトしました",
			});
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "ログアウトに失敗しました",
			});
		}
	};

	return (
		<SafeAreaView className="flex-1">
			<View className="flex-1 px-4 pt-4">
				<View className="flex-row justify-between items-center mb-4">
					<View>
						<Text className="text-2xl font-noto-bold">My List</Text>
						{user?.email && (
							<Text className="text-sm text-gray-600 font-noto-regular">
								{user.email}
							</Text>
						)}
					</View>
					<TouchableHighlight
						onPress={handleLogout}
						activeOpacity={0.7}
						className="bg-gray-500 rounded-md px-4 py-2"
						underlayColor="#6b7280"
					>
						<Text className="text-white font-noto-bold">ログアウト</Text>
					</TouchableHighlight>
				</View>

				{/* マイグレーションボタン */}
				<View className="mb-3 bg-blue-50 border border-blue-200 rounded-md p-3">
					<Text className="text-sm text-blue-800 font-noto-regular mb-2">
						古いTodoが表示されない場合は、データ更新が必要です
					</Text>
					<TouchableHighlight
						onPress={handleMigration}
						disabled={isMigrating}
						activeOpacity={0.7}
						className={`rounded-md px-4 py-2 ${
							isMigrating ? "bg-gray-400" : "bg-blue-600"
						}`}
						underlayColor="#2563eb"
					>
						{isMigrating ? (
							<View className="flex-row items-center justify-center">
								<ActivityIndicator color="#fff" size="small" />
								<Text className="text-white font-noto-bold ml-2">
									更新中...
								</Text>
							</View>
						) : (
							<Text className="text-white font-noto-bold text-center">
								既存データを更新
							</Text>
						)}
					</TouchableHighlight>
				</View>

				<TodoForm onSave={handleSave} />
				<TodoTable refresh={refreshTrigger} isShared={false} />
			</View>
		</SafeAreaView>
	);
}
