import AddTodoModal from "@/components/AddTodoModal";
import NicknameModal from "@/components/NicknameModal";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTodoRefresh } from "@/contexts/TodoRefreshContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	Keyboard,
	Text,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function MyListScreen() {
	const { user, nickname, logout, updateNickname } = useAuth();
	const { selectedOrganization } = useOrganization();
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();
	const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);

	// ログインしていない場合は何も表示しない
	if (!user) {
		return null;
	}

	const handleSave = () => {
		triggerRefresh();
	};

	const handleLogout = async () => {
		try {
			await logout();
			// Toast.show({
			// 	type: "success",
			// 	text1: "ログアウト",
			// 	text2: "ログアウトしました",
			// });
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
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 px-4 pt-4">
					<View className="flex-row justify-between items-center mb-4">
						<View className="flex-1">
							<Text className="text-3xl font-noto-bold">My List</Text>
							{nickname ? (
								<TouchableOpacity
									onPress={() => setIsNicknameModalVisible(true)}
									className="flex-row items-center mt-1"
								>
									<Text className="text-lg text-blue-600 font-noto-bold">
										{nickname}さん
									</Text>
									<Ionicons
										name="create-outline"
										size={16}
										color="#2563eb"
										className="ml-1"
									/>
								</TouchableOpacity>
							) : (
								<>
									<TouchableOpacity
										onPress={() => setIsNicknameModalVisible(true)}
										className="flex-row items-center mt-1"
									>
										<Text className="text-base text-gray-500 font-noto-regular">
											ニックネームを設定
										</Text>
										<Ionicons
											name="add-circle-outline"
											size={16}
											color="#6b7280"
											className="ml-1"
										/>
									</TouchableOpacity>
									{user?.email && (
										<Text className="text-sm text-gray-500 font-noto-regular mt-1">
											{user.email}
										</Text>
									)}
								</>
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

					<TodoTable
					refresh={refreshTrigger}
					organizationId={selectedOrganization?.id || null}
				/>

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
				organizationId={selectedOrganization?.id || null}
			/>

			<NicknameModal
				visible={isNicknameModalVisible}
				currentNickname={nickname || ""}
				onClose={() => setIsNicknameModalVisible(false)}
				onSave={updateNickname}
			/>
		</SafeAreaView>
	);
}
