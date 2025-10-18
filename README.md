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

3. **開発サーバーを起動**

```bash
npm start
# または
npx expo start
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
├── constants/               # 定数
│   ├── data.ts             # ダミーデータ
│   └── urls.ts             # API URL
├── types/                   # 型定義
│   └── Todo.ts             # Todo型
├── assets/                  # 静的ファイル
├── global.css              # グローバルスタイル
├── tailwind.config.js      # Tailwind設定
├── metro.config.js         # Metro bundler設定
├── babel.config.js         # Babel設定
└── package.json            # 依存関係
```

## 🔌 API仕様

### ベースURL

```
http://localhost:3000
```

### エンドポイント

#### 1. Todo一覧取得

```
GET /api/todos
```

**レスポンス:**

```json
[
	{
		"id": 1,
		"title": "タスク1",
		"content": "タスク1です。"
	}
]
```

#### 2. Todo作成

```
POST /api/todos
Content-Type: application/json
```

**リクエストボディ:**

```json
{
	"title": "新しいタスク",
	"content": "タスクの内容"
}
```

#### 3. Todo更新

```
PUT /api/todos/:id
Content-Type: application/json
```

**リクエストボディ:**

```json
{
	"title": "更新後のタイトル",
	"content": "更新後の内容"
}
```

#### 4. Todo削除

```
DELETE /api/todos/:id
```

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
