# セキュリティガイド

このドキュメントでは、Re:Mindのセキュリティに関する重要な情報と実装状況について説明します。

## 🔒 現在のセキュリティ状態

### ✅ 実装済みのセキュリティ対策

1. **Firebase認証・Firestore**
   - ✅ 認証情報は環境変数で管理（`.env`）
   - ✅ `.gitignore`で`.env`ファイルを除外済み
   - ✅ セキュリティルールで適切なアクセス制御
   - ✅ メール認証による本人確認
   - ✅ ログイン制限機能（7回失敗で10分間ロック）

2. **API キー管理**
   - ✅ すべての機密情報は`.env`ファイルに保存
   - ✅ GitHubリポジトリにコミットされていない
   - ✅ Firebase Cloud FunctionsでOpenAI APIキーを安全に管理

3. **AI機能のセキュリティ**
   - ✅ OpenAI APIキーはCloud Functions環境変数で管理（クライアント側に露出なし）
   - ✅ レート制限実装済み（1ユーザー100回/日、本番では10回/日推奨）
   - ✅ 認証済みユーザーのみアクセス可能

---

## 🚀 Firebase Cloud Functions実装状況

### 実装済みの構成

```
✅ 現在（安全）:
Re:Mind App → Firebase Cloud Functions → OpenAI API（APIキーは安全に管理）
```

### セキュリティ上の利点

- APIキーはCloud Functions環境変数で管理（クライアント側に露出なし）
- レート制限をサーバーサイドで実装
- 認証チェックをサーバーサイドで実施

### 実装詳細

Re:Mindでは既にFirebase Cloud Functionsが実装されています：

#### 実装済みのCloud Functions

1. **predictCategory** - AIカテゴリ推測
2. **sendDueReminders** - リマインダー通知の自動送信

#### `functions/src/index.ts`の実装例（predictCategory）:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();

export const predictCategory = functions
	.region("asia-northeast1") // 東京リージョン
	.https.onCall(async (data, context) => {
		// 認証チェック
		if (!context.auth) {
			throw new functions.https.HttpsError(
				"unauthenticated",
				"ユーザー認証が必要です"
			);
		}

		const { title, content } = data;

		// バリデーション
		if (!title || typeof title !== "string") {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"タイトルが必要です"
			);
		}

		// レート制限（Firestoreで実装）
		const userId = context.auth.uid;
		const today = new Date().toISOString().split("T")[0];
		const rateLimitDoc = admin
			.firestore()
			.collection("rateLimits")
			.doc(`${userId}_${today}`);

		const rateLimitData = await rateLimitDoc.get();
		const requestCount = rateLimitData.data()?.count || 0;

		if (requestCount >= 10) {
			throw new functions.https.HttpsError(
				"resource-exhausted",
				"1日の上限（10回）に達しました"
			);
		}

		// OpenAI API呼び出し（APIキーは環境変数から取得）
		const openai = new OpenAI({
			apiKey: functions.config().openai.key,
		});

		try {
			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content: "あなたはタスクを分類する専門家です。",
					},
					{
						role: "user",
						content: `以下のタスクをカテゴリ分類してください。
タイトル: ${title}
内容: ${content || "なし"}

カテゴリ: work, shopping, personal, study, school, housework, other`,
					},
				],
				temperature: 0.3,
				max_tokens: 10,
			});

			const category = response.choices[0]?.message?.content
				?.trim()
				.toLowerCase();

			// レート制限カウンターを更新
			await rateLimitDoc.set(
				{
					count: requestCount + 1,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			);

			return { category: category || "other" };
		} catch (error) {
			console.error("OpenAI API error:", error);
			throw new functions.https.HttpsError("internal", "AI推測に失敗しました");
		}
	});
```

#### 環境変数の設定

```bash
# OpenAI APIキーを設定
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"

# 確認
firebase functions:config:get
```

> **注意**: 上記のAPIキーは例です。実際の値は`.env`ファイルや環境変数に保存し、Gitにコミットしないでください。

#### デプロイ

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

#### クライアントサイドの実装

`services/aiCategoryService.ts`の実装例:

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import type { TodoCategory } from "@/types/Category";

export async function predictCategory(
	title: string,
	content: string
): Promise<TodoCategory> {
	try {
		if (!title.trim()) {
			return "other";
		}

		// Firebase Cloud Functionを呼び出し
		const predictCategoryFn = httpsCallable(functions, "predictCategory");
		const result = await predictCategoryFn({ title, content });

		const data = result.data as { category: string };
		const validCategories: TodoCategory[] = [
			"work",
			"shopping",
			"personal",
			"study",
			"school",
			"housework",
			"other",
		];

		if (validCategories.includes(data.category as TodoCategory)) {
			return data.category as TodoCategory;
		}

		return "other";
	} catch (error) {
		console.error("AI推測エラー:", error);
		return "other";
	}
}
```

