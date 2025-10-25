import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import type { Todo } from "@/types/Todo";

type ReminderNotificationModalProps = {
	visible: boolean;
	reminders: Todo[];
	onClose: () => void;
};

export default function ReminderNotificationModal({
	visible,
	reminders,
	onClose,
}: ReminderNotificationModalProps) {
	const { isDark } = useTheme();

	const formatDateTime = (date: Date | undefined) => {
		if (!date) return "";
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${month}月${day}日 ${hours}:${minutes}`;
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={onClose}>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<View
						className="mx-4 rounded-2xl p-6 w-[340px] max-h-[500px]"
						style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
					>
						{/* タイトル */}
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-row items-center">
								<Ionicons
									name="notifications"
									size={28}
									color={isDark ? "#f59e0b" : "#f59e0b"}
								/>
								<Text
									className="ml-2 text-xl font-noto-bold"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									リマインド通知
								</Text>
							</View>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close" size={24} color={isDark ? "#9ca3af" : "#6b7280"} />
							</TouchableOpacity>
						</View>

						{/* メッセージ */}
						<View className="mb-4">
							<Text
								className="font-noto-regular text-base text-center"
								style={{ color: isDark ? "#d1d5db" : "#374151" }}
							>
								{reminders.length}件のリマインドがあります
							</Text>
						</View>

						{/* リマインドリスト */}
						<ScrollView className="mb-4" style={{ maxHeight: 280 }}>
							{reminders.map((todo) => (
								<View
									key={todo.id}
									className="mb-3 p-4 rounded-lg"
									style={{
										backgroundColor: isDark ? "#374151" : "#f3f4f6",
										borderLeftWidth: 4,
										borderLeftColor: "#f59e0b",
									}}
								>
									<View className="flex-row items-start">
										<View className="flex-1">
											<Text
												className="font-noto-bold text-base mb-1"
												style={{ color: isDark ? "#f3f4f6" : "#111827" }}
											>
												{todo.title}
											</Text>
											{todo.content && (
												<Text
													className="font-noto-regular text-sm mb-2"
													style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
													numberOfLines={2}
												>
													{todo.content}
												</Text>
											)}
											<View className="flex-row items-center">
												<Ionicons
													name="time-outline"
													size={14}
													color={isDark ? "#9ca3af" : "#9ca3af"}
												/>
												<Text
													className="ml-1 font-noto-regular text-xs"
													style={{ color: isDark ? "#9ca3af" : "#9ca3af" }}
												>
													{formatDateTime(todo.remindAt)}
												</Text>
											</View>
										</View>
									</View>
								</View>
							))}
						</ScrollView>

						{/* わかったボタン */}
						<TouchableOpacity
							onPress={onClose}
							className="bg-blue-500 rounded-lg p-4 items-center"
							activeOpacity={0.7}
						>
							<Text className="text-white font-noto-bold text-base">わかった</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

