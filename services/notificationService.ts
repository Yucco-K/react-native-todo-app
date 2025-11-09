import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
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
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
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
 *
 * 【開発環境での注意】
 * 同じデバイスで複数ユーザーをテストする場合、重複トークン削除を無効化してください。
 * 環境変数 EXPO_PUBLIC_ALLOW_DUPLICATE_TOKENS=true を設定すると、
 * 複数ユーザーが同じトークンを持つことを許可します。
 *
 * 【本番環境】
 * 各ユーザーが異なるデバイスを使用するため、重複トークン削除が正常に機能します。
 */
export async function savePushToken(token: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	try {
		// 開発環境で重複トークンを許可するかどうか
		const allowDuplicates = process.env.EXPO_PUBLIC_ALLOW_DUPLICATE_TOKENS === "true";

		if (!allowDuplicates) {
			// 1. 同じプッシュトークンを持つ他のユーザーを検索
			const usersRef = collection(db, "users");
			const q = query(usersRef, where("pushToken", "==", token));
			const querySnapshot = await getDocs(q);

			// 2. 現在のユーザー以外から、このトークンを削除
			const deletePromises: Promise<void>[] = [];
			querySnapshot.forEach((docSnap) => {
				if (docSnap.id !== userId) {
					console.log(`⚠️ 重複トークンを検出: ユーザー ${docSnap.id} から削除します`);
					deletePromises.push(
						setDoc(
							doc(db, "users", docSnap.id),
							{
								pushToken: null,
								updatedAt: new Date(),
							},
							{ merge: true },
						),
					);
				}
			});

			// 重複トークンを削除
			if (deletePromises.length > 0) {
				await Promise.all(deletePromises);
				console.log(`✅ ${deletePromises.length}名のユーザーから重複トークンを削除しました`);
			}
		} else {
			console.log("🔧 開発モード: 重複トークンを許可します");
		}

		// 3. 現在のユーザーにトークンを保存
		await setDoc(
			doc(db, "users", userId),
			{
				pushToken: token,
				updatedAt: new Date(),
			},
			{ merge: true },
		);
		console.log("✅ プッシュトークンを保存しました");
	} catch (error) {
		console.error("Error saving push token:", error);
		throw error;
	}
}

/**
 * 通知履歴保存対象の全ユーザーIDを取得（プッシュトークンの有無に関係なく）
 * - 通知設定がOFFのユーザーは除外
 * - 指定されたuserIdを除外可能
 */
async function getAllNotificationTargetUserIds(excludeUserId?: string): Promise<string[]> {
	try {
		const usersRef = collection(db, "users");
		const q = query(usersRef);
		const querySnapshot = await getDocs(q);

		const userIds: string[] = [];
		let excludedByNotificationOff = 0;
		let excludedByUserId = 0;

		querySnapshot.forEach((doc) => {
			const data = doc.data();

			// 指定されたユーザーを除外
			if (excludeUserId && doc.id === excludeUserId) {
				excludedByUserId++;
				return;
			}

			// 通知設定を確認（デフォルトはtrue）
			const notificationEnabled = data.notificationEnabled !== false;
			if (!notificationEnabled) {
				excludedByNotificationOff++;
				return;
			}

			userIds.push(doc.id);
		});

		console.log("👥 通知履歴保存対象ユーザー取得:", {
			総ユーザー数: querySnapshot.size,
			対象ユーザー数: userIds.length,
			通知OFF除外: excludedByNotificationOff,
			userId除外: excludedByUserId,
			除外対象userId: excludeUserId || "なし",
		});

		return userIds;
	} catch (error) {
		console.error("Error getting notification target users:", error);
		return [];
	}
}

/**
 * 全ユーザーのプッシュトークンとuserIdのペアを取得（通知OFFのユーザーは除外）
 */
