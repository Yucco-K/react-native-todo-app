import { Ionicons } from "@expo/vector-icons";
import {
	type GestureResponderEvent,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useOrganization } from "../contexts/OrganizationContext";
import { useTheme } from "../contexts/ThemeContext";
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
	const { isDark } = useTheme();

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
			<Pressable
				className="flex-1"
				style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
				onPress={onClose}
			>
				<Pressable
					className="w-4/5 h-full"
					style={{
						backgroundColor: isDark
							? "rgba(31, 41, 55, 0.98)"
							: "rgba(255, 255, 255, 0.95)",
						shadowColor: "#000",
						shadowOffset: { width: 2, height: 0 },
						shadowOpacity: 0.3,
						shadowRadius: 10,
						elevation: 10,
					}}
					onPress={(e: GestureResponderEvent) => e.stopPropagation()}
				>
					<View className="flex-1">
						{/* ヘッダー */}
						<View className="p-6 pt-16">
							<Text
								className="text-2xl font-noto-bold"
								style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
							>
								グループ設定
							</Text>
						</View>

						<ScrollView className="flex-1 p-4">
							{/* MyList */}
							<TouchableOpacity
								className="flex-row items-center p-4 rounded-lg mb-2"
								style={{
									backgroundColor:
										selectedOrganization === null
											? isDark
												? "rgba(59, 130, 246, 0.3)"
												: "#dbeafe"
											: isDark
												? "rgba(75, 85, 99, 0.5)"
												: "#f9fafb",
								}}
								onPress={handleSelectMyList}
							>
								<Ionicons
									name="person"
									size={24}
									color={
										selectedOrganization === null
											? isDark
												? "#60a5fa"
												: "#2563eb"
											: isDark
												? "#9ca3af"
												: "#6b7280"
									}
								/>
								<Text
									className="ml-3 text-lg font-noto-regular"
									style={{
										color:
											selectedOrganization === null
												? isDark
													? "#60a5fa"
													: "#2563eb"
												: isDark
													? "#d1d5db"
													: "#374151",
									}}
								>
									My List
								</Text>
							</TouchableOpacity>

							{/* グループ一覧 */}
							<View className="mt-4">
								<Text
									className="text-sm font-noto-bold mb-2 px-2"
									style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
								>
									所属グループ
								</Text>

								{organizations.length === 0 ? (
									<Text
										className="text-sm font-noto-regular px-2 py-4"
										style={{ color: isDark ? "#d1d5db" : "#9ca3af" }}
									>
										所属しているグループがありません
									</Text>
								) : (
									organizations.map((org) => (
										<View key={org.id} className="mb-2">
											<TouchableOpacity
												className="flex-row items-center p-4 rounded-lg"
												style={{
													backgroundColor:
														selectedOrganization?.id === org.id
															? isDark
																? "rgba(59, 130, 246, 0.3)"
																: "#dbeafe"
															: isDark
																? "rgba(75, 85, 99, 0.5)"
																: "#f9fafb",
												}}
												onPress={() => handleSelectOrganization(org)}
											>
												<Ionicons
													name="people"
													size={24}
													color={
														selectedOrganization?.id === org.id
															? isDark
																? "#60a5fa"
																: "#2563eb"
															: isDark
																? "#9ca3af"
																: "#6b7280"
													}
												/>
												<Text
													className="ml-3 text-lg font-noto-regular flex-1"
													style={{
														color:
															selectedOrganization?.id === org.id
																? isDark
																	? "#60a5fa"
																	: "#2563eb"
																: isDark
																	? "#d1d5db"
																	: "#374151",
														flexShrink: 1,
														flexWrap: "wrap",
													}}
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
														color={isDark ? "#d1d5db" : "#6b7280"}
													/>
												</TouchableOpacity>
											</TouchableOpacity>
										</View>
									))
								)}
							</View>

							{/* アクションボタン */}
							<View className="mt-6">
								<TouchableOpacity
									className="flex-row items-center p-4 rounded-lg border mb-4"
									style={{
										backgroundColor: isDark
											? "rgba(34, 197, 94, 0.2)"
											: "#f0fdf4",
										borderColor: isDark ? "rgba(34, 197, 94, 0.4)" : "#86efac",
									}}
									onPress={() => {
										onCreateOrganization();
										onClose();
									}}
								>
									<Ionicons
										name="add-circle"
										size={24}
										color={isDark ? "#4ade80" : "#22c55e"}
									/>
									<Text
										className="ml-3 text-lg font-noto-bold"
										style={{ color: isDark ? "#4ade80" : "#15803d" }}
									>
										グループを作成
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className="flex-row items-center p-4 rounded-lg border mb-4"
									style={{
										backgroundColor: isDark
											? "rgba(59, 130, 246, 0.2)"
											: "#eff6ff",
										borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "#93c5fd",
									}}
									onPress={() => {
										onJoinOrganization();
										onClose();
									}}
								>
									<Ionicons
										name="enter"
										size={24}
										color={isDark ? "#60a5fa" : "#3b82f6"}
									/>
									<Text
										className="ml-3 text-lg font-noto-bold"
										style={{ color: isDark ? "#60a5fa" : "#1d4ed8" }}
									>
										グループに参加
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className="flex-row items-center p-4 rounded-lg border"
									style={{
										backgroundColor: isDark
											? "rgba(107, 114, 128, 0.3)"
											: "#f9fafb",
										borderColor: isDark
											? "rgba(156, 163, 175, 0.4)"
											: "#d1d5db",
									}}
									onPress={() => {
										onViewInvitations();
										onClose();
									}}
								>
									<Ionicons
										name="mail"
										size={24}
										color={isDark ? "#d1d5db" : "#6b7280"}
									/>
									<Text
										className="ml-3 text-lg font-noto-bold"
										style={{ color: isDark ? "#d1d5db" : "#374151" }}
									>
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
