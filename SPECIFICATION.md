# Todo アプリ 仕様書

## プロジェクト概要

React Native + Expo で構築したTodoアプリケーション。個人用と共有用のTodoを分けて管理でき、リアルタイムでのプッシュ通知機能を備えています。

### 主な特徴

- Firebase認証による安全なユーザー管理
- Firestore による永続化とリアルタイム同期
- タブナビゲーションによる直感的なUI
- モーダル検索・フィルタリング機能（カテゴリ対応）
- 共有Todo変更時の自動プッシュ通知
- **ニックネーム機能**：ユーザーの表示名をカスタマイズ
- **AIカテゴリ推測**：OpenAI APIによる自動カテゴリ分類
- **褒め言葉システム**：完了時にパーソナライズされた応援メッセージ

---

## 技術スタック

### フロントエンド

- **React Native**: クロスプラットフォームモバイルアプリ開発
- **Expo Router**: ファイルベースルーティング
- **NativeWind**: Tailwind CSS for React Native
- **TypeScript**: 型安全な開発

### バックエンド

- **Firebase Authentication**: ユーザー認証（Email/Password）
- **Cloud Firestore**: NoSQLデータベース
- **Expo Notifications**: プッシュ通知
- **OpenAI API**: AI カテゴリ推測（GPT-3.5-turbo）

### バリデーション・状態管理

- **Zod**: スキーマバリデーション
- **React Context API**: グローバル状態管理（Auth, TodoRefresh）

---

## 機能詳細

### 1. ユーザー認証

- **ログイン**: Email/Passwordでログイン
- **サインアップ**: 新規ユーザー登録
- **認証永続化**: AsyncStorageで認証状態を保持
- **自動リダイレクト**: 未ログイン時はログイン画面へ
- **ニックネーム登録**: ユーザー名を設定（最大20文字）、通知・UIに反映

### 2. Todo管理（CRUD操作）

- **作成**: タイトル（1〜50文字）、内容（任意、最大200文字）
- **編集**: 作成者のみ編集可能（3点メニュー）
- **削除**: 作成者のみ削除可能（3点メニュー）
- **完了切り替え**: チェックボックスで即座に反映
- **共有切り替え**: 作成者がMy List⇄Shared間を移動可能
- **カテゴリ設定**: 仕事、買い物、家事、勉強、健康、趣味、その他から選択
- **AIカテゴリ推測**: タイトル・内容からOpenAI APIで自動分類

### 3. タブナビゲーション

- **My List**: 個人用Todo（shared: false）
- **Shared**: 共有Todo（shared: true）
- **即時反映**: グローバルRefreshContextで全タブ同期

### 4. 検索・フィルター

- **モーダル検索**: タイトル・内容で部分一致検索
- **状態フィルター**: すべて / 未完了 / 完了済み
- **カテゴリフィルター**: 全カテゴリ、仕事、買い物、家事、勉強、健康、趣味、その他
- **リアルタイム検索**: 入力中に即座に結果更新

### 5. プッシュ通知

- **通知タイミング**: 共有Todo追加・編集・削除・完了時
- **通知対象**: 全登録ユーザー（完了通知のみ送信者を除く）
- **通知内容**: 操作者のニックネーム（未設定時はEmail）とTodoタイトル
- **完了通知**: 「〇〇さん が共有TODO「タイトル」を完了しました。完了時刻：MM月DD日HH時MM分」
- **Expo Push API使用**: トークン管理とFirestoreに保存

### 6. おすすめTODO機能

- **パーソナライズ提案**: Todo追加フォームの上部におすすめTODOを表示
- **高度な履歴分析**:
  - ユーザーの過去のTODO履歴（最大100件）を分析
  - 頻繁に追加されるカテゴリとタイトルを検出
  - **時間帯パターン**: 各タスクがいつ追加されるか（0-23時）を記録
  - **曜日パターン**: 各タスクが何曜日に追加されるかを記録
  - **周期検出**: 同じタスクの追加間隔を自動計算（時間単位）
  - **季節考慮**: 現在の月を考慮した提案
