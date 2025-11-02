import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	Text,
	TouchableHighlight,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useOrganization } from "../contexts/OrganizationContext";
import { useTheme } from "../contexts/ThemeContext";
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
	const { isDark } = useTheme();
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const { refreshOrganizations } = useOrganization();

	const fetchInvitations = useCallback(async () => {
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
	}, []);

	useEffect(() => {
		if (visible) {
			fetchInvitations();
		}
	}, [visible, fetchInvitations]);

	const handleAccept = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			await acceptInvitation(invitationId);
			await refreshOrganizations();

			// 招待一覧を再取得
			await fetchInvitations();
		} catch (error) {
			console.error("Error accepting invitation:", error);
			Toast.show({
				type: "error",
				text1: "参加失敗",
				text2: "グループへの参加に失敗しました",
			});
		} finally {
			setProcessingId(null);
		}
	};

	const handleDecline = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			await declineInvitation(invitationId);

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
			animationType="slide"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View className="flex-1 justify-center items-center bg-black/50">
					<TouchableWithoutFeedback>
						<View
							className="rounded-lg p-6 w-11/12"
							style={{
								maxHeight: "80%",
								backgroundColor: isDark ? "#1f2937" : "#ffffff",
							}}
						>
							<Text
								className="text-3xl font-noto-bold mb-4"
								style={{ color: isDark ? "#f3f4f6" : "#000000" }}
							>
								招待一覧
							</Text>

							<ScrollView
								style={{ maxHeight: 400 }}
								showsVerticalScrollIndicator={false}
							>
								{isLoading ? (
									<View className="py-8">
										<ActivityIndicator
											size="large"
											color={isDark ? "#60a5fa" : "#3b82f6"}
										/>
									</View>
								) : invitations.length === 0 ? (
									<View className="py-8">
										<Text
											className="text-center text-lg font-noto-regular"
											style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
										>
											招待はありません
										</Text>
									</View>
								) : (
									invitations.map((invitation) => (
										<View
											key={invitation.id}
											className="mb-4 p-4 rounded-lg"
											style={{
												backgroundColor: isDark
													? "rgba(59, 130, 246, 0.2)"
													: "#eff6ff",
												borderWidth: 1,
												borderColor: isDark
													? "rgba(59, 130, 246, 0.4)"
													: "#93c5fd",
											}}
										>
										<Text
											className="text-xl font-noto-bold mb-2"
											style={{
												color: isDark ? "#d1d5db" : "#1f2937",
												flexShrink: 1,
											}}
										>
											{invitation.organizationName}
										</Text>
										<Text
											className="text-sm font-noto-regular mb-4"
											style={{
												color: isDark ? "#9ca3af" : "#4b5563",
												flexShrink: 1,
											}}
										>
											グループへの招待が届いています
										</Text>

											<View className="flex-row space-x-2">
												<TouchableHighlight
													onPress={() => handleAccept(invitation.id)}
													disabled={processingId !== null}
													activeOpacity={0.7}
													className="flex-1 bg-green-600 rounded-md py-3 mr-2"
													underlayColor="#16a34a"
												>
													{processingId === invitation.id ? (
														<ActivityIndicator color="white" />
													) : (
														<Text className="text-white text-center text-lg font-noto-bold">
															承認
														</Text>
													)}
												</TouchableHighlight>

												<TouchableHighlight
													onPress={() => handleDecline(invitation.id)}
													disabled={processingId !== null}
													activeOpacity={0.7}
													className="flex-1 bg-gray-500 rounded-md py-3"
													underlayColor="#6b7280"
												>
													{processingId === invitation.id ? (
														<ActivityIndicator color="white" />
													) : (
														<Text className="text-white text-center text-lg font-noto-bold">
															拒否
														</Text>
													)}
												</TouchableHighlight>
											</View>
										</View>
									))
								)}
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
