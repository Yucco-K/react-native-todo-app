import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

type AvatarProps = {
	avatarUrl?: string | null;
	size?: number;
	style?: object;
};

export function Avatar({ avatarUrl, size = 40, style }: AvatarProps) {
	const [imageError, setImageError] = useState(false);

	useEffect(() => {
		if (avatarUrl) {
			setImageError(false); // URLが変わったらエラー状態をリセット
		}
	}, [avatarUrl]);

	// キャッシュバスティング: URIにタイムスタンプを追加（既に含まれている場合はそのまま返す）
	const getCacheBustedUri = (uri: string) => {
		if (!uri) return uri;
		// 既にタイムスタンプが含まれている場合はそのまま返す
		if (uri.includes("?t=") || uri.includes("&t=")) {
			return uri;
		}
		const separator = uri.includes("?") ? "&" : "?";
		return `${uri}${separator}t=${Date.now()}`;
	};

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
			{avatarUrl && !imageError ? (
				<Image
					source={{ uri: getCacheBustedUri(avatarUrl) }}
					style={{
						width: size,
						height: size,
						borderRadius: size / 2,
					}}
					resizeMode="cover"
					onError={() => setImageError(true)}
				/>
			) : (
				<Ionicons name="person" size={size * 0.6} color="#9ca3af" />
			)}
		</View>
	);
}
