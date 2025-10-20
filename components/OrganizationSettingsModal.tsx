import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { auth } from "../config/firebase";
import { useOrganization } from "../contexts/OrganizationContext";
import { getCurrentUserDisplayName } from "../services/notificationService";
import {
	deleteOrganization,
	getOrganizationMembers,
	inviteByEmail,
	leaveOrganization,
	removeMember,
} from "../services/organizationService";
import type { Organization } from "../types/Organization";

type OrganizationSettingsModalProps = {
	visible: boolean;
	organization: Organization | null;
	onClose: () => void;
};

export function OrganizationSettingsModal({
	visible,
	organization,
	onClose,
}: OrganizationSettingsModalProps) {
	const [members, setMembers] = useState<
		Array<{ userId: string; email: string; nickname?: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [isInviting, setIsInviting] = useState(false);
	const { refreshOrganizations, selectOrganization } = useOrganization();

	const isOwner = organization?.ownerId === auth.currentUser?.uid;

	const fetchMembers = async () => {
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
	};

	useEffect(() => {
		if (visible && organization) {
			fetchMembers();
		}
	}, [visible, organization]);

	const handleCopyInviteCode = async () => {
		if (!organization) return;

		await Clipboard.setStringAsync(organization.inviteCode);
		Toast.show({
			type: "success",
			text1: "コピー完了",
			text2: "招待コードをコピーしました",
		});
	};

	const handleInviteByEmail = async () => {
		if (!organization) return;

		if (!inviteEmail.trim()) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "メールアドレスを入力してください",
			});
			return;
		}

		setIsInviting(true);
		try {
			await inviteByEmail(organization.id, inviteEmail.trim());

			// 招待通知を送信
			const inviterName = await getCurrentUserDisplayName();
			// 招待されたユーザーのIDを取得する必要があるが、
			// inviteByEmail内で既に検索しているので、ここでは簡略化
			// 実際は inviteByEmail が招待されたユーザーIDを返すように修正すべき

			Toast.show({
				type: "success",
				text1: "招待完了",
				text2: `${inviteEmail} に招待を送信しました`,
			});

			setInviteEmail("");
		} catch (error: any) {
			console.error("Error inviting by email:", error);
			Toast.show({
				type: "error",
				text1: "招待失敗",
				text2: error.message || "招待の送信に失敗しました",
			});
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

							Toast.show({
								type: "success",
								text1: "削除完了",
								text2: "メンバーを削除しました",
							});
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

		Alert.alert("組織から退出", `「${organization.name}」から退出しますか？`, [
			{ text: "キャンセル", style: "cancel" },
			{
				text: "退出",
				style: "destructive",
				onPress: async () => {
					try {
						await leaveOrganization(organization.id);
						await refreshOrganizations();
						selectOrganization(null);

						Toast.show({
							type: "success",
							text1: "退出完了",
							text2: "組織から退出しました",
						});

						onClose();
					} catch (error: any) {
						console.error("Error leaving organization:", error);
						Toast.show({
							type: "error",
							text1: "退出失敗",
							text2: error.message || "組織からの退出に失敗しました",
						});
					}
				},
			},
		]);
	};

	const handleDeleteOrganization = () => {
		if (!organization) return;

		Alert.alert(
			"組織を削除",
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

							Toast.show({
								type: "success",
								text1: "削除完了",
								text2: "組織を削除しました",
							});

							onClose();
						} catch (error) {
							console.error("Error deleting organization:", error);
							Toast.show({
								type: "error",
								text1: "削除失敗",
								text2: "組織の削除に失敗しました",
							});
						}
					},
				},
			]
		);
	};

	if (!organization) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/50" onPress={onClose}>
				<Pressable
					className="flex-1 justify-center items-center"
					onPress={(e) => e.stopPropagation()}
				>
					<View
						className="bg-white rounded-lg w-5/6 max-w-md"
						style={{ maxHeight: "90%" }}
					>
						{/* ヘッダー */}
						<View className="border-b border-gray-200 p-6 flex-row items-center justify-between">
							<Text className="text-2xl font-noto-bold flex-1">
								{organization.name}
							</Text>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close" size={28} color="#6b7280" />
							</TouchableOpacity>
						</View>

						<ScrollView className="p-6">
							{/* 招待コード */}
							<View className="mb-6">
								<Text className="text-gray-700 font-noto-bold text-lg mb-2">
									招待コード
								</Text>
								<View className="flex-row items-center">
									<Text className="flex-1 text-2xl font-mono font-bold text-blue-600">
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
									<Text className="text-gray-700 font-noto-bold text-lg mb-2">
										メールアドレスで招待
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
												}}
												placeholder="メールアドレス"
												value={inviteEmail}
												onChangeText={setInviteEmail}
												keyboardType="email-address"
												autoCapitalize="none"
											/>
										</View>
									</TouchableWithoutFeedback>
									<TouchableOpacity
										className={`px-4 py-3 rounded-md ${
											isInviting ? "bg-blue-300" : "bg-blue-600"
										}`}
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
								<Text className="text-gray-700 font-noto-bold text-lg mb-2">
									メンバー（{members.length}人）
								</Text>

								{isLoading ? (
									<ActivityIndicator size="small" color="#3b82f6" />
								) : (
									members.map((member) => (
										<View
											key={member.userId}
											className="flex-row items-center justify-between p-3 bg-gray-50 rounded-md mb-2"
										>
											<View className="flex-1">
												<Text className="text-lg font-noto-bold text-gray-800">
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
												<TouchableOpacity
													onPress={() => handleRemoveMember(member)}
												>
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
							<View className="space-y-2">
								{!isOwner && (
									<TouchableOpacity
										className="px-4 py-3 bg-orange-600 rounded-md"
										onPress={handleLeaveOrganization}
									>
										<Text className="text-white text-center text-lg font-noto-bold">
											組織から退出
										</Text>
									</TouchableOpacity>
								)}

								{isOwner && (
									<TouchableOpacity
										className="px-4 py-3 bg-red-600 rounded-md"
										onPress={handleDeleteOrganization}
									>
										<Text className="text-white text-center text-lg font-noto-bold">
											組織を削除
										</Text>
									</TouchableOpacity>
								)}
							</View>
						</ScrollView>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
