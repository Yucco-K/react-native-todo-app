# スタンドアロンビルドガイド

このガイドでは、Re:MindのスタンドアロンビルドとApp Store/Google Playへの配信方法を説明します。

## 📋 前提条件

### 必須

- ✅ EASアカウント（既に設定済み）
- ✅ プロジェクトがEASに接続済み（`projectId: d048ced0-6b74-42f6-ae81-9ba5a1aa2947`）

### iOS配信に必要（オプション）

- Apple Developer Program（$99/年）
- Apple IDで登録

### Android配信に必要（オプション）

- Google Play Console登録（$25、一回のみ）

---

## 🏗️ ビルド設定

### アプリ識別子

- **iOS Bundle Identifier**: `com.yuccok.reactnativetodoapp`
- **Android Package**: `com.yuccok.reactnativetodoapp`

### ビルドプロファイル

| プロファイル  | 用途         | iOS                | Android            |
| ------------- | ------------ | ------------------ | ------------------ |
| `development` | 開発用       | Development Client | Development Client |
| `preview`     | テスト配信用 | 実機ビルド         | APK                |
| `production`  | ストア公開用 | 実機ビルド         | AAB                |

---

## 🚀 ビルドコマンド

### 1. プレビュービルド（テスト用）

#### iOS（TestFlight用）

```bash
# Apple Developer Accountでログイン必要
eas build --platform ios --profile preview
```

#### Android（直接インストール用APK）

```bash
eas build --platform android --profile preview

# ビルド完了後、APKをダウンロードして実機にインストール
```

---

### 2. プロダクションビルド（ストア公開用）

#### iOS（App Store用）

```bash
# Apple Developer Programへの登録が必要（$99/年）
eas build --platform ios --profile production
```

#### Android（Google Play用）

```bash
# Google Play Console登録が必要（$25、一回のみ）
eas build --platform android --profile production
```

---

### 3. 両プラットフォームを同時ビルド

```bash
# プレビュー
eas build --profile preview

# プロダクション
eas build --profile production
```

---

## 📱 ストア配信

### iOS（App Store & TestFlight）

#### 前提条件

1. **Apple Developer Programへの登録**（$99/年）
   - https://developer.apple.com/programs/
2. **App Store Connectでアプリ登録**
   - App IDの作成
   - App Store Connectでアプリエントリを作成

#### TestFlight配信（β版）

```bash
# ビルド実行
eas build --platform ios --profile preview

# TestFlightに自動アップロード
eas submit --platform ios --profile preview

# TestFlightでテスター招待
```

#### App Store配信（本番）

```bash
# プロダクションビルド
eas build --platform ios --profile production

# App Storeに提出
eas submit --platform ios --profile production

# App Store Connectで審査申請
```

---

### Android（Google Play）

#### 前提条件

1. **Google Play Console登録**（$25、一回のみ）
   - https://play.google.com/console/
2. **アプリを作成**
   - Google Play Consoleでアプリエントリを作成

#### 内部テスト配信

```bash
# APKビルド（テスト用）
eas build --platform android --profile preview

# 手動でGoogle Play Consoleにアップロード
# 内部テストトラックに公開
```

#### Google Play配信（本番）

```bash
# AABビルド（本番用）
eas build --platform android --profile production

# Google Playに提出
eas submit --platform android --profile production

# Google Play Consoleで審査申請
```

---

## 🔄 自動ビルド（EAS Workflows）

GitHubにタグをプッシュすると自動ビルドが実行されます：

```bash
# バージョンアップ
# app.json の version を更新（例: 1.0.0 → 1.0.1）

# タグを作成してプッシュ
git tag v1.0.1
git push origin v1.0.1

# 自動的にiOS/Androidの両方がビルドされます
# EAS Dashboard で進行状況を確認:
# https://expo.dev/accounts/yucco-k/projects/react-native-todo-app/builds
```

---

## 📊 ビルド状況の確認

### EAS Dashboard

```
https://expo.dev/accounts/yucco-k/projects/react-native-todo-app/builds
```

### コマンドラインで確認

```bash
# すべてのビルドを確認
eas build:list

# 最新のビルドを確認
eas build:list --limit 1

# 特定プラットフォームのビルドを確認
eas build:list --platform ios
eas build:list --platform android
```

---

## 💰 コスト概要

| 項目                        | 料金   | 備考                          |
| --------------------------- | ------ | ----------------------------- |
| **EAS Build**               | 無料   | 月30ビルドまで無料            |
| **Apple Developer Program** | $99/年 | iOS配信に必要                 |
| **Google Play Console**     | $25    | Android配信に必要（一回のみ） |

---

## 🛠️ トラブルシューティング

### ビルドが失敗する場合

#### 1. 依存関係の問題

```bash
# node_modules を再インストール
rm -rf node_modules
npm install

# ビルド再実行
eas build --platform ios --profile preview
```

#### 2. Apple Developer Accountの問題

```bash
# Apple IDでログイン
eas login --apple

# 再ビルド
eas build --platform ios --profile preview
```

#### 3. Android署名キーの問題

```bash
# EASが自動的に署名キーを生成します
# 初回ビルド時に自動で作成されます
eas build --platform android --profile preview
```

---

## 📝 チェックリスト

### 初回ビルド前

- [ ] `app.json` の `version` を確認
- [ ] Bundle Identifier / Package名を確認
- [ ] アイコン画像が正しく設定されているか確認
- [ ] スプラッシュスクリーンが正しく設定されているか確認

### iOS配信前

- [ ] Apple Developer Programに登録済み
- [ ] App Store Connectでアプリを作成済み
- [ ] プライバシーポリシーのURLを用意
- [ ] スクリーンショットを準備

### Android配信前

- [ ] Google Play Consoleに登録済み
- [ ] Google Playでアプリを作成済み
- [ ] プライバシーポリシーのURLを用意
- [ ] スクリーンショット、フィーチャーグラフィックを準備

---

## 🎯 推奨ワークフロー

### 1. 開発フェーズ（現在）

```bash
# Expo Goで開発（無制限・無料）
npx expo start

# OTA更新で本番配信（無制限・無料）
git push origin main
```

### 2. テストフェーズ

```bash
# プレビュービルドを作成（月30回まで無料）
eas build --platform ios --profile preview
eas build --platform android --profile preview

# TestFlightで配信（iOS、$99/年必要）
eas submit --platform ios --profile preview

# APKを直接インストール（Android、無料）
```

### 3. 本番リリース

```bash
# プロダクションビルド（月30回まで無料）
eas build --platform ios --profile production
eas build --platform android --profile production

# ストアに提出（iOS: $99/年、Android: $25）
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## 📚 参考リンク

- [EAS Build ドキュメント](https://docs.expo.dev/build/introduction/)
- [EAS Submit ドキュメント](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [Apple Developer Program](https://developer.apple.com/programs/)

---

## 💡 Tips

### ビルド時間を短縮

- プレビュービルドは待ち時間が長い場合がある（無料プラン）
- 有料プラン（Production plan: $29/月）にすると優先度が上がる

### バージョン管理

- `app.json` の `version` を更新するごとにビルド
- セマンティックバージョニング推奨（1.0.0 → 1.0.1 → 1.1.0）

### OTA更新との使い分け

- **UI/機能の小さな変更**: OTA更新（無料・即座）
- **ネイティブコードの変更**: スタンドアロンビルド必要
- **ストア公開**: スタンドアロンビルド必須
