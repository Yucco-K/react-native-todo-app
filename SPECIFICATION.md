# Todo アプリ 仕様書

## プロジェクト概要

React Native + Expo で構築したTodoアプリケーション。個人用のMy Listと、グループで共有できるTodoリストを管理でき、リアルタイムでのプッシュ通知機能を備えています。

### 主な特徴

- Firebase認証による安全なユーザー管理
- Firestore による永続化とリアルタイム同期
- ドロワーメニューによる直感的なUI（My List / グループ切り替え）
- モーダル検索・フィルタリング機能（カテゴリ対応）
- グループTodo変更時の自動プッシュ通知
- グループ管理機能（作成、招待、メンバー管理、権限制御）
- **ニックネーム機能**：ユーザーの表示名をカスタマイズ
- **AIカテゴリ推測**：Firebase Cloud Functions経由で安全に実装（レート制限付き）
- **褒め言葉システム**：完了時にパーソナライズされた応援メッセージ
- **おすすめTODO機能**：時間帯・曜日・周期を分析した自動提案（ワンタップで追加）
- **ダークモード**：システム設定の自動検出と手動切り替えに対応、全画面・モーダルで統一されたテーマ

---

## 技術スタック

### フロントエンド

- **React Native**: クロスプラットフォームモバイルアプリ開発
- **Expo Router**: ファイルベースルーティング
- **NativeWind**: Tailwind CSS for React Native
- **TypeScript**: 型安全な開発
- **@react-native-community/datetimepicker**: リマインド日時選択UI

### バックエンド

- **Firebase Authentication**: ユーザー認証（Email/Password）
- **Cloud Firestore**: NoSQLデータベース
- **Firebase Cloud Functions**: サーバーレス関数（AI推測、レート制限）
- **OpenAI API**: AI カテゴリ推測（GPT-3.5-turbo、Cloud Functions経由）
- **Expo Notifications**: プッシュ通知

### バリデーション・状態管理

- **Zod**: スキーマバリデーション
- **React Context API**: グローバル状態管理
  - `AuthContext`: ユーザー認証状態
  - `OrganizationContext`: グループ管理
  - `TodoRefreshContext`: Todo更新管理
  - `ThemeContext`: ダークモード管理
- **AsyncStorage**: ユーザー設定・セキュリティ情報の永続化（テーマ設定、ログイン失敗回数、ロックアウト時刻など）

---

## 機能詳細

### 1. ユーザー認証

- **ログイン**: Email/Passwordでログイン
- **サインアップ**: 新規ユーザー登録
- **認証永続化**: AsyncStorageで認証状態を保持
- **自動リダイレクト**: 未ログイン時はログイン画面へ
- **ニックネーム登録**: ユーザー名を設定（最大20文字）、通知・UIに反映
- **ログインセキュリティ**:
  - **失敗回数制限**: 7回連続でログイン失敗すると10分間ログインを一時停止
  - **段階的な警告**: 残り試行回数が3回以下になると警告メッセージを表示
  - **リアルタイムカウントダウン**: ロックアウト中は残り時間を秒単位で表示
  - **認証エラーのみカウント**: ネットワークエラーなどは失敗回数に含めない
  - **自動リセット**: ログイン成功時に失敗回数をリセット
  - **永続化**: AsyncStorageで失敗回数とロックアウト時刻を管理

### 2. Todo管理（CRUD操作）

- **作成**: タイトル（1〜50文字）、内容（任意、最大200文字）
- **編集**: 作成者のみ編集可能（3点メニュー）
- **削除**: 作成者のみ削除可能（3点メニュー）
- **完了切り替え**: チェックボックスで即座に反映
- **共有切り替え**: 作成者がMy List⇄Shared間を移動可能
- **カテゴリ設定**: 仕事、買い物、家事、勉強、健康、趣味、その他から選択
- **AIカテゴリ推測**: タイトル・内容からFirebase Cloud Functions + OpenAI APIで自動分類
  - セキュリティ: APIキーはサーバーサイドで安全に管理
  - レート制限: 1ユーザー1日10回まで
