# Google認証セットアップガイド

このガイドでは、React Native Todo AppにGoogle Sign-In機能を追加するための手順を説明します。

## 前提条件

- Firebase プロジェクトが作成済みであること
- Google Cloud Console へのアクセス権限があること

## セットアップ手順

### 1. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Firebase プロジェクトに対応する Google Cloud プロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択

#### Web クライアント ID の作成

1. アプリケーションの種類: **ウェブ アプリケーション**
2. 名前: `Todo App (Web Client for Firebase)`
3. 承認済みの JavaScript 生成元: 
   - `http://localhost`
   - `https://your-domain.com` (本番環境のドメイン)
4. 承認済みのリダイレクト URI:
   - `http://localhost`
   - `https://your-domain.com/__/auth/handler` (Firebase Auth用)
5. 「作成」をクリック
6. **クライアント ID** をコピーして保存

#### iOS クライアント ID の作成

1. アプリケーションの種類: **iOS**
2. 名前: `Todo App (iOS)`
3. バンドル ID: `com.yuccok.reactnativetodoapp` (app.config.jsと一致させる)
4. 「作成」をクリック
5. **クライアント ID** をコピーして保存

### 2. Firebase Console での設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 「Authentication」→「Sign-in method」に移動
4. 「Google」を有効化
   - Web SDK 構成の「ウェブ クライアント ID」に、手順1で作成した **Web クライアント ID** を入力
   - 「保存」をクリック

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を追加します：

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

**重要**: `.env` ファイルは `.gitignore` に含まれているため、Git にコミットされません。

### 4. iOS の追加設定

#### 4.1 URL スキームの設定

`app.config.js` に以下が含まれていることを確認：

```javascript
ios: {
  bundleIdentifier: "com.yuccok.reactnativetodoapp",
  infoPlist: {
    CFBundleURLTypes: [
      {
        CFBundleURLSchemes: [
          "com.googleusercontent.apps.YOUR-IOS-CLIENT-ID"
        ]
      }
    ]
  }
}
```

**注意**: `YOUR-IOS-CLIENT-ID` の部分を、実際の iOS クライアント ID（数字の部分のみ）に置き換えてください。

例: クライアント ID が `123456789-abc.apps.googleusercontent.com` の場合
→ `com.googleusercontent.apps.123456789-abc`

#### 4.2 GoogleService-Info.plist の更新

1. Firebase Console から最新の `GoogleService-Info.plist` をダウンロード
2. `ios/` ディレクトリに配置（既存のファイルを上書き）

### 5. ビルドと実行

```bash
# 依存関係のインストール
npm install

# iOS Pods のインストール
cd ios && pod install && cd ..

# 開発ビルドの実行
npx expo run:ios
```

## トラブルシューティング

### エラー: "No ID token"

- Web クライアント ID が正しく設定されているか確認
- `.env` ファイルが正しく読み込まれているか確認
- アプリを再起動

### エラー: "DEVELOPER_ERROR"

- iOS クライアント ID が正しいか確認
- バンドル ID が Google Cloud Console の設定と一致しているか確認
- URL スキームが正しく設定されているか確認

### エラー: "auth/invalid-credential"

- Firebase Console で Google 認証が有効になっているか確認
- Web SDK 構成の Web クライアント ID が正しいか確認

## セキュリティに関する注意事項

1. **環境変数の管理**
   - `.env` ファイルは絶対に Git にコミットしないでください
   - 本番環境では EAS Secrets を使用してください

2. **クライアント ID の保護**
   - iOS クライアント ID は公開されても問題ありませんが、バンドル ID で制限されています
   - Web クライアント ID も公開されますが、承認済みドメインで制限されています

3. **Firebase セキュリティルール**
   - Firestore のセキュリティルールで適切なアクセス制御を実装してください

## 参考リンク

- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Firebase Authentication with Google](https://firebase.google.com/docs/auth/ios/google-signin)
- [@react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin)