#### Firebase設定

`config/firebase.ts`で`functions`を初期化:

```typescript
import { getFunctions } from "firebase/functions";

export const functions = getFunctions(app, "asia-northeast1");
```

> **実装済み**: Re:Mindでは既にこの設定が完了しています。

---

## 💰 コスト管理

### OpenAI API使用量の見積もり

- **1リクエストあたり**: 約$0.0002（`gpt-3.5-turbo`, max_tokens=10）
- **1日10回 × 30日 × 10ユーザー**: 3,000リクエスト ≈ **$0.60/月**
- **現在のレート制限**: 1ユーザー100回/日（開発環境）
- **本番推奨**: 1ユーザー10回/日

### コスト監視設定

- ✅ OpenAI 月次予算: $10
- ✅ 80%使用アラート設定済み
- ✅ 100%使用アラート設定済み

### Firebase Cloud Functions無料枠

- **呼び出し**: 月200万回まで無料
- **ネットワーク**: 月5GB まで無料
- **CPU時間**: 月40万GB秒まで無料

**結論**: 通常使用では無料枠内で収まります

---

## 🔐 その他のセキュリティベストプラクティス

### 1. 環境変数の管理

✅ **実装済み**

```bash
# .env（ローカル開発用）
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# OpenAI APIキーはここに含めない！

# Firebase Functions（本番環境）
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```

> **重要**: 環境変数に実際のAPIキーや機密情報を記載しないこと。これは設定例です。

### 2. Firestore セキュリティルール

✅ **実装済み**

`firestore.rules`で適切なアクセス制御を実装済み:

```javascript
// レート制限用コレクション
match /rateLimits/{document} {
  allow read, write: if request.auth != null &&
                        request.auth.uid == document.split('_')[0];
}

// ユーザーコレクション
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Todoコレクション
match /todos/{todoId} {
  allow read, write: if request.auth != null;
}
```

詳細は`FIRESTORE_RULES.md`を参照してください。

### 3. プッシュ通知トークン

✅ **実装済み**

- Firestoreに保存（認証済みユーザーのみアクセス可能）
- トークンは暗号化された状態で送信
- 通知ON/OFF設定機能実装済み

### 4. 認証セキュリティ

✅ **実装済み**

- メール認証による本人確認
- ログイン制限機能（7回失敗で10分間ロック）
- パスワード要件（8文字以上）
- Google Sign-In、Apple Sign-In対応

### 5. 定期的なセキュリティレビュー

- 月1回：Firebase Console でAPI使用量を確認
- 月1回：OpenAI Dashboard で使用量と請求額を確認
- 四半期：依存関係の脆弱性チェック（`npm audit`）

---

## 📊 セキュリティチェックリスト

### デプロイ前

- [x] `.gitignore`に`.env*`を追加済み
- [x] GitHubに機密情報がコミットされていないことを確認
- [x] Firebase Cloud Functionsをデプロイ済み
- [x] Firestoreセキュリティルールを設定済み
- [x] レート制限実装済み
- [x] メール認証実装済み
- [x] ログイン制限実装済み

### 運用中

- [x] OpenAI API使用量を監視（月次予算$10、アラート設定済み）
- [x] Firebase請求アラートを設定済み
- 異常なアクセスパターンの監視（推奨）
- 定期的な脆弱性チェック（`npm audit`）

---

## 🆘 トラブルシューティング

### Q: OpenAI APIキーが漏洩してしまった場合

1. **すぐに実施**:

   ```bash
   # OpenAI Dashboardにアクセス
   # 漏洩したキーを無効化
   # 新しいキーを生成
   ```

2. **Firebase Functionsの更新**:
   ```bash
   firebase functions:config:set openai.key="NEW_KEY"
   firebase deploy --only functions
   ```

### Q: Cloud Functions のデプロイに失敗する

```bash
# ログを確認
firebase functions:log

# 権限を確認
gcloud projects get-iam-policy PROJECT_ID
```

### Q: レート制限が機能しない

- Firestoreの`rateLimits`コレクションを確認
- セキュリティルールが正しく設定されているか確認

---

## 📚 参考リンク

- [Firebase Cloud Functions ドキュメント](https://firebase.google.com/docs/functions)
- [OpenAI API ベストプラクティス](https://platform.openai.com/docs/guides/safety-best-practices)
- [Firebase セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)

---

## 🔄 更新履歴

- **2025-01-21**: ドキュメント作成、OpenAI API機能を一時的に無効化
- **2025-01-22**: Firebase Cloud Functions実装完了
- **2025-10-25**: ログイン制限機能実装
- **2025-10-26**: 通知ON/OFF設定機能実装
- **2025-11-15**: Re:Mindへのリブランディング、ドキュメント全体更新
