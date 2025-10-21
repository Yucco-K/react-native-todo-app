# セキュリティガイド

このドキュメントでは、アプリのセキュリティに関する重要な情報と、将来的な改善方法について説明します。

## 🔒 現在のセキュリティ状態

### ✅ 安全な部分

1. **Firebase認証・Firestore**
   - ✅ 認証情報は環境変数で管理（`.env`）
   - ✅ `.gitignore`で`.env`ファイルを除外済み
   - ✅ セキュリティルールで適切なアクセス制御

2. **API キー管理**
   - ✅ すべての機密情報は`.env`ファイルに保存
   - ✅ GitHubリポジトリにコミットされていない

### ⚠️ 改善が必要な部分

#### 1. OpenAI API（現在：一時的に無効化済み）

**問題点**:

- クライアントサイドからOpenAI APIを直接呼び出すと、APIキーが漏洩するリスクがあります
- `EXPO_PUBLIC_*`環境変数はアプリバンドルに含まれるため、デコンパイル可能

**現在の対応**:

- `services/aiCategoryService.ts`で機能を無効化
- ユーザーは手動でカテゴリを選択

**将来の実装**:

- Firebase Cloud Functionsでバックエンド実装（下記参照）

---

## 🚀 Firebase Cloud Functions実装ガイド

### なぜFirebase Cloud Functionsが必要か

```
❌ 現在（危険）:
React Native App → OpenAI API（APIキーが漏洩）

✅ 将来（安全）:
React Native App → Firebase Functions → OpenAI API（APIキーは安全）
```

### 実装手順

#### Step 1: Firebase CLIのインストール

```bash
npm install -g firebase-tools
firebase login
```

#### Step 2: Firebase Functionsの初期化

```bash
cd /Users/yukig/dev/react-native-todo-app
firebase init functions

# 質問に答える:
# - TypeScriptを選択
# - ESLintを有効化
# - 依存関係をインストール
```

#### Step 3: Cloud Functionの作成

`functions/src/index.ts`を作成:

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

#### Step 4: 環境変数の設定

```bash
# OpenAI APIキーを設定（ローカルでは実行しない）
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"

# 確認
firebase functions:config:get
```

#### Step 5: デプロイ

```bash
cd functions
npm install openai
cd ..
firebase deploy --only functions
```

#### Step 6: クライアントサイドの実装

`services/aiCategoryService.ts`を以下のように変更:

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

#### Step 7: Firebase設定の更新

`config/firebase.ts`に`functions`をエクスポート:

```typescript
import { getFunctions } from "firebase/functions";

// 既存のコード...

export const functions = getFunctions(app, "asia-northeast1");
```

---

## 💰 コスト管理

### OpenAI API使用量の見積もり

- **1リクエストあたり**: 約$0.0002（`gpt-3.5-turbo`, max_tokens=10）
- **1日10回 × 30日 × 10ユーザー**: 3,000リクエスト ≈ **$0.60/月**
- **レート制限**: 1ユーザー1日10回まで

### Firebase Cloud Functions無料枠

- **呼び出し**: 月200万回まで無料
- **ネットワーク**: 月5GB まで無料
- **CPU時間**: 月40万GB秒まで無料

**結論**: 通常使用では無料枠内で収まります

---

## 🔐 その他のセキュリティベストプラクティス

### 1. 環境変数の管理

```bash
# .env（ローカル開発用）
EXPO_PUBLIC_FIREBASE_API_KEY=...
# OpenAI APIキーは含めない！

# Firebase Functions（本番環境）
firebase functions:config:set openai.key="..."
```

### 2. Firestore セキュリティルール

`firestore.rules`で適切なアクセス制御を実装済み:

```javascript
// レート制限用コレクション
match /rateLimits/{document} {
  allow read, write: if request.auth != null &&
                        request.auth.uid == document.split('_')[0];
}
```

### 3. プッシュ通知トークン

- ✅ Firestoreに保存（認証済みユーザーのみアクセス可能）
- ✅ トークンは暗号化された状態で送信

### 4. 定期的なセキュリティレビュー

- [ ] 月1回：Firebase Console でAPI使用量を確認
- [ ] 月1回：OpenAI Dashboard で使用量と請求額を確認
- [ ] 四半期：依存関係の脆弱性チェック（`npm audit`）

---

## 📊 セキュリティチェックリスト

### デプロイ前

- [x] `.gitignore`に`.env*`を追加済み
- [x] GitHubに機密情報がコミットされていないことを確認
- [x] OpenAI API直接呼び出しを無効化
- [ ] Firebase Cloud Functionsをデプロイ（将来）
- [x] Firestoreセキュリティルールを設定

### デプロイ後

- [ ] OpenAI API使用量を監視
- [ ] Firebase請求アラートを設定
- [ ] 異常なアクセスパターンを監視

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
- **TODO**: Firebase Cloud Functions実装
