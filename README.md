# React Native Todo App

React NativeとExpo Routerを使用したTodoアプリです。CRUD機能（作成・読取・更新・削除）を完備し、NativeWindでスタイリングしています。

## 📱 機能一覧

### ✅ 実装済み機能

- **Todo作成**: タイトルと内容を入力してTodoを新規作成
- **Todo一覧表示**: 登録されたTodoをリスト表示
- **Todo編集**: 既存のTodoの内容を編集
- **Todo削除**: 不要なTodoを削除
- **バリデーション**: Zodを使った入力チェック
  - タイトル: 1〜50文字
  - 内容: 1〜200文字
- **トースト通知**: 操作成功/失敗の通知表示
- **自動リフレッシュ**: 作成・更新・削除後に自動でリスト更新
- **ローディング状態**: 処理中のUI表示

## 🛠 技術スタック

### フレームワーク・ライブラリ

| 技術                       | バージョン | 用途                         |
| -------------------------- | ---------- | ---------------------------- |
| React Native               | 0.81.4     | モバイルアプリフレームワーク |
| Expo                       | ~54.0      | 開発環境                     |
| Expo Router                | ~6.0       | ファイルベースルーティング   |
| TypeScript                 | ~5.9       | 型安全性                     |
| NativeWind                 | ^4.2       | Tailwindベースのスタイリング |
| Zod                        | ^3.25      | バリデーション               |
| react-native-toast-message | latest     | トースト通知                 |
| Firebase                   | latest     | バックエンド・データベース   |

### スタイリング

- **NativeWind v4**: TailwindCSSをReact Nativeで使用
- **カスタムフォント**: Noto Sans JP（日本語対応）

## 📦 セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn
- Expo Go アプリ（iOS/Android実機テスト用）

### インストール手順

1. **リポジトリをクローン**

```bash
git clone https://github.com/Yucco-K/react-native-todo-app.git
cd react-native-todo-app
```

2. **依存関係をインストール**

```bash
npm install
```

3. **Firebaseプロジェクトをセットアップ**

#### 3-1. Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `my-todo-app`）
4. Google Analyticsの設定（任意）

#### 3-2. Firestoreを有効化

1. Firebase Consoleで「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. **テストモード**を選択（開発用）
4. リージョンを選択（例: `asia-northeast1`）

#### 3-3. Firebase設定を取得

1. Firebase Consoleのプロジェクト設定（⚙️アイコン）を開く
2. 「全般」タブで下にスクロール
3. 「アプリを追加」→「ウェブアプリ」を選択
4. アプリのニックネームを入力
5. 表示される設定情報（`firebaseConfig`）をコピー

#### 3-4. 環境変数を設定

プロジェクトルートに`.env`ファイルを作成し、Firebase設定を入力：

```bash
# .env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**注意**: `.env`ファイルは`.gitignore`に含まれています。本番環境では環境変数を適切に管理してください。

4. **開発サーバーを起動**

```bash
npm start
# または
npx expo start --clear
```

## 🚀 実行方法

### 開発環境で実行

```bash
# 開発サーバーを起動（キャッシュクリア）
npx expo start --clear

# iOS シミュレーターで起動
npm run ios

# Android エミュレーターで起動
npm run android

# Webブラウザで起動
npm run web
```

### 実機でテスト

1. **Expo Goアプリをインストール**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **QRコードをスキャン**
   - `npx expo start` 実行後に表示されるQRコードを読み取る
   - iOS: カメラアプリでスキャン
   - Android: Expo Goアプリ内でスキャン

## 👥 他の人に共有する方法

### 方法1: ローカルネットワークで共有（同じWi-Fi内）

```bash
npx expo start
```

表示されるQRコードを相手に送り、Expo Goアプリでスキャンしてもらう

### 方法2: Expoサーバーに公開（インターネット経由）

```bash
npx expo start --tunnel
```

トンネル接続でQRコードを共有（インターネット経由でアクセス可能）

### 方法3: 本番アプリとしてビルド

```bash
# iOS用ビルド
eas build --platform ios

