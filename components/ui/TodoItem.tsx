import type { Todo } from "@/types/Todo";
import { Text, TouchableHighlight, TouchableOpacity, View } from "react-native";

type TodoItemProps = Todo & {
	onToggleComplete?: (id: number) => void;
	onEdit?: (todo: Todo) => void;
	onDelete?: (id: number) => void;
};

export default function TodoItem({
	id,
	title,
	content,
	completed,
	onToggleComplete,
	onEdit,
	onDelete,
}: TodoItemProps) {
	return (
		<View className="flex flex-row py-2 items-center">
			<View className="w-1/12 items-center">
				<TouchableOpacity onPress={() => onToggleComplete?.(id)}>
					<View
						className={`w-6 h-6 rounded border-2 items-center justify-center ${
							completed ? "bg-green-500 border-green-500" : "border-gray-400"
						}`}
					>
						{completed && (
							<Text className="text-white font-noto-bold text-lg">✓</Text>
						)}
					</View>
				</TouchableOpacity>
			</View>
			<Text
				className={`w-2/6 text-center font-noto-regular ${
					completed ? "line-through text-gray-400" : ""
				}`}
			>
				{title}
			</Text>
			<Text
				className={`w-2/6 text-center font-noto-regular ${
					completed ? "line-through text-gray-400" : ""
				}`}
			>
				{content}
			</Text>
			<View className="w-2/6 flex-row justify-center gap-1">
				<TouchableHighlight
					onPress={() => onEdit?.({ id, title, content, completed })}
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
