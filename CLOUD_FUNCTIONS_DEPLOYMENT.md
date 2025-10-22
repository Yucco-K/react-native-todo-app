# Cloud Functions デプロイ手順書

Firebase Cloud Functionsをデプロイして、AI機能を有効化する手順です。

## 📋 前提条件

- ✅ Firebase CLIがインストール済み
- ✅ Firebaseにログイン済み
- ✅ Cloud Functionsのコードが実装済み

---

## 🚀 デプロイ手順

### Step 1: 必要なAPIを有効化

以下のURLにアクセスして、必要なAPIを有効にしてください：

#### 1. Cloud Functions API

```
https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=react-native-todo-app-prod
```

**「Enable」(有効にする)** ボタンをクリック

#### 2. Cloud Build API

```
https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=react-native-todo-app-prod
```

**「Enable」(有効にする)** ボタンをクリック

#### 3. Cloud Resource Manager API

```
https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com?project=react-native-todo-app-prod
```

**「Enable」(有効にする)** ボタンをクリック

---

### Step 2: Cloud Functionsをデプロイ

ターミナルで以下のコマンドを実行：

```bash
cd /Users/yukig/dev/react-native-todo-app
firebase deploy --only functions
```

**初回デプロイは5-10分程度かかります。** ☕️

デプロイが成功すると、以下のようなメッセージが表示されます：

```
✔  functions[predictCategory(asia-northeast1)]: Successful create operation.
Function URL (predictCategory(asia-northeast1)): https://asia-northeast1-react-native-todo-app-prod.cloudfunctions.net/predictCategory
```

---

### Step 3: OpenAI APIキーの設定

デプロイ後、Google Cloud Consoleで環境変数を設定します。

#### 方法1: Google Cloud Console（推奨）

1. 以下のURLにアクセス：

   ```
   https://console.cloud.google.com/functions/list?project=react-native-todo-app-prod
   ```

2. `predictCategory` 関数をクリック

3. **「編集」** タブをクリック

4. **「ランタイム、ビルド、接続、セキュリティの設定」** を展開

5. **「ランタイム環境変数」** セクションで **「変数を追加」** をクリック

6. 以下を入力：
   - **名前**: `OPENAI_API_KEY`
   - **値**: `<your-openai-api-key>` （実際のキーは記載しないでください）

7. **「次へ」** → **「デプロイ」** をクリック

#### 方法2: gcloud CLI

```bash
gcloud functions deploy predictCategory \
  --region=asia-northeast1 \
  --set-env-vars OPENAI_API_KEY="<your-openai-api-key>"
```

---

### Step 4: Firestoreセキュリティルールの追加

レート制限用のコレクションにアクセスできるよう、Firestoreセキュリティルールを更新します。

Firebase Console → Firestore → **Rules** タブで、以下を追加：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 既存のルール...

    // レート制限用コレクション（AI機能用）
    match /rateLimits/{document} {
      allow read, write: if request.auth != null &&
                            request.auth.uid == document.split('_')[0];
    }
  }
}
```

**「公開」** ボタンをクリックして適用してください。

---

## ✅ 動作確認

### 1. アプリを起動

```bash
cd /Users/yukig/dev/react-native-todo-app
npx expo start --clear
```

### 2. TODOを作成

1. アプリにログイン
2. 「+」ボタンでTODO作成画面を開く
3. タイトルを入力（例：「牛乳を買う」）
4. カテゴリは自動で `shopping` に設定されるはず

### 3. ログを確認

Expo開発サーバーのログに以下が表示されれば成功：

```
🤖 AIカテゴリ推測を開始: "牛乳を買う"
✅ AIカテゴリ推測成功: "牛乳を買う" → shopping
```

### 4. Firebase Consoleでログを確認

```
https://console.cloud.google.com/functions/details/asia-northeast1/predictCategory?project=react-native-todo-app-prod&tab=logs
```

---

## 🐛 トラブルシューティング

### エラー: "functions/internal: サーバー設定エラー"

**原因**: OpenAI APIキーが設定されていない

**解決策**: Step 3のOpenAI APIキー設定を確認してください

---

### エラー: "functions/unauthenticated"

**原因**: ユーザーがログインしていない

**解決策**: アプリに再ログインしてください

---

### エラー: "functions/resource-exhausted"

**原因**: 1日の上限（10回）に達しました

**解決策**: 翌日まで待つか、Cloud Functionsコードの`requestCount >= 10`を増やしてください

---

### デプロイエラー: "Permission denied"

**原因**: 必要なAPIが有効になっていない

**解決策**: Step 1のAPI有効化を再確認してください

---

## 💰 料金について

### OpenAI API

- **1リクエスト**: 約$0.0002（`gpt-3.5-turbo`, max_tokens=10）
- **1日10回 × 30日 × 10ユーザー**: 約$0.60/月

### Firebase Cloud Functions

- **無料枠**: 月200万回まで
- **予想コスト**: $0/月（無料枠内）

**合計予想コスト**: 約$0.60/月

---

## 📊 使用量の監視

### Firebase Console

```
https://console.firebase.google.com/project/react-native-todo-app-prod/usage
```

### OpenAI Dashboard

```
https://platform.openai.com/usage
```

---

## 🔒 セキュリティ確認

### ✅ 実装済みのセキュリティ対策

- [x] OpenAI APIキーはサーバーサイドで管理
- [x] 認証済みユーザーのみ呼び出し可能
- [x] レート制限: 1ユーザー1日10回まで
- [x] エラーハンドリング
- [x] ログ記録

---

## 🎉 完了！

これで、AI機能が安全に有効化されました！

- ✅ GitHubに安全に公開可能
- ✅ OpenAI APIキーの漏洩リスクなし
- ✅ コスト管理済み
- ✅ レート制限実装済み

---

## 📚 関連ドキュメント

- `SECURITY_GUIDE.md` - セキュリティガイド
- `SECURITY_CHANGES_SUMMARY.md` - 変更サマリー
- `PRE_PUBLISH_CHECKLIST.md` - 公開前チェックリスト

---

**作成日**: 2025-10-22  
**最終更新**: 2025-10-22
