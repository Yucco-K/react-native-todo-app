# 変更履歴

## [2025-10-26] - 通知ON/OFF設定と通知履歴機能の追加

### 新機能

#### 通知ON/OFF設定

- **ヘッダーにトグルボタンを追加**: ユーザーが通知のON/OFFを簡単に切り替え可能
  - トグルをタップすると「通知をONにしました」/「通知をOFFにしました」のトーストを表示
  - Firestoreの`users`コレクションに`notificationEnabled`フィールドで保存
  - デフォルトは`true`（ON）
- **全通知タイプに対応**: TODO操作、招待、リマインダーのすべてのプッシュ通知に適用
- **クライアント側とサーバー側の両方でチェック**:
  - `services/notificationService.ts`: `getAllPushTokens`関数で`notificationEnabled`をチェック
  - `functions/src/index.ts`: `sendDueReminders` Cloud Functionで`notificationEnabled`をチェック
  - 通知OFFのユーザーはプッシュ通知の送信対象から除外
- **通知OFFの場合は履歴にも保存されない**: クライアント側で受信時にチェック

#### 通知履歴機能

- **ヘッダーに通知アイコンを追加**: タップすると受信した通知の履歴を表示
- **通知履歴モーダル**:
  - 受信した通知のタイトルと日時を一覧表示
  - タイトルをタップすると通知の詳細（本文、受信日時）を展開表示
  - 各通知の右側に×ボタンを配置し、個別削除が可能
- **Firestoreに保存**: `notificationHistory`コレクションに保存
  - `userId`, `title`, `body`, `data`, `createdAt`フィールド
  - 複合インデックス: `userId` (Ascending) + `createdAt` (Descending)
- **新しいサービス**: `services/notificationHistoryService.ts`を追加
  - `saveNotificationHistory`: 通知履歴を保存
  - `getNotificationHistory`: ユーザーの通知履歴を取得
  - `deleteNotificationHistory`: 通知履歴を削除

### 技術的な改善

- **`services/userService.ts`**: `getNotificationEnabled`と`setNotificationEnabled`関数を追加
- **`app/(tabs)/_layout.tsx`**: 通知受信時に`notificationEnabled`をチェックし、OFFの場合は履歴に保存しない
- **`app/(tabs)/mylist.tsx`**: 通知トグルと通知履歴アイコンをヘッダーに統合
- **`components/NotificationHistoryModal.tsx`**: 新しいモーダルコンポーネントを追加

### テスト環境での注意事項

**同じデバイスで複数のユーザーアカウントをテストする場合**:

- プッシュトークンはデバイス固有のため、同じデバイスを使用する全ユーザーが同じトークンを共有します
- ユーザーAが通知をOFFにしても、ユーザーBが通知をONにしている場合、同じデバイスに通知が届く可能性があります
- これは、プッシュトークンがユーザーではなくデバイスに紐づいているためです
- **本番環境では問題ありません**: 各ユーザーが異なるデバイスを使用するため、通知ON/OFF設定は正しく機能します
- **推奨**: 複数ユーザーでの通知ON/OFF機能をテストする場合は、異なる物理デバイスを使用してください

---

## [2025-10-26] - リマインド機能UI/UX改善とサーバー側自動送信

### UI/UX改善

#### リマインド設定画面のフル画面化

- **モーダル→タブ画面への移行**: リマインド設定を全幅画面で快適に操作可能に
  - 画面遷移方式に変更（組織設定と同様の体験）
  - スクロール可能な縦長レイアウト
  - ヘッダーにTodoタイトルを表示
- **ID単体取得の最適化**: `getTodoById()` を追加し、リマインド設定画面の初期化を高速化
- **過去日時の自動補正**: 初期表示が過去の場合は「現在+5分」を自動セット

#### リマインド表示の改善

- **Todoアイテムへのリマインド情報表示**: クリックで展開時にリマインド日時と通知状態を表示
  - 通知アイコン（未通知はオレンジ、通知済みはグレー）
  - 日時: `リマインド: YYYY/MM/DD HH:MM`
  - 状態: 「未通知」/「通知済み」
- **完了時のリマインド自動削除**: Todoを完了にするとリマインド情報を自動クリア
  - 未完了→完了: `remindAt`, `remindNotified` を削除
  - 完了→未完了: リマインドは変更せず（ユーザーが再設定可能）

