import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useOrganization } from "../contexts/OrganizationContext";
import {
	acceptInvitation,
	declineInvitation,
	getMyInvitations,
} from "../services/organizationService";
import type { Invitation } from "../types/Invitation";

type InvitationListModalProps = {
	visible: boolean;
	onClose: () => void;
};

export function InvitationListModal({
	visible,
	onClose,
}: InvitationListModalProps) {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const { refreshOrganizations } = useOrganization();

	const fetchInvitations = async () => {
		setIsLoading(true);
		try {
			const invites = await getMyInvitations();
			setInvitations(invites);
		} catch (error) {
			console.error("Error fetching invitations:", error);
			Toast.show({
				type: "error",
				text1: "取得失敗",
				text2: "招待一覧の取得に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (visible) {
			fetchInvitations();
		}
	}, [visible]);

	const handleAccept = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			await acceptInvitation(invitationId);
			await refreshOrganizations();

			Toast.show({
				type: "success",
				text1: "参加完了",
				text2: "組織に参加しました",
			});

			// 招待一覧を再取得
			await fetchInvitations();
		} catch (error) {
			console.error("Error accepting invitation:", error);
			Toast.show({
				type: "error",
				text1: "参加失敗",
				text2: "組織への参加に失敗しました",
			});
		} finally {
			setProcessingId(null);
		}
	};

	const handleDecline = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			await declineInvitation(invitationId);

			Toast.show({
				type: "success",
				text1: "招待を拒否しました",
			});

			// 招待一覧を再取得
			await fetchInvitations();
		} catch (error) {
			console.error("Error declining invitation:", error);
			Toast.show({
				type: "error",
				text1: "失敗",
				text2: "招待の拒否に失敗しました",
			});
		} finally {
			setProcessingId(null);
		}
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
					className="flex-1 justify-center items-center"
					onPress={(e) => e.stopPropagation()}
				>
					<View className="bg-white rounded-lg w-5/6 max-w-md max-h-3/4">
						{/* ヘッダー */}
						<View className="border-b border-gray-200 p-6 flex-row items-center justify-between">
							<Text className="text-3xl font-noto-bold">招待一覧</Text>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close" size={28} color="#6b7280" />
							</TouchableOpacity>
						</View>

						{/* コンテンツ */}
						<ScrollView className="p-6">
							{isLoading ? (
								<View className="py-8">
									<ActivityIndicator size="large" color="#3b82f6" />
								</View>
							) : invitations.length === 0 ? (
								<View className="py-8">
									<Text className="text-center text-gray-500 text-lg font-noto-regular">
										招待はありません
									</Text>
								</View>
							) : (
								invitations.map((invitation) => (
									<View
										key={invitation.id}
										className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-300"
									>
										<Text className="text-xl font-noto-bold text-gray-800 mb-2">
											{invitation.organizationName}
										</Text>
										<Text className="text-sm text-gray-600 font-noto-regular mb-4">
											組織への招待が届いています
										</Text>

										<View className="flex-row space-x-2">
											<TouchableOpacity
												className={`flex-1 px-4 py-3 rounded-md ${
													processingId === invitation.id
														? "bg-green-300"
														: "bg-green-600"
												}`}
												onPress={() => handleAccept(invitation.id)}
												disabled={processingId !== null}
											>
												<Text className="text-white text-center text-lg font-noto-bold">
													承認
												</Text>
											</TouchableOpacity>

											<TouchableOpacity
												className={`flex-1 px-4 py-3 rounded-md ${
													processingId === invitation.id
														? "bg-gray-300"
														: "bg-gray-500"
												}`}
												onPress={() => handleDecline(invitation.id)}
												disabled={processingId !== null}
											>
												<Text className="text-white text-center text-lg font-noto-bold">
													拒否
												</Text>
											</TouchableOpacity>
										</View>
									</View>
								))
							)}
						</ScrollView>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

