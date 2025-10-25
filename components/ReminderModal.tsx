import React, { useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Platform,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import type { Todo } from "@/types/Todo";

type ReminderModalProps = {
	visible: boolean;
	todo: Todo | null;
	onClose: () => void;
	onSave: (todoId: string, remindAt: Date) => Promise<void>;
	onRemove?: (todoId: string) => Promise<void>;
};

export default function ReminderModal({
	visible,
	todo,
	onClose,
	onSave,
	onRemove,
}: ReminderModalProps) {
	const { isDark } = useTheme();
	const [selectedDate, setSelectedDate] = useState<Date>(
		todo?.remindAt ? new Date(todo.remindAt) : new Date()
	);
	const [selectedTime, setSelectedTime] = useState<Date>(
		todo?.remindAt ? new Date(todo.remindAt) : new Date()
	);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// モーダルが開かれた時に日時をリセット
	React.useEffect(() => {
		if (visible && todo) {
			const initialDate = todo.remindAt ? new Date(todo.remindAt) : new Date();
			setSelectedDate(initialDate);
			setSelectedTime(initialDate);
		}
	}, [visible, todo]);

	const handleSave = async () => {
		if (!todo) return;

		// 日付と時刻を組み合わせる
		const combinedDateTime = new Date(selectedDate);
		combinedDateTime.setHours(selectedTime.getHours());
		combinedDateTime.setMinutes(selectedTime.getMinutes());
		combinedDateTime.setSeconds(0);
		combinedDateTime.setMilliseconds(0);

		// 過去の日時をチェック
		if (combinedDateTime <= new Date()) {
			alert("過去の日時は設定できません");
			return;
		}

		setIsLoading(true);
		try {
			await onSave(todo.id, combinedDateTime);
			onClose();
		} catch (error) {
			console.log("リマインド設定エラー:", error);
			alert("リマインドの設定に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemove = async () => {
		if (!todo || !onRemove) return;

		setIsLoading(true);
		try {
			await onRemove(todo.id);
			onClose();
		} catch (error) {
			console.log("リマインド削除エラー:", error);
			alert("リマインドの削除に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${year}年${month}月${day}日`;
	};

	const formatTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	if (!todo) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={onClose}>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<View
						className="mx-4 rounded-2xl p-6 w-[340px]"
						style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
					>
						{/* タイトル */}
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-row items-center">
								<Ionicons
									name="notifications"
									size={24}
									color={isDark ? "#60a5fa" : "#3b82f6"}
								/>
								<Text
									className="ml-2 text-xl font-noto-bold"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									リマインド設定
								</Text>
							</View>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close" size={24} color={isDark ? "#9ca3af" : "#6b7280"} />
							</TouchableOpacity>
						</View>

						{/* TODOタイトル表示 */}
						<View
							className="mb-4 p-3 rounded-lg"
							style={{ backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
						>
							<Text
								className="font-noto-regular text-sm"
								style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
							>
								TODO
							</Text>
							<Text
								className="font-noto-bold text-base mt-1"
								style={{ color: isDark ? "#f3f4f6" : "#111827" }}
							>
								{todo.title}
							</Text>
						</View>

						{/* 日付選択 */}
						<View className="mb-4">
							<Text
								className="font-noto-bold text-sm mb-2"
								style={{ color: isDark ? "#d1d5db" : "#374151" }}
							>
								日付
							</Text>
							<TouchableOpacity
								onPress={() => setShowDatePicker(true)}
								className="flex-row items-center justify-between p-3 rounded-lg border"
								style={{
									backgroundColor: isDark ? "#374151" : "#ffffff",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}
							>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									{formatDate(selectedDate)}
								</Text>
								<Ionicons
									name="calendar-outline"
									size={20}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</TouchableOpacity>
						</View>

						{/* 時刻選択 */}
						<View className="mb-6">
							<Text
								className="font-noto-bold text-sm mb-2"
								style={{ color: isDark ? "#d1d5db" : "#374151" }}
							>
								時刻
							</Text>
							<TouchableOpacity
								onPress={() => setShowTimePicker(true)}
								className="flex-row items-center justify-between p-3 rounded-lg border"
								style={{
									backgroundColor: isDark ? "#374151" : "#ffffff",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}
							>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#f3f4f6" : "#111827" }}
								>
									{formatTime(selectedTime)}
								</Text>
								<Ionicons
									name="time-outline"
									size={20}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</TouchableOpacity>
						</View>

						{/* DateTimePickerを表示 */}
						{showDatePicker && (
							<DateTimePicker
								value={selectedDate}
								mode="date"
								display={Platform.OS === "ios" ? "inline" : "default"}
								onChange={(_event, date) => {
									setShowDatePicker(Platform.OS === "ios");
									if (date) {
										setSelectedDate(date);
									}
								}}
								minimumDate={new Date()}
								themeVariant={isDark ? "dark" : "light"}
							/>
						)}

						{showTimePicker && (
							<DateTimePicker
								value={selectedTime}
								mode="time"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								onChange={(_event, date) => {
									setShowTimePicker(Platform.OS === "ios");
									if (date) {
										setSelectedTime(date);
									}
								}}
								themeVariant={isDark ? "dark" : "light"}
							/>
						)}

						{/* ボタン */}
						<View className="flex-col gap-3">
							{/* 保存ボタン */}
							<TouchableOpacity
								onPress={handleSave}
								disabled={isLoading}
								className="bg-blue-500 rounded-lg p-4 items-center"
								activeOpacity={0.7}
							>
								{isLoading ? (
									<ActivityIndicator color="white" />
								) : (
									<Text className="text-white font-noto-bold text-base">
										リマインドを設定
									</Text>
								)}
							</TouchableOpacity>

							{/* リマインド削除ボタン（既存のリマインドがある場合のみ） */}
							{todo.remindAt && onRemove && (
								<TouchableOpacity
									onPress={handleRemove}
									disabled={isLoading}
									className="border border-red-500 rounded-lg p-4 items-center"
									activeOpacity={0.7}
								>
									<Text className="text-red-500 font-noto-bold text-base">
										リマインドを削除
									</Text>
								</TouchableOpacity>
							)}

							{/* キャンセルボタン */}
							<TouchableOpacity
								onPress={onClose}
								disabled={isLoading}
								className="p-4 items-center"
								activeOpacity={0.7}
							>
								<Text
									className="font-noto-regular text-base"
									style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
								>
									キャンセル
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

