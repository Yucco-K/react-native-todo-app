# Firebase Storage セキュリティルール設定ガイド

このガイドでは、アバター画像のアップロード機能に必要なFirebase Storageのセキュリティルールを設定する方法を説明します。

---

## 📦 Firebase Storage の有効化

### 1. Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. 左メニューから「Storage」をクリック
4. 「始める」をクリック

### 2. セキュリティルールの選択

初回セットアップ時に、以下のいずれかを選択：

- **本番環境モード（推奨）**: セキュリティルールを設定してから使用開始
- **テストモード**: 30日間のみ全てのアクセスを許可（本番環境では非推奨）

**推奨**: 本番環境モードを選択してください。

### 3. ロケーションの選択

- **推奨**: `asia-northeast1`（東京）
- または `asia-northeast2`（大阪）

「完了」をクリックして、Storageを有効化します。

---

## 🔒 セキュリティルールの設定

### 1. ルールタブに移動

1. Firebase Console → Storage
2. 上部タブから「Rules」をクリック

### 2. ルールを編集

以下のルールをコピーして貼り付けます：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // アバター画像のルール
    match /avatars/{userId}/{filename} {
      // 読み取り: 認証済みユーザー全員が閲覧可能
      allow read: if request.auth != null;
      
      // 書き込み: 自分のアバターのみアップロード可能
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // 5MB以下
                   && request.resource.contentType.matches('image/.*');  // 画像のみ
      
      // 削除: 自分のアバターのみ削除可能
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
  }
}
```

### 3. ルールの説明

#### **読み取り権限（read）**
```javascript
allow read: if request.auth != null;
```
- **誰が**: 認証済みの全ユーザー
- **何を**: 全てのアバター画像を閲覧可能
- **理由**: グループメンバーのアバターを表示するため

#### **書き込み権限（write）**
```javascript
allow write: if request.auth != null 
             && request.auth.uid == userId
             && request.resource.size < 5 * 1024 * 1024
             && request.resource.contentType.matches('image/.*');
```
- **誰が**: 認証済みユーザー
- **何を**: 自分のフォルダ（`avatars/{userId}/`）にのみアップロード可能
- **制限**:
  - ファイルサイズ: 5MB以下
  - ファイル形式: 画像のみ（JPEG, PNG, GIF, WebPなど）

#### **削除権限（delete）**
```javascript
allow delete: if request.auth != null 
              && request.auth.uid == userId;
```
- **誰が**: 認証済みユーザー
- **何を**: 自分のアバター画像のみ削除可能

### 4. ルールを公開

1. 「公開」ボタンをクリック
2. 確認ダイアログで「公開」をクリック

---

## ✅ 動作確認

### 1. アプリでテスト

1. アプリを起動してログイン
2. プロフィール設定を開く
3. 「画像を選択」をタップ
4. 画像を選択して保存
5. 保存成功のメッセージが表示されることを確認

### 2. Firebase Console で確認

1. Firebase Console → Storage
2. 「Files」タブをクリック
3. `avatars/{userId}/` フォルダが作成されていることを確認
4. アップロードされた画像ファイルが表示されることを確認

---

## 🐛 トラブルシューティング

### エラー: "permission-denied"

**原因**: セキュリティルールが正しく設定されていない

**解決方法**:
1. Firebase Console → Storage → Rules
2. ルールが正しく公開されているか確認
3. ルールの構文エラーがないか確認
4. ブラウザのキャッシュをクリアして再試行

### エラー: "storage/unauthorized"

**原因**: ユーザーが認証されていない

**解決方法**:
1. アプリで正しくログインしているか確認
2. `auth.currentUser` が `null` でないか確認
3. Firebase Authentication が正しく設定されているか確認

### エラー: "storage/quota-exceeded"

**原因**: Storageの無料枠を超過

**解決方法**:
1. Firebase Console → Storage → Usage
2. 使用量を確認
3. 不要なファイルを削除
4. または、Blazeプラン（従量課金）にアップグレード

### 画像がアップロードされない

**原因**: ファイルサイズまたは形式の制限

**解決方法**:
1. 画像のファイルサイズが5MB以下か確認
2. 画像形式がJPEG, PNG, GIF, WebPのいずれかか確認
3. コンソールログでエラーメッセージを確認

---

## 📊 Storage の使用量と料金

### 無料枠（Sparkプラン）

- **ストレージ**: 5GB
- **ダウンロード**: 1GB/日
- **アップロード**: 20,000回/日

### 従量課金（Blazeプラン）

- **ストレージ**: $0.026/GB/月
- **ダウンロード**: $0.12/GB
- **アップロード**: 無料

### 推定コスト（1,000ユーザーの場合）

- **ストレージ**: 1,000ユーザー × 500KB/画像 = 500MB = $0.013/月
- **ダウンロード**: 1,000ユーザー × 10回/日 × 500KB = 5GB/日 = $0.60/日 = $18/月

**注意**: 実際のコストは使用状況によって異なります。

---

## 🔧 追加の最適化

### 1. 画像の圧縮

アプリ側で画像を圧縮してアップロードすることで、ストレージコストを削減できます。

**`components/NicknameModal.tsx`で既に実装済み:**

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,  // ← 80%の品質で圧縮
});
```

### 2. 古い画像の自動削除

新しい画像をアップロードする際、古い画像を自動的に削除することで、ストレージ使用量を削減できます。

**`services/userService.ts`で既に実装済み:**

```typescript
// 古い画像を削除（Firebase Storage上の画像の場合）
if (currentAvatarUrl) {
  await deleteOldAvatarImage(currentAvatarUrl);
}
```

### 3. CDNキャッシュの活用

Firebase Storageは自動的にCDNを使用するため、追加の設定は不要です。

---

## 📚 参考リンク

- [Firebase Storage セキュリティルール](https://firebase.google.com/docs/storage/security)
- [Firebase Storage 料金](https://firebase.google.com/pricing)
- [Firebase Storage ベストプラクティス](https://firebase.google.com/docs/storage/best-practices)

---

**最終更新日**: 2025-01-09