# Android用APKビルド
eas build --platform android --profile preview
```

ビルドしたアプリファイル（.ipa / .apk）を配布

## 📁 プロジェクト構造

```
react-native-todo-app/
├── app/                      # Expo Routerのルート
│   ├── _layout.tsx          # ルートレイアウト（グローバル設定）
│   └── index.tsx            # メイン画面
├── components/              # コンポーネント
│   ├── TodoForm.tsx         # Todo作成フォーム
│   ├── TodoTable.tsx        # Todo一覧表示
│   ├── EditTodoModal.tsx    # Todo編集モーダル
│   └── ui/
│       └── TodoItem.tsx     # Todo個別アイテム
├── config/                  # 設定
│   └── firebase.ts          # Firebase設定
├── services/                # サービス層
│   └── todoService.ts       # Firestore操作
├── constants/               # 定数
│   └── data.ts              # ダミーデータ
├── types/                   # 型定義
│   └── Todo.ts              # Todo型
├── assets/                  # 静的ファイル
├── global.css               # グローバルスタイル
├── tailwind.config.js       # Tailwind設定
├── metro.config.js          # Metro bundler設定
├── babel.config.js          # Babel設定
├── .env                     # 環境変数（gitignore）
└── package.json             # 依存関係
```

## 🔥 Firebase / Firestore

### データベース構造

このアプリは**Firebase Firestore**を使用しています。

#### コレクション: `todos`

各ドキュメントの構造：

```typescript
{
	id: string; // FirestoreのドキュメントID（自動生成）
	title: string; // Todoのタイトル（1〜50文字）
	content: string; // Todoの内容（1〜200文字）
	completed: boolean; // 完了状態（true/false）
	createdAt: Date; // 作成日時
}
```

### Firestoreの操作

アプリは`services/todoService.ts`を通じてFirestoreと通信します：

- **`getTodos()`**: すべてのTodoを取得（`createdAt`の降順）
- **`createTodo(title, content)`**: 新しいTodoを作成
- **`updateTodo(id, updates)`**: Todoを更新
- **`deleteTodo(id)`**: Todoを削除
- **`toggleTodoComplete(id, currentCompleted)`**: 完了状態をトグル

### セキュリティルール（開発用）

Firebase Consoleで以下のルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      // 開発環境: すべての読み書きを許可
      allow read, write: if true;

      // 本番環境の例（認証が必要）:
      // allow read, write: if request.auth != null;
    }
  }
}
```

**注意**: 上記は開発用のルールです。本番環境では適切な認証とセキュリティルールを設定してください。

## 🎨 デザイン仕様

### カラーパレット

- **プライマリ**: 黒 (`bg-black`)
- **セカンダリ**: 青 (`bg-blue-500`)
- **危険**: 赤 (`bg-red-500`)
- **成功**: 緑（トースト）
- **エラー**: 赤（トースト）

### フォント

- **Regular**: Noto Sans JP 400
- **Bold**: Noto Sans JP 700

### レイアウト

- SafeAreaView対応（iOSノッチ対応）
- レスポンシブな幅設定（w-1/3, w-2/3など）

## 🧪 開発コマンド

```bash
# 開発サーバー起動
npm start

# キャッシュクリアして起動
npx expo start --clear

# 型チェック
npx tsc --noEmit

# Lintチェック（エディタで自動実行）
```

## 📝 開発メモ

### NativeWind v4の注意点

- `global.css`のインポートが必須
- `metro.config.js`に`withNativeWind`設定が必要
- `tailwind.config.js`に`nativewind/preset`が必要
- `className`プロパティで全てのスタイリング

### トーストの位置

```tsx
<Toast position="top" topOffset={60} />
```

画面上部に表示（SafeArea考慮）

## 🐛 トラブルシューティング

### スタイルが効かない

```bash
# キャッシュをクリアして再起動
npx expo start --clear
```

### フォントが読み込まれない

アプリ起動時にSplashScreenで待機しているか確認：

```tsx
SplashScreen.preventAutoHideAsync();
```

### Android戻るボタンでアプリが落ちる

Modalに`onRequestClose`を設定：

```tsx
<Modal onRequestClose={onClose}>
```

## 👨‍💻 作成者

Yucco-K

## 🔗 リンク

- [GitHub Repository](https://github.com/Yucco-K/react-native-todo-app)
- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
