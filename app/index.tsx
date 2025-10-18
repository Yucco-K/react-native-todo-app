import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function index() {
	const [refreshKey, setRefreshKey] = useState(0);

	const handleSave = () => {
		setRefreshKey((prev) => prev + 1);
	};

	return (
		<SafeAreaView className="flex-1">
			<View className="flex-1 px-4 pt-4">
				<TodoForm onSave={handleSave} />
				<TodoTable refresh={refreshKey} />
			</View>
		</SafeAreaView>
	);
}
