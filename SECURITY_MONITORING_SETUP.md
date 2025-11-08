# セキュリティ監視セットアップガイド

このドキュメントでは、リポジトリのセキュリティ監視体制を構築する手順を説明します。

## 📋 目次

1. [GitHub セキュリティ機能の有効化](#1-github-セキュリティ機能の有効化)
2. [CI/CD ワークフローの確認](#2-cicd-ワークフローの確認)
3. [Pre-commit フックのセットアップ](#3-pre-commit-フックのセットアップ)
4. [定期的な監視とメンテナンス](#4-定期的な監視とメンテナンス)

---

## 1. GitHub セキュリティ機能の有効化

### 1.1 Secret Scanning の有効化

1. リポジトリの `Settings` → `Security & analysis` へ移動  
   または直接 URL: https://github.com/Yucco-K/react-native-todo-app/settings/security_and_analysis

2. 以下の機能を有効化：
   - ✅ **Dependency graph** (依存関係の可視化)
   - ✅ **Dependabot alerts** (脆弱性アラート)
   - ✅ **Dependabot security updates** (自動セキュリティアップデート)
   - ✅ **Secret scanning** (機密情報の検出)
   - ✅ **Push protection** (プッシュ前のブロック)

### 1.2 Code Scanning の有効化

1. リポジトリの `Security` タブ → `Code scanning` へ移動

2. `Set up` → `Default` を選択（推奨）
   - CodeQL が自動的に設定されます
   - または `Advanced` で `.github/workflows/codeql.yml` をカスタマイズ

3. 設定完了後、次回のプッシュから自動スキャンが実行されます

### 1.3 アラート通知の設定

1. `Settings` → `Notifications` → `Security alerts`

2. 以下を有効化：
   - ✅ Email notifications for security alerts
   - ✅ Web notifications

---

## 2. CI/CD ワークフローの確認

### 2.1 GitHub Actions ワークフロー

`.github/workflows/ci.yml` が追加されました。以下のチェックが自動実行されます：

- **Security Scan**: gitleaks による機密情報検出
- **Dependency Audit**: npm audit による脆弱性チェック
- **Lint Check**: Biome によるコード品質チェック
- **Test**: Jest によるユニットテスト
- **Build Check**: TypeScript コンパイルと Expo Doctor

### 2.2 ワークフローの動作確認

次回のプッシュまたはプルリクエスト作成時に自動実行されます。

```bash
# 手動でワークフローをトリガー（オプション）
git push origin main
```

実行結果は `Actions` タブで確認できます：  
https://github.com/Yucco-K/react-native-todo-app/actions

---

## 3. Pre-commit フックのセットアップ

### 3.1 前提条件

Python がインストールされていることを確認：

```bash
python3 --version
```

### 3.2 pre-commit のインストール

```bash
# pip を使用してインストール
pip3 install pre-commit

# または Homebrew（macOS）
brew install pre-commit
```

### 3.3 フックの有効化

プロジェクトルートで以下を実行：

```bash
cd /Users/yukig/dev/react-native-todo-app
pre-commit install
```

成功すると以下のメッセージが表示されます：
```
pre-commit installed at .git/hooks/pre-commit
```

### 3.4 動作確認

既存のファイルに対して手動実行：

```bash
pre-commit run --all-files
```

これで、次回のコミット時に自動的にチェックが実行されます。

### 3.5 フックのスキップ（緊急時のみ）

```bash
# 緊急時のみ使用（推奨しません）
git commit --no-verify -m "commit message"
```

---

## 4. 定期的な監視とメンテナンス

### 4.1 毎週の確認事項

1. **Dependabot アラート**  
   https://github.com/Yucco-K/react-native-todo-app/security/dependabot

2. **Secret scanning アラート**  
   https://github.com/Yucco-K/react-native-todo-app/security/secret-scanning

3. **Code scanning アラート**  
   https://github.com/Yucco-K/react-native-todo-app/security/code-scanning

### 4.2 毎月の確認事項

1. **依存関係の更新**
   ```bash
   npm outdated
   npm update
   ```

2. **Dependabot PR のレビュー**  
   自動作成された PR を確認してマージ

3. **セキュリティアドバイザリの確認**  
   https://github.com/advisories

### 4.3 アラート発生時の対応

#### Dependabot アラート
1. アラートの詳細を確認
2. 推奨バージョンへアップデート
3. テスト実行後にマージ

#### Secret Scanning アラート
1. **即座に対応**（最優先）
2. 該当のシークレットを無効化/変更
3. 必要に応じて Git 履歴から削除（`git filter-repo`）
4. 環境変数として再設定

#### Code Scanning アラート
1. 重大度を確認（Critical > High > Medium > Low）
2. 修正方法を確認
3. コードを修正してプッシュ

---

## 5. トラブルシューティング

### pre-commit が実行されない

```bash
# フックが正しくインストールされているか確認
ls -la .git/hooks/pre-commit

# 再インストール
pre-commit uninstall
pre-commit install
```

### gitleaks で誤検知が発生する

`.gitleaks.toml` の `[allowlist]` セクションに除外ルールを追加：

```toml
[allowlist]
regexes = [
  '''your-false-positive-pattern''',
]
```

### GitHub Actions が失敗する

1. `Actions` タブでログを確認
2. エラーメッセージに従って修正
3. 必要に応じて `.github/workflows/ci.yml` を調整

---

## 6. 参考リンク

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [CodeQL](https://codeql.github.com/)
- [gitleaks](https://github.com/gitleaks/gitleaks)
- [pre-commit](https://pre-commit.com/)

---

## ✅ チェックリスト

セットアップ完了後、以下を確認してください：

- [ ] GitHub Secret Scanning を有効化
- [ ] Dependabot alerts を有効化
- [ ] Code Scanning (CodeQL) を有効化
- [ ] CI ワークフロー (`.github/workflows/ci.yml`) が動作
- [ ] pre-commit フックをインストール
- [ ] 通知設定を確認
- [ ] 定期的な監視スケジュールを設定

---

**重要**: このセキュリティ監視体制は、継続的な運用が必要です。アラートが発生した場合は速やかに対応してください。

