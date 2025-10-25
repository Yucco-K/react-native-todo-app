import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

const STORAGE_KEY_FAILED_ATTEMPTS = "login_failed_attempts";
const STORAGE_KEY_LOCKOUT_TIME = "login_lockout_time";
const MAX_ATTEMPTS = 7;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10分

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{}
	);
	const [isLockedOut, setIsLockedOut] = useState(false);
	const [remainingTime, setRemainingTime] = useState(0); // 秒単位

	const { signIn } = useAuth();
	const router = useRouter();

	const checkLockoutStatus = useCallback(async () => {
		try {
			const lockoutTimeStr = await AsyncStorage.getItem(
				STORAGE_KEY_LOCKOUT_TIME
			);
			if (lockoutTimeStr) {
				const lockoutTime = Number.parseInt(lockoutTimeStr, 10);
				const now = Date.now();
				const timeRemaining = lockoutTime - now;

				if (timeRemaining > 0) {
					setIsLockedOut(true);
					setRemainingTime(Math.ceil(timeRemaining / 1000));
				} else {
					// ロックアウト期間が過ぎた場合、カウントをリセット
					await AsyncStorage.multiRemove([
						STORAGE_KEY_FAILED_ATTEMPTS,
						STORAGE_KEY_LOCKOUT_TIME,
					]);
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
			const attemptsStr = await AsyncStorage.getItem(
				STORAGE_KEY_FAILED_ATTEMPTS
			);
			const attempts = attemptsStr ? Number.parseInt(attemptsStr, 10) : 0;
			const newAttempts = attempts + 1;

			if (newAttempts >= MAX_ATTEMPTS) {
				// 7回目の失敗でロックアウト
				const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
				await AsyncStorage.setItem(
					STORAGE_KEY_LOCKOUT_TIME,
					lockoutTime.toString()
				);
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
				await AsyncStorage.setItem(
					STORAGE_KEY_FAILED_ATTEMPTS,
					newAttempts.toString()
				);
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
			await AsyncStorage.multiRemove([
				STORAGE_KEY_FAILED_ATTEMPTS,
				STORAGE_KEY_LOCKOUT_TIME,
			]);
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

				// エラーメッセージがある場合（ターミナルログに出力）
				if ("message" in error && typeof error.message === "string") {
					console.log("詳細:", error.message);
				}
			}

			// 認証エラーの場合のみ失敗回数をカウント
			if (isAuthError) {
				await incrementFailedAttempts();
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

	return (
		<SafeAreaView className="flex-1 bg-white">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<View className="flex-1 justify-center px-8">
					<Text className="text-4xl font-noto-bold text-center mb-8">
						Todo App
					</Text>
					<Text className="text-2xl font-noto-bold mb-6">ログイン</Text>

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
							<Text className="text-red-500 text-base mt-1 font-noto-regular">
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
								セキュリティのため、{Math.floor(remainingTime / 60)}分
								{remainingTime % 60}
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
							<Text className="text-white text-center font-noto-bold text-xl">
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
