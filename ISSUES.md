# 既知の問題

## グループTodo編集時のプッシュ通知が送信されない

### 症状

- グループのTodoを作成・削除した時はプッシュ通知が正常に送信される
- グループのTodoを編集した時はプッシュ通知が送信されない

### 調査状況

- `EditTodoModal.tsx`で`todo.organizationId`が`undefined`になっている
- `TodoItem.tsx`から`EditTodoModal`に渡す`todo`オブジェクトに`organizationId`を含めるように修正済み
- コードは正しいが、実行時に反映されていない可能性

### 確認済み項目

- ✅ `notifyTodoUpdated`は実装済み
- ✅ `TodoItem.tsx`のpropsに`organizationId`を追加済み
- ✅ `onEdit`の呼び出しに`organizationId`を含めるように修正済み
- ✅ `EditTodoModal.tsx`で`todo.organizationId`をチェックするロジックは正しい

### 次のステップ

- Metro bundlerのキャッシュクリア後も問題が継続
- デバイス側のアプリキャッシュをクリアする必要があるかもしれない
- または、`TodoTable.tsx`から`EditTodoModal`への`todo`の渡し方に問題がある可能性

### 関連ファイル

- `components/ui/TodoItem.tsx`
- `components/EditTodoModal.tsx`
- `services/notificationService.ts`

### コミット

- `a2d7b76` - TodoItemからEditTodoModalにorganizationIdを渡すように修正
- `3b5fa60` - Todo編集時のデバッグログを追加
