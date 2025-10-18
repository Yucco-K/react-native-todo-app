# React Native Todo App

React Native + Expo で構築したTodoアプリ。Firebase認証とFirestoreでデータ管理。

## 機能
- Todo作成・編集・削除・完了切り替え
- My List（個人用）/ Shared（共有用）のタブ切り替え
- 検索・フィルタリング（モーダル）
- プッシュ通知（共有Todoの変更時）
- Firebase認証（メール/パスワード）

## 技術スタック
- React Native + Expo Router
- Firebase (Authentication, Firestore)
- NativeWind, Zod, expo-notifications

## セットアップ

### 1. インストール
```bash
npm install
```

### 2. 環境変数
`.env` ファイルを作成：
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_EAS_PROJECT_ID=
```

### 3. Firebase設定
- [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
- Firestore Database を有効化
- Authentication でメール/パスワードを有効化
- セキュリティルールを設定（詳細は `SPECIFICATION.md`）

### 4. 起動
```bash
npx expo start
```

## アプリへのアクセス

### QRコードでアクセス
1. 開発サーバーを起動：`npx expo start`
2. ターミナルに表示されるQRコードをスキャン
   - **iOS**: カメラアプリでスキャン
   - **Android**: Expo Goアプリでスキャン

### テストユーザーでログイン
アプリを試す際は、以下のテストアカウントをご利用ください：

```
Email: test@example.com
Password: password123
```

> **注意**: このテストアカウントは誰でも使用できます。個人情報は入力しないでください。

## プロジェクト構造
```
app/              # 画面（Expo Router）
components/       # UIコンポーネント
services/         # ビジネスロジック
contexts/         # Context API
config/           # Firebase設定
types/            # 型定義
```

## ライセンス
MIT
