import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
	Keyboard,
	Switch,
	Text,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AddTodoModal from "@/components/AddTodoModal";
import NicknameModal from "@/components/NicknameModal";
import ReminderHistoryModal from "@/components/ReminderHistoryModal";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { getReminderHistory, removeTodoReminder } from "@/services/todoService";
import { getNotificationEnabled, setNotificationEnabled } from "@/services/userService";
import type { Todo } from "@/types/Todo";

export default function MyListScreen() {
	const { user, nickname, logout, updateNickname } = useAuth();
	const { selectedOrganization } = useOrganization();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();
	const { isDark, toggleTheme } = useTheme();
	const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);
	const [isReminderHistoryVisible, setIsReminderHistoryVisible] = useState(false);
	const [reminderHistory, setReminderHistory] = useState<Todo[]>([]);
	const [notificationEnabled, setNotificationEnabledState] = useState(true);

	console.log("📱 MyListScreen: レンダリング", {
		selectedOrganization: selectedOrganization?.name || "My List",
		organizationId: selectedOrganization?.id || null,
	});

	// 通知設定を読み込み
	useEffect(() => {
		const loadNotificationSetting = async () => {
			const enabled = await getNotificationEnabled();
			setNotificationEnabledState(enabled);
		};
		loadNotificationSetting();
	}, []);

	// ログインしていない場合は何も表示しない
	if (!user) {
		return null;
	}

	const handleSave = () => {
		triggerRefresh();
	};

	const handleLogout = async () => {
		try {
			await logout();
			// Toast.show({
			// 	type: "success",
			// 	text1: "ログアウト",
			// 	text2: "ログアウトしました",
			// });
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "ログアウトに失敗しました",
			});
		}
	};

	const handleOpenReminderHistory = async () => {
		try {
			const history = await getReminderHistory();
			setReminderHistory(history);
			setIsReminderHistoryVisible(true);
		} catch (error) {
			console.error("リマインド履歴取得エラー:", error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "リマインド履歴の取得に失敗しました",
			});
		}
	};

	const handleDeleteReminder = async (todoId: string) => {
		try {
			await removeTodoReminder(todoId);
			// 履歴を再取得
			const history = await getReminderHistory();
			setReminderHistory(history);
			triggerRefresh(); // Todoリストも更新
		} catch (error) {
			console.error("リマインド削除エラー:", error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "リマインドの削除に失敗しました",
			});
		}
	};

	const handleToggleNotification = async (value: boolean) => {
		try {
			setNotificationEnabledState(value);
			await setNotificationEnabled(value);
		} catch (error) {
			console.error("通知設定エラー:", error);
			// エラー時は元に戻す
			setNotificationEnabledState(!value);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "通知設定の変更に失敗しました",
			});
		}
	};

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 px-4 pt-4">
					<View className="flex-row justify-between items-center mb-4">
						<View className="flex-1">
							{nickname ? (
								<TouchableOpacity
									onPress={() => setIsNicknameModalVisible(true)}
									className="flex-row items-center mt-1"
								>
									<Text
										className="text-lg font-noto-bold"
										style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
									>
										{nickname}さん
									</Text>
									<Ionicons
										name="create-outline"
										size={16}
										color={isDark ? "#60a5fa" : "#2563eb"}
										className="ml-1"
									/>
								</TouchableOpacity>
							) : (
								<>
									<TouchableOpacity
										onPress={() => setIsNicknameModalVisible(true)}
										className="flex-row items-center mt-1"
									>
										<Text
											className="text-base font-noto-regular"
											style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
										>
											ニックネームを設定
										</Text>
										<Ionicons
											name="add-circle-outline"
											size={16}
											color={isDark ? "#d1d5db" : "#6b7280"}
											className="ml-1"
										/>
									</TouchableOpacity>
									{user?.email && (
										<Text
											className="text-sm font-noto-regular mt-1"
											style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
										>
											{user.email}
										</Text>
									)}
								</>
							)}
						</View>
						<View className="flex-row items-center gap-2">
							{/* 通知ON/OFFトグル */}
							<View className="flex-row items-center">
								<Switch
									value={notificationEnabled}
									onValueChange={handleToggleNotification}
									trackColor={{
										false: isDark ? "#4b5563" : "#d1d5db",
										true: isDark ? "#3b82f6" : "#60a5fa",
									}}
									thumbColor={notificationEnabled ? "#ffffff" : "#f3f4f6"}
								/>
							</View>

							{/* リマインド履歴ボタン */}
							<TouchableOpacity
								onPress={handleOpenReminderHistory}
								className="rounded-full w-10 h-10 items-center justify-center"
								style={{
									backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(251, 191, 36, 0.2)",
								}}
								activeOpacity={0.7}
							>
								<Ionicons name="time" size={20} color={isDark ? "#fbbf24" : "#f59e0b"} />
							</TouchableOpacity>

							{/* ダークモード切り替えボタン */}
							<TouchableOpacity
								onPress={toggleTheme}
								className="rounded-full w-10 h-10 items-center justify-center"
								style={{
									backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(156, 163, 175, 0.2)",
								}}
								activeOpacity={0.7}
							>
								<Ionicons
									name={isDark ? "sunny" : "moon"}
									size={20}
									color={isDark ? "#fbbf24" : "#6b7280"}
								/>
							</TouchableOpacity>

							{/* ログアウトボタン */}
							<TouchableHighlight
								onPress={handleLogout}
								activeOpacity={0.7}
								className="bg-gray-500 rounded-md px-4 py-2"
								underlayColor="#6b7280"
							>
								<Text className="text-white font-noto-bold">ログアウト</Text>
							</TouchableHighlight>
						</View>
					</View>

					<TodoTable
						refresh={refreshTrigger}
						organizationId={selectedOrganization?.id || null}
						isDark={isDark}
					/>

					{/* Floating Action Button */}
					<TouchableOpacity
						onPress={() => setIsAddModalVisible(true)}
						className="absolute bottom-6 right-6 bg-blue-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
						activeOpacity={0.8}
					>
						<Ionicons name="add" size={32} color="white" />
					</TouchableOpacity>
				</View>
			</TouchableWithoutFeedback>

			<AddTodoModal
				visible={isAddModalVisible}
				onClose={() => setIsAddModalVisible(false)}
				onSave={handleSave}
				organizationId={selectedOrganization?.id || null}
			/>

			<NicknameModal
				visible={isNicknameModalVisible}
				currentNickname={nickname || ""}
				onClose={() => setIsNicknameModalVisible(false)}
				onSave={updateNickname}
			/>

			<ReminderHistoryModal
				visible={isReminderHistoryVisible}
				reminders={reminderHistory}
				onClose={() => setIsReminderHistoryVisible(false)}
				onDelete={handleDeleteReminder}
			/>
		</SafeAreaView>
	);
}
