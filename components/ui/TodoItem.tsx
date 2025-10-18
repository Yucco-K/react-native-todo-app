import type { Todo } from "@/types/Todo";
import React from "react";
import { Text, TouchableHighlight, View } from "react-native";

type TodoItemProps = Todo & {
	onEdit?: (todo: Todo) => void;
	onDelete?: (id: number) => void;
};

export default function TodoItem({
	id,
	title,
	content,
	onEdit,
	onDelete,
}: TodoItemProps) {
	return (
		<View className="flex flex-row py-2 items-center">
			<Text className="w-2/6 text-center font-noto-regular">{title}</Text>
			<Text className="w-2/6 text-center font-noto-regular">{content}</Text>
			<View className="w-2/6 flex-row justify-center gap-1">
				<TouchableHighlight
					onPress={() => onEdit?.({ id, title, content })}
					activeOpacity={0.5}
					className="bg-blue-500 rounded-md px-2 py-1"
					underlayColor="#3b82f6"
				>
					<Text className="text-white text-center font-noto-bold text-xs">
						編集
					</Text>
				</TouchableHighlight>
				<TouchableHighlight
					onPress={() => onDelete?.(id)}
					activeOpacity={0.5}
					className="bg-red-500 rounded-md px-2 py-1"
					underlayColor="#dc2626"
				>
					<Text className="text-white text-center font-noto-bold text-xs">
						削除
					</Text>
				</TouchableHighlight>
			</View>
		</View>
	);
}
