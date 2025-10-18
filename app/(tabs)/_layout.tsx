import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#3b82f6",
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="mylist"
				options={{
					title: "My List",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="shared"
				options={{
					title: "Shared",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="people" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}

