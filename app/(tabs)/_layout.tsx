import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	AppState,
	Modal,
	Platform,
	Pressable,
	StatusBar,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { CreateOrganizationModal } from "@/components/CreateOrganizationModal";
import { DrawerMenu } from "@/components/DrawerMenu";
import { InvitationListModal } from "@/components/InvitationListModal";
import { JoinOrganizationModal } from "@/components/JoinOrganizationModal";
import ReminderNotificationModal from "@/components/ReminderNotificationModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { deleteAccount } from "@/services/accountService";
import { getMyInvitations } from "@/services/organizationService";
import { getDueReminders, markReminderAsNotified } from "@/services/todoService";
import type { Organization } from "@/types/Organization";
import type { Todo } from "@/types/Todo";

export default function TabLayout() {
	const router = useRouter();
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [createOrgVisible, setCreateOrgVisible] = useState(false);
	const [joinOrgVisible, setJoinOrgVisible] = useState(false);
	const [invitationsVisible, setInvitationsVisible] = useState(false);
	const [remindersVisible, setRemindersVisible] = useState(false);
	const [dueReminders, setDueReminders] = useState<Todo[]>([]);
	const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [deletePasswordError, setDeletePasswordError] = useState("");
	const { selectedOrganization } = useOrganization();
	const { triggerRefresh } = useTodoRefresh();
	const appState = useRef(Platform.OS !== "web" ? AppState.currentState : "active");
	const hasCheckedInitialInvitations = useRef(false);
	const hasCheckedInitialReminders = useRef(false);

	const getHeaderTitle = () => {
		if (selectedOrganization) {
			return selectedOrganization.name;
		}
		return "My List";
	};

	const handleManageOrganization = (org: Organization) => {
		router.push({
			pathname: "/(tabs)/organization-settings",
			params: { id: org.id },
		});
	};

	const handleDeleteAccountRequest = () => {
		Alert.alert(
			"アカウント削除",
			"アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。\n\n本当に削除しますか？",
			[
				{ text: "キャンセル", style: "cancel" },
				{
					text: "削除する",
					style: "destructive",
					onPress: () => {
						setDeletePassword("");
						setDeletePasswordError("");
						setIsDeleteAccountModalVisible(true);
					},
				},
			],
		);
	};

	const handleDeleteAccount = async () => {
		if (!deletePassword) {
			setDeletePasswordError("パスワードを入力してください");
			return;
		}

		try {
			await deleteAccount(deletePassword);
			setIsDeleteAccountModalVisible(false);
			Toast.show({
				type: "success",
				text1: "アカウント削除完了",
				text2: "アカウントが削除されました",
			});
		} catch (error) {
			console.error("アカウント削除エラー:", error);
			const errorMessage =
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "auth/wrong-password"
					? "パスワードが正しくありません"
					: "アカウントの削除に失敗しました";
			setDeletePasswordError(errorMessage);
		}
	};

	// 未読招待をチェックして、あればモーダルを自動的に開く
	const checkForPendingInvitations = useCallback(async () => {
		try {
			const invitations = await getMyInvitations();
			if (invitations.length > 0) {
				console.log(
					"📬 未読招待があります:",
					invitations.length,
					"件 - モーダルを自動的に開きます",
				);
				setInvitationsVisible(true);
			}
		} catch (error) {
			console.error("招待チェックエラー:", error);
		}
	}, []);

	// リマインド時刻が来たTodoをチェックして、あればモーダルを開く
	const checkForDueReminders = useCallback(async () => {
		try {
			const reminders = await getDueReminders();
			if (reminders.length > 0) {
				console.log("⏰ リマインドが", reminders.length, "件あります - モーダルを自動的に開きます");
				setDueReminders(reminders);
				setRemindersVisible(true);

				// 表示したタイミングで即座に通知済みに更新
				const results = await Promise.allSettled(
					reminders.map((reminder) => markReminderAsNotified(reminder.id)),
				);
				let hasUpdate = false;
				results.forEach((result, index) => {
					if (result.status === "rejected") {
						console.error("リマインド通知済み更新エラー:", {
							todoId: reminders[index].id,
							error: result.reason,
						});
					} else {
						hasUpdate = true;
					}
				});

				if (hasUpdate) {
					triggerRefresh();
				}
			}
		} catch (error) {
			console.error("リマインドチェックエラー:", error);
		}
	}, [triggerRefresh]);

	// アプリ起動時に未読招待をチェック（初回のみ）
	useEffect(() => {
		if (!hasCheckedInitialInvitations.current) {
			hasCheckedInitialInvitations.current = true;
			console.log("🚀 アプリ起動: 未読招待をチェック中...");
			checkForPendingInvitations();
		}
	}, [checkForPendingInvitations]);

	// アプリ起動時にリマインドをチェック（初回のみ）
	useEffect(() => {
		if (!hasCheckedInitialReminders.current) {
			hasCheckedInitialReminders.current = true;
			console.log("🚀 アプリ起動: リマインドをチェック中...");
			checkForDueReminders();
		}
	}, [checkForDueReminders]);

	// アプリがバックグラウンドからフォアグラウンドに戻った時に未読招待とリマインドをチェック
	useEffect(() => {
		// AppStateはネイティブのみで動作（Web/SSRでは無効化）
		if (Platform.OS === "web") return;

		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (appState.current.match(/inactive|background/) && nextAppState === "active") {
				console.log("🔄 アプリがフォアグラウンドに戻りました: 未読招待とリマインドをチェック中...");
				checkForPendingInvitations();
				checkForDueReminders();
			}
			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, [checkForPendingInvitations, checkForDueReminders]);

	return (
		<>
			<StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
			<Stack
				screenOptions={{
					headerShown: true,
					headerStyle: {
						backgroundColor: "#3b82f6",
					},
					headerTintColor: "#fff",
					headerTitleStyle: {
						fontWeight: "bold",
						fontSize: 20,
					},
					headerLeft: () => (
						<TouchableOpacity onPress={() => setDrawerVisible(true)} style={{ marginLeft: 15 }}>
							<Ionicons name="menu" size={28} color="#fff" />
						</TouchableOpacity>
					),
					headerTitle: () => (
						<View
							style={{
								flex: 1,
								paddingHorizontal: 10,
								paddingVertical: 4,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Text
								style={{
									color: "#fff",
									fontSize: 18,
									fontWeight: "bold",
									textAlign: "center",
								}}
								numberOfLines={3}
							>
								{getHeaderTitle()}
							</Text>
						</View>
					),
				}}
			>
				<Stack.Screen name="mylist" />
				<Stack.Screen name="organization-settings" options={{ headerShown: false }} />
				<Stack.Screen name="reminder-settings" options={{ headerShown: false }} />
			</Stack>

			{/* ドロワーメニュー */}
			<DrawerMenu
				visible={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				onCreateOrganization={() => setCreateOrgVisible(true)}
				onJoinOrganization={() => setJoinOrgVisible(true)}
				onManageOrganization={handleManageOrganization}
				onViewInvitations={() => setInvitationsVisible(true)}
				onDeleteAccount={handleDeleteAccountRequest}
			/>

			{/* 組織作成モーダル */}
			<CreateOrganizationModal
				visible={createOrgVisible}
				onClose={() => setCreateOrgVisible(false)}
			/>

			{/* 組織参加モーダル */}
			<JoinOrganizationModal visible={joinOrgVisible} onClose={() => setJoinOrgVisible(false)} />

			{/* 招待一覧モーダル */}
			<InvitationListModal
				visible={invitationsVisible}
				onClose={() => setInvitationsVisible(false)}
			/>

			{/* リマインド通知モーダル */}
			<ReminderNotificationModal
				visible={remindersVisible}
				reminders={dueReminders}
				onClose={() => {
					setRemindersVisible(false);
					setDueReminders([]);
				}}
			/>

			{/* アカウント削除モーダル */}
			<Modal
				visible={isDeleteAccountModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setIsDeleteAccountModalVisible(false)}
			>
				<Pressable
					className="flex-1 bg-black/75 justify-center items-center"
					onPress={() => setIsDeleteAccountModalVisible(false)}
				>
					<Pressable
						className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
						onPress={(e) => e.stopPropagation()}
					>
						<Text className="font-noto-bold text-xl mb-4 text-gray-900">アカウント削除の確認</Text>

						<Text className="font-noto-regular text-base mb-4 text-gray-700">
							本人確認のため、パスワードを入力してください。
						</Text>

						<View className="mb-4">
							<TextInput
								className="border-2 border-gray-300 rounded-md px-3 py-3 font-noto-regular text-base"
								placeholder="パスワード"
								value={deletePassword}
								onChangeText={(text) => {
									setDeletePassword(text);
									setDeletePasswordError("");
								}}
								secureTextEntry
								autoCapitalize="none"
								autoComplete="password"
							/>
							{deletePasswordError ? (
								<Text className="text-red-500 text-base mt-1 font-noto-regular">
									{deletePasswordError}
								</Text>
							) : null}
						</View>

						<View className="flex-row justify-end gap-3">
							<TouchableOpacity
								className="px-6 py-3 rounded-md bg-gray-200"
								onPress={() => {
									setIsDeleteAccountModalVisible(false);
									setDeletePassword("");
									setDeletePasswordError("");
								}}
							>
								<Text className="font-noto-bold text-base text-gray-700">キャンセル</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="px-6 py-3 rounded-md bg-red-600"
								onPress={handleDeleteAccount}
							>
								<Text className="font-noto-bold text-base text-white">削除する</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
