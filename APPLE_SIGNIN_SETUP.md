# Apple Sign-In セットアップガイド

このガイドでは、React Native Todo AppにApple Sign-In機能を追加するための手順を説明します。

## 前提条件

- Firebase プロジェクトが作成済みであること
- Apple Developer アカウントがあること
- iOS デバイスまたはシミュレータ（iOS 13以降）

## セットアップ手順

### 1. Apple Developer での設定

#### 1.1 App ID の設定

1. [Apple Developer Portal](https://developer.apple.com/account) にアクセス
2. 「Certificates, Identifiers & Profiles」に移動
3. 「Identifiers」→ あなたのApp IDを選択
4. 「Sign In with Apple」にチェックを入れる
5. 「Save」をクリック

#### 1.2 Service ID の作成（オプション - Web用）

1. 「Identifiers」→「+」ボタンをクリック
2. 「Services IDs」を選択
3. Description: `Todo App Sign In`
4. Identifier: `com.yuccok.reactnativetodoapp.signin`
5. 「Continue」→「Register」

### 2. Firebase Console での設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 「Authentication」→「Sign-in method」に移動
4. 「Apple」を有効化
   - OAuth コードフロー構成の「サービス ID」を入力（オプション）
   - 「保存」をクリック

### 3. Xcode での設定

#### 3.1 Capability の追加

1. Xcode でプロジェクトを開く
2. プロジェクトナビゲータでプロジェクトを選択
3. 「Signing & Capabilities」タブを開く
4. 「+ Capability」をクリック
5. 「Sign In with Apple」を追加

#### 3.2 Bundle Identifier の確認

`app.config.js` の `ios.bundleIdentifier` が Apple Developer Portal の App ID と一致していることを確認：

```javascript
ios: {
  bundleIdentifier: "com.yuccok.reactnativetodoapp",
}
```

### 4. ビルドと実行

```bash
# 依存関係のインストール
npm install

# iOS Pods のインストール
cd ios && pod install && cd ..

# 開発ビルドの実行
npx expo run:ios
```

## 動作確認

### iOSデバイス/シミュレータでの確認

1. アプリを起動
2. ログイン画面で「Appleでログイン」ボタンをタップ
3. Apple ID でサインイン
4. 認証が成功することを確認

### テストのポイント

- ✅ Apple Sign-In ボタンが iOS でのみ表示される
- ✅ Apple ID 選択画面が表示される
- ✅ 初回サインイン時にメール/名前の共有オプションが表示される
- ✅ ログイン後、Todo リストが表示される
- ✅ ユーザー情報が Firestore に保存される

## トラブルシューティング

### エラー: "Apple Sign-In is only available on iOS"

- Android や Web で実行している場合、このエラーが表示されます
- Apple Sign-In は iOS でのみ利用可能です
- コードでは `Platform.OS === "ios"` で条件分岐しています

### エラー: "ERR_REQUEST_CANCELED"

- ユーザーが Apple Sign-In をキャンセルした場合に発生します
- 正常な動作なので、エラーメッセージは表示されません

### エラー: "No identity token"

- Apple Sign-In の設定が正しくない可能性があります
- Xcode の「Sign In with Apple」Capability が追加されているか確認
- Bundle Identifier が正しいか確認

### ボタンが表示されない

- `Platform.OS === "ios"` の条件により、iOS 以外では表示されません
- iOS シミュレータまたは実機で確認してください

## セキュリティに関する注意事項

1. **プライバシー**
   - Apple Sign-In では、ユーザーがメールアドレスを隠すことができます
   - 隠されたメールアドレスは `privaterelay.appleid.com` ドメインになります
   - アプリはこれを適切に処理する必要があります

2. **ユーザー情報の取得**
   - 名前とメールアドレスは初回サインイン時のみ取得できます
   - 2回目以降は取得できないため、初回に保存する必要があります

3. **Firebase セキュリティルール**
   - Firestore のセキュリティルールで適切なアクセス制御を実装してください

## 本番環境への展開

### EAS Build での設定

Apple Sign-In は自動的に設定されます。追加の環境変数は不要です。

```bash
# Preview ビルド
eas build --profile preview --platform ios

# Production ビルド
eas build --profile production --platform ios
```

### App Store への提出

App Store に提出する際は、以下を確認してください：

1. **App Store Connect での設定**
   - 「Sign In with Apple」が有効になっていることを確認

2. **プライバシーポリシー**
   - Apple Sign-In を使用する場合、プライバシーポリシーが必要です
   - ユーザーデータの取り扱いについて明記してください

3. **審査ガイドライン**
   - 他のソーシャルログインを提供している場合、Apple Sign-In も必須です
   - Apple のガイドラインに従ってください

## 参考リンク

- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Authentication with Apple](https://firebase.google.com/docs/auth/ios/apple)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)

