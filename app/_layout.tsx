import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";

import { PraiseToast } from "@/components/PraiseToast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { TodoRefreshProvider } from "@/contexts/TodoRefreshContext";
import {
	NotoSansJP_400Regular,
	NotoSansJP_700Bold,
} from "@expo-google-fonts/noto-sans-jp";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import Toast from "react-native-toast-message";

// 開発中に表示される予期されたエラーメッセージを非表示にする
LogBox.ignoreLogs([
	"指定されたメールアドレスのユーザーが見つかりません",
	"Error inviting by email",
]);

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

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

	const toastConfig = {
		praise: PraiseToast,
	};

	return (
		<AuthProvider>
			<OrganizationProvider>
				<TodoRefreshProvider>
					<RootLayoutNav />
					<Toast position="top" topOffset={100} config={toastConfig} />
				</TodoRefreshProvider>
			</OrganizationProvider>
		</AuthProvider>
	);
}
