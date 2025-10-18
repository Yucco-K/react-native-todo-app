import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SharedListScreen() {
	const { user } = useAuth();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();

	const handleSave = () => {
		triggerRefresh();
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
					<Text className="text-xs text-gray-500 font-noto-regular mt-1">
						他の人と共有するTodoをここで作成・管理できます
					</Text>
				</View>
				<TodoForm onSave={handleSave} isShared={true} />
				<TodoTable refresh={refreshTrigger} isShared={true} />
			</View>
		</SafeAreaView>
	);
}

