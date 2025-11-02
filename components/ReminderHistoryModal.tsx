import { useTheme } from "@/contexts/ThemeContext";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type ReminderHistoryModalProps = {
	visible: boolean;
	reminders: Todo[];
	onClose: () => void;
	onDelete: (id: string) => void;
};

export default function ReminderHistoryModal({
	visible,
	reminders,
	onClose,
	onDelete,
}: ReminderHistoryModalProps) {
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
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable
				className="flex-1 bg-black/75 justify-center items-center"
				onPress={onClose}
			>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<View
						className="mx-4 rounded-2xl p-6 w-[340px] max-h-[500px]"
						style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
					>
						{/* タイトル */}
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-row items-center">
								<Ionicons
									name="time"
									size={28}
									color={isDark ? "#60a5fa" : "#3b82f6"}
								/>
								<Text
									className="ml-2 text-xl font-noto-bold"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									リマインド履歴
								</Text>
							</View>
							<TouchableOpacity onPress={onClose}>
								<Ionicons
									name="close"
									size={24}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</TouchableOpacity>
						</View>

						{/* メッセージ */}
						<View className="mb-4">
							<Text
								className="font-noto-regular text-base text-center"
								style={{ color: isDark ? "#d1d5db" : "#374151" }}
							>
								{reminders.length > 0
									? `${reminders.length}件のリマインド履歴`
									: "リマインド履歴はありません"}
							</Text>
						</View>

						{/* リマインドリスト */}
						{reminders.length > 0 ? (
							<ScrollView
								className="mb-4"
								style={{ maxHeight: 320 }}
								showsVerticalScrollIndicator={true}
							>
								{reminders.map((todo) => (
									<View
										key={todo.id}
										className="mb-3 p-4 rounded-lg flex-row items-start"
										style={{
											backgroundColor: isDark ? "#374151" : "#f3f4f6",
											borderLeftWidth: 4,
											borderLeftColor: todo.remindNotified
												? isDark
													? "#6b7280"
													: "#9ca3af"
												: "#f59e0b",
										}}
									>
										{/* 削除ボタン */}
										<TouchableOpacity
											onPress={() => onDelete(todo.id)}
											className="mr-3 mt-1"
										>
											<Ionicons
												name="close-circle"
												size={20}
												color={isDark ? "#ef4444" : "#dc2626"}
											/>
										</TouchableOpacity>

										{/* Todo情報 */}
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
												{typeof todo.remindNotified === "boolean" && (
													<Text
														className="ml-2 font-noto-regular text-xs"
														style={{
															color: todo.remindNotified
																? isDark
																	? "#9ca3af"
																	: "#6b7280"
																: "#f59e0b",
														}}
													>
														{todo.remindNotified ? "通知済み" : "未通知"}
													</Text>
												)}
											</View>
										</View>
									</View>
								))}
							</ScrollView>
						) : (
							<View className="py-8">
								<Text
									className="text-center font-noto-regular text-base"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									リマインドを設定すると
									{"\n"}
									ここに履歴が表示されます
								</Text>
							</View>
						)}

						{/* 閉じるボタン */}
						<TouchableOpacity
							onPress={onClose}
							className="bg-blue-500 rounded-lg p-4 items-center"
							activeOpacity={0.7}
						>
							<Text className="text-white font-noto-bold text-base">
								閉じる
							</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
