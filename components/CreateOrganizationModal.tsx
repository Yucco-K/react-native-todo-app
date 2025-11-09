import { useState } from "react";
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
import { createOrganization } from "../services/organizationService";

type CreateOrganizationModalProps = {
	visible: boolean;
	onClose: () => void;
};

export function CreateOrganizationModal({
	visible,
	onClose,
}: CreateOrganizationModalProps) {
	const { isDark } = useTheme();
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { refreshOrganizations } = useOrganization();

	const handleCreate = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "グループ名を入力してください",
			});
			return;
		}
		if (trimmedName.length > 30) {
			Toast.show({
				type: "error",
				text1: "文字数エラー",
				text2: "グループ名は30文字以内で入力してください",
			});
			return;
		}

		setIsLoading(true);
		try {
			await createOrganization(trimmedName);
			await refreshOrganizations();

			setName("");
			onClose();
		} catch (error) {
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
				<View className="flex-1 justify-center items-center bg-black/75">
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
								グループを作成
							</Text>

							<View className="mb-4">
								<Text
									className="font-noto-bold text-lg mb-2"
									style={{ color: isDark ? "#d1d5db" : "#374151" }}
								>
									グループ名
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
									placeholder="例：家族、仕事チーム"
									placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
									value={name}
									onChangeText={setName}
									autoFocus
									multiline
									textAlignVertical="top"
									maxLength={30}
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