- **リマインド機能**:
  - **専用画面でのリマインド設定**:
    - 3点メニューから「リマインド設定」をタップして専用画面へ遷移
    - フル画面で快適な日時選択（スクロール可能、ヘッダーにTodoタイトル表示）
    - DateTimePickerで日付と時刻を直感的に選択
  - **リマインド情報の可視化**:
    - Todoアイテムを展開すると設定日時と通知状態を表示
    - 未通知: オレンジアイコン、通知済み: グレーアイコン
    - 日時フォーマット: `リマインド: YYYY/MM/DD HH:MM`
  - **バリデーション**:
    - 過去の日時は設定不可
    - 既存リマインドが過去の場合、自動的に「現在+5分」を初期値にセット
  - **完了時の自動削除**: Todoを完了にすると `remindAt` と `remindNotified` を自動削除
  - **変更・削除**: 設定済みリマインドの変更や削除が可能
  - **サーバー側の自動プッシュ通知**（Firebase Cloud Functions）:
    - `sendDueReminders` Functionが毎分実行され、期限到達リマインドを自動検出
    - 条件: `remindNotified == false` かつ `remindAt <= now`
    - グループTodo: 全メンバーに通知
    - 個人Todo: 本人のみに通知
    - 送信後に `remindNotified: true` を自動更新
    - **アプリ未起動でも通知**: ユーザーがアプリを開いていなくても通知を受信可能
  - **クライアント側の自動チェック**:
    - アプリ起動・フォアグラウンド復帰時に未読リマインドを自動確認
    - リマインド通知モーダルで一覧表示
    - 「わかった」をタップするまで毎回表示（タップ後は `remindNotified: true` に更新して既読化）
  - **Firestoreフィールド**: `remindAt`（Date型）、`remindNotified`（boolean型）
  - **技術最適化**:
    - `getTodoById()` でID単体取得、設定画面の高速初期化
    - `useFocusEffect` で画面復帰時のTodoリスト自動再取得

### 3. グループ機能

- **My List**: 個人専用のプライベートTodoリスト（`organizationId: null`）
- **グループTodo**: 複数のグループ（家族、仕事チームなど）でTodoを共有
- **グループ作成**: ユーザーは自由に複数のグループを作成可能
- **招待システム**:
  - **招待コード**: 8桁の英数字コード（自動生成）で誰でも参加可能
  - **メール招待**: 登録済みユーザーをメールアドレスで招待（プッシュ通知で通知）
- **ドロワーメニュー**: 画面左上のメニューアイコンからMy Listと各グループを切り替え
- **権限管理**:
  - **グループ管理者**（作成者）: 招待、メンバー削除、グループ削除が可能
  - **一般メンバー**: グループからの退出のみ可能
  - **Todo作成者**: 自分が作成したTodoのみ編集・削除可能
- **即時反映**: グローバルRefreshContextとOrganizationContextで全画面同期

### 4. 検索・フィルター

- **モーダル検索**: タイトル・内容で部分一致検索
- **状態フィルター**: すべて / 未完了 / 完了済み
- **カテゴリフィルター**: 全カテゴリ、仕事、買い物、家事、勉強、健康、趣味、その他
- **リアルタイム検索**: 入力中に即座に結果更新

### 5. プッシュ通知

- **通知タイミング**: グループTodoの追加・削除・完了時、グループへの招待時、リマインダー期限到達時
- **通知対象**:
  - Todo変更通知: グループメンバー全員（送信者を除く）
  - 招待通知: 招待されたユーザーのみ
  - リマインダー通知: 個人Todoは本人のみ、グループTodoは全メンバー
