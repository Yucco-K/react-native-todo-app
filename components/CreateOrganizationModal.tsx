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
import { createOrganization } from "../services/organizationService";

type CreateOrganizationModalProps = {
	visible: boolean;
	onClose: () => void;
};

export function CreateOrganizationModal({
	visible,
	onClose,
}: CreateOrganizationModalProps) {
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { refreshOrganizations } = useOrganization();

	const handleCreate = async () => {
		if (!name.trim()) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "組織名を入力してください",
			});
			return;
		}

		setIsLoading(true);
		try {
			await createOrganization(name.trim());
			await refreshOrganizations();

			Toast.show({
				type: "success",
				text1: "組織作成完了",
				text2: `「${name}」を作成しました`,
			});

			setName("");
			onClose();
		} catch (error) {
			console.error("Error creating organization:", error);
			Toast.show({
				type: "error",
				text1: "作成失敗",
				text2: "組織の作成に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setName("");
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
							<Text className="text-3xl font-noto-bold mb-4">組織を作成</Text>

							<View className="mb-4">
								<Text className="text-gray-700 font-noto-bold text-lg mb-2">
									組織名
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
									placeholder="例：家族、仕事チーム"
									value={name}
									onChangeText={setName}
									autoFocus
								/>
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
									onPress={handleCreate}
									disabled={isLoading}
								>
									<Text className="text-white text-lg font-noto-bold">
										{isLoading ? "作成中..." : "作成"}
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

