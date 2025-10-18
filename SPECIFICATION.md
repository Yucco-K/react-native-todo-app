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
	id: string; // 自動生成されるドキュメントID
	userId: string; // Todo作成者のUID（Firebase Auth）
	title: string; // タイトル（1〜50文字）
	content: string; // 内容（1〜200文字）
	completed: boolean; // 完了状態
	shared: boolean; // 共有状態（false=個人用, true=共有）
	createdAt: Date; // 作成日時
}
```

#### `users` コレクション

```typescript
{
	id: string; // ユーザーUID（Firebase Auth）
	pushToken: string; // Expo Push通知トークン
	updatedAt: Date; // トークン更新日時
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

---

## 開発ロードマップ

### Phase 1: 本番環境準備（1-2ヶ月）

#### インフラ整備
- [ ] 本番用Firebaseプロジェクト作成
- [ ] 環境変数の分離（`.env.development`, `.env.production`）
- [ ] CI/CD パイプライン構築（GitHub Actions）
- [ ] バックアップ戦略の実装

#### アプリ配信
- [ ] Apple Developer アカウント取得
- [ ] Google Play Developer アカウント取得
- [ ] スタンドアロンビルド作成（iOS/Android）
- [ ] TestFlightでβテスト開始
- [ ] ストアリリース準備（スクリーンショット、説明文）

#### 品質保証
- [ ] Android環境での動作確認
- [ ] 複数デバイスでのテスト
- [ ] パフォーマンステスト
- [ ] セキュリティ監査

---

### Phase 2: 機能拡張（2-4ヶ月）

#### 優先度：高

**1. チーム・グループ機能**
- 複数ユーザーでのチーム作成
- チーム内でのTodo共有
- チームメンバー管理（招待・削除）
- チーム別の権限管理

**2. リマインダー・期限設定**
- Todoに期限（Due Date）を設定
- 期限前の通知機能
- カレンダー表示
- 期限切れTodoのハイライト

**3. タグ・カテゴリ機能**
- Todoにタグを付与（例：仕事、個人、買い物）
- タグによるフィルタリング
- カテゴリ別の色分け表示
- カスタムタグの作成

**4. 添付ファイル機能**
- 画像・PDF添付
- Firebase Storage 連携
- ファイルプレビュー
- ファイルサイズ制限

#### 優先度：中

**5. サブタスク機能**
- Todo内に複数のサブタスクを作成
- サブタスクの進捗表示
- 親Todoの自動完了判定

**6. コメント機能**
- Todo内でのコメント投稿
- @メンション通知
- コメントの編集・削除
- リアルタイム更新

**7. 並び替え・ドラッグ&ドロップ**
- 優先度による手動並び替え
- ドラッグ&ドロップで順序変更
- 並び順の保存

**8. ダークモード対応**
- システム設定に連動
- 手動切り替えオプション
- 目に優しい配色

#### 優先度：低

**9. 統計・レポート機能**
- 完了率の可視化
- 週次・月次レポート
- グラフ表示（達成率、Todo数推移）
- エクスポート機能（CSV/PDF）

**10. テンプレート機能**
- よく使うTodoをテンプレート保存
- テンプレートから一括作成
- テンプレート共有

**11. 繰り返しTodo**
- 毎日・毎週・毎月の繰り返し設定
- カスタム繰り返しパターン
- 完了時の自動再作成

**12. オフライン対応**
- オフライン時のローカル保存
- オンライン復帰時の自動同期
- 競合解決メカニズム

---

### Phase 3: スケーラビリティ向上（4-6ヶ月）

#### パフォーマンス最適化
- [ ] ページネーション実装（無限スクロール）
- [ ] 画像の遅延読み込み
- [ ] キャッシュ戦略の最適化
- [ ] バンドルサイズの削減

#### インフラ強化
- [ ] Cloud Functions でのバッチ処理
- [ ] Firebase Hosting での静態コンテンツ配信
- [ ] CDN導入
- [ ] ロードバランシング

#### 多言語対応
- [ ] i18n ライブラリ導入
- [ ] 英語・日本語対応
- [ ] 地域別設定（日付・時刻フォーマット）

#### アクセシビリティ
- [ ] スクリーンリーダー対応
- [ ] キーボードナビゲーション
- [ ] コントラスト比の改善
- [ ] フォントサイズ調整機能

---

### Phase 4: エンタープライズ機能（6ヶ月以降）

**1. 組織管理**
- 組織・部門の階層構造
- 組織全体のダッシュボード
- 管理者権限の詳細設定

**2. SSO（シングルサインオン）**
- Google / Microsoft アカウント連携
- SAML 2.0 対応
- Active Directory 連携

**3. 監査ログ**
- 全操作の記録
- 変更履歴の追跡
- コンプライアンス対応

**4. API提供**
- REST API の公開
- Webhook による外部連携
- API キー管理
- レート制限

**5. 外部サービス連携**
- Slack 通知
- Google Calendar 同期
- Trello / Asana インポート
- Zapier 連携

---

## 本番運用への移行計画

### ステップ1: 環境分離（Week 1-2）
```bash
# 開発環境
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx-dev

# 本番環境
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx-prod
```

### ステップ2: データ移行（Week 3）
1. 本番Firebaseプロジェクト作成
2. セキュリティルール・インデックス設定
3. テストデータの移行テスト

### ステップ3: βテスト（Week 4-6）
1. TestFlightでiOSユーザー招待（50-100名）
2. Google Play内部テストでAndroid検証
3. フィードバック収集・改善

### ステップ4: 段階的リリース（Week 7-8）
1. App Store / Google Play 申請
2. 審査通過後、段階的公開（10% → 50% → 100%）
3. 監視・問題対応

### ステップ5: 運用開始（Week 9-）
1. ユーザーサポート体制構築
2. 定期メンテナンス計画
3. 機能追加サイクル開始

---

## 技術的な課題と解決策

### 1. パフォーマンス
**課題**: ユーザー数・Todo数増加時のパフォーマンス低下

**解決策**:
- Firestoreクエリの最適化（複合インデックス）
- ページネーション実装
- Cloud Functions でのバックグラウンド処理
- キャッシュ戦略（React Query導入検討）

### 2. コスト管理
**課題**: Firebase無料枠超過時のコスト増大

**解決策**:
- Firebase Blaze（従量課金）プラン移行
- Cloud Functions の実行時間最適化
- 不要なデータの定期削除
- モニタリングとアラート設定

### 3. セキュリティ
**課題**: 大規模運用時のセキュリティリスク

**解決策**:
- 定期的なセキュリティ監査
- レート制限の実装
- 異常アクセスの検知・ブロック
- 定期的な脆弱性スキャン

### 4. データ整合性
**課題**: 同時編集時の競合

**解決策**:
- Firestore トランザクションの活用
- 楽観的ロックの実装
- バージョン管理フィールドの追加
- 競合解決UIの実装

---

## まとめ

このプロジェクトは現在**テスト開発段階**ですが、本番運用に向けた明確なロードマップを持っています。

### 短期目標（3ヶ月）
- 本番環境の構築
- スタンドアロンビルドの作成
- ストアへの公開

### 中期目標（6ヶ月）
- チーム機能の実装
- リマインダー・期限設定
- タグ・カテゴリ機能

### 長期目標（1年）
- エンタープライズ機能の提供
- 外部サービス連携
- グローバル展開（多言語対応）

**継続的な改善とユーザーフィードバックを重視**し、使いやすく信頼性の高いTodoアプリを目指します。