- **通知内容**:
  - 操作者のニックネーム（未設定時はEmail）とTodoタイトルを表示
  - 完了通知: 「〇〇さん が共有TODO「タイトル」を完了しました。完了時刻：MM月DD日HH時MM分」
- **通知ON/OFF設定**:
  - ヘッダーのトグルボタンで通知のON/OFFを切り替え可能
  - OFFにすると、すべてのプッシュ通知（TODO操作、招待、リマインダー）が届かなくなります
  - Firestoreの`users`コレクションに`notificationEnabled`フィールドで保存
  - デフォルトは`true`（ON）
  - クライアント側とサーバー側（Cloud Functions）の両方でチェック
- **通知履歴**:
  - ヘッダーの通知アイコンをタップすると、受信した通知の履歴を確認できます
  - 各通知をタップすると詳細を表示、×ボタンで削除できます
  - Firestoreの`notificationHistory`コレクションに保存
  - 通知OFFの場合は履歴にも保存されません
- **Expo Push API使用**: トークン管理とFirestoreに保存
- **既知の問題**: グループTodo編集時の通知が送信されない場合あり（`ISSUES.md`参照）

#### テスト環境での注意事項

**同じデバイスで複数のユーザーアカウントをテストする場合**:

- プッシュトークンはデバイス固有のため、同じデバイスを使用する全ユーザーが同じトークンを共有します
- ユーザーAが通知をOFFにしても、ユーザーBが通知をONにしている場合、同じデバイスに通知が届く可能性があります
- これは、プッシュトークンがユーザーではなくデバイスに紐づいているためです
- **本番環境では問題ありません**: 各ユーザーが異なるデバイスを使用するため、通知ON/OFF設定は正しく機能します
- **推奨**: 複数ユーザーでの通知ON/OFF機能をテストする場合は、異なる物理デバイスを使用してください

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

### 8. ダークモード

- **テーマ切り替え**: ライトモード⇄ダークモードを簡単に切り替え可能
  - **トグルボタン**: My List画面の右上（ログアウトボタンの隣）に配置
  - **アイコン**: 太陽🌞（ライトモード）と月🌙（ダークモード）で直感的に識別
- **自動テーマ検出**: 初回起動時にデバイスのシステム設定を自動検出
  - iOS/Androidのダークモード設定を`useColorScheme`で取得
  - システム設定が優先されるが、ユーザーが手動で変更可能
- **設定の永続化**: AsyncStorageでテーマ設定を保存
  - アプリを閉じても設定を保持
  - 次回起動時に前回の設定を自動復元
- **全画面対応**: すべての画面・モーダル・コンポーネントでダークモード対応
  - **メイン画面**: My List、グループTodoリスト
  - **モーダル**: Todo追加/編集、グループ作成/参加、招待一覧、ニックネーム設定、組織設定、検索
  - **ドロワーメニュー**: グループ切り替えメニュー
  - **UIコンポーネント**: TodoItem（3点メニューを含む）
- **カラー設計**: 視認性を重視した配色
  - **ダークモード背景**: `#1f2937`（ダークグレー）
  - **ダークモード入力フィールド**: `#374151`（ミディアムダークグレー）
  - **ダークモードテキスト**: `#e5e7eb`（明るいライトグレー）- 未完了TODO
  - **ダークモードテキスト（補助）**: `#d1d5db`（ライトグレー）- ラベル・説明文
  - **ダークモードテキスト（完了済み）**: `#9ca3af`（グレー）- 打ち消し線
  - **ダークモードアクセント**: `#60a5fa`（ライトブルー）- ボタン・リンク
  - **半透明すりガラス**: `rgba(31, 41, 55, 0.98)` - ドロワーメニューなど
- **Context API実装**: ThemeContextで全体のテーマ状態を管理
  - `isDark: boolean` - 現在のテーマ状態
  - `toggleTheme: () => void` - テーマ切り替え関数
  - App全体を`ThemeProvider`でラップして全コンポーネントで利用可能

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