- **インテリジェント提案**:
  - **周期的タスク優先**: 前回から周期の80%以上経過したタスクを最優先（スコア: 100）
  - **時間帯マッチング**: 現在時刻±2時間以内に通常追加されるタスクを優先（スコア: +50）
  - **曜日マッチング**: 現在の曜日によく追加されるタスクを優先（スコア: +30）
  - **カテゴリベース**: 最頻出カテゴリからテンプレートベースで提案
  - 最大3件まで提案（スコア順）
- **コンテキストアウェアメッセージ**:
  - 周期的タスク: 「いつもの{title}、そろそろ3日ぶりではないですか？」
  - 時間帯一致: 「この時間はいつも{title}をしていますね！」
  - 通常タスク: 「そろそろ{title}ですか？」
- **ワンタップ追加**: おすすめをタップすると即座にTODOとして追加
  - タップ後、自動的に新しいおすすめを再取得して常に3件表示
  - 緑色の背景と塗りつぶしアイコンで追加可能を明示

### 7. 褒め言葉システム

- **トースト表示**: タスク完了時に画面の1/3サイズの大きなトースト表示（4秒間）
- **フィードバック機能（緩やかなスコアリングシステム）**:
  - トースト左端にライク（👍）とディスライク（👎）ボタンを配置
  - ユーザーの好みを`praiseFeedback`コレクションに保存
  - **スコア計算**: `like: +1点`, `dislike: -1点`, `無反応: 0点`
  - **メッセージ選択ルール（多様性重視）**:
    - スコア+3以上: × 2倍の確率（最大5倍）- 大人気メッセージ
    - スコア+2: × 1.8倍の確率 - 人気メッセージ
    - スコア+1: × 1.5倍の確率 - 好まれている
    - スコア0: × 1倍（基準）- 通常確率
    - スコア-1: × 0.8倍（80%表示）- やや低評価
    - スコア-2: × 0.5倍（50%表示）- 低評価
    - スコア-3以下: 除外 - 本当に嫌なメッセージのみ除外
- **パーソナライズ**: ユーザー統計、フィードバック、タスク内容に基づいてメッセージを選択
  - **初回完了検出**: 累計完了タスク数が0の場合、初回専用の特別メッセージ
  - **完了頻度分析**: 最終完了日時から24時間以内なら「頻繁」、1週間以上なら「復帰」メッセージ
  - **放置期間検出**: タスク作成から7日以上で「長期放置」、3日以上で「やや放置」メッセージ
  - **キーワードマッチング**: タイトル・内容から「ジム」「勉強」「買い物」などを検出して特化メッセージ
  - **カテゴリ別メッセージ**: 仕事、買い物、家事などカテゴリに応じた褒め言葉
  - **ユーザーフィードバック反映**:
    - dislikeされたメッセージは除外
    - likeされたメッセージを80%の確率で優先的に表示
    - 20%の確率で新しいメッセージを提案（学習機会）
- **ランダムテーマ**: 25種類の背景色・絵文字でバリエーション豊か
- **統計データ**: `userStats`コレクションに累計完了タスク数と最終完了日時を保存し、パーソナライゼーションに活用

---

## データ構造

### Firestoreコレクション

#### `todos` コレクション

```typescript
{
	id: string; // 自動生成されるドキュメントID
	userId: string; // Todo作成者のUID（Firebase Auth）
	title: string; // タイトル（1〜50文字）
	content: string; // 内容（任意、最大200文字）
	completed: boolean; // 完了状態
	shared: boolean; // 共有状態（false=個人用, true=共有）
	category: TodoCategory; // カテゴリ（work, shopping, housework, study, health, hobby, other）
	createdAt: Date; // 作成日時
	completedAt?: Date; // 完了日時（完了時のみ）
	completedBy?: string; // 完了者のUID（完了時のみ）
}
```

