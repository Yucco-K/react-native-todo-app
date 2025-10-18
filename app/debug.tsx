import { useAuth } from "@/contexts/AuthContext";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DebugScreen() {
	const { user } = useAuth();

	return (
		<SafeAreaView className="flex-1">
			<View className="p-4">
				<Text className="text-xl font-noto-bold mb-4">デバッグ情報</Text>
				<Text className="font-noto-regular">Email: {user?.email}</Text>
				<Text className="font-noto-regular">UID: {user?.uid}</Text>
			</View>
		</SafeAreaView>
	);
}