- **AddTodoModal**: Todo追加モーダル（FABから起動、おすすめTODO表示）
- **TodoForm**: Todo作成フォーム（カテゴリ選択、AI推測ボタン付き）
- **TodoTable**: Todoリスト表示・管理
- **TodoItem**: 個別Todoカード（アコーディオン表示、カテゴリバッジ表示、**チェックボックス1.5倍**）
- **EditTodoModal**: Todo編集モーダル（カテゴリ選択、AI推測ボタン付き）
- **SearchModal**: 検索・フィルターモーダル（カテゴリフィルター対応）
- **NicknameModal**: ニックネーム登録・編集モーダル
- **PraiseToast**: 褒め言葉トースト（カスタムデザイン、4秒表示）
  - **画面の1/3サイズ**の大型トースト
  - **ライク👍/ディスライク👎ボタン**（72×72px、グレーデザイン）
  - **25種類のランダムカラーテーマ**と絵文字
  - トースト下部に配置、適切なマージンで操作しやすい

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
│   ├── AddTodoModal.tsx     # Todo追加モーダル
│   ├── EditTodoModal.tsx    # 編集モーダル
│   ├── SearchModal.tsx      # 検索モーダル
│   ├── TodoForm.tsx         # 作成フォーム
│   ├── TodoTable.tsx        # リスト表示
│   ├── NicknameModal.tsx    # ニックネーム設定モーダル
│   └── PraiseToast.tsx      # 褒め言葉トースト（フィードバックボタン付き）
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
   `.env`ファイルを作成し、Firebase設定を追加：

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
   # 注: OpenAI APIキーは不要です（Cloud Functionsで管理）
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

**開発環境：テスト・検証フェーズ（本番移行準備中）**

- ✅ 基本機能実装完了
- ✅ iOS環境で動作確認済み（iOS 18.6.2）
- ✅ ダークモード実装完了（全画面・全モーダル対応）
- ✅ Firebase Cloud Functions デプロイ済み（AI機能）
- ✅ レート制限実装済み（1ユーザー100回/日、開発用）
- ✅ セキュリティ強化完了（OpenAI APIキーはサーバーサイドで管理）
- ✅ CI/CD環境構築済み（EAS Workflows）
- ✅ テスト環境整備済み（Jest + React Native Testing Library）
- ✅ コスト監視設定済み（OpenAI、Firebase）
- ✅ 環境変数の分離設定済み（開発/本番環境）
- ✅ 本番用Firebase環境構築済み（`react-native-todo-app-prod`プロジェクト）
- ✅ Firebase Analytics 導入済み（ユーザー行動分析）
- ✅ スタンドアロンビルド設定完了（Bundle Identifier、EASプロファイル）
- ⚠️ Expo Go による開発環境（スタンドアロンビルドも可能）
- ❌ TestFlightβテスト未実施
- ❌ Android環境での動作検証未実施
- ❌ ストア公開未実施

### 完了した項目

1. **セキュリティ対策** ✅
   - ✅ OpenAI APIキーをCloud Functionsで安全に管理（クライアント側に露出なし）
   - ✅ Firebase Cloud Functions経由でAI機能を実装
   - ✅ レート制限の実装（Firestoreベース、1ユーザー100回/日）
   - ✅ Firebase Authentication による認証必須化
   - ✅ Firestore Security Rules 設定済み

2. **CI/CD** ✅
   - ✅ EAS Workflows 設定済み
   - ✅ 自動OTA更新（main → production、develop → preview）
   - ✅ 自動ビルド（タグ作成時）
   - ✅ GitHub連携済み

3. **テスト環境** ✅
   - ✅ Jest + React Native Testing Library 導入
   - ✅ テストスクリプト設定（test、test:watch、test:coverage）
   - ✅ サンプルテスト作成済み

