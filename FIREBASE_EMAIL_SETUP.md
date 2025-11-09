# Firebase メールテンプレート設定ガイド

このガイドでは、Firebase Authenticationのメール認証とパスワードリセットのメールテンプレートをカスタマイズする方法を説明します。

---

## 📧 メールテンプレートのカスタマイズ

### 1. Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. 左メニューから「Authentication」をクリック
4. 上部タブから「Templates」をクリック

---

## ✉️ メール認証テンプレート

### 設定手順

1. **「Email address verification」を選択**
2. **「テンプレートを編集」をクリック**
3. 以下の内容に変更：

#### 件名（Subject）
```
【Todo App】メールアドレスの確認
```

#### メール本文（Email body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .link {
      word-break: break-all;
      color: #3b82f6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📝 Todo App</h1>
  </div>
  <div class="content">
    <h2>メールアドレスの確認</h2>
    <p>Todo App のご登録ありがとうございます。</p>
    <p>下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
    
    <div style="text-align: center;">
      <a href="%LINK%" class="button">メールアドレスを確認</a>
    </div>
    
    <p style="margin-top: 20px;">※ボタンが機能しない場合は、以下のリンクをブラウザに貼り付けてください：</p>
    <p class="link">%LINK%</p>
    
    <div class="footer">
      <p>⏱️ このリンクは30分間有効です。</p>
      <p>💡 このメールに心当たりがない場合は、破棄してください。</p>
      <p>📧 サポート: <a href="https://yucco-k.github.io/react-native-todo-app/support.html">https://yucco-k.github.io/react-native-todo-app/support.html</a></p>
      <p style="margin-top: 20px;">— Todo App チーム</p>
    </div>
  </div>
</body>
</html>
```

4. **「保存」をクリック**

---

## 🔐 パスワードリセットテンプレート

### 設定手順

1. **「Password reset」を選択**
2. **「テンプレートを編集」をクリック**
3. 以下の内容に変更：

#### 件名（Subject）
```
【Todo App】パスワードリセットのご案内
```

#### メール本文（Email body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .link {
      word-break: break-all;
      color: #3b82f6;
    }
    .warning {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📝 Todo App</h1>
  </div>
  <div class="content">
    <h2>パスワードリセットのご案内</h2>
    <p>Todo App のパスワードリセットをリクエストされました。</p>
    <p>下のボタンをクリックして、新しいパスワードを設定してください。</p>
    
    <div style="text-align: center;">
      <a href="%LINK%" class="button">パスワードをリセット</a>
    </div>
    
    <p style="margin-top: 20px;">※ボタンが機能しない場合は、以下のリンクをブラウザに貼り付けてください：</p>
    <p class="link">%LINK%</p>
    
    <div class="warning">
      <p><strong>⚠️ 重要な注意事項</strong></p>
      <p>• このリクエストに心当たりがない場合は、このメールを無視してください。</p>
      <p>• パスワードは変更されません。</p>
    </div>
    
    <div class="footer">
      <p>⏱️ このリンクは1時間有効です。</p>
      <p>📧 サポート: <a href="https://yucco-k.github.io/react-native-todo-app/support.html">https://yucco-k.github.io/react-native-todo-app/support.html</a></p>
      <p style="margin-top: 20px;">— Todo App チーム</p>
    </div>
  </div>
</body>
</html>
```

4. **「保存」をクリック**

---

## 🔗 Dynamic Links の設定（重要）

メール認証とパスワードリセットのリンクをアプリで開くには、Firebase Dynamic Linksの設定が必要です。

### 設定手順

1. **Firebase Console で Dynamic Links を有効化**
   - 左メニューから「Engage」→「Dynamic Links」
   - 「始める」をクリック
   - ドメインを設定（例: `reactnativetodoapp.page.link`）

2. **iOS アプリの設定**
   - App Store ID: `6755060534`
   - Bundle ID: `com.yuccok.reactnativetodoapp`
   - Team ID: Apple Developer の Team ID

3. **Android アプリの設定**
   - Package name: `com.yuccok.reactnativetodoapp`

4. **URL プレフィックスの確認**
   - メール認証: `https://reactnativetodoapp.page.link/verify`
   - パスワードリセット: `https://reactnativetodoapp.page.link/reset`

---

## 📱 アプリ側の設定

### app.config.js に追加

```javascript
ios: {
  associatedDomains: [
    'applinks:reactnativetodoapp.page.link'
  ],
  // ... 既存の設定
},
android: {
  intentFilters: [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: 'reactnativetodoapp.page.link',
          pathPrefix: '/',
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ],
  // ... 既存の設定
},
```

---

## ✅ テスト方法

### メール認証のテスト

1. アプリで新規アカウントを作成
2. 登録したメールアドレスに認証メールが届く
3. メール内のリンクをクリック
4. アプリが開き、自動的にログイン画面にリダイレクト
5. ログインすると認証済みとしてアクセス可能

### パスワードリセットのテスト

1. ログイン画面で「パスワードを忘れた場合」をタップ
2. メールアドレスを入力して送信
3. メールが届く
4. メール内のリンクをクリック
5. アプリが開き、新しいパスワードを設定
6. 新しいパスワードでログイン

---

## 🐛 トラブルシューティング

### メールが届かない場合

1. **迷惑メールフォルダを確認**
2. **Firebase Console で送信履歴を確認**
   - Authentication → Templates → 送信履歴
3. **送信元メールアドレスを確認**
   - デフォルト: `noreply@<project-id>.firebaseapp.com`
   - カスタムドメインを使用する場合は別途設定が必要

### リンクが開かない場合

1. **Dynamic Links の設定を確認**
2. **Bundle ID / Package Name が一致しているか確認**
3. **Associated Domains の設定を確認**（iOS）
4. **Intent Filters の設定を確認**（Android）

---

## 📚 参考リンク

- [Firebase Authentication - Email Templates](https://firebase.google.com/docs/auth/custom-email-handler)
- [Firebase Dynamic Links](https://firebase.google.com/docs/dynamic-links)
- [iOS Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)

---

**最終更新日**: 2025-01-09

