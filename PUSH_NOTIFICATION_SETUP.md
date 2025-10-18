# プッシュ通知のセットアップ手順

## ✅ セットアップ完了

プッシュ通知機能が正常に動作する準備が整いました！

---

## 📋 完了した設定

### 1. Expoアカウント

- ✅ ログイン完了（ユーザー名: `yucco-k`）

### 2. プロジェクトID

- ✅ EASプロジェクト作成完了
- ✅ プロジェクトID: `d048ced0-6b74-42f6-ae81-9ba5a1aa2947`
- ✅ `app.json`に自動追加済み

### 3. Firestoreセキュリティルール

- ✅ `users`コレクションのルール設定済み
- ✅ プッシュトークンの保存・取得が可能

---

## 🚀 使い方

### アプリを起動

```bash
cd /Users/yukig/dev/react-native-todo-app
npx expo start --clear
```

### 動作確認

1. **アプリにログイン**
2. **通知パーミッションを許可**
3. コンソールに以下が表示される：
   ```
   Push token: ExponentPushToken[xxxxx]
   ✅ プッシュ通知トークンを登録しました
   ```

---

## 🔔 プッシュ通知のテスト

### 2台のデバイスで試す

1. **デバイス1**: アカウントAでログイン
2. **デバイス2**: アカウントBでログイン
3. **デバイス1**: Sharedタブで新しいTodoを作成
4. **デバイス2**: プッシュ通知が届く！

### 通知の種類

- **追加**: 「新しい共有Todo - [ユーザー]が「[タイトル]」を追加しました」
- **編集**: 「共有Todoが更新されました - [ユーザー]が「[タイトル]」を編集しました」
- **削除**: 「共有Todoが削除されました - [ユーザー]が「[タイトル]」を削除しました」

---

## ⚠️ 注意事項

- プッシュ通知は**物理デバイス**でのみ動作します
- エミュレーターでは動作しません
- Expo Goアプリを使用してください

---

## 🛠️ トラブルシューティング

### 通知が届かない場合

1. **通知パーミッションを確認**
   - 設定アプリ → Expo Go → 通知 → 許可

2. **ログを確認**
   - エラーメッセージをチェック

3. **アプリを再起動**

   ```bash
   npx expo start --clear
   ```

4. **Firestoreを確認**
   - Firebase Console → Firestore Database
   - `users`コレクションにプッシュトークンが保存されているか確認

---

## 📚 参考リンク

- [Expo Notifications ドキュメント](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Setup](https://docs.expo.dev/push-notifications/overview/)
