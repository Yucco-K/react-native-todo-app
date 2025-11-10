import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
const loginSchema = z.object({
	email: z.string().email("有効なメールアドレスを入力してください"),
	password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const STORAGE_KEY_FAILED_ATTEMPTS = "login_failed_attempts";
const STORAGE_KEY_LOCKOUT_TIME = "login_lockout_time";
const MAX_ATTEMPTS = 7;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10分

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLockedOut, setIsLockedOut] = useState(false);
	const [remainingTime, setRemainingTime] = useState(0); // 秒単位

	const { signIn, signInWithGoogle, signInWithApple, user } = useAuth();
	const { isDark } = useTheme();
	const router = useRouter();

	// Apple/Google Sign-In成功後、userが更新されたらローディングを解除
	useEffect(() => {
		if (user) {
			console.log("✅ 認証状態が更新されました - ローディング解除");
			setIsLoading(false);
		}
	}, [user]);

	const checkLockoutStatus = useCallback(async () => {
		try {
			const lockoutTimeStr = await AsyncStorage.getItem(STORAGE_KEY_LOCKOUT_TIME);
			if (lockoutTimeStr) {
				const lockoutTime = Number.parseInt(lockoutTimeStr, 10);
				const now = Date.now();
				const timeRemaining = lockoutTime - now;

				if (timeRemaining > 0) {
					setIsLockedOut(true);
					setRemainingTime(Math.ceil(timeRemaining / 1000));
				} else {
					// ロックアウト期間が過ぎた場合、カウントをリセット
					await AsyncStorage.multiRemove([STORAGE_KEY_FAILED_ATTEMPTS, STORAGE_KEY_LOCKOUT_TIME]);
				}
			}
		} catch (error) {
			console.log("ロックアウト状態の確認エラー:", error);
		}
	}, []);

	// ロックアウト状態を確認
	useEffect(() => {
		checkLockoutStatus();
	}, [checkLockoutStatus]);

	// カウントダウンタイマー
	useEffect(() => {
		if (isLockedOut && remainingTime > 0) {
			const timer = setInterval(() => {
				setRemainingTime((prev) => {
					if (prev <= 1) {
						setIsLockedOut(false);
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [isLockedOut, remainingTime]);

	const incrementFailedAttempts = async () => {
		try {
			const attemptsStr = await AsyncStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS);
			const attempts = attemptsStr ? Number.parseInt(attemptsStr, 10) : 0;
			const newAttempts = attempts + 1;

			if (newAttempts >= MAX_ATTEMPTS) {
				// 7回目の失敗でロックアウト
				const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
				await AsyncStorage.setItem(STORAGE_KEY_LOCKOUT_TIME, lockoutTime.toString());
				await AsyncStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, "0");
				setIsLockedOut(true);
				setRemainingTime(Math.ceil(LOCKOUT_DURATION_MS / 1000));

				Toast.show({
					type: "error",
					text1: "ログインが一時停止されました",
					text2: "セキュリティのため10分間お待ちください",
					visibilityTime: 8000,
				});
			} else {
				await AsyncStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, newAttempts.toString());
				const remainingAttempts = MAX_ATTEMPTS - newAttempts;
				if (remainingAttempts <= 3) {
					Toast.show({
						type: "error",
						text1: "ログイン失敗",
						text2: `あと${remainingAttempts}回失敗するとログインが一時停止されます`,
						visibilityTime: 6000,
					});
				}
			}
		} catch (error) {
			console.log("失敗回数の記録エラー:", error);
		}
	};

	const resetFailedAttempts = async () => {
		try {
			await AsyncStorage.multiRemove([STORAGE_KEY_FAILED_ATTEMPTS, STORAGE_KEY_LOCKOUT_TIME]);
		} catch (error) {
			console.log("失敗回数のリセットエラー:", error);
		}
	};

	const handleLogin = async () => {
		// ロックアウト中はログインを許可しない
		if (isLockedOut) {
			const minutes = Math.floor(remainingTime / 60);
			const seconds = remainingTime % 60;
			Toast.show({
				type: "error",
				text1: "ログインが一時停止されています",
				text2: `あと${minutes}分${seconds}秒後に再試行できます`,
				visibilityTime: 6000,
			});
			return;
		}

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
			// ログイン成功時、失敗回数をリセット
			await resetFailedAttempts();
			router.replace("/");
		} catch (error) {
			console.log("ログインエラー:", error);
			const errorTitle = "ログイン失敗";
			let errorMessage = "ログインに失敗しました";
			let isAuthError = false;

			if (error && typeof error === "object") {
				// カスタムエラー（メール未認証）
				if ("message" in error && error.message === "EMAIL_NOT_VERIFIED") {
					Alert.alert(
						"メール認証が必要です",
						"アカウントを使用するには、メールアドレスの認証が必要です。\n\n登録時に送信された認証メールのリンクをクリックしてください。\n\nメールが届いていない場合は、迷惑メールフォルダをご確認ください。",
						[{ text: "OK" }],
					);
					setIsLoading(false);
					return;
				}

				// エラーコードによる詳細なメッセージ
				if ("code" in error) {
					switch (error.code) {
						case "auth/invalid-credential":
							errorMessage = "メールアドレスまたはパスワードが間違っています";
							isAuthError = true;
							break;
						case "auth/user-not-found":
							errorMessage = "このメールアドレスは登録されていません";
							isAuthError = true;
							break;
						case "auth/wrong-password":
							errorMessage = "パスワードが間違っています";
							isAuthError = true;
							break;
						case "auth/invalid-email":
							errorMessage = "無効なメールアドレス形式です";
							break;
						case "auth/user-disabled":
							errorMessage = "このアカウントは無効化されています";
							break;
						case "auth/too-many-requests":
							errorMessage = "ログイン試行回数が多すぎます。しばらく待ってから再度お試しください";
							break;
						case "auth/network-request-failed":
							errorMessage = "ネットワークエラー: インターネット接続を確認してください";
							break;
						default:
							errorMessage = `ログインエラー: ${error.code}`;
					}
				}

				// エラーメッセージがある場合（ターミナルログに出力）
				if ("message" in error && typeof error.message === "string") {
					console.log("詳細:", error.message);
				}
			}

			// 認証エラーの場合のみ失敗回数をカウント
			if (isAuthError) {
				await incrementFailedAttempts();
				// incrementFailedAttempts内でToastを表示しない場合もあるため、
				// ここでも基本的なエラーメッセージを表示
				const attemptsStr = await AsyncStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS);
				const attempts = attemptsStr ? Number.parseInt(attemptsStr, 10) : 0;
				const remainingAttempts = MAX_ATTEMPTS - attempts;

				// 残り試行回数が4回以上の場合は通常のエラーメッセージを表示
				if (remainingAttempts > 3) {
					Toast.show({
						type: "error",
						text1: errorTitle,
						text2: errorMessage,
						visibilityTime: 4000,
					});
				}
			} else {
				// 認証エラー以外の場合は通常のトーストを表示
				Toast.show({
					type: "error",
					text1: errorTitle,
					text2: errorMessage,
					visibilityTime: 6000,
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			await signInWithGoogle();
			await resetFailedAttempts();
			console.log("✅ Google Sign-In成功 - 認証状態の更新を待機中...");
			// router.replace("/")を削除 - AuthContextのonAuthStateChangedが自動的にリダイレクトする
			// setIsLoadingはonAuthStateChangedでuserが更新されるまで維持
		} catch (error) {
			console.log("Google ログインエラー:", error);
			Toast.show({
				type: "error",
				text1: "Google ログイン失敗",
				text2: "Google ログインに失敗しました",
				visibilityTime: 4000,
			});
			setIsLoading(false);
		}
	};

	const handleAppleSignIn = async () => {
		setIsLoading(true);
		try {
			await signInWithApple();
			await resetFailedAttempts();
			console.log("✅ Apple Sign-In成功 - 認証状態の更新を待機中...");
			// router.replace("/")を削除 - AuthContextのonAuthStateChangedが自動的にリダイレクトする
			// setIsLoadingはonAuthStateChangedでuserが更新されるまで維持
		} catch (error) {
			console.log("Apple ログインエラー:", error);

			// ユーザーがキャンセルした場合は何も表示しない
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				error.message === "USER_CANCELED"
			) {
				console.log("ユーザーがApple Sign-Inをキャンセルしました");
			} else {
				Toast.show({
					type: "error",
					text1: "Apple ログイン失敗",
					text2: "Apple ログインに失敗しました",
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
					<View className="flex-1 justify-center p-8">
						<Text
							className="text-4xl font-noto-bold text-center mb-10"
							style={{ color: isDark ? "#d1d5db" : "#000000" }}
						>
							Todo App
						</Text>
						<Text
							className="text-2xl font-noto-bold mb-6"
							style={{ color: isDark ? "#f3f4f6" : "#000000" }}
						>
							ログイン
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
									placeholder="パスワード"
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

						{isLockedOut && (
							<View className="mb-4 bg-red-100 border border-red-400 rounded-md p-4">
								<Text className="text-red-700 font-noto-bold text-base text-center mb-1">
									⚠️ ログインが一時停止されています
								</Text>
								<Text className="text-red-600 font-noto-regular text-sm text-center">
									セキュリティのため、{Math.floor(remainingTime / 60)}分{remainingTime % 60}
									秒後に再試行できます
								</Text>
							</View>
						)}

						<TouchableHighlight
							onPress={handleLogin}
							disabled={isLoading || isLockedOut}
							activeOpacity={0.7}
							className={`rounded-md p-4 mb-4 ${isLockedOut ? "bg-gray-400" : "bg-blue-500"}`}
							underlayColor={isLockedOut ? "#9ca3af" : "#3b82f6"}
						>
							{isLoading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="text-white text-center font-noto-bold text-xl">ログイン</Text>
							)}
						</TouchableHighlight>

						{/* パスワードを忘れた場合 */}
						<TouchableOpacity onPress={() => router.push("/forgot-password")} className="mb-4">
							<Text
								className="text-center font-noto-regular text-base"
								style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}
							>
								パスワードを忘れた場合
							</Text>
						</TouchableOpacity>

						{/* 区切り線 */}
						<View className="flex-row items-center my-4">
							<View className="flex-1 h-px bg-gray-300" />
							<Text
								className="mx-4 font-noto-regular"
								style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
							>
								または
							</Text>
							<View className="flex-1 h-px bg-gray-300" />
						</View>

						{/* Google Sign-Inボタン */}
						<TouchableHighlight
							onPress={handleGoogleSignIn}
							disabled={isLoading || isLockedOut}
							activeOpacity={0.7}
							className={`rounded-md p-4 mb-3 border-2 ${isLockedOut ? "bg-gray-100 border-gray-300" : "bg-white border-gray-300"}`}
							underlayColor="#f3f4f6"
						>
							<View className="flex-row items-center justify-center">
								<GoogleIcon size={24} />
								<Text
									className="ml-2 text-center font-noto-bold text-lg"
									style={{ color: isDark ? "#374151" : "#374151" }}
								>
									Googleでログイン
								</Text>
							</View>
						</TouchableHighlight>

						{/* Apple Sign-Inボタン (iOSのみ) */}
						{Platform.OS === "ios" && (
							<TouchableHighlight
								onPress={handleAppleSignIn}
								disabled={isLoading || isLockedOut}
								activeOpacity={0.7}
								className={`rounded-md p-4 mb-6 border-2 ${isLockedOut ? "bg-gray-100 border-gray-300" : "bg-black border-black"}`}
								underlayColor="#1f1f1f"
							>
								<View className="flex-row items-center justify-center">
									<Ionicons name="logo-apple" size={24} color="white" />
									<Text className="ml-2 text-center text-white font-noto-bold text-lg">
										Appleでログイン
									</Text>
								</View>
							</TouchableHighlight>
						)}

					<View className="flex-row items-center justify-center">
						<Text 
							className="font-noto-regular text-base"
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
						>
							アカウントをお持ちでない方は
						</Text>
						<Link href="/signup" asChild>
							<TouchableOpacity className="ml-2">
								<Text 
									className="font-noto-bold text-base"
									style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}
								>
									新規登録
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
