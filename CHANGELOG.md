# 変更履歴

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
  - `components/ui/ToDoItem.tsx`: `GestureResponderEvent`型を明示
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

