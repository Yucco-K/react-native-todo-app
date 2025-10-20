import type { TodoCategory } from "@/types/Category";
import { CATEGORY_OPTIONS } from "@/types/Category";
import type { Todo } from "@/types/Todo";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	FlatList,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import TodoItem from "./ui/TodoItem";

type FilterType = "all" | "active" | "completed";

type SearchModalProps = {
	visible: boolean;
	onClose: () => void;
	data: Todo[];
	onToggleComplete: (id: string) => void;
	onEdit: (todo: Todo) => void;
	onDelete: (id: string) => void;
};

export default function SearchModal({
	visible,
	onClose,
	data,
	onToggleComplete,
	onEdit,
	onDelete,
}: SearchModalProps) {
	const [searchText, setSearchText] = useState("");
	const [filterType, setFilterType] = useState<FilterType>("all");
	const [categoryFilter, setCategoryFilter] = useState<TodoCategory | "all">(
		"all"
	);

	// フィルタリングと検索を適用したデータ
	const filteredData = (() => {
		let result = [...data];

		// 検索フィルター
		if (searchText.trim()) {
			const searchLower = searchText.toLowerCase();
			result = result.filter(
				(todo) =>
					todo.title.toLowerCase().includes(searchLower) ||
					todo.content.toLowerCase().includes(searchLower)
			);
		}

		// 完了状態フィルター
		if (filterType === "active") {
			result = result.filter((todo) => !todo.completed);
		} else if (filterType === "completed") {
			result = result.filter((todo) => todo.completed);
		}

		// カテゴリフィルター
		if (categoryFilter !== "all") {
			result = result.filter((todo) => todo.category === categoryFilter);
		}

		return result;
	})();

	const handleClose = () => {
		setSearchText("");
		setFilterType("all");
		setCategoryFilter("all");
		onClose();
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={false}
			onRequestClose={handleClose}
		>
			<View className="flex-1 bg-white">
				{/* ヘッダー */}
				<View className="bg-white border-b border-gray-200 pt-12 pb-3 px-4">
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-3xl font-noto-bold">検索</Text>
						<TouchableOpacity onPress={handleClose} className="p-2">
							<Ionicons name="close" size={28} color="#374151" />
						</TouchableOpacity>
					</View>

					{/* 検索バー */}
					<View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
						<Ionicons name="search" size={22} color="#6b7280" />
						<TextInput
							className="flex-1 ml-2 text-lg font-noto-regular"
							placeholder="タイトルや内容で検索..."
							placeholderTextColor="#9ca3af"
							value={searchText}
							onChangeText={setSearchText}
							autoFocus
						/>
						{searchText.length > 0 && (
							<TouchableOpacity onPress={() => setSearchText("")}>
								<Ionicons name="close-circle" size={22} color="#6b7280" />
							</TouchableOpacity>
						)}
					</View>

					{/* 完了状態フィルターボタン */}
					<View className="flex-row mt-3">
						<TouchableOpacity
							onPress={() => setFilterType("all")}
							className={`flex-1 py-2 rounded-md mx-1 ${
								filterType === "all" ? "bg-blue-500" : "bg-gray-200"
							}`}
						>
							<Text
								className={`text-center font-noto-bold text-base ${
									filterType === "all" ? "text-white" : "text-gray-700"
								}`}
							>
								すべて
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setFilterType("active")}
							className={`flex-1 py-2 rounded-md mx-1 ${
								filterType === "active" ? "bg-blue-500" : "bg-gray-200"
							}`}
						>
							<Text
								className={`text-center font-noto-bold text-base ${
									filterType === "active" ? "text-white" : "text-gray-700"
								}`}
							>
								未完了
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setFilterType("completed")}
							className={`flex-1 py-2 rounded-md mx-1 ${
								filterType === "completed" ? "bg-blue-500" : "bg-gray-200"
							}`}
						>
							<Text
								className={`text-center font-noto-bold text-base ${
									filterType === "completed" ? "text-white" : "text-gray-700"
								}`}
							>
								完了済み
							</Text>
						</TouchableOpacity>
					</View>

					{/* カテゴリフィルター */}
					<View className="mt-3">
						<Text className="text-gray-600 font-noto-bold text-sm mb-2">
							カテゴリ
						</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<TouchableOpacity
								onPress={() => setCategoryFilter("all")}
								className={`mr-2 px-4 py-2 rounded-full border-2 ${
									categoryFilter === "all"
										? "bg-purple-500 border-purple-500"
										: "bg-white border-gray-300"
								}`}
							>
								<Text
									className={`font-noto-bold text-sm ${
										categoryFilter === "all" ? "text-white" : "text-gray-700"
									}`}
								>
									すべて
								</Text>
							</TouchableOpacity>
							{CATEGORY_OPTIONS.map((option) => (
								<TouchableOpacity
									key={option.value}
									onPress={() => setCategoryFilter(option.value)}
									className={`mr-2 px-4 py-2 rounded-full border-2 ${
										categoryFilter === option.value
											? "bg-purple-500 border-purple-500"
											: "bg-white border-gray-300"
									}`}
								>
									<Text
										className={`font-noto-regular text-sm ${
											categoryFilter === option.value
												? "text-white"
												: "text-gray-700"
										}`}
									>
										{option.icon} {option.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>

				{/* 検索結果 */}
				<View className="flex-1">
					{filteredData.length === 0 ? (
						<View className="flex-1 justify-center items-center px-8">
							<Ionicons
								name={searchText ? "search-outline" : "list-outline"}
								size={64}
								color="#d1d5db"
							/>
							<Text className="text-gray-400 font-noto-regular text-xl mt-4 text-center">
								{searchText
									? "該当するTodoが見つかりません"
									: "キーワードを入力して検索"}
							</Text>
							<Text className="text-gray-400 font-noto-regular text-lg mt-2 text-center">
								{searchText
									? "検索条件やフィルターを変更してください"
									: "タイトルや内容で検索できます"}
							</Text>
						</View>
					) : (
						<>
							<View className="px-4 py-2 bg-gray-50 border-b border-gray-200">
								<Text className="text-gray-600 font-noto-regular text-base">
									{filteredData.length}件のTodoが見つかりました
								</Text>
							</View>
							<FlatList
								data={filteredData}
								renderItem={({ item }) => (
									<View className="px-4">
										<TodoItem
											{...item}
											onToggleComplete={onToggleComplete}
											onEdit={onEdit}
											onDelete={onDelete}
										/>
									</View>
								)}
								keyExtractor={(item) => item.id.toString()}
								contentContainerStyle={{ paddingBottom: 20 }}
								showsVerticalScrollIndicator={true}
							/>
						</>
					)}
				</View>
			</View>
		</Modal>
	);
}
