import { Dimensions, Text, View } from "react-native";
import type { ToastConfigParams } from "react-native-toast-message";

const { height } = Dimensions.get("window");

// カラーテーマのバリエーション（20種類以上）
const COLOR_THEMES = [
	// イエロー系
	{
		bg: "#fef3c7",
		border: "#fbbf24",
		title: "#f59e0b",
		emoji: "🎉",
	},
	{
		bg: "#fefce8",
		border: "#facc15",
		title: "#eab308",
		emoji: "⭐",
	},
	// ピンク系
	{
		bg: "#fce7f3",
		border: "#f472b6",
		title: "#ec4899",
		emoji: "💖",
	},
	{
		bg: "#fce7f3",
		border: "#f9a8d4",
		title: "#db2777",
		emoji: "💕",
	},
	{
		bg: "#ffe4e6",
		border: "#fb7185",
		title: "#e11d48",
		emoji: "🌸",
	},
	// パープル系
	{
		bg: "#ddd6fe",
		border: "#a78bfa",
		title: "#8b5cf6",
		emoji: "✨",
	},
	{
		bg: "#e9d5ff",
		border: "#c084fc",
		title: "#a855f7",
		emoji: "🦄",
	},
	{
		bg: "#f3e8ff",
		border: "#d8b4fe",
		title: "#c026d3",
		emoji: "💜",
	},
	// ブルー系
	{
		bg: "#bfdbfe",
		border: "#60a5fa",
		title: "#3b82f6",
		emoji: "🌟",
	},
	{
		bg: "#dbeafe",
		border: "#93c5fd",
		title: "#2563eb",
		emoji: "💙",
	},
	{
		bg: "#e0f2fe",
		border: "#7dd3fc",
		title: "#0284c7",
		emoji: "🌊",
	},
	// ティール/シアン系
	{
		bg: "#ccfbf1",
		border: "#5eead4",
		title: "#14b8a6",
		emoji: "🎊",
	},
	{
		bg: "#cffafe",
		border: "#67e8f9",
		title: "#06b6d4",
		emoji: "🐬",
	},
	// グリーン系
	{
		bg: "#d1fae5",
		border: "#6ee7b7",
		title: "#10b981",
		emoji: "🌈",
	},
	{
		bg: "#dcfce7",
		border: "#86efac",
		title: "#22c55e",
		emoji: "🍀",
	},
	{
		bg: "#d9f99d",
		border: "#a3e635",
		title: "#65a30d",
		emoji: "🌿",
	},
	// オレンジ系
	{
		bg: "#fed7aa",
		border: "#fb923c",
		title: "#f97316",
		emoji: "🔥",
	},
	{
		bg: "#ffedd5",
		border: "#fdba74",
		title: "#ea580c",
		emoji: "🧡",
	},
	// レッド系
	{
		bg: "#fecaca",
		border: "#f87171",
		title: "#ef4444",
		emoji: "❤️",
	},
	{
		bg: "#fee2e2",
		border: "#fca5a5",
		title: "#dc2626",
		emoji: "🎈",
	},
	// ライム系
	{
		bg: "#ecfccb",
		border: "#bef264",
		title: "#84cc16",
		emoji: "🌼",
	},
	// インディゴ系
	{
		bg: "#e0e7ff",
		border: "#a5b4fc",
		title: "#6366f1",
		emoji: "🌌",
	},
	// エメラルド系
	{
		bg: "#d1fae5",
		border: "#6ee7b7",
		title: "#059669",
		emoji: "💚",
	},
	// アンバー系
	{
		bg: "#fef3c7",
		border: "#fcd34d",
		title: "#d97706",
		emoji: "🌻",
	},
	// ローズ系
	{
		bg: "#ffe4e6",
		border: "#fda4af",
		title: "#f43f5e",
		emoji: "🌹",
	},
];

export function PraiseToast({ text1, text2, props }: ToastConfigParams<any>) {
	// propsからテーマを取得（ランダムに選択されたもの）
	const themeIndex = (props?.themeIndex ?? 0) % COLOR_THEMES.length;
	const theme = COLOR_THEMES[themeIndex];

	return (
		<View
			style={{
				height: height / 3,
				width: "90%",
				backgroundColor: theme.bg,
				borderRadius: 16,
				padding: 24,
				shadowColor: "#000",
				shadowOffset: {
					width: 0,
					height: 4,
				},
				shadowOpacity: 0.3,
				shadowRadius: 8,
				elevation: 8,
				justifyContent: "center",
				alignItems: "center",
				borderWidth: 3,
				borderColor: theme.border,
			}}
		>
			{/* タイトル */}
			<Text
				style={{
					fontSize: 28,
					fontFamily: "NotoSansJP_700Bold",
					color: theme.title,
					marginBottom: 16,
					textAlign: "center",
				}}
			>
				{text1}
			</Text>

			{/* 褒め言葉 */}
			<Text
				style={{
					fontSize: 20,
					fontFamily: "NotoSansJP_400Regular",
					color: "#374151",
					textAlign: "center",
					lineHeight: 32,
				}}
			>
				{text2}
			</Text>

			{/* 装飾（テーマごとに異なる絵文字） */}
			<Text
				style={{
					fontSize: 60,
					marginTop: 16,
				}}
			>
				{theme.emoji}
			</Text>
		</View>
	);
}
