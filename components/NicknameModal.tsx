import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	ActivityIndicator,
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
import { useTheme } from "../contexts/ThemeContext";
import { Avatar } from "./ui/Avatar";

type NicknameModalProps = {
	visible: boolean;
	currentNickname: string;
	currentAvatarUrl?: string | null;
	onClose: () => void;
	onSave: (nickname: string, avatarUrl: string | null) => Promise<void>;
};

export default function NicknameModal({
	visible,
	currentNickname,
	currentAvatarUrl,
	onClose,
	onSave,
}: NicknameModalProps) {
	const { isDark } = useTheme();
	const [nickname, setNickname] = useState(currentNickname);
	const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
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
			await onSave(trimmedNickname, avatarUrl.trim() || null);
			onClose();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "保存失敗",
				text2: "プロフィールの保存に失敗しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteAvatar = () => {
		setAvatarUrl("");
	};

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableWithoutFeedback onPress={onClose}>
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
								プロフィール設定
							</Text>

							<ScrollView showsVerticalScrollIndicator={false}>
								{/* アバター設定 */}
								<View className="mb-6">
									<Text
										className="text-base font-noto-bold mb-3"
										style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
									>
										アバター
									</Text>
									<View className="flex-row items-center">
										<Avatar avatarUrl={avatarUrl || null} size={80} />
										<View className="ml-4 flex-1">
											<TouchableOpacity
												onPress={() => {
													// 将来的に画像選択機能を追加
													Toast.show({
														type: "info",
														text1: "アバター設定",
														text2: "画像URLを下の入力欄に貼り付けてください",
													});
												}}
												className="mb-2"
											>
												<View
													className="px-4 py-2 rounded-md"
													style={{
														backgroundColor: isDark ? "#374151" : "#e5e7eb",
													}}
												>
													<Text
														className="text-center font-noto-bold"
														style={{ color: isDark ? "#d1d5db" : "#374151" }}
													>
														画像を選択
													</Text>
												</View>
											</TouchableOpacity>
											{avatarUrl && (
												<TouchableOpacity onPress={handleDeleteAvatar}>
													<View className="flex-row items-center justify-center">
														<Ionicons
															name="trash-outline"
															size={16}
															color="#ef4444"
														/>
														<Text className="text-red-500 font-noto-regular ml-1">
															削除
														</Text>
													</View>
												</TouchableOpacity>
											)}
										</View>
									</View>
									<TextInput
										className="border-2 rounded-md p-3 text-sm font-noto-regular mt-3"
										style={{
											borderColor: isDark ? "#4b5563" : "#d1d5db",
											backgroundColor: isDark ? "#374151" : "#ffffff",
											color: isDark ? "#f3f4f6" : "#000000",
										}}
										placeholder="画像URLを入力（任意）"
										placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
										value={avatarUrl}
										onChangeText={setAvatarUrl}
									/>
								</View>

								{/* ニックネーム設定 */}
								<View className="mb-4">
									<Text
										className="text-base font-noto-bold mb-3"
										style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
									>
										ニックネーム
									</Text>
									<Text
										className="text-sm font-noto-regular mb-2"
										style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
									>
										共有リストで表示される名前です
									</Text>
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
									/>
									<Text
										className="text-sm font-noto-regular mt-1"
										style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
									>
										{nickname.length}/20文字
									</Text>
								</View>
							</ScrollView>

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
