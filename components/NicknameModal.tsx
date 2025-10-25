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
import { useTheme } from "../contexts/ThemeContext";

type NicknameModalProps = {
	visible: boolean;
	currentNickname: string;
	onClose: () => void;
	onSave: (nickname: string) => Promise<void>;
};

export default function NicknameModal({
	visible,
	currentNickname,
	onClose,
	onSave,
}: NicknameModalProps) {
	const { isDark } = useTheme();
	const [nickname, setNickname] = useState(currentNickname);
	const [isLoading, setIsLoading] = useState(false);

	const handleSave = async () => {
		const trimmedNickname = nickname.trim();

		if (!trimmedNickname) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "ニックネームを入力してください",
			});
			return;
		}

		if (trimmedNickname.length > 20) {
			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "ニックネームは20文字以内で入力してください",
			});
			return;
		}

		setIsLoading(true);
		try {
			await onSave(trimmedNickname);
			// Toast.show({
			// 	type: "success",
			// 	text1: "保存成功",
			// 	text2: "ニックネームを更新しました",
			// });
			onClose();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "保存失敗",
				text2: "ニックネームの保存に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableWithoutFeedback onPress={onClose}>
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
								ニックネーム設定
							</Text>

							<Text
								className="text-base font-noto-regular mb-3"
								style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
							>
								共有リストで表示される名前です
							</Text>

							<View className="mb-4">
								<TextInput
									className="border-2 rounded-md p-3 text-lg font-noto-regular"
									style={{
										borderColor: isDark ? "#4b5563" : "#d1d5db",
										backgroundColor: isDark ? "#374151" : "#ffffff",
										color: isDark ? "#f3f4f6" : "#000000",
									}}
									placeholder="ニックネームを入力"
									placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
									value={nickname}
									onChangeText={setNickname}
									maxLength={20}
									autoFocus
								/>
								<Text
									className="text-sm font-noto-regular mt-1"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									{nickname.length}/20文字
								</Text>
							</View>

							<View className="flex-row justify-end mt-4 space-x-2">
								<TouchableHighlight
									onPress={onClose}
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
									onPress={handleSave}
									disabled={isLoading}
									activeOpacity={0.7}
									className="flex-1 bg-blue-500 rounded-md py-3"
									underlayColor="#3b82f6"
								>
									{isLoading ? (
										<ActivityIndicator color="white" />
									) : (
										<Text className="text-white font-noto-bold text-lg text-center">保存</Text>
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
