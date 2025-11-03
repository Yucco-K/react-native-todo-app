import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { auth } from "../../config/firebase";
import { useOrganization } from "../../contexts/OrganizationContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
	getCurrentUserDisplayName,
	notifyInvitation,
} from "../../services/notificationService";
import {
	deleteOrganization,
	getOrganizationMembers,
	inviteByEmail,
	leaveOrganization,
	removeMember,
	updateOrganizationName,
} from "../../services/organizationService";

export default function OrganizationSettingsScreen() {
	const params = useLocalSearchParams();
	const router = useRouter();
	const { organizations, refreshOrganizations, selectOrganization } =
		useOrganization();
	const { isDark } = useTheme();

	const [members, setMembers] = useState<
		Array<{ userId: string; email: string; nickname?: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [isInviting, setIsInviting] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
	const [isEditingName, setIsEditingName] = useState(false);
	const [newName, setNewName] = useState("");
	const [editNameError, setEditNameError] = useState<string | null>(null);

	// URLパラメータから組織IDを取得
	const organizationId = params.id as string;
	const organization = organizations.find((org) => org.id === organizationId);

	const isOwner = organization?.ownerId === auth.currentUser?.uid;

	const fetchMembers = useCallback(async () => {
		if (!organization) return;

		setIsLoading(true);
		try {
			const memberList = await getOrganizationMembers(organization.id);
			setMembers(memberList);
		} catch (error) {
			console.error("Error fetching members:", error);
			Toast.show({
				type: "error",
				text1: "取得失敗",
				text2: "メンバー一覧の取得に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	}, [organization]);

	useEffect(() => {
		if (organization) {
			fetchMembers();
		}
	}, [organization, fetchMembers]);

	const handleCopyInviteCode = async () => {
		if (!organization) return;

		await Clipboard.setStringAsync(organization.inviteCode);
	};

	const handleInviteByEmail = async () => {
		if (!organization) return;

		setInviteError(null);
		setInviteSuccess(null);

		if (!inviteEmail.trim()) {
			setInviteError("メールアドレスを入力してください");
			return;
		}

		setIsInviting(true);
		try {
			const invitedUserId = await inviteByEmail(
				organization.id,
				inviteEmail.trim()
			);

			const inviterName = await getCurrentUserDisplayName();
			await notifyInvitation(invitedUserId, organization.name, inviterName);

			setInviteSuccess(`${inviteEmail} に招待を送信しました`);
			setInviteEmail("");
		} catch (error) {
			let errorMessage = "招待の送信に失敗しました";
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				typeof error.message === "string"
			) {
				if (error.message.includes("見つかりません")) {
					errorMessage =
						"このメールアドレスはまだ登録されていません。招待コードを共有して、先にアプリに登録してもらってください。";
				} else if (error.message.includes("既にメンバー")) {
					errorMessage = "このユーザーは既にグループのメンバーです";
				} else if (error.message.includes("既に招待")) {
					errorMessage = "このユーザーには既に招待を送信しています";
				} else if (error.message.includes("権限がありません")) {
					errorMessage = "招待する権限がありません";
				} else {
					errorMessage = error.message;
				}
			}

			setInviteError(errorMessage);
		} finally {
			setIsInviting(false);
		}
	};

	const handleRemoveMember = (member: {
		userId: string;
		email: string;
		nickname?: string;
	}) => {
		if (!organization) return;

		Alert.alert(
			"メンバー削除",
			`${member.nickname || member.email} を削除しますか？`,
			[
				{ text: "キャンセル", style: "cancel" },
				{
					text: "削除",
					style: "destructive",
					onPress: async () => {
						try {
							await removeMember(organization.id, member.userId);
							await fetchMembers();
						} catch (error) {
							console.error("Error removing member:", error);
							Toast.show({
								type: "error",
								text1: "削除失敗",
								text2: "メンバーの削除に失敗しました",
							});
						}
					},
				},
			]
		);
	};

	const handleLeaveOrganization = () => {
		if (!organization) return;

		Alert.alert(
			"グループから退出",
			`「${organization.name}」から退出しますか？`,
			[
				{ text: "キャンセル", style: "cancel" },
				{
					text: "退出",
					style: "destructive",
					onPress: async () => {
						try {
							await leaveOrganization(organization.id);
							await refreshOrganizations();
							selectOrganization(null);

							router.back();
						} catch (error) {
							console.error("Error leaving organization:", error);
							const errorMessage =
								error &&
								typeof error === "object" &&
								"message" in error &&
								typeof error.message === "string"
									? error.message
									: "グループからの退出に失敗しました";
							Toast.show({
								type: "error",
								text1: "退出失敗",
								text2: errorMessage,
							});
						}
					},
				},
			]
		);
	};

	const handleDeleteOrganization = () => {
		if (!organization) return;

		Alert.alert(
			"グループを削除",
			`「${organization.name}」を削除しますか？この操作は取り消せません。`,
			[
				{ text: "キャンセル", style: "cancel" },
				{
					text: "削除",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteOrganization(organization.id);
							await refreshOrganizations();
							selectOrganization(null);

							router.back();
						} catch (error) {
							console.error("Error deleting organization:", error);
							Toast.show({
								type: "error",
								text1: "削除失敗",
								text2: "グループの削除に失敗しました",
							});
						}
					},
				},
			]
		);
	};

	// 組織名を更新
	const handleUpdateName = async () => {
		setEditNameError(null);
		const trimmedName = newName.trim();
		if (!trimmedName) {
			setEditNameError("グループ名を入力してください");
			return;
		}
		if (trimmedName.length > 30) {
			setEditNameError("グループ名は30文字以内で入力してください");
			return;
		}

		try {
			await updateOrganizationName(organizationId, trimmedName);
			await refreshOrganizations();
			setIsEditingName(false);
			setNewName("");
			setEditNameError(null);
			Toast.show({
				type: "success",
				text1: "更新成功",
				text2: "グループ名を更新しました",
			});
		} catch (error) {
			console.error("Error updating organization name:", error);
			setEditNameError("グループ名の更新に失敗しました");
		}
	};

	if (!organization) {
		return (
			<View
				className="flex-1 justify-center items-center"
				style={{ backgroundColor: isDark ? "#111827" : "#ffffff" }}
			>
				<Text
					className="text-lg font-noto-regular"
					style={{ color: isDark ? "#d1d5db" : "#374151" }}
				>
					組織が見つかりません
				</Text>
				<TouchableOpacity
					className="mt-4 px-6 py-3 bg-blue-600 rounded-md"
					onPress={() => router.back()}
				>
					<Text className="text-white font-noto-bold text-lg">戻る</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View
			className="flex-1"
			style={{ backgroundColor: isDark ? "#111827" : "#f9fafb" }}
		>
			{/* ヘッダー */}
			<View
				className="px-6 pt-16 pb-4"
				style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
			>
				<View className="flex-row items-center">
					<TouchableOpacity onPress={() => router.back()} className="mr-4">
						<Ionicons
							name="arrow-back"
							size={24}
							color={isDark ? "#60a5fa" : "#2563eb"}
						/>
					</TouchableOpacity>
					{isOwner ? (
						<TouchableOpacity
							className="flex-1"
							onPress={() => {
								setNewName(organization.name);
								setIsEditingName(true);
							}}
						>
							<View className="flex-row items-center">
								<Text
									className="text-2xl font-noto-bold flex-1"
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
									}}
									numberOfLines={3}
								>
									{organization.name}
								</Text>
								<Ionicons
									name="create-outline"
									size={24}
									color={isDark ? "#60a5fa" : "#2563eb"}
									style={{ marginLeft: 8 }}
								/>
							</View>
							<Text
								className="text-sm font-noto-regular mt-1"
								style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
							>
								タップして編集
							</Text>
						</TouchableOpacity>
					) : (
						<View className="flex-1">
							<Text
								className="text-2xl font-noto-bold"
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
								numberOfLines={3}
							>
								{organization.name}
							</Text>
						</View>
					)}
				</View>
			</View>

			<ScrollView className="flex-1 px-6 py-4">
				{/* 招待コード */}
				<View className="mb-6">
					<Text
						className="font-noto-bold text-lg mb-2"
						style={{ color: isDark ? "#d1d5db" : "#374151" }}
					>
						招待コード
					</Text>
					<View className="flex-row items-center">
						<Text
							className="flex-1 text-2xl font-mono font-bold"
							style={{ color: isDark ? "#d1d5db" : "#2563eb" }}
						>
							{organization.inviteCode}
						</Text>
						<TouchableOpacity
							className="p-2 bg-blue-100 rounded-md"
							onPress={handleCopyInviteCode}
						>
							<Ionicons name="copy-outline" size={24} color="#2563eb" />
						</TouchableOpacity>
					</View>
					<Text className="text-gray-500 text-sm font-noto-regular mt-2">
						このコードを共有して招待できます
					</Text>
				</View>

				{/* メールで招待 */}
				{isOwner && (
					<View className="mb-6">
						<Text
							className="font-noto-bold text-lg mb-2"
							style={{ color: isDark ? "#d1d5db" : "#374151" }}
						>
							メンバーを招待
						</Text>
						<Text
							className="font-noto-regular text-sm mb-2"
							style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
						>
							登録済みユーザーのメールアドレスを入力してください。プッシュ通知で招待が届きます。
						</Text>
						<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
							<View>
								<TextInput
									className="border-2 border-gray-300 rounded-md text-lg mb-2"
									style={{
										fontFamily: "System",
										lineHeight: undefined,
										paddingVertical: 12,
										paddingHorizontal: 12,
										fontSize: 16,
										color: isDark ? "#ffffff" : "#000000",
										backgroundColor: isDark ? "#374151" : "#ffffff",
									}}
									placeholder="メールアドレス"
									placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
									value={inviteEmail}
									onChangeText={(text: string) => {
										setInviteEmail(text);
										setInviteError(null);
										setInviteSuccess(null);
									}}
									keyboardType="email-address"
									autoCapitalize="none"
								/>
							</View>
						</TouchableWithoutFeedback>

						{inviteError && (
							<View className="mb-3 p-3 bg-red-50 rounded-md border border-red-200">
								<Text className="text-red-700 font-noto-regular text-sm">
									{inviteError}
								</Text>
							</View>
						)}

						{inviteSuccess && (
							<View className="mb-3 p-3 bg-green-50 rounded-md border border-green-200">
								<Text className="text-green-700 font-noto-regular text-sm">
									{inviteSuccess}
								</Text>
							</View>
						)}

						<TouchableOpacity
							className={`px-4 py-3 rounded-md ${isInviting ? "bg-blue-300" : "bg-blue-600"}`}
							onPress={handleInviteByEmail}
							disabled={isInviting}
						>
							<Text className="text-white text-center text-lg font-noto-bold">
								{isInviting ? "送信中..." : "招待を送信"}
							</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* メンバー一覧 */}
				<View className="mb-6">
					<Text
						className="font-noto-bold text-lg mb-2"
						style={{ color: isDark ? "#d1d5db" : "#374151" }}
					>
						メンバー（{members.length}人）
					</Text>

					{isLoading ? (
						<ActivityIndicator size="small" color="#3b82f6" />
					) : (
						members.map((member) => (
							<View
								key={member.userId}
								className="flex-row items-center justify-between p-3 mb-2 rounded-md"
								style={{ backgroundColor: isDark ? "#374151" : "#f9fafb" }}
							>
								<View className="flex-1">
									<Text
										className="text-lg font-noto-bold"
										style={{ color: isDark ? "#f3f4f6" : "#1f2937" }}
									>
										{member.nickname || member.email}
									</Text>
									{member.nickname && (
										<Text className="text-sm text-gray-500 font-noto-regular">
											{member.email}
										</Text>
									)}
									{member.userId === organization.ownerId && (
										<Text className="text-xs text-blue-600 font-noto-bold mt-1">
											オーナー
										</Text>
									)}
								</View>

								{isOwner && member.userId !== organization.ownerId && (
									<TouchableOpacity onPress={() => handleRemoveMember(member)}>
										<Ionicons
											name="remove-circle-outline"
											size={24}
											color="#ef4444"
										/>
									</TouchableOpacity>
								)}
							</View>
						))
					)}
				</View>

				{/* アクション */}
				<View className="mb-8">
					{!isOwner && (
						<TouchableOpacity
							className="px-4 py-3 bg-orange-600 rounded-md mb-3"
							onPress={handleLeaveOrganization}
						>
							<Text className="text-white text-center text-lg font-noto-bold">
								グループから退出
							</Text>
						</TouchableOpacity>
					)}

					{isOwner && (
						<TouchableOpacity
							className="px-4 py-3 bg-red-600 rounded-md mb-3"
							onPress={handleDeleteOrganization}
						>
							<Text className="text-white text-center text-lg font-noto-bold">
								グループを削除
							</Text>
						</TouchableOpacity>
					)}

					<TouchableHighlight
						onPress={() => router.back()}
						activeOpacity={0.7}
						className="bg-gray-300 rounded-md py-3"
						underlayColor="#d1d5db"
					>
						<Text className="text-gray-700 font-noto-bold text-lg text-center">
							閉じる
						</Text>
					</TouchableHighlight>
				</View>
			</ScrollView>

			{/* グループ名編集モーダル */}
			<Modal
				visible={isEditingName}
				transparent
				animationType="fade"
				onRequestClose={() => {
					setIsEditingName(false);
					setEditNameError(null);
				}}
			>
				<TouchableWithoutFeedback
					onPress={() => {
						setIsEditingName(false);
						setEditNameError(null);
					}}
				>
					<View className="flex-1 justify-center items-center bg-black/75">
						<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
							<View
								className="rounded-lg p-6 w-11/12"
								style={{
									backgroundColor: isDark ? "#1f2937" : "#ffffff",
								}}
							>
								<Text
									className="text-xl font-noto-bold mb-4"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									グループ名を編集
								</Text>

								<View className="mb-4">
									<TextInput
										className="border-2 rounded-md px-4 py-3 text-lg font-noto-regular"
										style={{
											borderColor: editNameError
												? "#ef4444"
												: isDark
													? "#4b5563"
													: "#d1d5db",
											backgroundColor: isDark ? "#374151" : "#ffffff",
											color: isDark ? "#f3f4f6" : "#000000",
										}}
										placeholder="新しいグループ名"
										placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
										value={newName}
										onChangeText={(text) => {
											setNewName(text);
											setEditNameError(null);
										}}
										editable={true}
										autoFocus
										multiline
										textAlignVertical="top"
										maxLength={30}
									/>
									<View className="flex-row justify-between items-center mt-1">
										<Text
											className="text-sm font-noto-regular"
											style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
										>
											{newName.length}/30文字
										</Text>
									</View>
									{editNameError && (
										<View
											className="mt-2 p-3 rounded-md"
											style={{
												backgroundColor: isDark ? "#7f1d1d" : "#fee2e2",
											}}
										>
											<Text
												className="text-sm font-noto-regular"
												style={{ color: isDark ? "#fca5a5" : "#dc2626" }}
											>
												{editNameError}
											</Text>
										</View>
									)}
								</View>

								<View className="flex-row gap-3">
									<TouchableHighlight
										onPress={() => {
											setIsEditingName(false);
											setNewName("");
											setEditNameError(null);
										}}
										activeOpacity={0.7}
										className="flex-1 bg-gray-300 rounded-md py-3"
										underlayColor="#d1d5db"
									>
										<Text className="text-gray-700 font-noto-bold text-lg text-center">
											キャンセル
										</Text>
									</TouchableHighlight>

									<TouchableHighlight
										onPress={handleUpdateName}
										activeOpacity={0.7}
										className="flex-1 bg-blue-600 rounded-md py-3"
										underlayColor="#2563eb"
									>
										<Text className="text-white font-noto-bold text-lg text-center">
											更新
										</Text>
									</TouchableHighlight>
								</View>
							</View>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</View>
	);
}
