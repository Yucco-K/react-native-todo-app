import type { Todo } from "@/types/Todo";
import React from "react";
import { Text, TouchableHighlight, View } from "react-native";

type TodoItemProps = Todo & {
	onDelete?: (id: number) => void;
};

export default function TodoItem({
	id,
	title,
	content,
	onDelete,
}: TodoItemProps) {
	return (
		<View className="flex flex-row py-2 items-center">
			<Text className="w-2/6 text-center font-noto-regular">{title}</Text>
			<Text className="w-3/6 text-center font-noto-regular">{content}</Text>
			<TouchableHighlight
				onPress={() => onDelete?.(id)}
				activeOpacity={0.5}
				className="w-1/6 bg-red-500 rounded-md p-2"
				underlayColor="#dc2626"
			>
				<Text className="text-white text-center font-noto-bold text-xs">
					削除
				</Text>
			</TouchableHighlight>
		</View>
	);
}
