import { API_URL } from "@/constants/urls";
import React, { useState } from "react";
import { Text, TextInput, TouchableHighlight, View } from "react-native";

export default function TodoForm() {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const createTodos = async () => {
		try {
			await fetch(`${API_URL}/api/todos`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title, content }),
			});
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<View className="space-y-2 mb-2">
			<TextInput
				className="border-2 border-gray-300 rounded-md p-2"
				placeholder="タイトル"
				value={title}
				onChangeText={setTitle}
			/>
			<TextInput
				className="border-2 border-gray-300 rounded-md p-2"
				placeholder="内容"
				value={content}
				onChangeText={setContent}
			/>
			<TouchableHighlight
				onPress={createTodos}
				activeOpacity={0.5}
				className="bg-black rounded-md p-2"
				underlayColor="gray"
			>
				<Text className="text-white text-center font-noto-bold">保存</Text>
			</TouchableHighlight>
		</View>
	);
}
