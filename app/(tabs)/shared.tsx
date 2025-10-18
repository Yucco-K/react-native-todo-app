import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SharedListScreen() {
	const [refreshKey, setRefreshKey] = useState(0);
	const { user } = useAuth();

	const handleSave = () => {
		setRefreshKey((prev) => prev + 1);
	};

	return (
		<SafeAreaView className="flex-1">
			<View className="flex-1 px-4 pt-4">
				<View className="mb-4">
					<Text className="text-2xl font-noto-bold">Shared List</Text>
					{user?.email && (
						<Text className="text-sm text-gray-600 font-noto-regular">
							{user.email}
						</Text>
					)}
				</View>
				<TodoForm onSave={handleSave} isShared={true} />
				<TodoTable refresh={refreshKey} isShared={true} />
			</View>
		</SafeAreaView>
	);
}

