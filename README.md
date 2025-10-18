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

## 動作確認環境

- **iOS**: iOS 18.6.2（iPhone実機）
- **Android**: 未検証

> **注意**: 現在iOSでのみ動作確認を行っています。Androidでの動作は保証されていません。

## セットアップ

### 1. インストール

```bash
npm install
```

### 2. 環境変数

プロジェクトには3つの環境設定ファイルがあります：

- `.env` - 現在使用中の環境
- `.env.development` - 開発環境（テスト用Firebase）
- `.env.production` - 本番環境

#### 環境の切り替え方法

**開発環境で起動（デフォルト）:**
```bash
cp .env.development .env
npx expo start
```

**本番環境で起動:**
```bash
cp .env.production .env
npx expo start
```

#### 環境変数の形式

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
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
