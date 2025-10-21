# CI/CD ガイド

このプロジェクトはEAS Workflowsを使用した継続的デリバリー（CD）を実装しています。

## 📋 概要

### 自動化されているプロセス

1. **OTA更新の自動配信**
   - `main`ブランチへのプッシュ → 本番環境に自動配信
   - `develop`/`feature/*`ブランチへのプッシュ → プレビュー環境に自動配信

2. **プロダクションビルドの自動作成**
   - バージョンタグ（`v1.0.0`など）の作成 → iOS/Androidビルドを自動作成

---

## 🚀 セットアップ手順

### 1. EASプロジェクトとGitHubをリンク

1. [EAS Dashboard](https://expo.dev/accounts/yucco-k/projects/react-native-todo-app)にアクセス
2. プロジェクトの「Settings」→「GitHub」に移動
3. 「Install GitHub App」をクリック
4. GitHubリポジトリ（`Yucco-K/react-native-todo-app`）を選択して接続

### 2. ワークフローの確認

プロジェクトには以下のワークフローファイルが含まれています：

```
.eas/workflows/
├── production-update.yml   # 本番環境への自動OTA更新
├── preview-update.yml      # プレビュー環境への自動OTA更新
└── production-build.yml    # プロダクションビルドの自動作成
```

---

## 📝 ワークフローの詳細

### 1. Production OTA Update（本番環境への自動配信）

**トリガー**: `main`ブランチへのプッシュ

```yaml
name: Production OTA Update

on:
  push:
    branches:
      - main

jobs:
  update:
    name: Deploy to Production
    type: update
    params:
      branch: production
      message: "Auto-deploy: ${{ github.event.head_commit.message }}"
```

**使い方**:
```bash
git add .
git commit -m "feat: 新機能を追加"
git push origin main
# → 自動でproductionブランチに配信される
```

---

### 2. Preview OTA Update（プレビュー環境への自動配信）

**トリガー**: `develop`または`feature/*`ブランチへのプッシュ

```yaml
name: Preview OTA Update

on:
  push:
    branches:
      - develop
      - feature/*

jobs:
  update:
    name: Deploy to Preview
    type: update
    params:
      branch: preview
      message: "Preview: ${{ github.event.head_commit.message }}"
```

**使い方**:
```bash
# 新機能ブランチを作成
git checkout -b feature/dark-mode
git add .
git commit -m "feat: ダークモードを追加"
git push origin feature/dark-mode
# → 自動でpreviewブランチに配信される
```

---

### 3. Production Build（プロダクションビルドの自動作成）

**トリガー**: `v*.*.*`形式のタグ作成

```yaml
name: Production Build

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build_ios:
    name: Build iOS Production
    type: build
    params:
      platform: ios
      profile: production
      
  build_android:
    name: Build Android Production
    type: build
    params:
      platform: android
      profile: production
```

**使い方**:
```bash
# バージョンタグを作成
git tag v1.0.0
git push origin v1.0.0
# → iOS/Androidの本番ビルドが自動作成される
```

---

## 🔧 手動実行

ワークフローは手動でも実行できます：

```bash
# 本番環境への更新
eas workflow:run production-update.yml

# プレビュー環境への更新
eas workflow:run preview-update.yml

# プロダクションビルド
eas workflow:run production-build.yml
```

---

## 📊 ワークフローの確認

実行中・完了したワークフローは以下で確認できます：

1. [EAS Dashboard](https://expo.dev/accounts/yucco-k/projects/react-native-todo-app/workflows)の「Workflows」タブ
2. 各ワークフローの実行ログを確認可能
3. 失敗した場合のエラーメッセージも表示

---

## 🎯 ブランチ戦略

このプロジェクトでは以下のブランチ戦略を推奨します：

```
main (本番環境)
  ↑
develop (開発環境)
  ↑
feature/* (機能開発)
```

### フロー例

1. **新機能開発**
   ```bash
   git checkout -b feature/new-feature
   # 開発作業
   git push origin feature/new-feature
   # → previewブランチに自動配信（テスト用）
   ```

2. **開発環境へマージ**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   # → previewブランチに自動配信
   ```

3. **本番環境へリリース**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # → productionブランチに自動配信
   ```

4. **アプリストアへのビルド**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   # → iOS/Androidビルドが自動作成
   ```

---

## ⚠️ 注意事項

### 1. 環境変数

ワークフロー実行時に必要な環境変数は、EAS Dashboardの「Secrets」で設定してください：

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- その他、`.env.production`の変数

### 2. ビルドクレジット

EAS Workflowsでビルドを実行する際は、EASのビルドクレジットを消費します。
無料プランでは月30ビルドまで利用可能です。

### 3. 実行時間

- **OTA更新**: 約2-5分
- **ビルド作成**: 約10-30分（プラットフォームによる）

---

## 🔗 参考リンク

- [EAS Workflows公式ドキュメント](https://docs.expo.dev/eas/workflows/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

## 📞 トラブルシューティング

### ワークフローが実行されない

1. GitHubリポジトリが正しくリンクされているか確認
2. EAS Dashboardの「Workflows」タブでステータスを確認
3. ワークフローファイルの構文が正しいか確認

### ビルドが失敗する

1. `eas.json`の設定を確認
2. 環境変数が正しく設定されているか確認
3. EAS Dashboardのビルドログを確認

### 更新が反映されない

1. `production`ブランチが正しく設定されているか確認
2. アプリが最新版を取得しているか確認
3. キャッシュをクリアして再起動

