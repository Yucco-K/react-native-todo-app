import { CreateOrganizationModal } from "@/components/CreateOrganizationModal";
import { DrawerMenu } from "@/components/DrawerMenu";
import { InvitationListModal } from "@/components/InvitationListModal";
import { JoinOrganizationModal } from "@/components/JoinOrganizationModal";
import ReminderNotificationModal from "@/components/ReminderNotificationModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { notifyReminder } from "@/services/notificationService";
import { getMyInvitations } from "@/services/organizationService";
import {
	getDueReminders,
	markReminderAsNotified,
} from "@/services/todoService";
import type { Organization } from "@/types/Organization";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, Text, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
	const router = useRouter();
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [createOrgVisible, setCreateOrgVisible] = useState(false);
	const [joinOrgVisible, setJoinOrgVisible] = useState(false);
	const [invitationsVisible, setInvitationsVisible] = useState(false);
	const [remindersVisible, setRemindersVisible] = useState(false);
	const [dueReminders, setDueReminders] = useState<Todo[]>([]);
	const { selectedOrganization } = useOrganization();
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

	// 未読招待をチェックして、あればモーダルを自動的に開く
	const checkForPendingInvitations = useCallback(async () => {
		try {
			const invitations = await getMyInvitations();
			if (invitations.length > 0) {
				console.log(
					"📬 未読招待があります:",
					invitations.length,
					"件 - モーダルを自動的に開きます"
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
				console.log(
					"⏰ リマインドが",
					reminders.length,
					"件あります - モーダルを自動的に開きます"
				);
				setDueReminders(reminders);
				setRemindersVisible(true);

				// プッシュ通知を送信し、通知済みフラグを更新
				for (const reminder of reminders) {
					try {
						await notifyReminder({
							id: reminder.id,
							title: reminder.title,
							content: reminder.content,
							organizationId: reminder.organizationId,
						});
						await markReminderAsNotified(reminder.id);
					} catch (error) {
						console.error("リマインド通知エラー:", error);
					}
				}
			}
		} catch (error) {
			console.error("リマインドチェックエラー:", error);
		}
	}, []);

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
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === "active"
			) {
				console.log(
					"🔄 アプリがフォアグラウンドに戻りました: 未読招待とリマインドをチェック中..."
				);
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
						<TouchableOpacity
							onPress={() => setDrawerVisible(true)}
							style={{ marginLeft: 15 }}
						>
							<Ionicons name="menu" size={28} color="#fff" />
						</TouchableOpacity>
					),
					headerTitle: () => (
						<View>
							<Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
								{getHeaderTitle()}
							</Text>
						</View>
					),
				}}
			>
				<Stack.Screen name="mylist" />
				<Stack.Screen
					name="organization-settings"
					options={{ headerShown: false }}
				/>
			</Stack>

			{/* ドロワーメニュー */}
			<DrawerMenu
				visible={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				onCreateOrganization={() => setCreateOrgVisible(true)}
				onJoinOrganization={() => setJoinOrgVisible(true)}
				onManageOrganization={handleManageOrganization}
				onViewInvitations={() => setInvitationsVisible(true)}
			/>

			{/* 組織作成モーダル */}
			<CreateOrganizationModal
				visible={createOrgVisible}
				onClose={() => setCreateOrgVisible(false)}
			/>

			{/* 組織参加モーダル */}
			<JoinOrganizationModal
				visible={joinOrgVisible}
				onClose={() => setJoinOrgVisible(false)}
			/>

			{/* 招待一覧モーダル */}
			<InvitationListModal
				visible={invitationsVisible}
				onClose={() => setInvitationsVisible(false)}
			/>

			{/* リマインド通知モーダル */}
			<ReminderNotificationModal
				visible={remindersVisible}
				reminders={dueReminders}
				onClose={() => setRemindersVisible(false)}
			/>
		</>
	);
}
