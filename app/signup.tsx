import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

// バリデーションスキーマ
const signupSchema = z
	.object({
		email: z.string().email("有効なメールアドレスを入力してください"),
		password: z.string().min(8, "パスワードは8文字以上で入力してください"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "パスワードが一致しません",
		path: ["confirmPassword"],
	});

export default function SignupScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const { signUp, signInWithGoogle, signInWithApple, user } = useAuth();
	const { isDark } = useTheme();
	const router = useRouter();

	// Apple/Google Sign-In成功後、userが更新されたらローディングを解除
	useEffect(() => {
		if (user) {
			setIsLoading(false);
		}
	}, [user]);

	const handleSignup = async () => {
		// バリデーション
		const result = signupSchema.safeParse({
			email,
			password,
			confirmPassword,
		});

		if (!result.success) {
			const fieldErrors: {
				email?: string;
				password?: string;
				confirmPassword?: string;
			} = {};
			result.error.errors.forEach((err) => {
				const field = err.path[0];
				if (field === "email" || field === "password" || field === "confirmPassword") {
					fieldErrors[field] = err.message;
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
			await signUp(email, password);

			// メール認証の案内を表示
			Alert.alert(
				"認証メールを送信しました",
				`${email} に認証メールを送信しました。\n\nメール内のリンクをクリックしてアカウントを有効化してください。\n\n認証後、ログイン画面からログインできます。`,
				[
					{
						text: "OK",
						onPress: () => router.replace("/login"),
					},
				],
			);
		} catch (error) {
			let errorTitle = "登録失敗";
			let errorMessage = "登録に失敗しました";

			if (error && typeof error === "object") {
				// エラーコードによる詳細なメッセージ
				if ("code" in error) {
					switch (error.code) {
						case "auth/email-already-in-use":
							errorMessage = "このメールアドレスは既に使用されています";
							break;
						case "auth/weak-password":
							errorMessage = "パスワードが弱すぎます（6文字以上必要）";
							break;
						case "auth/invalid-email":
							errorMessage = "無効なメールアドレス形式です";
							break;
						case "auth/operation-not-allowed":
							errorTitle = "認証が無効です";
							errorMessage =
								"メール/パスワード認証が有効化されていません。Firebase Consoleで有効にしてください。";
							break;
						case "auth/network-request-failed":
							errorMessage = "ネットワークエラー: インターネット接続を確認してください";
							break;
						case "auth/unauthorized-continue-url":
							errorTitle = "設定エラー";
							errorMessage =
								"Firebase Consoleの設定に問題があります。開発者に連絡してください。";
							break;
						default:
							errorMessage = `登録エラー: ${error.code}`;
					}
				}

				// エラーメッセージがある場合（ターミナルログに出力）
				if ("message" in error && typeof error.message === "string") {
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

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			await signInWithGoogle();
			// router.replace("/")を削除 - AuthContextのonAuthStateChangedが自動的にリダイレクトする
			// setIsLoadingはonAuthStateChangedでuserが更新されるまで維持
		} catch (error) {
			Toast.show({
				type: "error",
				text1: "Google サインアップ失敗",
				text2: "Google サインアップに失敗しました",
				visibilityTime: 4000,
			});
			setIsLoading(false);
		}
	};

	const handleAppleSignIn = async () => {
		setIsLoading(true);
		try {
			await signInWithApple();
			// router.replace("/")を削除 - AuthContextのonAuthStateChangedが自動的にリダイレクトする
			// setIsLoadingはonAuthStateChangedでuserが更新されるまで維持
		} catch (error) {

			// ユーザーがキャンセルした場合は何も表示しない
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				error.message === "USER_CANCELED"
			) {
			} else {
				Toast.show({
					type: "error",
					text1: "Apple サインアップ失敗",
					text2: "Apple サインアップに失敗しました",
					visibilityTime: 4000,
				});
			}
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View className="flex-1 justify-center px-8">
						<Text
							className="text-4xl font-noto-bold text-center mb-8"
							style={{ color: isDark ? "#a5f3fc" : "#06b6d4" }}
						>
							Re:Mind
						</Text>
						<Text
							className="text-2xl font-noto-bold mb-6"
							style={{ color: isDark ? "#f3f4f6" : "#000000" }}
						>
							新規登録
						</Text>

						<View className="mb-4">
							<TextInput
								className="border-2 rounded-md p-3 font-noto-regular"
								style={{
									borderColor: isDark ? "#4b5563" : "#d1d5db",
									backgroundColor: isDark ? "#374151" : "#ffffff",
									color: isDark ? "#d1d5db" : "#000000",
								}}
								placeholder="メールアドレス"
								placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								autoComplete="email"
							/>
							{errors.email && (
								<Text className="text-red-500 text-base mt-1 font-noto-regular">
									{errors.email}
								</Text>
							)}
						</View>

						<View className="mb-4">
							<View
								className="flex-row items-center border-2 rounded-md px-3"
								style={{
									borderColor: isDark ? "#4b5563" : "#d1d5db",
									backgroundColor: isDark ? "#374151" : "#ffffff",
								}}
							>
								<TextInput
									className="flex-1 font-noto-regular py-3"
									style={{
										color: isDark ? "#d1d5db" : "#000000",
									}}
									placeholder="パスワード（6文字以上）"
									placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!isPasswordVisible}
									autoCapitalize="none"
									autoComplete="password"
								/>
								<TouchableOpacity
									onPress={() => setIsPasswordVisible((prev) => !prev)}
									activeOpacity={0.7}
									style={{ paddingLeft: 8 }}
								>
									<Ionicons
										name={isPasswordVisible ? "eye-off" : "eye"}
										size={22}
										color={isDark ? "#d1d5db" : "#6b7280"}
									/>
								</TouchableOpacity>
							</View>
							{errors.password && (
								<Text className="text-red-500 text-base mt-1 font-noto-regular">
									{errors.password}
								</Text>
							)}
						</View>

						<View className="mb-6">
							<View
								className="flex-row items-center border-2 rounded-md px-3"
								style={{
									borderColor: isDark ? "#4b5563" : "#d1d5db",
									backgroundColor: isDark ? "#374151" : "#ffffff",
								}}
							>
								<TextInput
									className="flex-1 font-noto-regular py-3"
									style={{
										color: isDark ? "#d1d5db" : "#000000",
									}}
									placeholder="パスワード（確認）"
									placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									secureTextEntry={!isConfirmPasswordVisible}
									autoCapitalize="none"
									autoComplete="password"
								/>
								<TouchableOpacity
									onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
									activeOpacity={0.7}
									style={{ paddingLeft: 8 }}
								>
									<Ionicons
										name={isConfirmPasswordVisible ? "eye-off" : "eye"}
										size={22}
										color={isDark ? "#d1d5db" : "#6b7280"}
									/>
								</TouchableOpacity>
							</View>
							{errors.confirmPassword && (
								<Text className="text-red-500 text-base mt-1 font-noto-regular">
									{errors.confirmPassword}
								</Text>
							)}
						</View>

						<TouchableHighlight
							onPress={handleSignup}
							disabled={isLoading}
							activeOpacity={0.7}
							className="bg-blue-500 rounded-md p-4 mb-4"
							underlayColor="#3b82f6"
						>
							{isLoading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="text-white text-center font-noto-bold text-xl">登録</Text>
							)}
						</TouchableHighlight>

						{/* 区切り線 */}
						<View className="flex-row items-center my-4">
							<View className="flex-1 h-px bg-gray-300" />
							<Text className="mx-4 text-gray-600 font-noto-regular">または</Text>
							<View className="flex-1 h-px bg-gray-300" />
						</View>

						{/* Google Sign-Inボタン */}
						<TouchableHighlight
							onPress={handleGoogleSignIn}
							disabled={isLoading}
							activeOpacity={0.7}
							className="bg-white rounded-md p-4 mb-3 border-2 border-gray-300"
							underlayColor="#f3f4f6"
						>
							<View className="flex-row items-center justify-center">
								<GoogleIcon size={24} />
								<Text className="ml-2 text-center text-gray-700 font-noto-bold text-lg">
									Googleでサインアップ
								</Text>
							</View>
						</TouchableHighlight>

						{/* Apple Sign-Inボタン (iOSのみ) */}
						{Platform.OS === "ios" && (
							<TouchableHighlight
								onPress={handleAppleSignIn}
								disabled={isLoading}
								activeOpacity={0.7}
								className="bg-black rounded-md p-4 mb-6 border-2 border-black"
								underlayColor="#1f1f1f"
							>
								<View className="flex-row items-center justify-center">
									<Ionicons name="logo-apple" size={24} color="white" />
									<Text className="ml-2 text-center text-white font-noto-bold text-lg">
										Appleでサインアップ
									</Text>
								</View>
							</TouchableHighlight>
						)}

					<View className="flex-row items-center justify-center mt-4">
						<Text
							className="font-noto-regular text-base"
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
						>
							すでにアカウントをお持ちの方
						</Text>
						<Link href="/login" asChild>
							<TouchableOpacity className="ml-2">
								<Text
									className="font-noto-bold text-base"
									style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}
								>
									ログイン
								</Text>
							</TouchableOpacity>
						</Link>
					</View>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
