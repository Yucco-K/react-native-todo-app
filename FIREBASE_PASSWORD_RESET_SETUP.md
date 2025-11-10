# Firebase パスワードリセット設定ガイド

このガイドでは、Firebase Console でパスワードリセットメールのテンプレートをカスタマイズし、新しいパスワードの要件をユーザーに伝える方法を説明します。

## 📧 パスワードリセットメールテンプレートのカスタマイズ

### 1. Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. 左メニューから **Authentication** をクリック
4. 上部タブから **Templates** をクリック

### 2. パスワードリセットテンプレートを編集

1. **Password reset** テンプレートの右側にある **編集アイコン（鉛筆マーク）** をクリック
2. 以下の内容を参考にテンプレートをカスタマイズ

#### 推奨テンプレート（日本語）

**件名:**
```
パスワードリセットのご案内
```

**メール本文:**
```
こんにちは、

パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：

%LINK%

このリンクは1時間有効です。

【新しいパスワードの要件】
• 8文字以上

このリクエストに心当たりがない場合は、このメールを無視してください。

よろしくお願いいたします。
```

### 3. 言語設定

- **Language**: `Japanese (日本語)` を選択
- 複数言語をサポートする場合は、各言語ごとにテンプレートを設定

### 4. 送信者情報のカスタマイズ

1. **From name**: アプリ名（例: `TODO App`）
2. **From email**: デフォルトは `noreply@<your-project-id>.firebaseapp.com`
   - カスタムドメインを使用する場合は、Firebase Console の設定から変更可能

### 5. 保存

- **SAVE** ボタンをクリックして変更を保存

## 🔒 Firebase のパスワードポリシー設定

Firebase Authentication では、デフォルトで最小6文字のパスワードが要求されます。アプリ側でより厳格なバリデーション（8文字以上、文字+数字）を実装していますが、Firebase 側でもポリシーを設定できます。

### パスワードポリシーの設定（オプション）

1. Firebase Console → **Authentication** → **Settings**
2. **Password policy** セクションで以下を設定:
   - **Minimum length**: 8
   - **Require uppercase letters**: オプション
   - **Require lowercase letters**: オプション
   - **Require numbers**: 推奨
   - **Require special characters**: オプション

**注意**: Firebase のパスワードポリシーは、Identity Platform（有料プラン）でのみ利用可能です。無料プランでは、アプリ側のバリデーションで対応してください。

## 📱 アプリ側の実装

アプリでは以下のバリデーションを実装済みです：

### サインアップ画面 (`app/signup.tsx`)
```typescript
password: z.string().min(8, "パスワードは8文字以上で入力してください")
```

### ログイン画面 (`app/login.tsx`)
```typescript
password: z.string().min(8, "パスワードは8文字以上で入力してください")
```

### パスワードリセット画面 (`app/forgot-password.tsx`)
- パスワード要件（8文字以上）を画面上に表示
- エラーメッセージを日本語化

## 🧪 テスト方法

1. **パスワードリセットフローのテスト**:
   - アプリでログイン画面を開く
   - 「パスワードを忘れた場合」をタップ
   - メールアドレスを入力して送信
   - 受信したメールを確認（件名、本文、パスワード要件が正しく表示されているか）
   - メール内のリンクをクリック
   - 新しいパスワードを入力（要件を満たさないパスワードでエラーが出るか確認）
   - 要件を満たすパスワードで正常にリセットできるか確認

2. **バリデーションのテスト**:
   - 新規登録時に以下のパスワードでテスト:
     - ❌ `abc123` (7文字 - 短すぎる)
     - ❌ `test` (4文字 - 短すぎる)
     - ✅ `abcdefgh` (8文字)
     - ✅ `12345678` (8文字)
     - ✅ `abc12345` (8文字)
     - ✅ `Password123` (11文字)

## 📝 注意事項

1. **メールが届かない場合**:
   - 迷惑メールフォルダを確認
   - Firebase Console の **Authorized domains** に正しいドメインが登録されているか確認
   - Firebase Console の **Email action handler** が正しく設定されているか確認

2. **パスワードリセットリンクの有効期限**:
   - デフォルトでは1時間有効
   - 期限切れの場合は、再度リセットメールを送信

3. **セキュリティ**:
   - パスワードリセットリンクは1回のみ使用可能
   - 使用後は無効化される

## 🔗 関連ドキュメント

- [Firebase Authentication - Email Templates](https://firebase.google.com/docs/auth/custom-email-handler)
- [Firebase Authentication - Password Policy](https://cloud.google.com/identity-platform/docs/password-policy)
- [FIREBASE_EMAIL_SETUP.md](./FIREBASE_EMAIL_SETUP.md) - メール認証の設定ガイド

