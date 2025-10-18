import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, setDoc, collection, query, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// 通知の表示設定
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

/**
 * プッシュ通知のパーミッションを取得してトークンを登録
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
	let token: string | undefined;

	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "default",
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: "#FF231F7C",
		});
	}

	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;
		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		if (finalStatus !== "granted") {
			alert("プッシュ通知の許可が必要です");
			return;
		}

		try {
			token = (await Notifications.getExpoPushTokenAsync()).data;
			console.log("Push token:", token);
		} catch (e) {
			console.error("Error getting push token:", e);
		}
	} else {
		alert("物理デバイスでのみプッシュ通知が機能します");
	}

	return token;
}

/**
 * ユーザーのプッシュトークンをFirestoreに保存
 */
export async function savePushToken(token: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	try {
		await setDoc(
			doc(db, "users", userId),
			{
				pushToken: token,
				updatedAt: new Date(),
			},
			{ merge: true }
		);
		console.log("Push token saved to Firestore");
	} catch (error) {
		console.error("Error saving push token:", error);
		throw error;
	}
}

/**
 * 全ユーザーのプッシュトークンを取得（現在のユーザーを除く）
 */
async function getAllPushTokens(excludeCurrentUser: boolean = true): Promise<string[]> {
	try {
		const currentUserId = auth.currentUser?.uid;
		const usersRef = collection(db, "users");
		const q = query(usersRef);
		const querySnapshot = await getDocs(q);

		const tokens: string[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			if (data.pushToken) {
				// 現在のユーザーを除外する場合
				if (excludeCurrentUser && doc.id === currentUserId) {
					return;
				}
				tokens.push(data.pushToken);
			}
		});

		return tokens;
	} catch (error) {
		console.error("Error getting push tokens:", error);
		return [];
	}
}

/**
 * プッシュ通知を送信
 */
export async function sendPushNotification(
	title: string,
	body: string,
	data?: Record<string, unknown>
): Promise<void> {
	try {
		const tokens = await getAllPushTokens(true);

		if (tokens.length === 0) {
			console.log("送信先のプッシュトークンがありません");
			return;
		}

		const messages = tokens.map((token) => ({
			to: token,
			sound: "default",
			title,
			body,
			data,
		}));

		// Expo Push Notification APIに送信
		for (const message of messages) {
			try {
				const response = await fetch("https://exp.host/--/api/v2/push/send", {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Accept-encoding": "gzip, deflate",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(message),
				});

				const result = await response.json();
				console.log("Push notification sent:", result);
			} catch (error) {
				console.error("Error sending individual notification:", error);
			}
		}
	} catch (error) {
		console.error("Error in sendPushNotification:", error);
	}
}

/**
 * 共有Todoの追加通知
 */
export async function notifyTodoAdded(title: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser?.email) return;

	await sendPushNotification(
		"新しい共有Todo",
		`${currentUser.email} が「${title}」を追加しました`,
		{ type: "todo_added" }
	);
}

/**
 * 共有Todoの編集通知
 */
export async function notifyTodoUpdated(title: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser?.email) return;

	await sendPushNotification(
		"共有Todoが更新されました",
		`${currentUser.email} が「${title}」を編集しました`,
		{ type: "todo_updated" }
	);
}

/**
 * 共有Todoの削除通知
 */
export async function notifyTodoDeleted(title: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser?.email) return;

	await sendPushNotification(
		"共有Todoが削除されました",
		`${currentUser.email} が「${title}」を削除しました`,
		{ type: "todo_deleted" }
	);
}

