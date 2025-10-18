import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Text, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function MyListScreen() {
	const [refreshKey, setRefreshKey] = useState(0);
	const { user, logout } = useAuth();

	const handleSave = () => {
		setRefreshKey((prev) => prev + 1);
	};

	const handleLogout = async () => {
		try {
			await logout();
			Toast.show({
				type: "success",
				text1: "ログアウト",
				text2: "ログアウトしました",
			});
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "エラー",
				text2: "ログアウトに失敗しました",
			});
		}
	};

	return (
		<SafeAreaView className="flex-1">
			<View className="flex-1 px-4 pt-4">
				<View className="flex-row justify-between items-center mb-4">
					<View>
						<Text className="text-2xl font-noto-bold">My List</Text>
						{user?.email && (
							<Text className="text-sm text-gray-600 font-noto-regular">
								{user.email}
							</Text>
						)}
					</View>
					<TouchableHighlight
						onPress={handleLogout}
						activeOpacity={0.7}
						className="bg-gray-500 rounded-md px-4 py-2"
						underlayColor="#6b7280"
					>
						<Text className="text-white font-noto-bold">ログアウト</Text>
					</TouchableHighlight>
				</View>
				<TodoForm onSave={handleSave} />
				<TodoTable refresh={refreshKey} isShared={false} />
			</View>
		</SafeAreaView>
	);
}

