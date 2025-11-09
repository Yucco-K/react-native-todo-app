import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
	Keyboard,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "../config/firebase";

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { isDark } = useTheme();
	const router = useRouter();

	const handleResetPassword = async () => {
		if (!email) {
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "メールアドレスを入力してください",
				visibilityTime: 4000,
			});
			return;
		}

		// 簡易的なメールアドレスのバリデーション
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "有効なメールアドレスを入力してください",
				visibilityTime: 4000,
			});
			return;
		}

		setIsLoading(true);

		try {
			console.log("📧 パスワードリセットメールを送信中...", email);
			
			// パスワードリセットメールを送信
			await sendPasswordResetEmail(auth, email);
			
			console.log("✅ パスワードリセットメールを送信しました:", email);

			Toast.show({
				type: "success",
				text1: "送信完了",
				text2: `${email} にパスワードリセットメールを送信しました`,
				visibilityTime: 6000,
			});
			
			// 2秒後にログイン画面に戻る
			setTimeout(() => {
				router.back();
			}, 2000);
		} catch (error) {
			console.error("❌ パスワードリセットエラー:", error);
			let errorMessage = "パスワードリセットメールの送信に失敗しました";

			if (error && typeof error === "object" && "code" in error) {
				console.error("エラーコード:", error.code);
				switch (error.code) {
					case "auth/user-not-found":
						errorMessage = "このメールアドレスは登録されていません";
						break;
					case "auth/invalid-email":
						errorMessage = "無効なメールアドレスです";
						break;
					case "auth/too-many-requests":
						errorMessage = "リクエストが多すぎます。しばらく待ってから再試行してください";
						break;
					default:
						errorMessage = `エラーが発生しました: ${error.code || "不明なエラー"}`;
				}
			}

			Toast.show({
				type: "error",
				text1: "エラー",
				text2: errorMessage,
				visibilityTime: 6000,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}>
				<View className="flex-1 px-6 justify-center">
					{/* 戻るボタン */}
					<TouchableOpacity onPress={() => router.back()} className="absolute top-4 left-6 z-10">
						<Ionicons name="arrow-back" size={28} color={isDark ? "#d1d5db" : "#374151"} />
					</TouchableOpacity>

					{/* タイトル */}
					<View className="mb-8">
						<Text
							className="text-3xl font-noto-bold mb-2"
							style={{ color: isDark ? "#f3f4f6" : "#1f2937" }}
						>
							パスワードをリセット
						</Text>
						<Text
							className="text-base font-noto-regular"
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
						>
							登録したメールアドレスを入力してください。
							{"\n"}
							パスワードリセット用のリンクをお送りします。
						</Text>
					</View>

					{/* メールアドレス入力 */}
					<View className="mb-6">
						<Text
							className="text-base font-noto-medium mb-2"
							style={{ color: isDark ? "#d1d5db" : "#374151" }}
						>
							メールアドレス
						</Text>
						<TextInput
							className="border-2 rounded-md px-4 py-3 font-noto-regular text-base"
							style={{
								borderColor: isDark ? "#4b5563" : "#d1d5db",
								backgroundColor: isDark ? "#374151" : "#ffffff",
								color: isDark ? "#f3f4f6" : "#1f2937",
							}}
							placeholder="example@email.com"
							placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
							editable={!isLoading}
						/>
					</View>

					{/* 送信ボタン */}
					<TouchableOpacity
						className="bg-blue-600 rounded-md py-4 items-center mb-4"
						onPress={handleResetPassword}
						disabled={isLoading}
						style={{
							opacity: isLoading ? 0.6 : 1,
						}}
					>
						<Text className="text-white text-lg font-noto-bold">
							{isLoading ? "送信中..." : "リセットメールを送信"}
						</Text>
					</TouchableOpacity>

					{/* 説明 */}
					<View
						className="p-4 rounded-lg"
						style={{
							backgroundColor: isDark ? "#374151" : "#f3f4f6",
						}}
					>
						<Text
							className="text-sm font-noto-regular"
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
						>
							💡 メールが届かない場合は、迷惑メールフォルダをご確認ください。
						</Text>
					</View>
				</View>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}
