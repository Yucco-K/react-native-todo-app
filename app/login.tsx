import { useAuth } from "@/contexts/AuthContext";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableHighlight,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";

// バリデーションスキーマ
const loginSchema = z.object({
	email: z.string().email("有効なメールアドレスを入力してください"),
	password: z.string().min(6, "パスワードは6文字以上で入力してください"),
});

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{}
	);

	const { signIn } = useAuth();
	const router = useRouter();

	const handleLogin = async () => {
		// バリデーション
		const result = loginSchema.safeParse({ email, password });

		if (!result.success) {
			const fieldErrors: { email?: string; password?: string } = {};
			result.error.errors.forEach((err) => {
				if (err.path[0] === "email" || err.path[0] === "password") {
					fieldErrors[err.path[0]] = err.message;
				}
			});
			setErrors(fieldErrors);

			Toast.show({
				type: "error",
				text1: "入力エラー",
				text2: "入力内容を確認してください",
			});
			return;
		}

		setErrors({});
		setIsLoading(true);

	try {
		await signIn(email, password);
		// Toast.show({
		// 	type: "success",
		// 	text1: "ログイン成功",
		// 	text2: "ようこそ！",
		// });
		router.replace("/");
	} catch (error) {
			console.error("ログインエラー:", error);
			const errorTitle = "ログイン失敗";
			let errorMessage = "ログインに失敗しました";

			if (error && typeof error === "object") {
				// エラーコードによる詳細なメッセージ
				if ("code" in error) {
					switch (error.code) {
						case "auth/invalid-credential":
							errorMessage = "メールアドレスまたはパスワードが間違っています";
							break;
						case "auth/user-not-found":
							errorMessage = "このメールアドレスは登録されていません";
							break;
						case "auth/wrong-password":
							errorMessage = "パスワードが間違っています";
							break;
						case "auth/invalid-email":
							errorMessage = "無効なメールアドレス形式です";
							break;
						case "auth/user-disabled":
							errorMessage = "このアカウントは無効化されています";
							break;
						case "auth/too-many-requests":
							errorMessage =
								"ログイン試行回数が多すぎます。しばらく待ってから再度お試しください";
							break;
						case "auth/network-request-failed":
							errorMessage =
								"ネットワークエラー: インターネット接続を確認してください";
							break;
						default:
							errorMessage = `ログインエラー: ${error.code}`;
					}
				}

				// エラーメッセージがある場合
				if ("message" in error && typeof error.message === "string") {
					console.error("詳細:", error.message);
					// 開発用に詳細メッセージも表示
					if (__DEV__) {
						errorMessage += `\n\n[開発モード] ${error.message}`;
					}
				}
			}

			Toast.show({
				type: "error",
				text1: errorTitle,
				text2: errorMessage,
				visibilityTime: 6000,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-white">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<View className="flex-1 justify-center px-8">
					<Text className="text-3xl font-noto-bold text-center mb-8">
						Todo App
					</Text>
					<Text className="text-xl font-noto-bold mb-6">ログイン</Text>

					<View className="mb-4">
						<TextInput
							className="border-2 border-gray-300 rounded-md p-3 font-noto-regular"
							placeholder="メールアドレス"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
						/>
						{errors.email && (
							<Text className="text-red-500 text-sm mt-1 font-noto-regular">
								{errors.email}
							</Text>
						)}
					</View>

					<View className="mb-6">
						<TextInput
							className="border-2 border-gray-300 rounded-md p-3 font-noto-regular"
							placeholder="パスワード"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoCapitalize="none"
							autoComplete="password"
						/>
						{errors.password && (
							<Text className="text-red-500 text-sm mt-1 font-noto-regular">
								{errors.password}
							</Text>
						)}
					</View>

					<TouchableHighlight
						onPress={handleLogin}
						disabled={isLoading}
						activeOpacity={0.7}
						className="bg-blue-500 rounded-md p-4 mb-4"
						underlayColor="#3b82f6"
					>
						{isLoading ? (
							<ActivityIndicator color="white" />
						) : (
							<Text className="text-white text-center font-noto-bold text-lg">
								ログイン
							</Text>
						)}
					</TouchableHighlight>

					<View className="flex-row justify-center">
						<Text className="text-gray-600 font-noto-regular">
							アカウントをお持ちでない方は{" "}
						</Text>
						<Link href="/signup" asChild>
							<TouchableHighlight>
								<Text className="text-blue-500 font-noto-bold">新規登録</Text>
							</TouchableHighlight>
						</Link>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
