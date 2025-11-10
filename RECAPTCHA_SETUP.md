# reCAPTCHA セットアップガイド

このガイドでは、アプリにreCAPTCHA v2を統合する手順を説明します。

## 📋 概要

reCAPTCHAは、ボットや自動化された攻撃からアプリを保護するためのセキュリティ機能です。

### 実装内容

- **ログイン画面**: 3回以上ログインに失敗した場合にreCAPTCHAを表示
- **サインアップ画面**: 新規登録時に常にreCAPTCHAを表示
- **WebView実装**: React Native WebViewを使用したreCAPTCHA v2の統合

## 🔑 reCAPTCHAサイトキーの取得

### 1. Google reCAPTCHA管理コンソールにアクセス

[Google reCAPTCHA](https://www.google.com/recaptcha/admin) にアクセスし、Googleアカウントでログインします。

### 2. 新しいサイトを登録

1. **ラベル**: アプリ名を入力（例: `Todo App`）
2. **reCAPTCHAタイプ**: `reCAPTCHA v2` を選択
   - 「"ロボットではありません" チェックボックス」を選択
3. **ドメイン**: 
   - `localhost` （開発環境用）
   - 本番環境のドメイン（例: `yourdomain.com`）
4. **利用規約**に同意してチェック
5. **送信**をクリック

### 3. サイトキーとシークレットキーを取得

登録後、以下の情報が表示されます：

- **サイトキー（Site Key）**: クライアント側で使用
- **シークレットキー（Secret Key）**: サーバー側で使用（今回は不要）

## ⚙️ 環境変数の設定

### 1. `.env`ファイルの作成

プロジェクトルートに`.env`ファイルを作成し、以下を追加します：

```bash
# reCAPTCHA
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

`your_recaptcha_site_key_here`を取得したサイトキーに置き換えてください。

### 2. `.env`ファイルを`.gitignore`に追加

`.env`ファイルが既に`.gitignore`に含まれていることを確認してください：

```
.env
.env.local
```

## 📱 動作確認

### 開発環境でのテスト

1. **アプリを起動**:
   ```bash
   npx expo start
   ```

2. **サインアップ画面でテスト**:
   - サインアップ画面を開く
   - メールアドレスとパスワードを入力
   - 「新規登録」ボタンをタップ
   - reCAPTCHAモーダルが表示されることを確認
   - チェックボックスをクリックして認証
   - 認証後、自動的にサインアップ処理が実行されることを確認

3. **ログイン画面でテスト**:
   - ログイン画面を開く
   - 意図的に間違ったパスワードで3回ログインを試行
   - 4回目の試行時にreCAPTCHAモーダルが表示されることを確認
   - チェックボックスをクリックして認証
   - 認証後、ログイン処理が実行されることを確認

## 🔧 カスタマイズ

### reCAPTCHA表示タイミングの変更

ログイン画面でreCAPTCHAを表示する失敗回数を変更する場合、`app/login.tsx`の以下の定数を変更します：

```typescript
const RECAPTCHA_THRESHOLD = 3; // 3回失敗でreCAPTCHA表示
```

### reCAPTCHAのテーマ変更

`components/ReCaptcha.tsx`の以下の部分を変更します：

```typescript
'theme': 'light',  // 'light' または 'dark'
```

### reCAPTCHAのサイズ変更

```typescript
'size': 'normal'  // 'normal' または 'compact'
```

## 🚨 トラブルシューティング

### reCAPTCHAが表示されない

1. **環境変数の確認**:
   - `.env`ファイルが正しく作成されているか
   - `EXPO_PUBLIC_RECAPTCHA_SITE_KEY`が正しく設定されているか
   - アプリを再起動したか（環境変数の変更後は再起動が必要）

2. **サイトキーの確認**:
   - Google reCAPTCHA管理コンソールでサイトキーが正しいか確認
   - ドメイン設定に`localhost`が含まれているか確認

### reCAPTCHA認証が失敗する

1. **ネットワーク接続の確認**:
   - インターネット接続が正常か確認
   - ファイアウォールやプロキシの設定を確認

2. **ドメイン設定の確認**:
   - reCAPTCHA管理コンソールでドメイン設定が正しいか確認
   - 本番環境では正しいドメインが登録されているか確認

### WebViewが表示されない

1. **react-native-webviewのインストール確認**:
   ```bash
   npm list react-native-webview
   ```

2. **再インストール**:
   ```bash
   npm install react-native-webview
   npx expo prebuild --clean
   ```

## 📊 セキュリティ上の注意

### サイトキーの扱い

- **サイトキー**: クライアント側で使用するため、公開されても問題ありません
- **シークレットキー**: サーバー側でのみ使用し、絶対に公開しないでください

### 本番環境での設定

本番環境では、以下を確認してください：

1. **正しいドメインの登録**: reCAPTCHA管理コンソールで本番ドメインを登録
2. **環境変数の設定**: EAS Buildの環境変数に`EXPO_PUBLIC_RECAPTCHA_SITE_KEY`を設定
3. **セキュリティルールの確認**: Firebaseのセキュリティルールが適切に設定されているか確認

## 🔗 関連リンク

- [Google reCAPTCHA](https://www.google.com/recaptcha/)
- [reCAPTCHA v2 ドキュメント](https://developers.google.com/recaptcha/docs/display)
- [react-native-webview](https://github.com/react-native-webview/react-native-webview)

## 📝 実装詳細

### ファイル構成

```
components/
  └── ReCaptcha.tsx          # reCAPTCHAコンポーネント
app/
  ├── login.tsx              # ログイン画面（3回失敗後にreCAPTCHA）
  └── signup.tsx             # サインアップ画面（常にreCAPTCHA）
```

### 主な機能

1. **WebViewベースの実装**: React Native WebViewを使用してreCAPTCHA v2を表示
2. **モーダル表示**: ユーザーフレンドリーなモーダルUIで表示
3. **自動リトライ**: reCAPTCHA期限切れ時の自動リセット
4. **エラーハンドリング**: 認証失敗時の適切なエラーメッセージ表示

### セキュリティ機能

- **ログイン保護**: 複数回の失敗後にreCAPTCHAを要求
- **サインアップ保護**: 新規登録時に常にreCAPTCHA認証を要求
- **トークン管理**: 認証トークンの適切な管理とリセット

