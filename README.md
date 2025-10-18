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

### 2. Firebase設定

- [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
- Firestore Database を有効化
- Authentication でメール/パスワードを有効化
- セキュリティルールを設定（詳細は `SPECIFICATION.md`）

### 3. 起動

```bash
npx expo start
```

## アプリへのアクセス

1. アプリを起動
2. QRコードをスキャン
   - **iOS**: カメラアプリでスキャン
   - **Android**: Expo Goアプリでスキャン

> **注意**: 開発サーバーと同じWiFiネットワークに接続している必要があります

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
