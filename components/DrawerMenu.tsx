import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useOrganization } from "../contexts/OrganizationContext";
import type { Organization } from "../types/Organization";

type DrawerMenuProps = {
	visible: boolean;
	onClose: () => void;
	onCreateOrganization: () => void;
	onJoinOrganization: () => void;
	onManageOrganization: (org: Organization) => void;
	onViewInvitations: () => void;
};

export function DrawerMenu({
	visible,
	onClose,
	onCreateOrganization,
	onJoinOrganization,
	onManageOrganization,
	onViewInvitations,
}: DrawerMenuProps) {
	const { organizations, selectedOrganization, selectOrganization } =
		useOrganization();

	const handleSelectMyList = () => {
		console.log("📝 My Listを選択 → organizationId: null");
		selectOrganization(null);
		onClose();
	};

	const handleSelectOrganization = (org: Organization) => {
		console.log("📝 グループを選択:", org.name, "→ organizationId:", org.id);
		selectOrganization(org);
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/50" onPress={onClose}>
				<Pressable
					className="w-4/5 h-full bg-white"
					onPress={(e) => e.stopPropagation()}
				>
					<View className="flex-1">
						{/* ヘッダー */}
						<View className="bg-blue-600 p-6 pt-16">
							<Text className="text-white text-2xl font-noto-bold">
								グループ設定
							</Text>
						</View>

						<ScrollView className="flex-1 p-4">
							{/* MyList */}
							<TouchableOpacity
								className={`flex-row items-center p-4 rounded-lg mb-2 ${
									selectedOrganization === null ? "bg-blue-100" : "bg-gray-50"
								}`}
								onPress={handleSelectMyList}
							>
								<Ionicons
									name="person"
									size={24}
									color={selectedOrganization === null ? "#2563eb" : "#6b7280"}
								/>
								<Text
									className={`ml-3 text-lg font-noto-regular ${
										selectedOrganization === null
											? "text-blue-600"
											: "text-gray-700"
									}`}
								>
									My List
								</Text>
							</TouchableOpacity>

							{/* グループ一覧 */}
							<View className="mt-4">
								<Text className="text-gray-500 text-sm font-noto-bold mb-2 px-2">
									所属グループ
								</Text>

								{organizations.length === 0 ? (
									<Text className="text-gray-400 text-sm font-noto-regular px-2 py-4">
										所属しているグループがありません
									</Text>
								) : (
									organizations.map((org) => (
										<View key={org.id} className="mb-2">
											<TouchableOpacity
												className={`flex-row items-center p-4 rounded-lg ${
													selectedOrganization?.id === org.id
														? "bg-blue-100"
														: "bg-gray-50"
												}`}
												onPress={() => handleSelectOrganization(org)}
											>
												<Ionicons
													name="people"
													size={24}
													color={
														selectedOrganization?.id === org.id
															? "#2563eb"
															: "#6b7280"
													}
												/>
												<Text
													className={`ml-3 text-lg font-noto-regular flex-1 ${
														selectedOrganization?.id === org.id
															? "text-blue-600"
															: "text-gray-700"
													}`}
												>
													{org.name}
												</Text>
												<TouchableOpacity
													onPress={() => {
														onManageOrganization(org);
														onClose();
													}}
												>
													<Ionicons
														name="settings-outline"
														size={20}
														color="#6b7280"
													/>
												</TouchableOpacity>
											</TouchableOpacity>
										</View>
									))
								)}
							</View>

							{/* アクションボタン */}
							<View className="mt-6 space-y-2">
								<TouchableOpacity
									className="flex-row items-center p-4 bg-green-50 rounded-lg border border-green-300"
									onPress={() => {
										onCreateOrganization();
										onClose();
									}}
								>
									<Ionicons name="add-circle" size={24} color="#22c55e" />
									<Text className="ml-3 text-green-700 text-lg font-noto-bold">
										グループを作成
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className="flex-row items-center p-4 bg-blue-50 rounded-lg border border-blue-300"
									onPress={() => {
										onJoinOrganization();
										onClose();
									}}
								>
									<Ionicons name="enter" size={24} color="#3b82f6" />
									<Text className="ml-3 text-blue-700 text-lg font-noto-bold">
										グループに参加
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className="flex-row items-center p-4 bg-gray-50 rounded-lg border border-gray-300"
									onPress={() => {
										onViewInvitations();
										onClose();
									}}
								>
									<Ionicons name="mail" size={24} color="#6b7280" />
									<Text className="ml-3 text-gray-700 text-lg font-noto-bold">
										招待一覧
									</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