4. **UI/UX改善** ✅
   - ✅ ダークモード実装（システム設定自動検出、手動切り替え対応）
   - ✅ AsyncStorage でテーマ設定永続化
   - ✅ ThemeContext による全画面・全モーダル対応

5. **コスト監視** ✅
   - ✅ OpenAI 使用量アラート設定済み
     - 月次予算: $10
     - 80%使用アラート、100%使用アラート
   - ✅ Firebase コスト監視設定済み
   - ✅ ユーザーフレンドリーなエラーメッセージ実装
     - レート制限到達時にトースト通知でユーザーに通知

6. **環境設定** ✅
   - ✅ 環境変数の分離（開発/本番環境）
   - ✅ 本番用Firebaseプロジェクト設定（`react-native-todo-app-prod`）
   - ✅ Cloud Functions環境変数管理（OpenAI APIキー）

7. **分析・監視** ✅
   - ✅ Firebase Analytics 導入済み（ユーザー行動分析）
   - ✅ コスト監視（OpenAI、Firebase）

8. **ビルド・配信準備** ✅
   - ✅ スタンドアロンビルド設定完了
     - Bundle Identifier: `com.yuccok.reactnativetodoapp`
     - Android Package: `com.yuccok.reactnativetodoapp`
   - ✅ EAS Build プロファイル設定（preview、production）
   - ✅ BUILD_GUIDE.md 作成済み

### 本番運用への残課題

1. **アプリ配信** ⚠️
   - ✅ スタンドアロンビルド設定完了（Bundle Identifier、EASプロファイル）
   - ❌ スタンドアロンビルドの実行（`eas build`コマンド実行のみ）
   - ❌ TestFlightでのβテスト実施（Apple Developer Program: $99/年必要）
   - ❌ App Store / Google Play への本番公開
   - 💡 **現状**: Expo Go経由でのアクセス可能（QRコード公開済み）
   - 💡 **次のステップ**: `eas build --platform ios --profile preview` でビルド実行

2. **プラットフォーム対応** ⚠️
   - ❌ Android環境での動作検証
   - ❌ Android固有のUI/UX調整
   - ❌ Android通知設定の最適化

3. **監視・運用** ⚠️
   - ✅ Firebase Analytics 導入済み（ユーザー行動分析）
   - ❌ エラートラッキング（Sentry等の導入）
   - ❌ パフォーマンス監視（Firebase Performance Monitoring）
   - ✅ コスト監視設定済み
     - OpenAI: 月次予算$10、80%/100%使用アラート
     - Firebase: コスト監視設定済み

4. **本番環境最適化** ⚠️
   - 💡 OpenAI レート制限の値調整を検討（現在100回/日、本番環境では10回/日推奨）
     - ⚠️ 実装済みだが、現在は開発テスト用に緩和された設定
     - 💰 コスト抑制のため、本番公開時には10回/日への変更を推奨
   - ❌ バックアップ・リカバリ戦略の策定
   - ✅ 環境変数の分離（開発/本番環境）設定済み
   - ✅ 本番用Firebaseプロジェクト設定済み（`react-native-todo-app-prod`）

### 今後の推奨アクション

1. **短期（1-2週間）**
   - 💡 OpenAI レート制限の値を本番用に調整（100回 → 10回/日、オプション）
   - ✅ スタンドアロンビルド設定完了
   - プレビュービルドの実行（`eas build --platform ios/android --profile preview`）
   - TestFlight配信（iOS、Apple Developer Program: $99/年必要）
   - Android環境での動作検証（APKビルド）

2. **中期（1-2ヶ月）**
   - Sentry等のエラートラッキング導入
   - Firebase Performance Monitoring 導入
   - App Store / Google Play 公開準備

3. **長期（3ヶ月以降）**
   - バックアップ・リカバリ戦略の実装
   - パフォーマンス最適化とスケーラビリティ向上
   - ユーザーフィードバックに基づく機能拡張
