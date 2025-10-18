import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
	NotoSansJP_400Regular,
	NotoSansJP_700Bold,
} from "@expo-google-fonts/noto-sans-jp";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

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

		if (!user && !inAuthScreen) {
			// ユーザーが未ログインの場合、ログイン画面へ
			console.log("➡️ Router: ログインページにリダイレクト");
			router.replace("/login");
		} else if (user && inAuthScreen) {
			// ユーザーがログイン済みの場合、ホーム画面へ
			console.log("➡️ Router: ホーム画面にリダイレクト");
			router.replace("/");
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
		<AuthProvider>
			<RootLayoutNav />
			<Toast position="top" topOffset={60} />
		</AuthProvider>
	);
}
