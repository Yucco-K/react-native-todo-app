import TodoForm from "@/components/TodoForm";
import TodoTable from "@/components/TodoTable";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function index() {
	return (
		<SafeAreaView>
			<TodoForm />
			<TodoTable />
		</SafeAreaView>
	);
}
