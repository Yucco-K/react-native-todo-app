# プッシュ通知のセットアップ手順

## ⚠️ 重要

Expo Goでプッシュ通知を使用するには、Expoアカウントが必要です。

## 📝 セットアップ手順

### 1. Expoアカウントにログイン

```bash
npx expo login
```

または、アカウントがない場合：

```bash
npx expo register
```

### 2. プロジェクトIDを取得

```bash
npx expo whoami
eas project:info
```

### 3. app.jsonにprojectIdを追加

プロジェクトIDを取得したら、`app.json`に以下を追加：

```json
{
	"expo": {
		"name": "react-native-todo-app",
		"slug": "react-native-todo-app",
		"extra": {
			"eas": {
				"projectId": "YOUR_PROJECT_ID_HERE"
			}
		}
		// ... その他の設定
	}
}
```

### 4. アプリを再起動

```bash
# ターミナルでExpoサーバーを停止（Ctrl+C）
# 再度起動
npx expo start --clear
```

## 🔄 代替案：ローカル通知のみ使用

プッシュ通知が不要な場合、ローカル通知のみを使用することもできます：

```typescript
// services/notificationService.ts を以下のように変更

export async function registerForPushNotificationsAsync(): Promise<
	string | undefined
> {
	// プッシュトークンの取得をスキップ
	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== "granted") {
		alert("通知の許可が必要です");
		return;
	}

	console.log("通知パーミッション取得済み");
	return undefined; // プッシュトークンなし
}
```

この場合、リモートプッシュ通知は動作しませんが、アプリ内通知は引き続き使用できます。

## 📱 テスト環境

- **開発中**: Expo Go アプリ（要Expoアカウント）
- **本番**: EAS Build（スタンドアロンアプリ）

## 参考リンク

- [Expo Notifications ドキュメント](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Setup](https://docs.expo.dev/push-notifications/overview/)
