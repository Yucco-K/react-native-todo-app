# GitHub Pages セットアップガイド

このガイドでは、プライバシーポリシーとサポートページをGitHub Pagesで公開する手順を説明します。

## 📋 概要

以下のページがGitHub Pagesで公開されます：

- **トップページ**: `https://yucco-k.github.io/react-native-todo-app/`
- **プライバシーポリシー**: `https://yucco-k.github.io/react-native-todo-app/privacy-policy.html`
- **サポートページ**: `https://yucco-k.github.io/react-native-todo-app/support.html`

---

## 🚀 セットアップ手順

### 1. GitHubリポジトリでGitHub Pagesを有効化

1. GitHubでリポジトリを開く
   - URL: [https://github.com/Yucco-K/react-native-todo-app](https://github.com/Yucco-K/react-native-todo-app)

2. **Settings**タブをクリック

3. 左サイドバーの**Pages**をクリック

4. **Source**セクションで以下を設定：
   - **Branch**: `main` を選択
   - **Folder**: `/docs` を選択
   - **Save**ボタンをクリック

5. 数分待つと、ページが公開されます
   - 公開URLが表示されます: `https://yucco-k.github.io/react-native-todo-app/`

---

### 2. 公開URLの確認

GitHub Pagesが有効化されると、以下のURLでアクセスできます：

#### トップページ
```
https://yucco-k.github.io/react-native-todo-app/
```

#### プライバシーポリシー
```
https://yucco-k.github.io/react-native-todo-app/privacy-policy.html
```

#### サポートページ
```
https://yucco-k.github.io/react-native-todo-app/support.html
```

---

### 3. App Store Connect での設定

GitHub Pagesが公開されたら、App Store Connectで以下のURLを設定します：

#### App Information ページ
1. [App Store Connect](https://appstoreconnect.apple.com/) にログイン
2. **My Apps** → **Todo App** を選択
3. **App Information** をクリック
4. 以下のURLを入力：

**Privacy Policy URL:**
```
https://yucco-k.github.io/react-native-todo-app/privacy-policy.html
```

**Support URL:**
```
https://yucco-k.github.io/react-native-todo-app/support.html
```

5. **Save**をクリック

---

## 🔄 更新方法

プライバシーポリシーやサポートページを更新する場合：

1. `docs/privacy-policy.md` または `docs/support.md` を編集
2. 変更をコミット・プッシュ

```bash
git add docs/
git commit -m "docs: プライバシーポリシーを更新"
git push origin main
```

3. GitHub Pagesが自動的に更新されます（通常1-2分）

---

## ✅ 確認事項

### GitHub Pages が正しく公開されているか確認

以下のURLにアクセスして、ページが表示されることを確認してください：

- [ ] https://yucco-k.github.io/react-native-todo-app/
- [ ] https://yucco-k.github.io/react-native-todo-app/privacy-policy.html
- [ ] https://yucco-k.github.io/react-native-todo-app/support.html

### App Store Connect で設定完了

- [ ] Privacy Policy URL を設定
- [ ] Support URL を設定
- [ ] 変更を保存

---

## 🐛 トラブルシューティング

### ページが表示されない（404エラー）

**原因**: GitHub Pagesがまだ有効化されていない、またはビルド中

**解決方法**:
1. GitHub リポジトリの **Settings** → **Pages** で設定を確認
2. 数分待ってから再度アクセス
3. ブラウザのキャッシュをクリア（Cmd+Shift+R）

### ページが古い内容のまま

**原因**: GitHub Pagesのキャッシュ

**解決方法**:
1. ブラウザのキャッシュをクリア
2. 5-10分待ってから再度アクセス
3. シークレットモード/プライベートブラウジングで確認

### Markdownが表示されない

**原因**: HTMLファイルがMarkdownファイルを読み込めていない

**解決方法**:
1. `docs/privacy-policy.md` と `docs/support.md` が存在することを確認
2. ブラウザの開発者ツール（F12）でエラーを確認
3. 必要に応じて、HTMLファイルのパスを修正

---

## 📝 ファイル構成

```
docs/
├── index.html              # トップページ
├── privacy-policy.html     # プライバシーポリシー表示用
├── privacy-policy.md       # プライバシーポリシー本文
├── support.html            # サポートページ表示用
└── support.md              # サポートページ本文
```

---

## 🔒 セキュリティ

- GitHub Pagesは**HTTPS**で自動的に配信されます
- App Store審査要件を満たしています
- プライバシーポリシーとサポートページは公開情報のため、publicリポジトリでも問題ありません

---

## 📚 参考リンク

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [App Store Connect - App Information](https://developer.apple.com/help/app-store-connect/manage-app-information/add-app-information)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## ✨ 完了後の確認

GitHub Pagesの設定が完了したら、以下を確認してください：

1. ✅ すべてのURLが正しく表示される
2. ✅ プライバシーポリシーの内容が正確
3. ✅ サポートページのリンクが機能する
4. ✅ App Store Connect にURLを設定済み
5. ✅ 審査メモにURLを記載

これで、App Store審査の準備が整いました！🎉

