import React, { useState } from "react";
import {
	Keyboard,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useOrganization } from "../contexts/OrganizationContext";
import { joinByInviteCode } from "../services/organizationService";

type JoinOrganizationModalProps = {
	visible: boolean;
	onClose: () => void;
};

export function JoinOrganizationModal({
	visible,
	onClose,
}: JoinOrganizationModalProps) {
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

			// 参加した組織を選択
			selectOrganization(org);

			Toast.show({
				type: "success",
				text1: "参加完了",
				text2: `「${org.name}」に参加しました`,
			});

			setInviteCode("");
			onClose();
		} catch (error: any) {
			console.error("Error joining organization:", error);
			Toast.show({
				type: "error",
				text1: "参加失敗",
				text2: error.message || "組織への参加に失敗しました",
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
			animationType="fade"
			onRequestClose={handleClose}
		>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View className="flex-1 justify-center items-center bg-black/50">
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View className="bg-white rounded-lg p-6 w-5/6 max-w-md">
							<Text className="text-3xl font-noto-bold mb-4">組織に参加</Text>

							<View className="mb-4">
								<Text className="text-gray-700 font-noto-bold text-lg mb-2">
									招待コード（8桁）
								</Text>
								<TextInput
									className="border-2 border-gray-300 rounded-md text-lg"
									style={{
										fontFamily: "System",
										lineHeight: undefined,
										paddingVertical: 14,
										paddingHorizontal: 12,
										fontSize: 18,
									}}
									placeholder="例：ABC12345"
									value={inviteCode}
									onChangeText={(text) => setInviteCode(text.toUpperCase())}
									autoCapitalize="characters"
									autoCorrect={false}
									maxLength={8}
									autoFocus
								/>
								<Text className="text-gray-500 text-sm font-noto-regular mt-2">
									組織の管理者から招待コードを教えてもらってください
								</Text>
							</View>

							<View className="flex-row justify-end space-x-2">
								<TouchableOpacity
									className="px-6 py-3 bg-gray-200 rounded-md"
									onPress={handleClose}
									disabled={isLoading}
								>
									<Text className="text-gray-700 text-lg font-noto-bold">
										キャンセル
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className={`px-6 py-3 rounded-md ${
										isLoading ? "bg-blue-300" : "bg-blue-600"
									}`}
									onPress={handleJoin}
									disabled={isLoading}
								>
									<Text className="text-white text-lg font-noto-bold">
										{isLoading ? "参加中..." : "参加"}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
