import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";

type AvatarProps = {
	avatarUrl?: string | null;
	size?: number;
	style?: object;
};

export function Avatar({ avatarUrl, size = 40, style }: AvatarProps) {
	return (
		<View
			style={[
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: "#e5e7eb",
					justifyContent: "center",
					alignItems: "center",
					overflow: "hidden",
				},
				style,
			]}
		>
			{avatarUrl ? (
				<Image
					source={{ uri: avatarUrl }}
					style={{
						width: size,
						height: size,
						borderRadius: size / 2,
					}}
					resizeMode="cover"
				/>
			) : (
				<Ionicons name="person" size={size * 0.6} color="#9ca3af" />
			)}
		</View>
	);
}

