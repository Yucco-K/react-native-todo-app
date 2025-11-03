import AddTodoModal from "@/components/AddTodoModal";
import NicknameModal from "@/components/NicknameModal";
import NotificationHistoryModal from "@/components/NotificationHistoryModal";
import ReminderHistoryModal from "@/components/ReminderHistoryModal";
import TodoTable from "@/components/TodoTable";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import {
	deleteNotificationHistory,
	getNotificationHistory,
	type NotificationHistory,
} from "@/services/notificationHistoryService";
import {
	registerForPushNotificationsAsync,
	savePushToken,
} from "@/services/notificationService";
import { getOrganizationMembers } from "@/services/organizationService";
import { getReminderHistory, removeTodoReminder } from "@/services/todoService";
import {
	getNotificationEnabled,
	getUserAvatarUrl,
	getUserAvatarUrlById,
	saveUserAvatarUrl,
	setNotificationEnabled,
} from "@/services/userService";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
	AppState,
	type AppStateStatus,
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

export default function MyListScreen() {
	const { user, nickname, logout, updateNickname } = useAuth();
	const { selectedOrganization } = useOrganization();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();
	const { isDark, toggleTheme } = useTheme();
	const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);
	const [isReminderHistoryVisible, setIsReminderHistoryVisible] =
		useState(false);
	const [isNotificationHistoryVisible, setIsNotificationHistoryVisible] =
		useState(false);
	const [reminderHistory, setReminderHistory] = useState<Todo[]>([]);
	const [notificationHistory, setNotificationHistory] = useState<
		NotificationHistory[]
	>([]);
	const [notificationEnabled, setNotificationEnabledState] = useState(true);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [memberAvatars, setMemberAvatars] = useState<
		Array<{ userId: string; avatarUrl: string | null }>
	>([]);

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

	// ユーザーアバターを読み込み
	useEffect(() => {
		const loadAvatar = async () => {
			const url = await getUserAvatarUrl();
			setAvatarUrl(url);
		};
		loadAvatar();
	}, []);

	// グループメンバーのアバターを読み込み
	useEffect(() => {
		const loadMemberAvatars = async () => {
			if (!selectedOrganization) {
				setMemberAvatars([]);
				return;
			}

			try {
				console.log(
					"👥 グループメンバーのアバターを読み込み中...",
					selectedOrganization.id
				);
				const members = await getOrganizationMembers(selectedOrganization.id);
				console.log("👥 取得したメンバー:", members);

				const avatars = await Promise.all(
					members.map(async (member) => {
						const avatarUrl = await getUserAvatarUrlById(member.userId);
						console.log(`👤 メンバー ${member.userId} のアバター:`, avatarUrl);
						return {
							userId: member.userId,
							avatarUrl,
						};
					})
				);
				console.log("👥 最終的なアバター配列:", avatars);
				setMemberAvatars(avatars);
			} catch (error) {
				console.error("メンバーアバター読み込みエラー:", error);
				setMemberAvatars([]);
			}
		};
		loadMemberAvatars();
	}, [selectedOrganization]);

	// アプリがフォアグラウンドに戻った時にリストを更新（remindNotifiedの更新を反映）
	useEffect(() => {
		const subscription = AppState.addEventListener(
			"change",
			(nextAppState: AppStateStatus) => {
				if (nextAppState === "active") {
					console.log(
						"📱 アプリがフォアグラウンドに戻りました → Todoリストを更新"
					);
					triggerRefresh();
				}
			}
		);

		return () => {
			subscription.remove();
		};
	}, [triggerRefresh]);

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

	const handleOpenNotificationHistory = async () => {
		try {
			if (!user?.uid) return;
			const history = await getNotificationHistory(user.uid);
			setNotificationHistory(history);
			setIsNotificationHistoryVisible(true);
		} catch (error) {
			console.error("通知履歴取得エラー:", error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "通知履歴の取得に失敗しました",
			});
		}
	};

	const handleDeleteNotification = async (notificationId: string) => {
		try {
			await deleteNotificationHistory(notificationId);
			// 履歴を再取得
			if (user?.uid) {
				const history = await getNotificationHistory(user.uid);
				setNotificationHistory(history);
			}
		} catch (error) {
			console.error("通知削除エラー:", error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "通知の削除に失敗しました",
			});
		}
	};

	const handleToggleNotification = async (value: boolean) => {
		try {
			console.log(`🔔 通知設定変更開始: ${value ? "ON" : "OFF"}`);
			setNotificationEnabledState(value);
			await setNotificationEnabled(value);

			// 通知をONにした場合、プッシュトークンを即座に再登録
			if (value) {
				console.log("📱 プッシュトークン再登録を開始...");
				try {
					const token = await registerForPushNotificationsAsync();
					console.log("📱 取得したトークン:", token ? "存在" : "null");
					if (token) {
						await savePushToken(token);
						console.log("✅ プッシュトークンを再登録しました:", token);
					} else {
						console.error("⚠️ プッシュトークンの取得に失敗しました");
						throw new Error("プッシュトークンの取得に失敗しました");
					}
				} catch (tokenError) {
					console.error("❌ プッシュトークン再登録エラー:", tokenError);
					// トークン再登録に失敗した場合は通知設定を元に戻す
					await setNotificationEnabled(false);
					setNotificationEnabledState(false);
					throw new Error("プッシュトークンの再登録に失敗しました");
				}
			}

			console.log(`✅ 通知設定変更完了: ${value ? "ON" : "OFF"}`);
			Toast.show({
				type: "success",
				text1: "設定変更",
				text2: value
					? "通知をONにしました"
					: "通知をOFFにしました（プッシュトークンも削除されました）",
			});
		} catch (error) {
			console.error("❌ 通知設定エラー:", error);
			// エラー時は元に戻す
			setNotificationEnabledState(!value);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2:
					error instanceof Error
						? error.message
						: "通知設定の変更に失敗しました",
			});
		}
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
		>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 px-4" style={{ marginTop: -8 }}>
					{/* ユーザー名表示エリア */}
					<View className="mb-2">
						{/* グループの場合はメンバーアバター表示 */}
						{selectedOrganization && memberAvatars.length > 0 && (
							<View
								className="flex-row justify-end mb-2"
								style={{ marginRight: -4 }}
							>
								{memberAvatars.slice(0, 5).map((member, index) => (
									<View
										key={member.userId}
										style={{
											marginLeft: index > 0 ? -8 : 0,
											zIndex: memberAvatars.length - index,
										}}
									>
										<Avatar avatarUrl={member.avatarUrl} size={32} />
									</View>
								))}
								{memberAvatars.length > 5 && (
									<View
										style={{
											marginLeft: -8,
											zIndex: 0,
										}}
									>
										<View
											style={{
												width: 32,
												height: 32,
												borderRadius: 16,
												backgroundColor: isDark ? "#374151" : "#e5e7eb",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<Text
												style={{
													color: isDark ? "#d1d5db" : "#6b7280",
													fontSize: 12,
													fontWeight: "bold",
												}}
											>
												+{memberAvatars.length - 5}
											</Text>
										</View>
									</View>
								)}
							</View>
						)}

						{nickname ? (
							<View className="flex-row items-center">
								<Avatar
									avatarUrl={avatarUrl}
									size={40}
									style={{ marginRight: 12 }}
								/>
								<TouchableOpacity
									onPress={() => setIsNicknameModalVisible(true)}
									className="flex-row items-center flex-1"
								>
									<Text
										className="text-lg font-noto-bold"
										style={{
											color: isDark ? "#60a5fa" : "#2563eb",
											flexShrink: 1,
										}}
										numberOfLines={2}
									>
										{nickname}さん
									</Text>
									<Ionicons
										name="create-outline"
										size={24}
										color={isDark ? "#60a5fa" : "#2563eb"}
										style={{ marginLeft: 8 }}
									/>
								</TouchableOpacity>
							</View>
						) : (
							<View className="flex-row items-center">
								<Avatar
									avatarUrl={avatarUrl}
									size={40}
									style={{ marginRight: 12 }}
								/>
								<View className="flex-1">
									<TouchableOpacity
										onPress={() => setIsNicknameModalVisible(true)}
										className="flex-row items-center"
									>
										<Text
											className="text-base font-noto-regular"
											style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
										>
											ニックネームを設定
										</Text>
										<Ionicons
											name="add-circle-outline"
											size={24}
											color={isDark ? "#d1d5db" : "#6b7280"}
											style={{ marginLeft: 8 }}
										/>
									</TouchableOpacity>
									{user?.email && (
										<Text
											className="text-sm font-noto-regular mt-1"
											style={{
												color: isDark ? "#d1d5db" : "#6b7280",
												flexShrink: 1,
											}}
											numberOfLines={2}
										>
											{user.email}
										</Text>
									)}
								</View>
							</View>
						)}
					</View>

					{/* アイコン・ボタンエリア */}
					<View className="flex-row justify-between items-center mb-4">
						<View className="flex-1" />
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

							{/* 通知履歴ボタン */}
							<TouchableOpacity
								onPress={handleOpenNotificationHistory}
								className="rounded-full w-10 h-10 items-center justify-center"
								style={{
									backgroundColor: isDark
										? "rgba(59, 130, 246, 0.2)"
										: "rgba(96, 165, 250, 0.2)",
								}}
								activeOpacity={0.7}
							>
								<Ionicons
									name="notifications"
									size={20}
									color={isDark ? "#60a5fa" : "#3b82f6"}
								/>
							</TouchableOpacity>

							{/* リマインド履歴ボタン */}
							<TouchableOpacity
								onPress={handleOpenReminderHistory}
								className="rounded-full w-10 h-10 items-center justify-center"
								style={{
									backgroundColor: isDark
										? "rgba(245, 158, 11, 0.2)"
										: "rgba(251, 191, 36, 0.2)",
								}}
								activeOpacity={0.7}
							>
								<Ionicons
									name="time"
									size={20}
									color={isDark ? "#fbbf24" : "#f59e0b"}
								/>
							</TouchableOpacity>

							{/* ダークモード切り替えボタン */}
							<TouchableOpacity
								onPress={toggleTheme}
								className="rounded-full w-10 h-10 items-center justify-center"
								style={{
									backgroundColor: isDark
										? "rgba(59, 130, 246, 0.2)"
										: "rgba(156, 163, 175, 0.2)",
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
				currentAvatarUrl={avatarUrl}
				onClose={() => setIsNicknameModalVisible(false)}
				onSave={async (newNickname, newAvatarUrl) => {
					await updateNickname(newNickname);
					await saveUserAvatarUrl(newAvatarUrl || "");
					setAvatarUrl(newAvatarUrl);
				}}
			/>

			<NotificationHistoryModal
				visible={isNotificationHistoryVisible}
				notifications={notificationHistory}
				onClose={() => setIsNotificationHistoryVisible(false)}
				onDelete={handleDeleteNotification}
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
