import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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
	const [error, setError] = useState<string | null>(null);

	// モーダルが開かれた時に現在の値を反映
	useEffect(() => {
		if (visible) {
			setNickname(currentNickname);
			setAvatarUrl(currentAvatarUrl || "");
			setError(null);
		}
	}, [visible, currentNickname, currentAvatarUrl]);

	const handleSave = async () => {
		setError(null);
		const trimmedNickname = nickname.trim();

		if (!trimmedNickname) {
			setError("ニックネームを入力してください");
			return;
		}

		if (trimmedNickname.length > 20) {
			setError("ニックネームは20文字以内で入力してください");
			return;
		}

		setIsLoading(true);
		try {
			await onSave(trimmedNickname, avatarUrl.trim() || null);
			setIsLoading(false);
			Alert.alert("成功", "プロフィールが保存されました", [
				{ text: "OK", onPress: onClose },
			]);
		} catch (error) {
			setIsLoading(false);
			Alert.alert(
				"エラー",
				`プロフィールの保存に失敗しました: ${String(error)}`,
				[{ text: "OK" }]
			);
			setError("プロフィールの保存に失敗しました");
		}
	};

	const handleDeleteAvatar = () => {
		setAvatarUrl("");
	};

	const handlePickImage = async () => {
		setError(null);
		try {
			// パーミッションをリクエスト
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				setError("画像ライブラリへのアクセス権限が必要です");
				return;
			}

			// 画像を選択
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				setAvatarUrl(result.assets[0].uri);
			}
		} catch (error) {
			setError("画像の選択に失敗しました");
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
								{/* エラーメッセージ */}
								{error && (
									<View
										className="mb-4 p-3 rounded-md"
										style={{ backgroundColor: isDark ? "#7f1d1d" : "#fee2e2" }}
									>
										<Text
											className="text-sm font-noto-regular"
											style={{ color: isDark ? "#fca5a5" : "#dc2626" }}
										>
											{error}
										</Text>
									</View>
								)}

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
												onPress={handlePickImage}
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
												<TouchableOpacity
													onPress={handleDeleteAvatar}
													className="mt-2"
												>
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
										<Text className="text-white font-noto-bold text-lg text-center">
											保存
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