#### `users` コレクション

```typescript
{
	id: string; // ユーザーUID（Firebase Auth）
	pushToken: string; // Expo Push通知トークン
	nickname?: string; // ニックネーム（最大20文字、任意）
	updatedAt: Date; // トークン更新日時
}
```

#### `userStats` コレクション

```typescript
{
	id: string; // ユーザーUID（Firebase Auth）
	totalCompletedTasks: number; // 累計完了タスク数
	lastCompletedAt?: Date; // 最終完了日時
}
```

#### `completedTodoHistory` コレクション（AI統計用）

```typescript
{
	id: string; // 自動生成されるドキュメントID
	userId: string; // TodoのユーザーUID
	title: string; // タイトル
	category: TodoCategory; // カテゴリ
	completedAt: Date; // 完了日時
	completedBy?: string; // 完了者のUID
	createdAt: Date; // 作成日時
	deletedAt: Date; // 削除日時（48時間経過後）
}
```

**用途**: 完了後48時間経過して自動削除されたTodoの履歴を保存し、AI統計機能（褒め言葉生成、パーソナライゼーション）のデータとして活用します。

#### `praiseFeedback` コレクション（褒め言葉フィードバック）

```typescript
{
	id: string; // 自動生成されるドキュメントID
	userId: string; // ユーザーUID
	message: string; // 褒め言葉のメッセージ
	category: TodoCategory; // 完了したTodoのカテゴリ
	feedbackType: "like" | "dislike"; // フィードバックの種類
	createdAt: Date; // フィードバック日時
}
```

**用途**: ユーザーが褒め言葉トーストに対して行ったライク/ディスライクのフィードバックを保存し、今後の褒め言葉生成時にユーザーの好みを反映させます。

### バリデーション（Zod）

```typescript
// Todoスキーマ
{
  title: z.string().min(1).max(50),
  content: z.string().optional().or(z.literal("")).max(200) // 任意
}

// ニックネームスキーマ
{
  nickname: z.string().min(1).max(20)
}
```

---

## 画面構成

### 認証フロー

```
app/
├── login.tsx          # ログイン画面
├── signup.tsx         # サインアップ画面
└── (tabs)/            # タブナビゲーション（認証後）
    ├── _layout.tsx    # タブレイアウト
    ├── mylist.tsx     # My List画面
    └── shared.tsx     # Shared画面
```

### UI/UXコンポーネント

- **TodoForm**: Todo作成フォーム（カテゴリ選択、AI推測ボタン付き）
- **TodoTable**: Todoリスト表示・管理
- **TodoItem**: 個別Todoカード（アコーディオン表示、カテゴリバッジ表示）
- **EditTodoModal**: Todo編集モーダル（カテゴリ選択、AI推測ボタン付き）
- **SearchModal**: 検索・フィルターモーダル（カテゴリフィルター対応）
- **NicknameModal**: ニックネーム登録・編集モーダル
- **PraiseToast**: 褒め言葉トースト（カスタムデザイン）

### ナビゲーション

- **Stack Navigation**: 認証 → タブ
- **Tab Navigation**: My List ⇄ Shared

---

