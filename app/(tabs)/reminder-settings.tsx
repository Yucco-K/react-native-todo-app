import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getTodoById, getTodos, removeTodoReminder, setTodoReminder } from "@/services/todoService";
import type { Todo } from "@/types/Todo";

export default function ReminderSettingsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const todoId = typeof params.id === "string" ? params.id : undefined;
	const organizationIdParam =
		typeof params.organizationId === "string"
			? params.organizationId
			: params.organizationId === null || params.organizationId === undefined
				? null
				: undefined;
	const { isDark } = useTheme();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [todo, setTodo] = useState<Todo | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedTime, setSelectedTime] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	// まずIDで単体取得し、なければ一覧から検索
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				if (!todoId) {
					setLoading(false);
					return;
				}
				let found = await getTodoById(todoId);
				if (!found) {
					const todos = await getTodos(organizationIdParam);
					found = todos.find((t) => t.id === todoId) ?? null;
				}
				if (mounted) {
					setTodo(found);
					const now = new Date();
					const base = found?.remindAt ? new Date(found.remindAt) : new Date();
					// 初期値が過去の場合は現在+5分をセット
					const safeInitial = base <= now ? new Date(now.getTime() + 5 * 60 * 1000) : base;
					setSelectedDate(safeInitial);
					setSelectedTime(safeInitial);
				}
			} catch (e) {
				console.log("リマインド設定画面 初期化エラー:", e);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [todoId, organizationIdParam]);

	const headerTitle = useMemo(
		() => (todo ? `リマインド設定 - ${todo.title}` : "リマインド設定"),
		[todo],
	);

	const handleSave = async () => {
		if (!todo) return;
		const combined = new Date(selectedDate);
		combined.setHours(selectedTime.getHours());
		combined.setMinutes(selectedTime.getMinutes());
		combined.setSeconds(0);
		combined.setMilliseconds(0);
		if (combined <= new Date()) {
			alert("過去の日時は設定できません");
			return;
		}
		setSaving(true);
		try {
			await setTodoReminder(todo.id, combined);
			router.back();
		} catch (e) {
			console.log("リマインド保存エラー:", e);
			alert("リマインドの設定に失敗しました");
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = async () => {
		if (!todo?.remindAt) return;
		setSaving(true);
		try {
			await removeTodoReminder(todo.id);
			router.back();
		} catch (e) {
			console.log("リマインド削除エラー:", e);
			alert("リマインドの削除に失敗しました");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}

	if (!todo || !todoId) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<Text>対象のTodoが見つかりませんでした</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#ffffff" }}>
			{/* ヘッダー */}
		<View
			style={{
				backgroundColor: "#3b82f6",
				paddingTop: 52,
				paddingBottom: 12,
				paddingHorizontal: 16,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			<TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
				<Ionicons name="chevron-back" size={24} color="#fff" />
			</TouchableOpacity>
			<Text
				style={{
					color: "#fff",
					fontSize: 18,
					fontWeight: "bold",
					flex: 1,
					flexShrink: 1,
					textAlign: "center",
				}}
				numberOfLines={2}
			>
				{headerTitle}
			</Text>
			<View style={{ width: 32 }} />
		</View>

			{/* 全幅レイアウト */}
			<ScrollView contentContainerStyle={{ padding: 16 }}>
				{/* TODO 情報 */}
				<View
					style={{
						marginBottom: 16,
						padding: 12,
						borderRadius: 12,
						backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
					}}
				>
				<Text style={{ color: isDark ? "#d1d5db" : "#6b7280", fontSize: 12 }}>TODO</Text>
				<Text
					style={{
						color: isDark ? "#f3f4f6" : "#111827",
						fontSize: 16,
						fontWeight: "700",
						marginTop: 4,
						flexShrink: 1,
					}}
				>
					{todo.title}
				</Text>
				{!!todo.content && (
					<Text
						style={{
							color: isDark ? "#d1d5db" : "#374151",
							fontSize: 14,
							marginTop: 6,
							flexShrink: 1,
						}}
					>
						{todo.content}
					</Text>
				)}
				</View>

				{/* 日付 */}
				<View style={{ marginBottom: 16 }}>
					<Text
						style={{
							color: isDark ? "#d1d5db" : "#374151",
							fontSize: 13,
							fontWeight: "700",
							marginBottom: 8,
						}}
					>
						日付
					</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(true)}
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							padding: 12,
							borderRadius: 12,
							borderWidth: 1,
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
							borderColor: isDark ? "#374151" : "#d1d5db",
						}}
					>
						<Text style={{ color: isDark ? "#f3f4f6" : "#111827", fontSize: 16 }}>
							{`${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`}
						</Text>
						<Ionicons name="calendar-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
					</TouchableOpacity>
					{showDatePicker && (
						<DateTimePicker
							value={selectedDate}
							mode="date"
							display={Platform.OS === "ios" ? "inline" : "default"}
							onChange={(_e: unknown, date?: Date) => {
								setShowDatePicker(Platform.OS === "ios");
								if (date) setSelectedDate(date);
							}}
							minimumDate={new Date()}
							themeVariant={isDark ? "dark" : "light"}
						/>
					)}
				</View>

				{/* 時刻 */}
				<View style={{ marginBottom: 24 }}>
					<Text
						style={{
							color: isDark ? "#d1d5db" : "#374151",
							fontSize: 13,
							fontWeight: "700",
							marginBottom: 8,
						}}
					>
						時刻
					</Text>
					<TouchableOpacity
						onPress={() => setShowTimePicker(true)}
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							padding: 12,
							borderRadius: 12,
							borderWidth: 1,
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
							borderColor: isDark ? "#374151" : "#d1d5db",
						}}
					>
						<Text style={{ color: isDark ? "#f3f4f6" : "#111827", fontSize: 16 }}>
							{`${String(selectedTime.getHours()).padStart(2, "0")}:${String(selectedTime.getMinutes()).padStart(2, "0")}`}
						</Text>
						<Ionicons name="time-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
					</TouchableOpacity>
					{showTimePicker && (
						<DateTimePicker
							value={selectedTime}
							mode="time"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_e: unknown, date?: Date) => {
								setShowTimePicker(Platform.OS === "ios");
								if (date) setSelectedTime(date);
							}}
							themeVariant={isDark ? "dark" : "light"}
						/>
					)}
				</View>

				{/* アクション */}
				<View style={{ gap: 12 }}>
					<TouchableOpacity
						onPress={handleSave}
						disabled={saving}
						style={{
							backgroundColor: "#3b82f6",
							borderRadius: 12,
							padding: 16,
							alignItems: "center",
						}}
						activeOpacity={0.7}
					>
						{saving ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: "#fff", fontWeight: "700" }}>リマインドを設定</Text>
						)}
					</TouchableOpacity>

					{todo.remindAt && (
						<TouchableOpacity
							onPress={handleRemove}
							disabled={saving}
							style={{
								borderWidth: 1,
								borderColor: "#ef4444",
								borderRadius: 12,
								padding: 16,
								alignItems: "center",
							}}
							activeOpacity={0.7}
						>
							<Text style={{ color: "#ef4444", fontWeight: "700" }}>リマインドを削除</Text>
						</TouchableOpacity>
					)}
				</View>
			</ScrollView>
		</View>
	);
}