### 通知機能の強化

#### サーバー側の定期送信（Cloud Functions）

- **`sendDueReminders` Function 追加**: 毎分実行、期限到達リマインドを自動送信
  - 条件: `remindNotified == false` かつ `remindAt <= now`
  - 個人Todo: 本人のみ
  - 組織Todo: 全メンバー
  - 送信後に `remindNotified: true` を更新
- **アプリ未起動でも通知**: ユーザーがアプリを開いていなくても、時刻到達でプッシュ通知

#### クライアント側の改善

- **起動/復帰時のモーダル常時表示**: 「わかった」を押すまで未読リマインドを毎回表示
  - アプリ起動時: リマインドチェック→モーダル表示
  - フォアグラウンド復帰時: 同様にチェック→表示
  - 「わかった」押下時: 一括で `remindNotified` を更新して既読化
- **重複送信の防止**: クライアント側でのプッシュ送信を停止（サーバー側に一本化）

### 技術的改善

- **Toast設定の安定化**: `toastConfig` をモジュールスコープに移動し、再レンダー時の参照変更を防止
- **リスト再取得の強化**: `useFocusEffect` を追加し、画面に戻った際の自動更新を実装
- **TypeScript型安全性向上**: DateTimePicker の `onChange` に明示的な型付与

### 技術詳細

- **変更ファイル**:
  - `app/(tabs)/reminder-settings.tsx` - 新規追加（全幅リマインド設定画面）
  - `components/ReminderModal.tsx` - 削除（画面遷移に移行）
  - `functions/src/index.ts` - `sendDueReminders` Function 追加
  - `services/todoService.ts` - `getTodoById()`, `toggleTodoComplete()` 改善
  - `app/(tabs)/_layout.tsx` - 重複送信停止、モーダル既読化ロジック改善
  - `components/ui/TodoItem.tsx` - リマインド情報表示追加
  - `app/_layout.tsx` - Toast設定の安定化

---

## [2025-10-25] - リマインド機能追加

### 新機能

#### TODOリマインド機能

- **リマインド設定**: Todoの3点メニューからリマインド日時を設定可能
  - カレンダーピッカー（DateTimePicker）で日付と時刻を選択
  - 設定済みリマインドの変更・削除が可能
  - 過去の日時は設定不可（バリデーション）
- **自動プッシュ通知**: 設定時刻にプッシュ通知を自動送信
  - グループTodo: 全メンバーに通知
  - 個人Todo: 本人のみに通知
- **ログイン時の自動チェック**: アプリ起動・フォアグラウンド復帰時に未読リマインドを確認
  - リマインド通知モーダルで一覧表示
  - 「わかった」ボタンで閉じると通知済みフラグを更新
  - 以降、同じリマインドは表示されない
- **Firestore管理**: `remindAt`（日時）と`remindNotified`（通知済みフラグ）をTodoに追加

#### 技術詳細

- **新規ファイル**:
  - `components/ReminderModal.tsx` - リマインド設定モーダル
  - `components/ReminderNotificationModal.tsx` - 通知表示モーダル
- **サービス追加**:
  - `setTodoReminder()` - リマインド設定
  - `removeTodoReminder()` - リマインド削除
  - `getDueReminders()` - 期限到達リマインド取得
  - `markReminderAsNotified()` - 通知済みフラグ更新
  - `notifyReminder()` - リマインドプッシュ通知送信
- **ライブラリ追加**:
  - `@react-native-community/datetimepicker` - 日時選択UI

---

## [2025-10-25] - セキュリティ強化

### セキュリティ機能

#### ログインクールダウン機能

- **パスワード入力エラー制限**: 7回失敗で10分間ログインを一時停止
  - AsyncStorageで失敗回数とロックアウト時刻を管理
  - 認証エラー（パスワード間違いなど）のみカウント（ネットワークエラー等は除外）
  - ログイン成功時に失敗回数を自動リセット
- **リアルタイムカウントダウン**: 残り時間を秒単位で表示
  - 画面に警告ボックスを表示（赤色の背景）
  - 「あと○分○秒後に再試行できます」と分かりやすく表示
- **段階的な警告**: 残り3回以下になると警告メッセージを表示
  - 「あと○回失敗するとログインが一時停止されます」
- **ボタンの無効化**: ロックアウト中はログインボタンを無効化（グレーアウト）