async function getAllPushTokensWithUserId(
	excludeCurrentUser: boolean = true,
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

			// デバッグログ: 各ユーザーの通知設定を出力
			console.log(`🔔 ユーザー通知設定チェック:`, {
				userId: doc.id,
				email: data.email || "不明",
				notificationEnabled: data.notificationEnabled,
				判定結果: notificationEnabled ? "ON" : "OFF",
				pushToken有無: !!data.pushToken,
			});

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

		// プッシュトークンの重複をチェック
		const tokenCounts = new Map<string, string[]>();
		tokens.forEach((t) => {
			const userIds = tokenCounts.get(t.pushToken) || [];
			userIds.push(t.userId);
			tokenCounts.set(t.pushToken, userIds);
		});

		const duplicates = Array.from(tokenCounts.entries()).filter(
			([_, userIds]) => userIds.length > 1,
		);

		console.log("📱 プッシュトークン取得:", {
			総ユーザー数: querySnapshot.size,
			取得トークン数: tokens.length,
			通知OFF除外: excludedByNotificationOff,
			除外設定: excludeCurrentUser ? "現在のユーザーを除外" : "全員",
			currentUserId,
			currentUserId型: typeof currentUserId,
			取得したuserIds: tokens.map((t) => t.userId),
			取得したトークン一覧: tokens.map((t) => ({
				userId: t.userId,
				token: t.pushToken.substring(0, 30) + "...",
			})),
			重複トークン数: duplicates.length,
			重複詳細:
				duplicates.length > 0
					? duplicates.map(([token, userIds]) => ({
							トークン: token.substring(0, 20) + "...",
							userIds: userIds,
						}))
					: "なし",
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
 * グループ通知の場合は、グループメンバーのみに送信する
 */
export async function sendPushNotification(
	title: string,
	body: string,
	data?: Record<string, unknown>,
	includeCurrentUser: boolean = false,
): Promise<void> {
	try {
		// 操作者のuserIdを取得
		const actionUserId = data?.actionUserId as string | undefined;
		const notificationType = data?.type as string | undefined;
		const organizationId = data?.organizationId as string | undefined;

		// グループ通知の場合、グループメンバーのみを対象とする
		let tokensWithUserId: Array<{ userId: string; pushToken: string }> = [];

		if (
			organizationId &&
			["member_joined", "member_left", "organization_renamed", "organization_deleted"].includes(
				notificationType || "",
			)
		) {
			// グループメンバーのトークンのみを取得
			const orgDoc = await getDoc(doc(db, "organizations", organizationId));
			if (orgDoc.exists()) {
				const orgData = orgDoc.data();
				const members = orgData.members as string[];

				// 全ユーザーのトークンを取得
				const allTokens = await getAllPushTokensWithUserId(false);

				// グループメンバーのみにフィルタリング
				tokensWithUserId = allTokens.filter((item) => members.includes(item.userId));

				console.log("👥 グループ通知: メンバーのみに送信", {
					organizationId,
					totalMembers: members.length,
					tokensFound: tokensWithUserId.length,
				});
			}
		} else {
			// 通常の通知: 全ユーザーのトークンを取得
			tokensWithUserId = await getAllPushTokensWithUserId(false);
		}

		if (tokensWithUserId.length === 0) {
			console.log("送信先のプッシュトークンがありません");
			return;
		}

		console.log("🔍 プッシュ通知フィルタリング:", {
			actionUserId,
			notificationType,
			organizationId,
			totalTokens: tokensWithUserId.length,
			includeCurrentUser,
		});

		// フィルタリング: 操作者には通知しない（ただしリマインドは除く）
		const filteredTokens = tokensWithUserId.filter((item) => {
			console.log(`🔍 フィルタリング判定:`, {
				"item.userId": item.userId,
				"item.userId型": typeof item.userId,
				actionUserId: actionUserId,
				actionUserId型: typeof actionUserId,
				notificationType: notificationType,
				"userId一致(===)": actionUserId && item.userId === actionUserId,
				actionUserIdが存在: !!actionUserId,
			});

			// リマインド通知の場合は全員に送信
			if (notificationType === "reminder") {
				console.log(`✅ リマインド通知: ${item.userId}に送信`);
				return true;
			}
			// 操作者が設定されている場合、その操作者には通知しない
			if (actionUserId && item.userId === actionUserId) {
				console.log(`❌ 操作者を除外: ${item.userId} (actionUserId: ${actionUserId})`);
				return false;
			}
			console.log(`✅ 通知送信対象: ${item.userId}`);
			return true;
		});

		// プッシュ通知の送信（トークンがある場合のみ）
		if (filteredTokens.length > 0) {
			// 同じプッシュトークンに重複して送信しないよう、ユニーク化
			const uniqueTokens = Array.from(
				new Map(filteredTokens.map((item) => [item.pushToken, item])).values(),
			);

			if (uniqueTokens.length < filteredTokens.length) {
				console.log(`⚠️ 重複トークンを除去: ${filteredTokens.length}件 → ${uniqueTokens.length}件`);
			}

			const messages = uniqueTokens.map((item) => ({
				to: item.pushToken,
				sound: "default",
				title,
				body,
				data,
			}));

			console.log(
				`📤 プッシュ通知送信: ${uniqueTokens.length}件（操作者除外済み、除外数: ${tokensWithUserId.length - filteredTokens.length}）`,
			);

			// Expo Push APIに送信
			for (const message of messages) {
				try {
					const response = await fetch("https://exp.host/--/api/v2/push/send", {
						method: "POST",
						headers: {
							Accept: "application/json",
							"Content-Type": "application/json",
						},
						body: JSON.stringify(message),
					});

					const result = await response.json();
					console.log("Push notification sent:", result);
				} catch (error) {
					console.error("Error sending push notification:", error);
				}
			}
		} else {
			console.log("⚠️ プッシュ通知の送信先がありません（通知履歴は保存します）");
		}

		// 通知履歴を保存（プッシュトークンの有無に関係なく、操作者以外の全ユーザーに）
		const { saveNotificationHistory } = await import("./notificationHistoryService");

		let allTargetUserIds: string[] = [];

		// グループ通知の場合、グループメンバーのみを対象とする
		if (
			organizationId &&
			["member_joined", "member_left", "organization_renamed", "organization_deleted"].includes(
				notificationType || "",
			)
		) {
			const orgDoc = await getDoc(doc(db, "organizations", organizationId));
			if (orgDoc.exists()) {
				const orgData = orgDoc.data();
				const members = orgData.members as string[];

				// 操作者を除外し、通知設定ONのメンバーのみを対象とする
				const usersRef = collection(db, "users");
				const usersSnapshot = await getDocs(usersRef);

				allTargetUserIds = members.filter((memberId) => {
					// 操作者を除外
					if (actionUserId && memberId === actionUserId) {
						return false;
					}

					// 通知設定を確認
					const userDoc = usersSnapshot.docs.find((doc) => doc.id === memberId);
					if (userDoc) {
						const userData = userDoc.data();
						const notificationEnabled = userData.notificationEnabled !== false;
						return notificationEnabled;
					}

					return false;
				});

				console.log(
					`💾 グループ通知履歴を一括保存: ${allTargetUserIds.length}名のメンバー（操作者除外）`,
				);
			}
		} else {
			// 通常の通知: 操作者以外の全ユーザー（通知設定ONのみ）を取得
			allTargetUserIds = await getAllNotificationTargetUserIds(actionUserId);

			console.log(`💾 通知履歴を一括保存: ${allTargetUserIds.length}名のユーザー（操作者除外）`);
		}

		for (const userId of allTargetUserIds) {
			try {
				await saveNotificationHistory(userId, title, body, data);
			} catch (error) {
				console.error(`通知履歴の保存エラー (userId: ${userId}):`, error);
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

	console.log("➕ notifyTodoAdded呼び出し:", {
		title,
		displayName,
		userId,
		userId型: typeof userId,
		userIdの値: userId || "undefined/null",
		"auth.currentUser": auth.currentUser ? "存在" : "null",
	});

	if (!userId) {
		console.error("⚠️ 警告: userIdがnullまたはundefinedです！");
	}

	await sendPushNotification(
		"新しい共有Todo",
		`${displayName} が「${title}」を追加しました`,
		{ type: "todo_added", actionUserId: userId },
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * 共有Todoの編集通知
 */
export async function notifyTodoUpdated(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const userId = auth.currentUser?.uid;

	console.log("✏️ notifyTodoUpdated呼び出し:", {
		title,
		displayName,
		userId,
		userId型: typeof userId,
		userIdの値: userId || "undefined/null",
		"auth.currentUser": auth.currentUser ? "存在" : "null",
	});

	if (!userId) {
		console.error("⚠️ 警告: userIdがnullまたはundefinedです！");
	}

	await sendPushNotification(
		"共有Todoが更新されました",
		`${displayName} が「${title}」を編集しました`,
		{ type: "todo_updated", actionUserId: userId },
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * 共有Todoの削除通知
 */
export async function notifyTodoDeleted(title: string): Promise<void> {
	const displayName = await getCurrentUserDisplayName();
	const userId = auth.currentUser?.uid;

	console.log("🗑️ notifyTodoDeleted呼び出し:", {
		title,
		displayName,
		userId,
		userId型: typeof userId,
		userIdの値: userId || "undefined/null",
		"auth.currentUser": auth.currentUser ? "存在" : "null",
	});

	if (!userId) {
		console.error("⚠️ 警告: userIdがnullまたはundefinedです！");
	}

	await sendPushNotification(
		"共有Todoが削除されました",
		`${displayName} が「${title}」を削除しました`,
		{ type: "todo_deleted", actionUserId: userId },
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

	console.log("🔔 notifyTodoCompleted呼び出し:", {
		title,
		displayName,
		userId,
		userId型: typeof userId,
		userIdの値: userId || "undefined/null",
		"auth.currentUser": auth.currentUser ? "存在" : "null",
	});

	if (!userId) {
		console.error("⚠️ 警告: userIdがnullまたはundefinedです！");
	}

	await sendPushNotification(
		"共有TODO完了",
		`${displayName} が共有TODO「${title}」を完了しました。完了時刻：${completedTime}`,
		{ type: "todo_completed", actionUserId: userId },
		// includeCurrentUser: false (デフォルト) - 本人には通知しない
	);
}

/**
 * グループへの招待通知
 */
export async function notifyInvitation(
	invitedUserId: string,
	orgName: string,
	inviterName: string,
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
			throw new Error(`Push notification failed: ${response.status} (body: ${errorBody})`);
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
				true, // 本人を含む全員に通知
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
				throw new Error(`Push notification failed: ${response.status} (body: ${errorBody})`);
			}
		}

		console.log(`⏰ リマインド通知送信: ${todo.title}`);
	} catch (error) {
		console.error("Error sending reminder notification:", error);
		throw error;
	}
}
