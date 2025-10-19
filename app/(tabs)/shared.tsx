import AddTodoModal from "@/components/AddTodoModal";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	Keyboard,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SharedListScreen() {
	const { user, nickname } = useAuth();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);

	const handleSave = () => {
		triggerRefresh();
	};

	return (
		<SafeAreaView className="flex-1">
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 px-4 pt-4">
					<View className="mb-4">
						<Text className="text-3xl font-noto-bold">Shared List</Text>
						{nickname ? (
							<Text className="text-base text-blue-600 font-noto-bold">
								{nickname}さん
							</Text>
						) : (
							user?.email && (
								<Text className="text-base text-gray-600 font-noto-regular">
									{user.email}
								</Text>
							)
						)}
						<Text className="text-sm text-gray-500 font-noto-regular mt-1">
							他の人と共有するTodoをここで作成・管理できます
						</Text>
					</View>

					<TodoTable refresh={refreshTrigger} isShared={true} />

					{/* Floating Action Button */}
					<TouchableOpacity
						onPress={() => setIsAddModalVisible(true)}
						className="absolute bottom-6 right-6 bg-blue-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
						activeOpacity={0.8}
					>
						<Ionicons name="add" size={32} color="white" />
					</TouchableOpacity>
				</View>
			</TouchableWithoutFeedback>

			<AddTodoModal
				visible={isAddModalVisible}
				onClose={() => setIsAddModalVisible(false)}
				onSave={handleSave}
				isShared={true}
			/>
		</SafeAreaView>
	);
}
