import { Stack } from "expo-router";
import "../global.css";

import {
	NotoSansJP_400Regular,
	NotoSansJP_700Bold,
} from "@expo-google-fonts/noto-sans-jp";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

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
		<>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
			</Stack>
			<Toast position="top" topOffset={60} />
		</>
	);
}
