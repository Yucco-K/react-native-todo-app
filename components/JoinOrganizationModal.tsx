import React, { useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	Modal,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useOrganization } from "../contexts/OrganizationContext";
import { useTheme } from "../contexts/ThemeContext";
import { joinByInviteCode } from "../services/organizationService";

type JoinOrganizationModalProps = {
	visible: boolean;
	onClose: () => void;
};

export function JoinOrganizationModal({
	visible,
	onClose,
}: JoinOrganizationModalProps) {
	const { isDark } = useTheme();
	const [inviteCode, setInviteCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { refreshOrganizations, selectOrganization } = useOrganization();

	const handleJoin = async () => {
		if (!inviteCode.trim()) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "招待コードを入力してください",
			});
			return;
		}

		setIsLoading(true);
		try {
			const org = await joinByInviteCode(inviteCode.trim().toUpperCase());
			await refreshOrganizations();

			// 参加したグループを選択
			selectOrganization(org);

			setInviteCode("");
			onClose();
		} catch (error: any) {
			console.error("Error joining organization:", error);
			Toast.show({
				type: "error",
				text1: "参加失敗",
				text2: error.message || "グループへの参加に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setInviteCode("");
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={handleClose}
		>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View className="flex-1 justify-center items-center bg-black/50">
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
								グループに参加
							</Text>

							<View className="mb-4">
								<Text
									className="font-noto-bold text-lg mb-2"
									style={{ color: isDark ? "#d1d5db" : "#374151" }}
								>
									招待コード（8桁）
								</Text>
								<TextInput
									className="border-2 rounded-md text-lg"
									style={{
										fontFamily: "System",
										lineHeight: undefined,
										paddingVertical: 14,
										paddingHorizontal: 12,
										fontSize: 18,
										borderColor: isDark ? "#4b5563" : "#d1d5db",
										backgroundColor: isDark ? "#374151" : "#ffffff",
										color: isDark ? "#f3f4f6" : "#000000",
									}}
									placeholder="例：ABC12345"
									placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
									value={inviteCode}
									onChangeText={(text) => setInviteCode(text.toUpperCase())}
									autoCapitalize="characters"
									autoCorrect={false}
									maxLength={8}
									autoFocus
								/>
								<Text
									className="text-sm font-noto-regular mt-2"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									グループの管理者から招待コードを教えてもらってください
								</Text>
							</View>

							<View className="flex-row justify-end mt-4 space-x-2">
								<TouchableHighlight
									onPress={handleClose}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-gray-300 rounded-md py-3 mr-2"
									underlayColor="#d1d5db"
								>
									<Text className="text-gray-700 font-noto-bold text-lg text-center">
										キャンセル
									</Text>
								</TouchableHighlight>

								<TouchableHighlight
									onPress={handleJoin}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-blue-500 rounded-md py-3"
									underlayColor="#3b82f6"
								>
									{isLoading ? (
										<ActivityIndicator color="white" />
									) : (
										<Text className="text-white font-noto-bold text-lg text-center">
											参加
										</Text>
									)}
								</TouchableHighlight>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
