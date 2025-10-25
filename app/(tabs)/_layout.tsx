import { CreateOrganizationModal } from "@/components/CreateOrganizationModal";
import { DrawerMenu } from "@/components/DrawerMenu";
import { InvitationListModal } from "@/components/InvitationListModal";
import { JoinOrganizationModal } from "@/components/JoinOrganizationModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getMyInvitations } from "@/services/organizationService";
import type { Organization } from "@/types/Organization";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Text, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
	const router = useRouter();
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [createOrgVisible, setCreateOrgVisible] = useState(false);
	const [joinOrgVisible, setJoinOrgVisible] = useState(false);
	const [invitationsVisible, setInvitationsVisible] = useState(false);
	const { selectedOrganization } = useOrganization();
	const appState = useRef(AppState.currentState);
	const hasCheckedInitialInvitations = useRef(false);

	const getHeaderTitle = () => {
		if (selectedOrganization) {
			return selectedOrganization.name;
		}
		return "My List";
	};

	const handleManageOrganization = (org: Organization) => {
		console.log("🔧 組織設定を開きます:", org.name, "id:", org.id);
		router.push({
			pathname: "/(tabs)/organization-settings",
			params: { id: org.id },
		});
		console.log("✅ 画面遷移を実行しました");
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

	// アプリ起動時に未読招待をチェック（初回のみ）
	useEffect(() => {
		if (!hasCheckedInitialInvitations.current) {
			hasCheckedInitialInvitations.current = true;
			console.log("🚀 アプリ起動: 未読招待をチェック中...");
			checkForPendingInvitations();
		}
	}, [checkForPendingInvitations]);

	// アプリがバックグラウンドからフォアグラウンドに戻った時に未読招待をチェック
	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === "active"
			) {
				console.log(
					"🔄 アプリがフォアグラウンドに戻りました: 未読招待をチェック中..."
				);
				checkForPendingInvitations();
			}
			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, [checkForPendingInvitations]);

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
		</>
	);
}
