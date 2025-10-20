# Firestore Security Rules

組織機能に対応した最新のFirestoreセキュリティルールです。
Firebase Consoleの「Firestore Database」→「ルール」タブでこの内容を設定してください。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ユーザーコレクション
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 組織コレクション
    match /organizations/{orgId} {
      // 読み取り：メンバーのみ
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      
      // 作成：認証済みユーザー
      allow create: if request.auth != null;
      
      // 更新・削除：オーナーのみ
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
    
    // 招待コレクション
    match /invitations/{invitationId} {
      // 読み取り：招待されたユーザー
      allow read: if request.auth != null && 
        request.auth.token.email == resource.data.invitedEmail;
      
      // 作成：認証済みユーザー
      allow create: if request.auth != null;
      
      // 更新：招待されたユーザー（承認・拒否用）
      allow update: if request.auth != null && 
        request.auth.token.email == resource.data.invitedEmail;
      
      // 削除：組織オーナー（organizationIdからオーナーを確認）
      allow delete: if request.auth != null;
    }
    
    // Todoコレクション（組織対応）
    match /todos/{todoId} {
      // 読み取り：
      // - 作成者本人
      // - 組織のTodoの場合は組織のメンバー
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId ||
         (resource.data.organizationId != null && 
          exists(/databases/$(database)/documents/organizations/$(resource.data.organizationId)) &&
          request.auth.uid in get(/databases/$(database)/documents/organizations/$(resource.data.organizationId)).data.members));
      
      // 作成：認証済みユーザー
      allow create: if request.auth != null;
      
      // 更新・削除：作成者のみ
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // 完了済みTodo履歴（統計用）
    match /completedTodoHistory/{historyId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // ユーザー統計
    match /userStats/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // 褒め言葉フィードバック
    match /praiseFeedback/{feedbackId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 必要なFirestoreインデックス

以下のインデックスをFirebase Consoleの「Firestore Database」→「インデックス」タブで作成してください。

### 1. organizationsコレクション
- **コレクションID**: `organizations`
- **フィールド**:
  - `members` (配列)
  - `createdAt` (降順)

### 2. invitationsコレクション
- **コレクションID**: `invitations`
- **フィールド**:
  - `invitedEmail` (昇順)
  - `status` (昇順)
  - `createdAt` (降順)

### 3. todosコレクション（個人用）
- **コレクションID**: `todos`
- **フィールド**:
  - `userId` (昇順)
  - `organizationId` (昇順)
  - `createdAt` (降順)

### 4. todosコレクション（組織用）
- **コレクションID**: `todos`
- **フィールド**:
  - `organizationId` (昇順)
  - `createdAt` (降順)

### 5. todosコレクション（__name__インデックス）
- **コレクションID**: `todos`
- **フィールド**:
  - `userId` (昇順)
  - `createdAt` (降順)
  - `__name__` (昇順)

## 注意事項

1. インデックスの作成には数分かかる場合があります
2. インデックスエラーが発生した場合、エラーメッセージ内のリンクをクリックすると自動作成できます
3. セキュリティルールの変更は即座に反映されます

