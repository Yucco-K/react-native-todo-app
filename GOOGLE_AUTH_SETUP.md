# Google認証の設定手順

このアプリでGoogle認証を使用するには、以下の設定が必要です。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成または選択

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 既存のプロジェクトを選択するか、新しいプロジェクトを作成

### 1.2 OAuth 2.0認証情報の作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuth クライアント ID」をクリック
3. アプリケーションの種類を選択：
   - **Webアプリケーション**（Expo Goでテストする場合）
   - **iOS**（iOSアプリの場合）
   - **Android**（Androidアプリの場合）

### 1.3 Webアプリケーション用の設定

1. 名前: 任意の名前（例: "Todo App Web"）
2. 承認済みのJavaScript生成元:
   ```
   https://auth.expo.io
   ```
3. 承認済みのリダイレクトURI:

   ```
   https://auth.expo.io/@your-expo-username/react-native-todo-app
   ```

   ※ `your-expo-username`は実際のExpoユーザー名に置き換えてください

4. 「作成」をクリック
5. **クライアントID**をコピーして保存

### 1.4 iOS用の設定（オプション）

1. アプリケーションの種類: **iOS**
2. バンドルID: `com.yourcompany.reactnativetodoapp`（app.jsonのbundleIdentifierと一致させる）
3. 「作成」をクリック

### 1.5 Android用の設定（オプション）

1. アプリケーションの種類: **Android**
2. パッケージ名: `com.yourcompany.reactnativetodoapp`（app.jsonのpackageと一致させる）
3. SHA-1証明書フィンガープリント:
   ```bash
   # 開発用証明書のSHA-1を取得
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. 「作成」をクリック

## 2. Firebase Consoleでの設定

### 2.1 Google認証プロバイダーの有効化

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. 左側のメニューから「Authentication」→「Sign-in method」を選択
4. 「Google」をクリック
5. 「有効にする」をオンに切り替え
6. プロジェクトのサポートメール: 自分のメールアドレスを入力
7. 「保存」をクリック

### 2.2 承認済みドメインの追加

1. Firebase Console の「Authentication」→「Settings」→「Authorized domains」
2. 以下のドメインが追加されていることを確認：
   - `localhost`
   - `auth.expo.io`
   - あなたのアプリのドメイン（本番環境用）

## 3. 環境変数の設定

プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下を追加：

```env
# 既存のFirebase設定
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google認証用のクライアントID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## 4. app.jsonの設定

`app.json`に以下を追加：

```json
{
	"expo": {
		"scheme": "react-native-todo-app",
		"ios": {
			"bundleIdentifier": "com.yourcompany.reactnativetodoapp"
		},
		"android": {
			"package": "com.yourcompany.reactnativetodoapp"
		}
	}
}
```

## 5. テスト

### 5.1 Expo Goでのテスト

```bash
npm start
```

Expo Goアプリでスキャンして、Google認証ボタンをタップしてテスト

### 5.2 Development Build（Dev Client）でのテスト（推奨）
Expo AuthSession Proxy を使わず、カスタムURLスキームで安定動作させる方法です。

1) 依存関係（導入済み）
```bash
npm install expo-dev-client
```

2) iOS で起動
```bash
npx expo run:ios
```
初回は自動でネイティブプロジェクトを生成し、Xcodeでビルド・インストールされます。

3) Android で起動（任意）
```bash
npx expo run:android
```

4) リダイレクトURI
- アプリ内で `makeRedirectUri({ scheme: "reactnativetodoapp", useProxy: false })` を使用
- Google Cloud Console では iOS/Android クライアントIDを使用（Webクライアントの `https://auth.expo.io/...` は不要）

### 5.3 本番ビルドでのテスト

```bash
# iOSの場合
eas build --platform ios

# Androidの場合
eas build --platform android
```

## トラブルシューティング

### エラー: "redirect_uri_mismatch"

- Google Cloud Consoleの承認済みリダイレクトURIが正しく設定されているか確認
- Expoのユーザー名とプロジェクト名が正しいか確認

### エラー: "Google認証に失敗しました"

- `.env`ファイルの`EXPO_PUBLIC_GOOGLE_CLIENT_ID`が正しく設定されているか確認
- Firebase Consoleで Google認証プロバイダーが有効になっているか確認

### エラー: "auth/operation-not-allowed"

- Firebase Consoleで Google認証プロバイダーが有効になっているか確認

## セキュリティに関する注意事項

1. **クライアントIDの管理**
   - WebクライアントIDは公開されても問題ありませんが、クライアントシークレットは絶対に公開しないでください
   - `.env`ファイルは`.gitignore`に追加してGitにコミットしないようにしてください

2. **承認済みドメインの制限**
   - 本番環境では、承認済みドメインを実際に使用するドメインのみに制限してください

3. **OAuth同意画面の設定**
   - Google Cloud Consoleで「OAuth同意画面」を設定し、アプリの情報を正確に入力してください
   - 本番環境に公開する前に、Googleの審査を受ける必要がある場合があります

## 参考リンク

- [Firebase Authentication - Google](https://firebase.google.com/docs/auth/web/google-signin)
- [Expo Authentication](https://docs.expo.dev/guides/authentication/)
- [Google Cloud Console](https://console.cloud.google.com/)
