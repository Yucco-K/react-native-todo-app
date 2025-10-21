import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
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
import { auth } from "../config/firebase";
import { useOrganization } from "../contexts/OrganizationContext";
import { useTheme } from "../contexts/ThemeContext";
import {
	getCurrentUserDisplayName,
	notifyInvitation,
} from "../services/notificationService";
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
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
	const { refreshOrganizations, selectOrganization } = useOrganization();
	const { isDark } = useTheme();

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
		if (visible && organization) {
			fetchMembers();
		} else if (!visible) {
			// モーダルが閉じたときに入力とメッセージをリセット
			setInviteEmail("");
			setInviteError(null);
			setInviteSuccess(null);
		}
	}, [visible, organization, fetchMembers]);

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

		// エラー・成功メッセージをリセット
		setInviteError(null);
		setInviteSuccess(null);

		if (!inviteEmail.trim()) {
			setInviteError("メールアドレスを入力してください");
			return;
		}

		setIsInviting(true);
		try {
			// 招待を送信（招待されたユーザーIDを取得）
			const invitedUserId = await inviteByEmail(
				organization.id,
				inviteEmail.trim()
			);

			// 招待通知を送信
			const inviterName = await getCurrentUserDisplayName();
			await notifyInvitation(invitedUserId, organization.name, inviterName);

			setInviteSuccess(`${inviteEmail} に招待を送信しました`);
			setInviteEmail("");
		} catch (error: any) {
			// エラーメッセージを分かりやすく表示
			let errorMessage = "招待の送信に失敗しました";
			if (error.message.includes("見つかりません")) {
				errorMessage =
					"このメールアドレスはまだ登録されていません。招待コードを共有して、先にアプリに登録してもらってください。";
			} else if (error.message.includes("既にメンバー")) {
				errorMessage = "このユーザーは既にグループのメンバーです";
			} else if (error.message.includes("既に招待")) {
				errorMessage = "このユーザーには既に招待を送信しています";
			} else if (error.message.includes("権限がありません")) {
				errorMessage = "招待する権限がありません";
			} else if (error.message) {
				errorMessage = error.message;
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

							Toast.show({
								type: "success",
								text1: "退出完了",
								text2: "グループから退出しました",
							});

							onClose();
						} catch (error: any) {
							console.error("Error leaving organization:", error);
							Toast.show({
								type: "error",
								text1: "退出失敗",
								text2: error.message || "グループからの退出に失敗しました",
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

							Toast.show({
								type: "success",
								text1: "削除完了",
								text2: "グループを削除しました",
							});

							onClose();
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

	if (!organization) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View
					className="flex-1 justify-center items-center"
					style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
				>
					<TouchableWithoutFeedback>
						<View
							className="rounded-lg p-6 w-11/12"
							style={{
								maxHeight: "80%",
								backgroundColor: isDark ? "#1f2937" : "#ffffff",
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 12,
								elevation: 8,
							}}
						>
							<Text
								className="text-xl font-noto-bold mb-4 px-4 py-2 rounded-md"
								style={{
									backgroundColor: isDark ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
									color: isDark ? "#60a5fa" : "#2563eb",
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.1,
									shadowRadius: 4,
									elevation: 3,
								}}
							>
								{organization.name}
							</Text>

							<ScrollView
								style={{ maxHeight: 400 }}
								showsVerticalScrollIndicator={false}
							>
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
													}}
													placeholder="メールアドレス"
													value={inviteEmail}
													onChangeText={(text) => {
														setInviteEmail(text);
														setInviteError(null);
														setInviteSuccess(null);
													}}
													keyboardType="email-address"
													autoCapitalize="none"
												/>
											</View>
										</TouchableWithoutFeedback>

										{/* エラーメッセージ */}
										{inviteError && (
											<View className="mb-3 p-3 bg-red-50 rounded-md border border-red-200">
												<Text className="text-red-700 font-noto-regular text-sm">
													{inviteError}
												</Text>
											</View>
										)}

										{/* 成功メッセージ */}
										{inviteSuccess && (
											<View className="mb-3 p-3 bg-green-50 rounded-md border border-green-200">
												<Text className="text-green-700 font-noto-regular text-sm">
													{inviteSuccess}
												</Text>
											</View>
										)}

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
												グループから退出
											</Text>
										</TouchableOpacity>
									)}

									{isOwner && (
										<TouchableOpacity
											className="px-4 py-3 bg-red-600 rounded-md"
											onPress={handleDeleteOrganization}
										>
											<Text className="text-white text-center text-lg font-noto-bold">
												グループを削除
											</Text>
										</TouchableOpacity>
									)}
								</View>
							</ScrollView>

							<View className="mt-4">
								<TouchableHighlight
									onPress={onClose}
									activeOpacity={0.7}
									className="bg-gray-300 rounded-md py-3"
									underlayColor="#d1d5db"
								>
									<Text className="text-gray-700 font-noto-bold text-lg text-center">
										閉じる
									</Text>
								</TouchableHighlight>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
