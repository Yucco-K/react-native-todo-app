import { API_URL } from "@/constants/urls";
import type { Todo } from "@/types/Todo";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import TodoItem from "./ui/TodoItem";

type TodoTableProps = {
	refresh?: number;
};

export default function TodoTable({ refresh }: TodoTableProps) {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState<Todo[]>([]);

	const getTodos = useCallback(async () => {
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
	}, []);

	const deleteTodo = async (id: number) => {
		try {
			const response = await fetch(`${API_URL}/api/todos/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("削除に失敗しました");
			}

			Toast.show({
				type: "success",
				text1: "削除成功",
				text2: "Todoを削除しました",
			});

			// リストを再取得
			getTodos();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1: "削除失敗",
				text2: "Todoの削除に失敗しました",
			});
		}
	};

	useEffect(() => {
		if (refresh !== undefined) {
			getTodos();
		}
	}, [refresh, getTodos]);
	return (
		<View className="flex-1">
			<View className="flex flex-row py-2 border-b-2 border-t-2 border-gray-400 items-center">
				<Text className="w-2/6 text-center font-noto-bold">タイトル</Text>
				<Text className="w-3/6 text-center font-noto-bold">内容</Text>
				<Text className="w-1/6 text-center font-noto-bold">操作</Text>
			</View>
			{isLoading ? (
				<View className="py-4">
					<ActivityIndicator />
				</View>
			) : (
				<FlatList
					data={data}
					renderItem={({ item }) => (
						<TodoItem {...item} onDelete={deleteTodo} />
					)}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={{ paddingBottom: 20 }}
					showsVerticalScrollIndicator={true}
				/>
			)}
		</View>
	);
}
