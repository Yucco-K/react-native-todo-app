import {
	NotoSansJP_400Regular,
	NotoSansJP_700Bold,
	useFonts,
} from "@expo-google-fonts/noto-sans-jp";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";
import { PraiseToast } from "@/components/PraiseToast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodoRefreshProvider, useTodoRefresh } from "@/contexts/TodoRefreshContext";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Toast の設定は再レンダーで参照が変わらないようモジュールスコープに定義
const toastConfig = {
	praise: PraiseToast,
};

function RootLayoutNav() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const { triggerRefresh } = useTodoRefresh();
	const notificationListener = useRef<ReturnType<
		typeof Notifications.addNotificationReceivedListener
	> | null>(null);
	const responseListener = useRef<ReturnType<
		typeof Notifications.addNotificationResponseReceivedListener
	> | null>(null);

	// 通知リスナーを設定
	useEffect(() => {
		// 通知を受信したときの処理
		notificationListener.current = Notifications.addNotificationReceivedListener(
			async (notification) => {
				if (!user) return;

				const { title, data } = notification.request.content;
				console.log("📬 通知を受信しました:", {
					title,
					受信ユーザー: user.email,
					受信ユーザーID: user.uid,
					"data.actionUserId": data?.actionUserId,
					"data.type": data?.type,
				});

				if (data?.type === "reminder") {
					console.log("🔄 通知受信: リマインドのためTodoリストを更新");
					triggerRefresh();
				}

				// 通知履歴はサーバー側（sendPushNotification）で保存されるため、
				// ここでは保存しない（重複を防ぐため）
			},
		);

		// 通知をタップしたときの処理
		responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log("👆 通知をタップしました:", response);
			const notificationData = response.notification.request.content.data ?? {};
			if (notificationData?.type === "reminder") {
				console.log("🔄 通知タップ: リマインドのためTodoリストを更新");
				triggerRefresh();
			}
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
	}, [user, triggerRefresh]);

	useEffect(() => {
		if (loading) {
			console.log("🔄 Router: 認証状態を読み込み中...");
			return;
		}

		const inAuthScreen = segments[0] === "login" || segments[0] === "signup";
		console.log("========================================");
		console.log("🔄 Router: 現在の状態");
		console.log("📋 isLoggedIn:", !!user);
		console.log("📋 user:", user);
		console.log("📋 user.email:", user?.email);
		console.log("📋 currentScreen:", segments[0] || "index");
		console.log("📋 inAuthScreen:", inAuthScreen);
		console.log("========================================");

		if (!user) {
			// ユーザーが未ログインで、認証画面にいない場合、ログイン画面へ
			if (!inAuthScreen) {
				console.log("========================================");
				console.log("➡️ Router: ログインページにリダイレクト");
				console.log("========================================");
				router.replace("/login");
			}
		} else {
			// ユーザーがログイン済みで、認証画面にいる場合、ホーム画面へ
			if (inAuthScreen) {
				console.log("========================================");
				console.log("➡️ Router: ログイン成功 - ホームページにリダイレクト");
				console.log("========================================");
				// 少し遅延を入れて確実にリダイレクト
				setTimeout(() => {
					router.replace("/");
				}, 100);
			} else {
				console.log("========================================");
				console.log("✅ Router: ユーザーはログイン済み - リダイレクトなし");
				console.log("========================================");
			}
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
