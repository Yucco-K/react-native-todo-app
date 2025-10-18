# Todo アプリ 仕様書

## 技術スタック
- React Native + Expo Router
- Firebase (Authentication, Firestore)
- NativeWind, Zod, expo-notifications

## 機能
1. **認証**: メール/パスワードでログイン・サインアップ
2. **Todo管理**: 作成・編集・削除・完了切り替え
3. **タブ切り替え**: My List（個人用）/ Shared（共有用）
4. **検索・フィルター**: モーダル検索、状態フィルター
5. **プッシュ通知**: 共有Todoの変更時に通知

## データ構造
```typescript
// todos コレクション
{
  userId: string;
  title: string;      // 1〜50文字
  content: string;    // 1〜200文字
  completed: boolean;
  shared: boolean;
  createdAt: Date;
}
```

## セキュリティルール
```javascript
// 自分のTodoのみアクセス可能
allow read, write: if request.auth.uid == resource.data.userId;
```

## セットアップ
```bash
npm install
npx expo start
```

環境変数（`.env`）にFirebase設定を追加。
