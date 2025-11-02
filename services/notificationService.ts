import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
} from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";

// 通知の表示設定
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		priority: Notifications.AndroidNotificationPriority.HIGH,
	}),
});

// iOS: 通知センターに保存されるように設定
if (Platform.OS === "ios") {
	Notifications.setNotificationCategoryAsync("default", []);
}

/**
 * プッシュ通知のパーミッションを取得してトークンを登録
 */
export async function registerForPushNotificationsAsync(): Promise<
	string | undefined
> {
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
 * 全ユーザーのプッシュトークンとuserIdのペアを取得（通知OFFのユーザーは除外）
 */
async function getAllPushTokensWithUserId(
	excludeCurrentUser: boolean = true
): Promise<Array<{ userId: string; pushToken: string }>> {
	try {
		const currentUserId = auth.currentUser?.uid;
		const usersRef = collection(db, "users");
		const q = query(usersRef);
		const querySnapshot = await getDocs(q);

		const tokens: Array<{ userId: string; pushToken: string }> = [];
		let excludedByNotificationOff = 0;

		querySnapshot.forEach((doc) => {
			const data = doc.data();

			// 現在のユーザーを除外する場合
			if (excludeCurrentUser && doc.id === currentUserId) {
				return;
			}

			// 通知設定を確認（デフォルトはtrue）
			const notificationEnabled = data.notificationEnabled !== false;
			if (!notificationEnabled) {
				excludedByNotificationOff++;
				return;
			}

			if (data.pushToken) {
				tokens.push({
					userId: doc.id,
					pushToken: data.pushToken,
				});
			}
		});

		console.log("📱 プッシュトークン取得:", {
			総ユーザー数: querySnapshot.size,
			取得トークン数: tokens.length,
			通知OFF除外: excludedByNotificationOff,
			除外設定: excludeCurrentUser ? "現在のユーザーを除外" : "全員",
		});

		return tokens;
	} catch (error) {
		console.error("Error getting push tokens:", error);
		return [];
	}
}

/**
 * プッシュ通知を送信
 * 操作者（actionUserId）が設定されている場合、その操作を行ったユーザーには通知しない
 * ただし、リマインド通知（type: "reminder"）の場合は操作者にも通知する
 */
export async function sendPushNotification(
	title: string,
	body: string,
	data?: Record<string, unknown>,
	includeCurrentUser: boolean = false
): Promise<void> {
	try {
		const tokensWithUserId =
			await getAllPushTokensWithUserId(!includeCurrentUser);

		if (tokensWithUserId.length === 0) {
			console.log("送信先のプッシュトークンがありません");
			return;
		}

		// 操作者のuserIdを取得
		const actionUserId = data?.actionUserId as string | undefined;
		const notificationType = data?.type as string | undefined;

		// フィルタリング: 操作者には通知しない（ただしリマインドは除く）
		const filteredTokens = tokensWithUserId.filter((item) => {
			// リマインド通知の場合は操作者にも送信
			if (notificationType === "reminder") {
				return true;
			}
			// 操作者が設定されている場合、その操作者には通知しない
			if (actionUserId && item.userId === actionUserId) {
				return false;
			}
			return true;
		});

		if (filteredTokens.length === 0) {
			console.log("フィルタリング後の送信先がありません");
			return;
		}

		const messages = filteredTokens.map((item) => ({
			to: item.pushToken,
			sound: "default",
			title,
			body,
			data,
		}));

		console.log(
			`📤 プッシュ通知送信: ${filteredTokens.length}件（操作者除外済み）`
		);

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
 * 現在のユーザーの表示名を取得（ニックネーム優先）
 */
export async function getCurrentUserDisplayName(): Promise<string> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		return "不明なユーザー";
	}

	try {
		// ニックネームを取得
		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (userDoc.exists()) {
			const data = userDoc.data();
			if (data.nickname) {
				return `${data.nickname}さん`;
			}
		}

		// ニックネームがない場合はメールアドレスを使用
		return auth.currentUser?.email || "不明なユーザー";
	} catch (error) {
		console.error("Error getting user display name:", error);
		return auth.currentUser?.email || "不明なユーザー";
	}
}

/**
 * 共有Todoの追加通知
 */
export async function notifyTodoAdded(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const userId = auth.currentUser?.uid;

	await sendPushNotification(
		"新しい共有Todo",
		`${displayName} が「${title}」を追加しました`,
		{ type: "todo_added", actionUserId: userId }
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * 共有Todoの編集通知
 */
export async function notifyTodoUpdated(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const userId = auth.currentUser?.uid;

	await sendPushNotification(
		"共有Todoが更新されました",
		`${displayName} が「${title}」を編集しました`,
		{ type: "todo_updated", actionUserId: userId }
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * 共有Todoの削除通知
 */
export async function notifyTodoDeleted(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const userId = auth.currentUser?.uid;

	await sendPushNotification(
		"共有Todoが削除されました",
		`${displayName} が「${title}」を削除しました`,
		{ type: "todo_deleted", actionUserId: userId }
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * 日時を「○月○日○時○分」形式でフォーマット
 */
function formatDateTime(date: Date): string {
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	return `${month}月${day}日${hours}時${minutes}分`;
}

/**
 * 共有Todoの完了通知
 */
export async function notifyTodoCompleted(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const completedTime = formatDateTime(new Date());
	const userId = auth.currentUser?.uid;

	await sendPushNotification(
		"共有TODO完了",
		`${displayName} が共有TODO「${title}」を完了しました。完了時刻：${completedTime}`,
		{ type: "todo_completed", actionUserId: userId }
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * グループへの招待通知
 */
export async function notifyInvitation(
	invitedUserId: string,
	orgName: string,
	inviterName: string
): Promise<void> {
	// 自分自身には通知を送らない
	const currentUserId = auth.currentUser?.uid;
	if (currentUserId === invitedUserId) {
		console.log("招待通知: 自分自身には通知を送りません");
		return;
	}

	// 招待されたユーザーのプッシュトークンを取得
	const userDoc = await getDoc(doc(db, "users", invitedUserId));
	if (!userDoc.exists()) {
		console.error("User not found:", invitedUserId);
		return;
	}

	const userData = userDoc.data();
	const pushToken = userData.pushToken;

	if (!pushToken) {
		console.log("User has no push token:", invitedUserId);
		return;
	}

	// プッシュ通知を送信
	const message = {
		to: pushToken,
		sound: "default",
		title: "グループへの招待",
		body: `${inviterName} があなたを「${orgName}」に招待しました`,
		data: {
			type: "organization_invitation",
			organizationName: orgName,
		},
	};

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

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Push notification failed: ${response.status} (body: ${errorBody})`
			);
		}

		console.log("Invitation notification sent");
	} catch (error) {
		console.error("Error sending invitation notification:", error);
		throw error;
	}
}

/**
 * Todoのリマインド通知を送信
 */
export async function notifyReminder(todo: {
	id: string;
	title: string;
	content: string;
	organizationId?: string;
}): Promise<void> {
	try {
		const currentUserId = auth.currentUser?.uid;
		if (!currentUserId) {
			console.log("リマインド通知: ユーザーが未ログイン");
			return;
		}

		// グループTodoの場合は全メンバーに通知、個人Todoの場合は本人のみに通知
		if (todo.organizationId) {
			// グループの全メンバーに通知
			await sendPushNotification(
				"📌 リマインド",
				`「${todo.title}」のリマインド時刻になりました`,
				{
					type: "reminder",
					todoId: todo.id,
					todoTitle: todo.title,
				},
				true // 本人を含む全員に通知
			);
		} else {
			// 個人Todoの場合は本人のみに通知
			const userDoc = await getDoc(doc(db, "users", currentUserId));
			if (!userDoc.exists()) {
				console.log("リマインド通知: ユーザーが見つかりません");
				return;
			}

			const userData = userDoc.data();
			const pushToken = userData.pushToken;

			if (!pushToken) {
				console.log("リマインド通知: プッシュトークンがありません");
				return;
			}

			const message = {
				to: pushToken,
				sound: "default",
				title: "📌 リマインド",
				body: `「${todo.title}」のリマインド時刻になりました`,
				data: {
					type: "reminder",
					todoId: todo.id,
					todoTitle: todo.title,
				},
			};

			const response = await fetch("https://exp.host/--/api/v2/push/send", {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Accept-encoding": "gzip, deflate",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(
					`Push notification failed: ${response.status} (body: ${errorBody})`
				);
			}
		}

		console.log(`⏰ リマインド通知送信: ${todo.title}`);
	} catch (error) {
		console.error("Error sending reminder notification:", error);
		throw error;
	}
}
