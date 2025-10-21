# テストガイド

このプロジェクトのテスト環境のセットアップと使用方法について説明します。

## 📋 テストツール

### 1. **Jest**（ユニットテスト）

- JavaScriptテストフレームワーク
- React Nativeアプリの標準的なテストツール
- 高速で並列実行可能

### 2. **React Native Testing Library**

- React Nativeコンポーネントのテスト用ライブラリ
- ユーザーの視点でテストを記述
- DOM Testing Libraryのベストプラクティスに準拠

---

## 🚀 テストの実行

### 基本的な実行

```bash
# すべてのテストを実行
npm test

# 監視モード（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート付き
npm run test:coverage
```

### 特定のテストファイルを実行

```bash
# ファイル名で指定
npm test TodoItem.test.tsx

# パターンマッチ
npm test components/
```

---

## 📝 テストの書き方

### コンポーネントのテスト例

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TodoItem from '../../components/ui/TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    userId: 'user1',
    title: 'テストTODO',
    content: 'テスト内容',
    completed: false,
    shared: false,
    category: 'work' as const,
    organizationId: null,
  };

  it('タイトルが正しく表示される', () => {
    const { getByText } = render(
      <TodoItem
        {...mockTodo}
        currentUserId="user1"
        onToggle={jest.fn()}
      />
    );
    expect(getByText('テストTODO')).toBeTruthy();
  });

  it('チェックボックスをタップするとonToggleが呼ばれる', () => {
    const mockToggle = jest.fn();
    const { getByTestId } = render(
      <TodoItem
        {...mockTodo}
        currentUserId="user1"
        onToggle={mockToggle}
        testID="checkbox"
      />
    );

    fireEvent.press(getByTestId('checkbox'));
    expect(mockToggle).toHaveBeenCalledWith('1');
  });
});
```

### サービス関数のテスト例

```typescript
import { validateTodo } from "../../services/todoService";

describe("todoService", () => {
	describe("validateTodo", () => {
		it("有効なTODOデータはエラーなし", () => {
			const validTodo = {
				title: "テストTODO",
				content: "これは有効なTODOです",
			};
			expect(() => validateTodo(validTodo)).not.toThrow();
		});

		it("タイトルが空の場合はエラー", () => {
			const invalidTodo = {
				title: "",
				content: "タイトルが空です",
			};
			expect(() => validateTodo(invalidTodo)).toThrow();
		});
	});
});
```

---

## 🎯 テスト戦略

### 優先度の高いテスト

1. **ビジネスロジック**
   - `services/todoService.ts`
   - `services/organizationService.ts`
   - `services/praiseFeedbackService.ts`

2. **重要なコンポーネント**
   - `components/ui/TodoItem.tsx`
   - `components/TodoTable.tsx`
   - `components/AddTodoModal.tsx`

3. **ユーティリティ関数**
   - バリデーション
   - データ変換
   - 日付処理

### テストすべき内容

✅ **基本機能**

- データの追加・編集・削除
- 状態の切り替え
- バリデーション

✅ **エッジケース**

- 空の入力
- 最大文字数
- nullやundefined

✅ **ユーザーインタラクション**

- ボタンのタップ
- フォームの入力
- モーダルの開閉

❌ **テスト不要**

- Firebaseの内部実装
- React Nativeの内部実装
- サードパーティライブラリ

---

## 🔧 CI/CDとの統合

### 自動テスト実行

プルリクエストやプッシュ時に自動でテストが実行されます。

```yaml
# .eas/workflows/test.yml
jobs:
  test:
    name: Run Unit Tests
    type: generic
    command:
      - npm install
      - npm run test -- --ci --coverage
```

### デプロイ前のテスト

本番環境へのデプロイ前に自動でテストが実行されます。テストが失敗するとデプロイされません。

```yaml
# .eas/workflows/production-update.yml
jobs:
  test:
    name: Run Tests
    type: generic
    command:
      - npm install
      - npm run test -- --ci

  update:
    name: Deploy to Production
    type: update
    needs: test # テストが成功した場合のみ実行
```

---

## 📊 カバレッジレポート

### カバレッジの確認

```bash
npm run test:coverage
```

カバレッジレポートは`coverage/`ディレクトリに生成されます。

```bash
# ブラウザでHTMLレポートを開く
open coverage/lcov-report/index.html
```

### カバレッジの目標

- **全体**: 70%以上
- **ビジネスロジック**: 80%以上
- **重要なコンポーネント**: 70%以上

---

## 🐛 トラブルシューティング

### テストが失敗する

1. **依存関係のインストール**

   ```bash
   npm install
   ```

2. **キャッシュのクリア**

   ```bash
   npm test -- --clearCache
   ```

3. **Node modulesの再インストール**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Mockが動作しない

`jest.setup.js`でモックが正しく設定されているか確認してください。

```javascript
// jest.setup.js
jest.mock("./config/firebase", () => ({
	auth: {},
	db: {},
}));
```

### コンポーネントのテストでエラー

コンポーネントが使用しているContext（AuthContext、ThemeContextなど）をモックする必要があります。

```typescript
import { ThemeProvider } from '../../contexts/ThemeContext';

const { getByText } = render(
  <ThemeProvider>
    <TodoItem {...props} />
  </ThemeProvider>
);
```

---

## 📚 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Expo Testing](https://docs.expo.dev/develop/unit-testing/)

---

## 🎓 ベストプラクティス

### 1. テストは簡潔に

```typescript
// ❌ 悪い例：複雑すぎる
it('複数の機能をテスト', () => {
  // 10行以上のテストコード...
});

// ✅ 良い例：1つの機能を1つのテスト
it('タイトルが表示される', () => {
  const { getByText } = render(<TodoItem {...props} />);
  expect(getByText('テスト')).toBeTruthy();
});
```

### 2. テスト名は明確に

```typescript
// ❌ 悪い例
it('works', () => { ... });

// ✅ 良い例
it('タイトルが空の場合はエラーを投げる', () => { ... });
```

### 3. Arrange-Act-Assert

```typescript
it('チェックボックスをタップすると完了状態が切り替わる', () => {
  // Arrange: テストの準備
  const mockToggle = jest.fn();
  const { getByTestId } = render(<TodoItem {...props} onToggle={mockToggle} />);

  // Act: アクションを実行
  fireEvent.press(getByTestId('checkbox'));

  // Assert: 期待する結果を検証
  expect(mockToggle).toHaveBeenCalled();
});
```

### 4. 実装の詳細をテストしない

```typescript
// ❌ 悪い例：内部状態をテスト
it('stateが正しく更新される', () => {
  const wrapper = render(<Component />);
  expect(wrapper.instance().state.count).toBe(0);
});

// ✅ 良い例：ユーザーが見る結果をテスト
it('カウンターが0と表示される', () => {
  const { getByText } = render(<Component />);
  expect(getByText('0')).toBeTruthy();
});
```

---

## 🔄 継続的改善

テストは一度書いて終わりではありません。以下を定期的に実施してください：

1. **新機能のテストを追加**
2. **カバレッジを確認して不足箇所を補完**
3. **古いテストのリファクタリング**
4. **失敗するテストの修正**

テストを書くことで、コードの品質が向上し、リファクタリングやバグ修正が安全に行えるようになります！
