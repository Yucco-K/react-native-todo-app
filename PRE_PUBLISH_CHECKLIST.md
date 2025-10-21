# GitHubへの公開前チェックリスト

このドキュメントでは、コードをGitHubに公開する前に確認すべき項目をまとめています。

## ✅ セキュリティチェック

### 1. 環境変数ファイルの除外

- [x] `.gitignore`に`.env*`ファイルが含まれている
- [x] `.env`ファイルがGitの追跡対象外であることを確認

```bash
# 確認コマンド
git status
# .envファイルが表示されないことを確認
```

### 2. 機密情報の削除

- [x] OpenAI APIキーがコード内に直接記述されていない
- [x] Firebase設定が環境変数で管理されている
- [x] すべてのAPIキーが`.env`ファイルにのみ存在

```bash
# 機密情報の検索
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "AIza" . --exclude-dir=node_modules --exclude-dir=.git
```

### 3. AI機能の無効化

- [x] `services/aiCategoryService.ts`でOpenAI API呼び出しを無効化
- [x] `package.json`から`openai`パッケージを削除
- [x] ドキュメントに無効化の理由を記載

### 4. コミット履歴の確認

```bash
# 過去のコミットに機密情報が含まれていないか確認
git log --all --full-history --source -- .env
git log -S "OPENAI_API_KEY" --all

# もし機密情報が見つかった場合は、git-filter-repoで削除が必要
```

---

## 📝 ドキュメントチェック

### 必須ドキュメント

- [x] `README.md` - プロジェクト概要、セットアップ手順
- [x] `SPECIFICATION.md` - 詳細な仕様書
- [x] `SECURITY_GUIDE.md` - セキュリティガイド（新規作成）
- [x] `FIRESTORE_RULES.md` - Firestoreセキュリティルール
- [x] `CI_CD_GUIDE.md` - CI/CD設定ガイド
- [x] `TESTING_GUIDE.md` - テスト設定ガイド
- [x] `LICENSE` - ライセンス情報

### ドキュメント内容の確認

- [x] AI機能が一時的に無効化されていることを明記
- [x] セットアップ手順にOpenAI APIキーの記述を削除/コメントアウト
- [x] セキュリティ対応について説明
- [x] 将来の実装方針（Firebase Cloud Functions）を記載

---

## 🧪 コード品質チェック

### テスト実行

```bash
# すべてのテストを実行
npm test

# カバレッジ確認
npm run test:coverage
```

- [ ] すべてのテストが通過
- [ ] カバレッジが適切（最低50%以上推奨）

### Lintチェック

```bash
# Lintエラーの確認
npm run lint
```

- [ ] Lintエラーがない、または許容範囲内

### ビルド確認

```bash
# 開発ビルド
npx expo start

# 本番ビルド（EAS）
eas build --platform ios --profile preview
```

- [ ] 開発環境で正常に動作
- [ ] EASビルドが成功

---

## 🔒 Firebase設定チェック

### Firestore セキュリティルール

- [x] セキュリティルールが適切に設定されている
- [x] `FIRESTORE_RULES.md`に最新のルールを記載

### Firestore インデックス

- [x] 必要なインデックスがすべて作成されている
- [x] `README.md`にインデックス作成手順を記載

### Authentication設定

- [x] メール/パスワード認証が有効
- [x] 不要なプロバイダーは無効化

---

## 📦 依存関係チェック

### 脆弱性スキャン

```bash
# 脆弱性チェック
npm audit

# 高リスクの脆弱性を修正
npm audit fix
```

- [ ] 高リスクの脆弱性がない
- [ ] 修正可能な脆弱性は修正済み

### 不要な依存関係の削除

- [x] 使用していないパッケージを削除
- [x] `package.json`が最新の状態

---

## 🌐 GitHub設定チェック

### リポジトリ設定

- [ ] リポジトリをpublicまたはprivateに設定
- [ ] 適切なライセンスを選択（例：MIT License）
- [ ] リポジトリの説明を記載

### GitHub Secrets設定（GitHub Actionsを使用する場合）

```
# 以下のSecretsを設定（必要に応じて）
- EXPO_TOKEN
- FIREBASE_SERVICE_ACCOUNT_KEY
```

- [ ] 必要なSecretsを設定
- [ ] ローカルの`.env`をGitHub Secretsにコピーしない（重要！）

### .gitignore確認

```bash
# .gitignoreが正しく機能しているか確認
git status --ignored
```

- [x] `node_modules/`が除外されている
- [x] `.env*`ファイルが除外されている
- [x] `dist/`が除外されている

---

## 🚀 公開前の最終確認

### 1. クリーンビルド

```bash
# キャッシュをクリア
npx expo start --clear

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

### 2. 動作確認

- [ ] ログイン/サインアップが正常に動作
- [ ] Todo作成/編集/削除が正常に動作
- [ ] グループ機能が正常に動作
- [ ] ダークモードが正常に動作
- [ ] プッシュ通知が正常に送受信できる

### 3. ドキュメント確認

- [ ] README.mdのスクリーンショットが最新
- [ ] QRコードが最新
- [ ] すべてのリンクが正常に動作

### 4. コミット前の最終チェック

```bash
# ステータス確認
git status

# 差分確認
git diff

# .envファイルが含まれていないことを確認
git ls-files | grep .env
# 何も表示されなければOK
```

---

## ⚠️ 公開後の注意事項

### モニタリング

1. **Firebase使用量を監視**
   - Firebase Console で日次使用量を確認
   - 予算アラートを設定（推奨：$10/月）

2. **異常なアクセスを監視**
   - 急激なユーザー増加
   - 異常なAPI呼び出し数
   - 不審なエラーログ

### セキュリティインシデント対応

**もしAPIキーが漏洩した場合**:

1. **即座に実施**:
   - Firebase Console でAPIキーを無効化
   - 新しいAPIキーを生成
   - `.env`ファイルを更新

2. **Gitからの削除**:

   ```bash
   # 履歴から機密情報を完全に削除
   # ※注意：この操作は不可逆です
   git filter-repo --path .env --invert-paths
   git push --force
   ```

3. **ユーザーへの通知**:
   - セキュリティインシデントを公表
   - 影響範囲を明確にする

---

## 📚 参考リンク

- [GitHub: Ignoring files](https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files)
- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/api-keys#best-practices)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

## ✅ 最終確認

すべてのチェックボックスにチェックが入ったら、以下のコマンドでGitHubにプッシュしてください：

```bash
# ローカルの変更をコミット
git add .
git commit -m "feat: AI機能を一時的に無効化（セキュリティ対応）"

# GitHubにプッシュ
git push origin main
```

---

**🎉 公開完了！**

あなたのプロジェクトは安全にGitHubで公開されています。
