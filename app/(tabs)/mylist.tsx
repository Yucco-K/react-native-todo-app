import NicknameModal from "@/components/NicknameModal";
import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import { useAuth } from "@/contexts/AuthContext";
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
	const { refreshTrigger, triggerRefresh } = useTodoRefresh();
	const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);

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

					<TodoForm onSave={handleSave} />
					<TodoTable refresh={refreshTrigger} isShared={false} />
				</View>
			</TouchableWithoutFeedback>

			<NicknameModal
				visible={isNicknameModalVisible}
				currentNickname={nickname || ""}
				onClose={() => setIsNicknameModalVisible(false)}
				onSave={updateNickname}
			/>
		</SafeAreaView>
	);
}
