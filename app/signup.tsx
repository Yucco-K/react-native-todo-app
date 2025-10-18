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
const signupSchema = z
	.object({
		email: z.string().email("有効なメールアドレスを入力してください"),
		password: z.string().min(6, "パスワードは6文字以上で入力してください"),
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

	const { signUp } = useAuth();
	const router = useRouter();

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
				if (
					field === "email" ||
					field === "password" ||
					field === "confirmPassword"
				) {
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
			Toast.show({
				type: "success",
				text1: "登録成功",
				text2: "アカウントを作成しました",
			});
			router.replace("/");
		} catch (error) {
			console.error(error);
			let errorMessage = "登録に失敗しました";

			if (error && typeof error === "object" && "code" in error) {
				if (error.code === "auth/email-already-in-use") {
					errorMessage = "このメールアドレスは既に使用されています";
				} else if (error.code === "auth/weak-password") {
					errorMessage = "パスワードが弱すぎます";
				} else if (error.code === "auth/invalid-email") {
					errorMessage = "無効なメールアドレスです";
				}
			}

			Toast.show({
				type: "error",
				text1: "登録失敗",
				text2: errorMessage,
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
					<Text className="text-xl font-noto-bold mb-6">新規登録</Text>

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

					<View className="mb-4">
						<TextInput
							className="border-2 border-gray-300 rounded-md p-3 font-noto-regular"
							placeholder="パスワード（6文字以上）"
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

					<View className="mb-6">
						<TextInput
							className="border-2 border-gray-300 rounded-md p-3 font-noto-regular"
							placeholder="パスワード（確認）"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
							autoCapitalize="none"
							autoComplete="password"
						/>
						{errors.confirmPassword && (
							<Text className="text-red-500 text-sm mt-1 font-noto-regular">
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
							<Text className="text-white text-center font-noto-bold text-lg">
								登録
							</Text>
						)}
					</TouchableHighlight>

					<View className="flex-row justify-center">
						<Text className="text-gray-600 font-noto-regular">
							既にアカウントをお持ちの方は{" "}
						</Text>
						<Link href="/login" asChild>
							<TouchableHighlight>
								<Text className="text-blue-500 font-noto-bold">
									ログイン
								</Text>
							</TouchableHighlight>
						</Link>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

