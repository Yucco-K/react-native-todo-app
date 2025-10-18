import { useAuth } from "@/contexts/AuthContext";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
	Modal,
	Pressable,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type TodoItemProps = Todo & {
	onToggleComplete?: (id: string) => void;
	onToggleShared?: (id: string, currentShared: boolean) => void;
	onEdit?: (todo: Todo) => void;
	onDelete?: (id: string) => void;
	showShareToggle?: boolean;
};

export default function TodoItem({
	id,
	userId,
	title,
	content,
	completed,
	shared,
	onToggleComplete,
	onToggleShared,
	onEdit,
	onDelete,
	showShareToggle = false,
}: TodoItemProps) {
	const [menuVisible, setMenuVisible] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);
	const { user } = useAuth();

	// 現在のユーザーが作成者かどうか
	const isOwner = user?.uid === userId;

	return (
		<View className="py-2 border-b border-gray-200">
			<View className="flex-row items-center justify-between">
				{/* 左側: チェックボックスとTodo内容 */}
				<TouchableOpacity
					className="flex-row items-center flex-1 mr-2"
					onPress={() => setIsExpanded(!isExpanded)}
					activeOpacity={0.7}
				>
					{/* 完了チェックボックス */}
					<View style={{ width: 32 }} className="items-center mr-2">
						<TouchableOpacity
							onPress={(e) => {
								e.stopPropagation();
								onToggleComplete?.(id);
							}}
						>
							<View
								className={`w-6 h-6 rounded border-2 items-center justify-center ${
									completed
										? "bg-green-500 border-green-500"
										: "border-gray-400"
								}`}
							>
								{completed && (
									<Text className="text-white font-noto-bold text-lg">✓</Text>
								)}
							</View>
						</TouchableOpacity>
					</View>

					{/* タイトルと内容 */}
					<View className="flex-1">
						<Text
							className={`font-noto-regular text-base ${
								completed ? "line-through text-gray-400" : ""
							}`}
							numberOfLines={1}
						>
							{title}
						</Text>
						{isExpanded && (
							<Text
								className={`font-noto-regular text-sm text-gray-500 mt-2 ${
									completed ? "line-through text-gray-400" : ""
								}`}
							>
								{content}
							</Text>
						)}
					</View>
				</TouchableOpacity>

				{/* 右側: 3点メニューボタン */}
				<TouchableOpacity
					onPress={(e) => {
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
						<View className="bg-white rounded-lg shadow-lg overflow-hidden min-w-[180px]">
							{/* 共有トグル - 作成者のみ */}
							{showShareToggle && isOwner && (
								<Pressable
									className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200"
									onPress={(e) => {
										e.stopPropagation();
									}}
								>
									<Text className="font-noto-regular text-gray-700 text-base">
										共有する
									</Text>
									<Switch
										value={shared}
										onValueChange={() => {
											onToggleShared?.(id, shared);
											setMenuVisible(false);
										}}
										trackColor={{ false: "#d1d5db", true: "#60a5fa" }}
										thumbColor={shared ? "#3b82f6" : "#f3f4f6"}
										ios_backgroundColor="#d1d5db"
										style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
									/>
								</Pressable>
							)}

							{/* 編集ボタン - 作成者のみ */}
							{isOwner && (
								<Pressable
									className="flex-row items-center px-4 py-3 border-b border-gray-200"
									onPress={() => {
										onEdit?.({ id, userId, title, content, completed, shared });
										setMenuVisible(false);
									}}
								>
									<Ionicons name="create-outline" size={22} color="#3b82f6" />
									<Text className="ml-3 font-noto-regular text-gray-700 text-base">
										編集
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
