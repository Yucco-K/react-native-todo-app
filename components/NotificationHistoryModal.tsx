import { useTheme } from "@/contexts/ThemeContext";
import type { NotificationHistory } from "@/services/notificationHistoryService";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type NotificationHistoryModalProps = {
	visible: boolean;
	notifications: NotificationHistory[];
	onClose: () => void;
	onDelete: (notificationId: string) => void;
};

export default function NotificationHistoryModal({
	visible,
	notifications,
	onClose,
	onDelete,
}: NotificationHistoryModalProps) {
	const { isDark } = useTheme();
	const [selectedNotification, setSelectedNotification] =
		useState<NotificationHistory | null>(null);

	const handleNotificationPress = (notification: NotificationHistory) => {
		setSelectedNotification(notification);
	};

	const handleCloseDetail = () => {
		setSelectedNotification(null);
	};

	const renderNotificationItem = ({ item }: { item: NotificationHistory }) => (
		<View
			className="flex-row items-center justify-between py-3 px-4 border-b"
			style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
		>
			<TouchableOpacity
				className="flex-1 mr-3"
				onPress={() => handleNotificationPress(item)}
			>
				<Text
					className="font-noto-bold text-base mb-1"
					style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
					numberOfLines={1}
				>
					{item.title}
				</Text>
				<Text
					className="font-noto-regular text-sm"
					style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
				>
					{item.createdAt.toLocaleString()}
				</Text>
			</TouchableOpacity>
		<TouchableOpacity
			onPress={() => {
				Alert.alert("通知削除", "この通知を削除しますか？", [
					{ text: "キャンセル", style: "cancel" },
					{
						text: "削除",
						style: "destructive",
						onPress: () => onDelete(item.id),
					},
				]);
			}}
			className="p-2"
		>
			<Ionicons
				name="close-circle"
				size={24}
				color={isDark ? "#ef4444" : "#dc2626"}
			/>
		</TouchableOpacity>
		</View>
	);

	return (
		<>
			{/* 通知履歴リストモーダル */}
			<Modal
				visible={visible && !selectedNotification}
				transparent
				animationType="slide"
				onRequestClose={onClose}
			>
				<Pressable className="flex-1 bg-black/75 justify-end" onPress={onClose}>
					<Pressable
						className="rounded-t-3xl overflow-hidden"
						style={{
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
							maxHeight: "80%",
						}}
						onPress={(e) => e.stopPropagation()}
					>
						<View className="p-6">
							<View className="flex-row items-center justify-between mb-4">
								<Text
									className="font-noto-bold text-2xl"
									style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
								>
									通知履歴
								</Text>
								<TouchableOpacity onPress={onClose}>
									<Ionicons
										name="close"
										size={28}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</TouchableOpacity>
							</View>

							{notifications.length === 0 ? (
								<View className="py-8">
									<Text
										className="font-noto-regular text-center text-base"
										style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
									>
										通知履歴がありません
									</Text>
								</View>
							) : (
								<FlatList
									data={notifications}
									renderItem={renderNotificationItem}
									keyExtractor={(item) => item.id}
									style={{ maxHeight: 400 }}
									showsVerticalScrollIndicator={true}
								/>
							)}
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* 通知詳細モーダル */}
			<Modal
				visible={visible && selectedNotification !== null}
				transparent
				animationType="fade"
				onRequestClose={handleCloseDetail}
			>
				<Pressable
					className="flex-1 bg-black/75 justify-center items-center p-6"
					onPress={handleCloseDetail}
				>
					<Pressable
						className="rounded-2xl p-6 w-full max-w-md"
						style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
						onPress={(e) => e.stopPropagation()}
					>
						<View className="flex-row items-center justify-between mb-4">
							<Text
								className="font-noto-bold text-xl flex-1"
								style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
							>
								通知詳細
							</Text>
							<TouchableOpacity onPress={handleCloseDetail}>
								<Ionicons
									name="close"
									size={24}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							style={{ maxHeight: 400 }}
							showsVerticalScrollIndicator={true}
						>
							<View className="mb-4">
								<Text
									className="font-noto-bold text-sm mb-1"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									タイトル
								</Text>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
								>
									{selectedNotification?.title}
								</Text>
							</View>

							<View className="mb-4">
								<Text
									className="font-noto-bold text-sm mb-1"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									内容
								</Text>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
								>
									{selectedNotification?.body}
								</Text>
							</View>

							<View className="mb-4">
								<Text
									className="font-noto-bold text-sm mb-1"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									受信日時
								</Text>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
								>
									{selectedNotification?.createdAt.toLocaleString()}
								</Text>
							</View>
						</ScrollView>

						<TouchableOpacity
							className="mt-4 py-3 rounded-lg items-center"
							style={{ backgroundColor: isDark ? "#3b82f6" : "#2563eb" }}
							onPress={handleCloseDetail}
						>
							<Text className="font-noto-bold text-white text-base">
								閉じる
							</Text>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
