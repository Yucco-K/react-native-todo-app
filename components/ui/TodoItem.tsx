import type { Todo } from "@/types/Todo";
import React from "react";
import { Text, View } from "react-native";

export default function TodoItem({ title, content }: Todo) {
	return (
		<View className="flex flex-row py-2">
			<Text className="w-1/3 text-center font-noto-bold">{title}</Text>
			<Text className="w-2/3 text-center font-noto-bold">{content}</Text>
		</View>
	);
}
