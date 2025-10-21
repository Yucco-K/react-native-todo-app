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
				text2: "グループ名を入力してください",
			});
			return;
		}

		setIsLoading(true);
		try {
			await createOrganization(name.trim());
			await refreshOrganizations();

			Toast.show({
				type: "success",
				text1: "グループ作成完了",
				text2: `「${name}」を作成しました`,
			});

			setName("");
			onClose();
		} catch (error) {
			console.error("Error creating organization:", error);
			Toast.show({
				type: "error",
				text1: "作成失敗",
				text2: "グループの作成に失敗しました",
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
			animationType="slide"
			onRequestClose={handleClose}
		>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View className="flex-1 justify-center items-center bg-black/50">
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View
							className="bg-white rounded-lg p-6 w-11/12"
							style={{ maxHeight: "80%" }}
						>
							<Text className="text-3xl font-noto-bold mb-4">グループを作成</Text>

							<View className="mb-4">
								<Text className="text-gray-700 font-noto-bold text-lg mb-2">
									グループ名
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
									onPress={handleCreate}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-blue-500 rounded-md py-3"
									underlayColor="#3b82f6"
								>
									{isLoading ? (
										<ActivityIndicator color="white" />
									) : (
										<Text className="text-white font-noto-bold text-lg text-center">
											作成
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
