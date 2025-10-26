import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";

import { PraiseToast } from "@/components/PraiseToast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodoRefreshProvider } from "@/contexts/TodoRefreshContext";
import { saveNotificationHistory } from "@/services/notificationHistoryService";
import { getNotificationEnabled } from "@/services/userService";
import {
	NotoSansJP_400Regular,
	NotoSansJP_700Bold,
} from "@expo-google-fonts/noto-sans-jp";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { SplashScreen } from "expo-router";
import { useEffect, useRef } from "react";
import { LogBox } from "react-native";
import Toast from "react-native-toast-message";

// 開発中に表示される予期されたエラーメッセージを非表示にする
LogBox.ignoreLogs([
	"指定されたメールアドレスのユーザーが見つかりません",
	"Error inviting by email",
	"Internal React error: Expected static flag was missing",
]);

SplashScreen.preventAutoHideAsync();

// Toast の設定は再レンダーで参照が変わらないようモジュールスコープに定義
const toastConfig = {
	praise: PraiseToast,
};

function RootLayoutNav() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const notificationListener = useRef<ReturnType<
		typeof Notifications.addNotificationReceivedListener
	> | null>(null);
	const responseListener = useRef<ReturnType<
		typeof Notifications.addNotificationResponseReceivedListener
	> | null>(null);

	// 通知リスナーを設定
	useEffect(() => {
		// 通知を受信したときの処理
		notificationListener.current =
			Notifications.addNotificationReceivedListener(async (notification) => {
				if (!user) return;

				const { title, body, data } = notification.request.content;
				console.log("📬 通知を受信しました:", title);

				// 通知設定を確認
				const isEnabled = await getNotificationEnabled();
				if (!isEnabled) {
					console.log("⚠️ 通知がOFFのため、履歴に保存しません");
					return;
				}

				// 通知履歴を保存
				try {
					await saveNotificationHistory(
						user.uid,
						title || "通知",
						body || "",
						data as Record<string, unknown>
					);
				} catch (error) {
					console.error("通知履歴の保存エラー:", error);
				}
			});

		// 通知をタップしたときの処理
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener((response) => {
				console.log("👆 通知をタップしました:", response);
				// 必要に応じて画面遷移などを実装
			});

		return () => {
			if (notificationListener.current) {
				notificationListener.current.remove();
			}
			if (responseListener.current) {
				responseListener.current.remove();
			}
		};
	}, [user]);

	useEffect(() => {
		if (loading) {
			console.log("🔄 Router: 認証状態を読み込み中...");
			return;
		}

		const inAuthScreen = segments[0] === "login" || segments[0] === "signup";
		console.log("🔄 Router: 現在の状態", {
			isLoggedIn: !!user,
			currentScreen: segments[0] || "index",
			inAuthScreen,
		});

		// ログイン/サインアップ画面では認証チェックによる自動リダイレクトを行わない
		if (inAuthScreen) {
			console.log("⏭️ Router: 認証画面では自動リダイレクトをスキップ");
			return;
		}

		if (!user) {
			// ユーザーが未ログインの場合、ログイン画面へ
			console.log("➡️ Router: ログインページにリダイレクト");
			router.replace("/login");
		}
	}, [user, loading, segments, router]);

	if (loading) {
		return null;
	}

	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen name="login" options={{ headerShown: false }} />
			<Stack.Screen name="signup" options={{ headerShown: false }} />
		</Stack>
	);
}

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		NotoSansJP_400Regular,
		NotoSansJP_700Bold,
	});
	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);
	if (!fontsLoaded || fontError) {
		return null;
	}

	return (
		<ThemeProvider>
			<AuthProvider>
				<OrganizationProvider>
					<TodoRefreshProvider>
						<RootLayoutNav />
						<Toast position="top" topOffset={100} config={toastConfig} />
					</TodoRefreshProvider>
				</OrganizationProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
