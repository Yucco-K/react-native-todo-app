# React Native Todo App

React Native + Expo で構築したTodoアプリ。Firebase認証とFirestoreでデータ管理。

## 機能

- Todo作成・編集・削除・完了切り替え
- **グループ機能**：複数のグループ（家族、仕事チームなど）を作成・管理
  - **My List**：個人専用のプライベートTodoリスト
  - **グループTodo**：メンバー全員で共有できるTodoリスト
  - **招待システム**：
    - 招待コード（8桁英数字）で誰でも参加可能
    - メールアドレスで直接招待（登録済みユーザーのみ）
  - **ドロワーメニュー**：画面左上のメニューアイコンからMy Listと各グループを簡単に切り替え
  - **権限管理**：
    - グループ作成者（管理者）のみが招待・メンバー削除・グループ削除可能
    - Todoの編集・削除は作成者のみ可能
  - **リアルタイム同期**：グループメンバー全員の変更が即座に反映
- **プッシュ通知**：グループのTodo追加・削除・完了時に全メンバーに通知（通知センター対応）
- 検索・フィルタリング（モーダル、カテゴリ対応）
- Firebase認証（メール/パスワード）
- **ニックネーム登録**：ユーザー名を設定可能
- **カテゴリ管理**：仕事、買い物、家事、学校などのカテゴリ分類
- **AI カテゴリ推測**：OpenAI APIで自動カテゴリ分類
- **褒め言葉トースト**：タスク完了時にパーソナライズされた褒め言葉を表示（4秒間）
  - **フィードバック機能**：ライク👍/ディスライク👎ボタンで好みを学習
  - **スコアリングシステム**：ユーザーの反応に基づいて表示頻度を調整（多様性重視）
  - 押し間違いに寛容な設計（3回dislikeで除外）
- **おすすめTODO**：時間帯・曜日・周期を分析した自動提案（常に3件表示）
  - 過去のTODO履歴から行動パターンを学習
  - 使い込むほど精度が向上
  - **ワンタップで即座に追加**（追加後も新しいおすすめを自動表示）
- **操作性の向上**
  - チェックボックス・ボタンサイズを1.5倍に拡大（タップしやすい）
  - シンプルなグレーデザインで見やすい
- **ダークモード**：目に優しい暗いテーマに切り替え可能
  - **自動テーマ検出**：デバイスのシステム設定を自動認識
  - **トグルボタン**：My List画面右上でワンタップ切り替え
  - **設定保存**：一度設定すれば次回起動時も維持
  - **全画面対応**：すべての画面・モーダル・コンポーネントがダークモードに対応
  - **視認性最適化**：テキストやUIカラーをダークモードで見やすく調整

## 技術スタック

- React Native + Expo Router
- Firebase (Authentication, Firestore)
- OpenAI API (GPT-3.5-turbo)
- React Context API (テーマ管理、組織管理、Todo更新管理)
- AsyncStorage (ユーザー設定の永続化)
- NativeWind, Zod, expo-notifications

## デモ動画

[![デモ動画](https://img.youtube.com/vi/3YNxz43t5II/0.jpg)](https://youtube.com/shorts/3YNxz43t5II?feature=share)

アプリの使い方や機能の詳細は[こちらのデモ動画](https://youtube.com/shorts/3YNxz43t5II?feature=share)をご覧ください。

> 💡 このデモ動画はグループ機能実装前の収録です。最新版ではグループTodo機能、招待システムなどが追加されています。

## 動作確認環境

- **iOS**: iOS 18.6.2（iPhone実機、Expo Go）
- **Android**: 未検証

### プッシュ通知について

- **Expo Go環境**: バックグラウンド時の通知は通知センターに表示されます（iOS 15以降）
- **通知内容**:
  - グループTodoの追加・削除・完了時にリアルタイムで全メンバーに通知
  - ニックネームを登録している場合は「〇〇さんが...」と表示
- **招待通知**: メールアドレスで招待された場合、プッシュ通知で通知
- **動作確認済み**: 通知の送受信、通知センター保存がExpo Goで正常に動作
- **既知の問題**: グループTodo編集時のプッシュ通知が送信されない場合があります（詳細は`ISSUES.md`参照）

> 📱 現在iOSでのみ動作確認を行っています。Androidでの動作は保証されていません。

## セットアップ

### 1. インストール

```bash
npm install
```

### 2. Firebase設定

- [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
- **Firestore Database を有効化**
- **Authentication でメール/パスワードを有効化**
- **セキュリティルールを設定**（詳細は `SPECIFICATION.md`）
- **Firestore Indexes を作成**（必須）:
  - インデックス1: `organizationId` + `userId` + `createdAt`（グループTodo用）
  - インデックス2: `userId` + `createdAt`（おすすめTODO用）
  - 作成方法: アプリ起動時のエラーメッセージ内のリンクから自動作成が最も簡単
- **Firestore Security Rules を設定**（`FIRESTORE_RULES.md`参照）

### 3. 起動

```bash
npx expo start
```

## アプリへのアクセス

### 方法1: ローカル開発環境（WiFi必要）

1. `npx expo start` でアプリを起動
2. QRコードをスキャン
   - **iOS**: カメラアプリでスキャン
   - **Android**: Expo Goアプリでスキャン

> 💻 開発サーバーと同じWiFiネットワークに接続している必要があります

### 方法2: 公開版（どこからでもアクセス可能）

**Expo Goアプリ**をインストール（[iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)）して、以下のQRコードをスキャン：

<img src="./assets/qr-code.png" width="200" />

> **メリット**: WiFi制限なし、どこからでもアクセス可能

### テストアカウント

アプリをすぐに試したい方は、以下のテストアカウントをご利用ください：

- **メールアドレス**: `test@example.com`
- **パスワード**: `password123`

## プロジェクト構造

```
app/              # 画面（Expo Router）
components/       # UIコンポーネント
  ├─ ui/          # TodoItemなどのUI部品
  └─ *.tsx        # モーダルコンポーネント（Todo追加/編集、グループ管理など）
services/         # ビジネスロジック
  ├─ todoService.ts              # Todo CRUD操作
  ├─ organizationService.ts      # グループ管理
  ├─ praiseFeedbackService.ts    # 褒め言葉フィードバック
  ├─ todoRecommendationService.ts # おすすめTODO生成
  └─ notificationService.ts      # プッシュ通知
contexts/         # Context API
  ├─ AuthContext.tsx             # ユーザー認証
  ├─ OrganizationContext.tsx     # グループ管理
  ├─ TodoRefreshContext.tsx      # Todo更新管理
  └─ ThemeContext.tsx            # ダークモード管理
config/           # Firebase設定
types/            # 型定義
```

## ライセンス

MIT
