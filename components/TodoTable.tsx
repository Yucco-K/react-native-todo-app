import { API_URL } from "@/constants/urls";
import type { Todo } from "@/types/Todo";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import TodoItem from "./ui/TodoItem";

type TodoTableProps = {
	refresh?: number;
};

export default function TodoTable({ refresh }: TodoTableProps) {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState<Todo[]>([]);

	useEffect(() => {
		const getTodos = async () => {
			setLoading(true);
			try {
				const response = await fetch(`${API_URL}/api/todos`);
				const json = await response.json();
				setData(json);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		if (refresh !== undefined) {
			getTodos();
		}
	}, [refresh]);
	return (
		<>
			<View className="flex flex-row py-2 border-b-2 border-t-2 border-gray-400">
				<Text className="w-1/3 text-center font-noto-bold">タイトル</Text>
				<Text className="w-2/3 text-center font-noto-bold">内容</Text>
			</View>
			{isLoading ? (
				<ActivityIndicator />
			) : (
				<FlatList
					data={data}
					renderItem={({ item }) => <TodoItem {...item} />}
					keyExtractor={(item) => item.id.toString()}
				/>
			)}
		</>
	);
}
