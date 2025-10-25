# GitHub Actions セットアップガイド

このプロジェクトはGitHub ActionsでCI/CDを実行します。

## 📋 概要

GitHub Actionsで以下を自動実行：

1. **テスト**：ESLint、Biome、型チェック、ユニットテスト
2. **デプロイ**：EAS Updateで本番環境に自動配信

---

## 🔧 セットアップ手順

### Step 1: EXPO_TOKENの生成

#### 方法1: Expo公式サイトから（推奨）

1. [Expo Access Tokens](https://expo.dev/accounts/yucco-k/settings/access-tokens)にアクセス
2. 「Create Token」をクリック
3. 名前を入力（例：`github-actions`）
4. 生成されたトークンをコピー **（一度しか表示されません！）**

#### 方法2: コマンドラインから

```bash
npx eas login
npx eas build:configure
```

---

### Step 2: GitHub Secretsに登録

1. GitHubリポジトリを開く：

   ```
   https://github.com/Yucco-K/react-native-todo-app/settings/secrets/actions
   ```

2. 「New repository secret」をクリック

3. 以下を入力：
   - **Name**: `EXPO_TOKEN`
   - **Secret**: Step 1でコピーしたトークンを貼り付け

4. 「Add secret」をクリック

---

## 🚀 動作確認

### Step 3: ワークフローの実行

セットアップ完了後、以下のタイミングで自動実行されます：

#### 1. mainブランチへのプッシュ時

```bash
git add .
git commit -m "feat: 新機能を追加"
git push origin main
```

→ テスト実行 → 成功すればEAS Updateで自動デプロイ

#### 2. Pull Request作成時

```bash
git checkout -b feature/new-feature
git add .
git commit -m "feat: 新機能"
git push origin feature/new-feature
```

→ GitHubでPull Request作成 → テストのみ実行（デプロイしない）

---

## 📊 ワークフローの確認

実行状況は以下で確認できます：

```
https://github.com/Yucco-K/react-native-todo-app/actions
```

### ステータス

- ✅ 緑色のチェック：成功
- ❌ 赤いバツ：失敗
- 🟡 黄色の丸：実行中

---

## 🔍 ワークフローの詳細

### テストジョブ (`test`)

以下を実行：

1. ESLint - コーディング規約チェック
2. Biome - コード品質チェック
3. TypeScript型チェック - 型エラーチェック
4. Jest - ユニットテスト

### デプロイジョブ (`deploy`)

- **条件**: テストが成功 + mainブランチへのプッシュ
- **実行内容**: EAS Updateで`production`ブランチに配信

---

## ⚠️ トラブルシューティング

### ワークフローが実行されない

1. **EXPO_TOKENが設定されているか確認**

   ```
   https://github.com/Yucco-K/react-native-todo-app/settings/secrets/actions
   ```

2. **Actionsが有効化されているか確認**
   ```
   https://github.com/Yucco-K/react-native-todo-app/settings/actions
   ```
   「Allow all actions and reusable workflows」を選択

### テストが失敗する

1. ローカルで実行して確認：

   ```bash
   npm run lint
   npm run biome:check:ci
   npx tsc --noEmit
   npm run test -- --ci
   ```

2. エラーを修正してコミット

### デプロイが失敗する

1. EXPO_TOKENが正しいか確認
2. EAS Updateの権限があるか確認
3. ワークフローログで詳細を確認

---

## 🎯 EAS Workflowsとの比較

### GitHub Actions（現在）

- ✅ GitHub環境に統合
- ✅ 無料枠が大きい
- ✅ 設定が柔軟
- ✅ ログが見やすい

### EAS Workflows（旧）

- `.eas/workflows/`のファイルは残していますが、使用していません
- 必要に応じて削除可能

---

## 📚 参考リンク

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [Expo GitHub Actions](https://github.com/expo/expo-github-action)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
