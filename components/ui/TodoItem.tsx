import { useAuth } from "@/contexts/AuthContext";
import { TODO_CATEGORIES } from "@/types/Category";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
	type GestureResponderEvent,
	Modal,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type TodoItemProps = Todo & {
	onToggleComplete?: (id: string) => void;
	onEdit?: (todo: Todo) => void;
	onDelete?: (id: string) => void;
	onSetReminder?: (todo: Todo) => void;
	isDark?: boolean;
};

export default function TodoItem({
	id,
	userId,
	title,
	content,
	completed,
	shared,
	organizationId,
	category,
	remindAt,
	remindNotified,
	onToggleComplete,
	onEdit,
	onDelete,
	onSetReminder,
	isDark = false,
}: TodoItemProps) {
	const [menuVisible, setMenuVisible] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);
	const { user } = useAuth();

	// 現在のユーザーが作成者かどうか
	const isOwner = user?.uid === userId;

	return (
		<View
			className="py-2 border-b"
			style={{ borderColor: isDark ? "#4b5563" : "#e5e7eb" }}
		>
			<View className="flex-row items-center justify-between">
				{/* 左側: チェックボックスとTodo内容 */}
				<TouchableOpacity
					className="flex-row items-center flex-1 mr-2"
					onPress={() => setIsExpanded(!isExpanded)}
					activeOpacity={0.7}
				>
					{/* 完了チェックボックス */}
					<View style={{ width: 48 }} className="items-center mr-2">
						<TouchableOpacity
							onPress={(e: GestureResponderEvent) => {
								e.stopPropagation();
								onToggleComplete?.(id);
							}}
						>
							<View
								className={`w-9 h-9 rounded border-2 items-center justify-center ${
									completed
										? "bg-green-500 border-green-500"
										: "border-gray-400"
								}`}
							>
								{completed && (
									<Text className="text-white font-noto-bold text-2xl">✓</Text>
								)}
							</View>
						</TouchableOpacity>
					</View>

					{/* タイトルと内容 */}
					<View className="flex-1">
						<Text
							className="font-noto-bold text-xl"
							style={{
								color: completed
									? isDark
										? "#9ca3af"
										: "#9ca3af"
									: isDark
										? "#e5e7eb"
										: "#000000",
								textDecorationLine: completed ? "line-through" : "none",
							}}
							numberOfLines={1}
						>
							{title}
						</Text>
						{isExpanded && (
							<>
								{/* カテゴリバッジ */}
								{category && (
									<View className="mt-2 flex-row">
										<View className="bg-blue-100 px-3 py-1 rounded-full">
											<Text className="text-blue-700 font-noto-bold text-base">
												{TODO_CATEGORIES[
													category as keyof typeof TODO_CATEGORIES
												] || "その他"}
											</Text>
										</View>
									</View>
								)}

								<Text
									className="font-noto-regular text-lg mt-2"
									style={{
										color: completed
											? isDark
												? "#9ca3af"
												: "#9ca3af"
											: isDark
												? "#e5e7eb"
												: "#6b7280",
										textDecorationLine: completed ? "line-through" : "none",
									}}
								>
									{content}
								</Text>

								{/* リマインド情報 */}
								{remindAt && (
									<View className="mt-3 flex-row items-center">
										<Ionicons
											name="notifications"
											size={18}
											color={
												remindNotified
													? isDark
														? "#9ca3af"
														: "#6b7280"
													: "#f59e0b"
											}
										/>
										<Text
											className="ml-2 font-noto-regular text-base"
											style={{ color: isDark ? "#e5e7eb" : "#374151" }}
										>
											リマインド: {new Date(remindAt).toLocaleString()}
										</Text>
										{typeof remindNotified === "boolean" && (
											<Text
												className="ml-2 font-noto-regular text-sm"
												style={{
													color: remindNotified
														? isDark
															? "#9ca3af"
															: "#6b7280"
														: "#f59e0b",
												}}
											>
												{remindNotified ? "通知済み" : "未通知"}
											</Text>
										)}
									</View>
								)}
							</>
						)}
					</View>
				</TouchableOpacity>

				{/* 右側: 3点メニューボタン */}
				<TouchableOpacity
					onPress={(e: GestureResponderEvent) => {
						e.stopPropagation();
						setMenuVisible(true);
					}}
					className="p-2"
				>
					<Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
				</TouchableOpacity>
			</View>

			{/* メニューモーダル */}
			<Modal
				visible={menuVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setMenuVisible(false)}
			>
				<Pressable
					className="flex-1 bg-black/50"
					onPress={() => setMenuVisible(false)}
				>
					<View className="flex-1 items-end justify-start pt-20 pr-4">
						<View
							className="rounded-lg shadow-lg overflow-hidden min-w-[180px]"
							style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
						>
							{/* 編集ボタン - 作成者のみ */}
							{isOwner && (
								<Pressable
									className="flex-row items-center px-4 py-3"
									style={{
										borderBottomWidth: 1,
										borderBottomColor: isDark ? "#374151" : "#e5e7eb",
									}}
									onPress={() => {
										onEdit?.({
											id,
											userId,
											title,
											content,
											completed,
											shared,
											organizationId,
											category,
											remindAt,
											remindNotified,
										});
										setMenuVisible(false);
									}}
								>
									<Ionicons
										name="create-outline"
										size={22}
										color={isDark ? "#60a5fa" : "#3b82f6"}
									/>
									<Text
										className="ml-3 font-noto-regular text-base"
										style={{ color: isDark ? "#d1d5db" : "#374151" }}
									>
										編集
									</Text>
								</Pressable>
							)}

							{/* リマインド設定ボタン - 作成者のみ & 未完了のみ */}
							{isOwner && !completed && (
								<Pressable
									className="flex-row items-center px-4 py-3"
									style={{
										borderBottomWidth: 1,
										borderBottomColor: isDark ? "#374151" : "#e5e7eb",
									}}
									onPress={() => {
										onSetReminder?.({
											id,
											userId,
											title,
											content,
											completed,
											shared,
											organizationId,
											category,
											remindAt,
											remindNotified,
										});
										setMenuVisible(false);
									}}
								>
									<Ionicons
										name={remindAt ? "notifications" : "notifications-outline"}
										size={22}
										color={
											remindAt ? "#f59e0b" : isDark ? "#60a5fa" : "#3b82f6"
										}
									/>
									<Text
										className="ml-3 font-noto-regular text-base"
										style={{
											color: remindAt
												? "#f59e0b"
												: isDark
													? "#d1d5db"
													: "#374151",
										}}
									>
										{remindAt ? "リマインド変更" : "リマインド設定"}
									</Text>
								</Pressable>
							)}

							{/* 削除ボタン - 作成者のみ */}
							{isOwner && (
								<Pressable
									className="flex-row items-center px-4 py-3"
									onPress={() => {
										onDelete?.(id);
										setMenuVisible(false);
									}}
								>
									<Ionicons name="trash-outline" size={22} color="#ef4444" />
									<Text className="ml-3 font-noto-regular text-red-500 text-base">
										削除
									</Text>
								</Pressable>
							)}

							{/* 作成者でない場合のメッセージ */}
							{!isOwner && (
								<View className="px-4 py-4">
									<Text className="font-noto-regular text-gray-500 text-sm text-center">
										この操作は作成者のみ可能です
									</Text>
								</View>
							)}
						</View>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}