## セキュリティルール

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証必須
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // todosコレクション
    match /todos/{todoId} {
      // 自分が作成したTodoのみ読み書き可能
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // usersコレクション（プッシュトークン、ニックネーム）
    match /users/{userId} {
      // 自分のトークンのみ書き込み可能、全員が読み込み可能
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // userStatsコレクション（ユーザー統計）
    match /userStats/{userId} {
      // 自分の統計のみ読み書き可能
      allow read, write: if request.auth.uid == userId;
    }

    // completedTodoHistoryコレクション（完了Todo履歴、AI統計用）
    match /completedTodoHistory/{historyId} {
      // 自分の履歴のみ読み込み可能、書き込みは自動削除処理のみ
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if false; // 履歴は更新・削除不可
    }

    // praiseFeedbackコレクション（褒め言葉フィードバック）
    match /praiseFeedback/{feedbackId} {
      // 自分のフィードバックのみ読み書き可能
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Firestore Indexes（必須）

アプリの各機能に必要な複合インデックスを設定してください。

#### インデックス1: My List/Shared List表示用

```
Collection: todos
Fields:
  - shared (Ascending)
  - userId (Ascending)
  - createdAt (Descending)
```

#### インデックス2: おすすめTODO機能用

```
Collection: todos
Fields:
  - userId (Ascending)
  - createdAt (Descending)
  - __name__ (Descending)
```

**作成方法**:

1. Firebase Console → Firestore Database → Indexesタブ
2. 「Add index」をクリック
3. 上記の設定で作成
4. または、アプリ実行時のエラーメッセージ内のリンクをクリックして自動作成

**注意**: インデックス作成には数分かかります。Status が「Enabled」になるまで待ってください。

---

## 状態管理

### Context API

#### AuthContext

```typescript
// 認証状態の管理
{
	user: User | null;
	loading: boolean;
	nickname: string | null;
	signIn: (email, password) => Promise<void>;
	signUp: (email, password) => Promise<void>;
	signOut: () => Promise<void>;
	updateNickname: (nickname: string) => Promise<void>;
}
```

#### TodoRefreshContext

```typescript
// グローバルリフレッシュトリガー
{
  refreshTrigger: number;
  triggerRefresh: () => void;
}
```

---

## プッシュ通知フロー

1. **ユーザーログイン時**
   - Expo Push Tokenを取得
   - Firestoreの`users`コレクションに保存

2. **共有Todo変更時**
   - `notifyTodoAdded/Updated/Deleted`を呼び出し
   - Firestoreから全ユーザーのトークンを取得
   - Expo Push APIに通知リクエスト送信

3. **通知受信**
   - **フォアグラウンド（アプリ起動時）**: アラート表示
   - **バックグラウンド**: 通知センターに表示（Expo Goでも動作）
   - **iOS 15以降**: Expo Goでも通知センターへの保存が可能

---

## ディレクトリ構造

```
react-native-todo-app/
├── app/                      # 画面（Expo Router）
│   ├── (tabs)/              # タブナビゲーション
│   │   ├── _layout.tsx      # タブレイアウト
│   │   ├── mylist.tsx       # My List画面
│   │   └── shared.tsx       # Shared画面
│   ├── _layout.tsx          # ルートレイアウト
│   ├── index.tsx            # エントリーポイント
│   ├── login.tsx            # ログイン画面
│   └── signup.tsx           # サインアップ画面
├── components/              # UIコンポーネント
│   ├── ui/
│   │   └── TodoItem.tsx     # Todoカード
│   ├── EditTodoModal.tsx    # 編集モーダル
│   ├── SearchModal.tsx      # 検索モーダル
│   ├── TodoForm.tsx         # 作成フォーム
│   ├── TodoTable.tsx        # リスト表示
│   ├── NicknameModal.tsx    # ニックネーム設定モーダル
│   └── PraiseToast.tsx      # 褒め言葉トースト
├── contexts/                # Context API
│   ├── AuthContext.tsx      # 認証コンテキスト
│   └── TodoRefreshContext.tsx
├── services/                # ビジネスロジック
│   ├── notificationService.ts  # プッシュ通知
│   ├── todoService.ts       # Todo CRUD操作
│   ├── userService.ts       # ユーザー情報管理（ニックネーム）
│   ├── userStatsService.ts  # ユーザー統計管理
│   ├── praiseService.ts     # 褒め言葉生成ロジック
│   ├── praiseFeedbackService.ts # 褒め言葉フィードバック管理
│   ├── todoRecommendationService.ts # おすすめTODO生成
│   └── aiCategoryService.ts # AIカテゴリ推測（OpenAI）
├── config/                  # 設定ファイル
│   └── firebase.ts          # Firebase初期化
├── types/                   # 型定義
│   ├── Todo.ts
│   └── Category.ts          # カテゴリ定義
├── .env                     # 環境変数（Git除外）
├── app.json                 # Expo設定
└── package.json
```

---

## 開発環境

### 必要なツール

- Node.js 18+
- npm または yarn
- Expo Go アプリ（iOS/Android）
- Firebase プロジェクト

### セットアップ手順

1. **依存関係のインストール**

   ```bash
   npm install
   ```

2. **環境変数の設定**
   `.env`ファイルを作成し、Firebase設定とOpenAI APIキーを追加：

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key  # AIカテゴリ推測用
   ```

3. **Firebaseの設定**
   - Firebase Console でプロジェクト作成
   - Authentication で Email/Password を有効化
   - Firestore Database を作成
   - セキュリティルールを設定
   - 必要なインデックスを作成

4. **アプリ起動**

   ```bash
   npx expo start
   ```

5. **動作確認**
   - Expo Go アプリでQRコードをスキャン
   - サインアップしてアカウント作成
   - Todoの作成・編集・削除を確認

---

## 動作確認環境

- **iOS**: iOS 18.6.2（iPhone実機）
- **Android**: 未検証
- **Expo Go**: 最新版

### プッシュ通知について

- **Expo Go環境**: バックグラウンド時の通知は通知センターに表示されます（iOS 15以降）
- **スタンドアロンビルド**: 通知アクション、カスタムサウンド、バッジなどの高度な機能が利用可能
- **現在の実装**: Expo Goで通知の送受信と通知センター保存が動作確認済み

---

## トラブルシューティング

### Firestoreインデックスエラー

```
FirebaseError: The query requires an index.
```

**対処法**:

1. **エラーメッセージ内のリンクをクリック**（最も確実）
   - Firebaseが必要なインデックスを自動設定してくれます
   - 「Save」をクリックしてインデックスを作成
2. **手動で作成**:
   - Firebase Console → Firestore Database → Indexesタブ
   - 「Add index」から上記の必須インデックスを作成
3. **インデックス作成後**:
   - Status が「Building」→「Enabled」になるまで待つ（1-5分）
   - アプリを完全にリロード（Expo Goを再起動）
   - キャッシュをクリア: `npx expo start --clear`

**特に「おすすめTODO生成エラー」が出る場合**:

- インデックス2（userId + createdAt）が必要です
- エラーメッセージのURLから自動作成が最も確実です

### プッシュ通知が届かない

- **基本的な確認**:
  - Firebase Consoleで複数ユーザーが登録されているか確認
  - `users` コレクションにプッシュトークンが保存されているか確認
  - 通知権限が許可されているか確認（iOS設定アプリ）
- **Expo Go**: バックグラウンド時の通知は通知センターに表示されます
- **より高度な機能**: 通知アクション等が必要な場合はスタンドアロンビルドを検討

### 認証エラー

```
FirebaseError: Missing or insufficient permissions.
```

→ Firebase Console でセキュリティルールを確認・更新

---

## プロジェクトステータス

### 現在の状態

**開発環境：テスト・検証フェーズ**

- ✅ 基本機能実装完了
- ✅ iOS環境で動作確認済み
- ⚠️ テスト用Firebase環境で運用中
- ⚠️ Expo Go による開発環境のみ
- ❌ 本番環境未構築
- ❌ Android未検証

### 本番運用への課題

1. **インフラ**
   - 本番用Firebaseプロジェクトの作成
   - セキュリティルールの本番環境最適化
   - バックアップ・リカバリ戦略の策定

2. **アプリ配信**
   - スタンドアロンビルドの作成
   - App Store / Google Play への公開準備
   - TestFlightでのβテスト実施

3. **監視・運用**
   - Firebase Analytics の導入
   - エラートラッキング（Sentry等）
   - パフォーマンス監視

4. **セキュリティ**
   - API キーの環境分離（開発/本番）
   - HTTPS通信の強制
   - レート制限の実装