#### テストアカウント情報の削除

- **README.mdからテストアカウント削除**: セキュリティ上の理由で削除

---

## [2025-10-25] - UX/プッシュ通知改善

### 追加機能

#### プッシュ通知の改善

- **招待通知の改善**: 招待を送った本人には招待通知が送られないように修正
  - 自分が自分を招待した場合に通知が送られないように制御
  - `notificationService.ts`で現在のユーザーIDをチェック
- **アプリ起動時の招待チェック**: アプリを開いた時（起動時・フォアグラウンド時）に未読の招待を自動チェック
  - `AppState`を使用してアプリのフォアグラウンド/バックグラウンド状態を監視
  - 未読招待がある場合は招待一覧モーダルを自動表示
  - セッションが確立されている場合のみ実行（未ログイン時は実行しない）

#### 組織設定のUI改善

- **モーダルから画面遷移へ**: 組織設定を専用画面に変更
  - スクロール可能になり、メンバー一覧や設定項目がすべて表示可能に
  - `app/(tabs)/organization-settings.tsx`として実装
  - タブグループ内に配置してスムーズな画面遷移を実現
  - 元の`OrganizationSettingsModal.tsx`は削除

### UI/UX改善

#### トースト通知の最適化

- **成功トーストの削除**: 褒め言葉トースト以外の成功トーストを削除
  - グループ作成完了
  - グループ参加完了（招待コード入力、招待承認）
  - 招待拒否完了
  - 招待コードコピー完了
  - メンバー削除完了
  - グループ退出完了
  - グループ削除完了
  - **保持**: 褒め言葉トースト（タスク完了時の `type: "praise"`）のみ
  - **理由**: 成功時は画面遷移やUI変化で十分にフィードバックできるため、トーストは不要

#### エラー表示の改善

- **エラーダイアログの非表示化**: ログイン/サインアップ失敗時のネイティブエラーダイアログを非表示に
  - `console.error` → `console.log` に変更してダイアログを抑制
  - ユーザーにはトーストで分かりやすいエラーメッセージを表示
  - 開発者はターミナルログで詳細なエラー情報を確認可能
  - デバッガー（`j`キー）でも確認可能

### 技術的な変更

#### TypeScript設定の改善

- `tsconfig.json`に`"jsx": "react-native"`を追加
- 暗黙的な`any`型エラーを修正
  - `components/TodoTable.tsx`: `FlatList`のitem型を明示
  - `components/ui/TodoItem.tsx`: `GestureResponderEvent`型を明示
  - `app/(tabs)/organization-settings.tsx`: エラーハンドリングの型を明示

#### ルーティングの改善

- 組織設定画面をタブグループ内に配置
  - クロスナビゲーション問題を解決
  - インポートパスを`../` → `../../`に修正

### 修正されたバグ

- ✅ 自分が自分を招待した際に通知が送られる問題
- ✅ 組織設定モーダルでスクロールできない問題
- ✅ ログイン失敗時にネイティブエラーダイアログが表示される問題

### 関連ファイル

- `services/notificationService.ts` - 招待通知の改善
- `app/(tabs)/_layout.tsx` - アプリ起動時の招待チェック、組織設定画面への遷移
- `app/(tabs)/organization-settings.tsx` - 新しい組織設定画面
- `components/OrganizationSettingsModal.tsx` - 削除
- `components/CreateOrganizationModal.tsx` - 成功トースト削除
- `components/JoinOrganizationModal.tsx` - 成功トースト削除
- `components/InvitationListModal.tsx` - 成功トースト削除
- `app/login.tsx` - エラーダイアログ非表示化
- `app/signup.tsx` - エラーダイアログ非表示化
- `tsconfig.json` - TypeScript設定改善

### コミット履歴

- `5837d7e` - デバッグログを削除
- `6c1c30d` - 組織設定をモーダルから画面遷移に変更
- `d860892` - 褒め言葉トースト以外の成功トーストを削除

---

## 過去の実装

過去の主要機能の実装については、以下のドキュメントを参照してください：

- `IMPLEMENTATION_COMPLETE.md` - Firebase Cloud Functions実装完了
- `SECURITY_CHANGES_SUMMARY.md` - セキュリティ改善の履歴
- `ISSUES.md` - 既知の問題と対応状況
