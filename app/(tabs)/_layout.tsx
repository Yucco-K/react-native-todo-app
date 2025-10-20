import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { CreateOrganizationModal } from "@/components/CreateOrganizationModal";
import { DrawerMenu } from "@/components/DrawerMenu";
import { InvitationListModal } from "@/components/InvitationListModal";
import { JoinOrganizationModal } from "@/components/JoinOrganizationModal";
import { OrganizationSettingsModal } from "@/components/OrganizationSettingsModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { Organization } from "@/types/Organization";

export default function TabLayout() {
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [createOrgVisible, setCreateOrgVisible] = useState(false);
	const [joinOrgVisible, setJoinOrgVisible] = useState(false);
	const [invitationsVisible, setInvitationsVisible] = useState(false);
	const [settingsOrg, setSettingsOrg] = useState<Organization | null>(null);
	const { selectedOrganization } = useOrganization();

	const getHeaderTitle = () => {
		if (selectedOrganization) {
			return selectedOrganization.name;
		}
		return "My List";
	};

	const handleManageOrganization = (org: Organization) => {
		setSettingsOrg(org);
	};

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

			{/* 組織設定モーダル */}
			<OrganizationSettingsModal
				visible={settingsOrg !== null}
				organization={settingsOrg}
				onClose={() => setSettingsOrg(null)}
			/>
		</>
	);
}

