# Todo アプリ 仕様書

## プロジェクト概要

React Native + Expo で構築したTodoアプリケーション。個人用と共有用のTodoを分けて管理でき、リアルタイムでのプッシュ通知機能を備えています。

### 主な特徴
- Firebase認証による安全なユーザー管理
- Firestore による永続化とリアルタイム同期
- タブナビゲーションによる直感的なUI
- モーダル検索・フィルタリング機能
- 共有Todo変更時の自動プッシュ通知

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

### 2. Todo管理（CRUD操作）
- **作成**: タイトル（1〜50文字）、内容（1〜200文字）
- **編集**: 作成者のみ編集可能（3点メニュー）
- **削除**: 作成者のみ削除可能（3点メニュー）
- **完了切り替え**: チェックボックスで即座に反映
- **共有切り替え**: 作成者がMy List⇄Shared間を移動可能

### 3. タブナビゲーション
- **My List**: 個人用Todo（shared: false）
- **Shared**: 共有Todo（shared: true）
- **即時反映**: グローバルRefreshContextで全タブ同期

### 4. 検索・フィルター
- **モーダル検索**: タイトル・内容で部分一致検索
- **状態フィルター**: すべて / 未完了 / 完了済み
- **リアルタイム検索**: 入力中に即座に結果更新

### 5. プッシュ通知
- **通知タイミング**: 共有Todo追加・編集・削除時
- **通知対象**: 全登録ユーザー（送信者を除く）
- **通知内容**: 操作者のEmailとTodoタイトル
- **Expo Push API使用**: トークン管理とFirestoreに保存

---

## データ構造

### Firestoreコレクション

#### `todos` コレクション
```typescript
{
  id: string;           // 自動生成されるドキュメントID
  userId: string;       // Todo作成者のUID（Firebase Auth）
  title: string;        // タイトル（1〜50文字）
  content: string;      // 内容（1〜200文字）
  completed: boolean;   // 完了状態
  shared: boolean;      // 共有状態（false=個人用, true=共有）
  createdAt: Date;      // 作成日時
}
```

#### `users` コレクション
```typescript
{
  id: string;           // ユーザーUID（Firebase Auth）
  pushToken: string;    // Expo Push通知トークン
  updatedAt: Date;      // トークン更新日時
}
```

### バリデーション（Zod）
```typescript
// Todoスキーマ
{
  title: z.string().min(1).max(50),
  content: z.string().min(1).max(200)
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
- **TodoForm**: Todo作成フォーム
- **TodoTable**: Todoリスト表示・管理
- **TodoItem**: 個別Todoカード（アコーディオン表示）
- **EditTodoModal**: Todo編集モーダル
- **SearchModal**: 検索・フィルターモーダル

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
    
    // usersコレクション（プッシュトークン）
    match /users/{userId} {
      // 自分のトークンのみ書き込み可能、全員が読み込み可能
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### Firestore Indexes（必須）

```
Collection: todos
Fields: userId (Ascending), shared (Ascending), createdAt (Descending)
```

Firebase Consoleで以下のURLから作成：
```
https://console.firebase.google.com/project/[PROJECT_ID]/firestore/indexes
```

---

## 状態管理

### Context API

#### AuthContext
```typescript
// 認証状態の管理
{
  user: User | null;
  loading: boolean;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
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
   - アプリ起動時: アラート表示
   - バックグラウンド: 通知センターに表示（スタンドアロンビルド時のみ）

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
│   └── TodoTable.tsx        # リスト表示
├── contexts/                # Context API
│   ├── AuthContext.tsx      # 認証コンテキスト
│   └── TodoRefreshContext.tsx
├── services/                # ビジネスロジック
│   ├── notificationService.ts  # プッシュ通知
│   └── todoService.ts       # Todo CRUD操作
├── config/                  # 設定ファイル
│   └── firebase.ts          # Firebase初期化
├── types/                   # 型定義
│   └── Todo.ts
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
   `.env`ファイルを作成し、Firebase設定を追加：
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
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

> **注意**: プッシュ通知の通知センター保存機能は、スタンドアロンビルドが必要です。Expo Goでは通知を受信できますが、通知センターには保存されません。

---

## トラブルシューティング

### Firestoreインデックスエラー
```
FirebaseError: The query requires an index.
```
→ エラーメッセージのリンクから Firebase Console でインデックスを作成

### プッシュ通知が届かない
- Expo Go では制限あり（スタンドアロンビルド推奨）
- Firebase Consoleで複数ユーザーが登録されているか確認
- `users` コレクションにプッシュトークンが保存されているか確認

### 認証エラー
```
FirebaseError: Missing or insufficient permissions.
```
→ Firebase Console でセキュリティルールを確認・更新
