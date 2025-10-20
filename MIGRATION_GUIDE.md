# 組織機能移行ガイド

## 概要

このガイドは、既存の`shared: true`のTodoを組織システムに移行するための手順です。

## 移行方針

### オプション1: 既存の共有Todoを削除（推奨）

最もシンプルな方法は、既存の共有Todoを削除し、ユーザーに組織機能で新しくTodoを作成してもらうことです。

**手順:**

1. Firebase Consoleにアクセス
2. Firestore Databaseを開く
3. `todos`コレクションで`shared == true`のドキュメントを検索
4. 該当するドキュメントを削除

**FirestoreクエリでのSQL的な削除:**

Firebase Consoleでは直接一括削除はできないため、以下のいずれかの方法を選択してください:

- **手動削除**: 件数が少ない場合は手動で削除
- **スクリプト削除**: 以下の削除スクリプトを使用（開発環境で実行）

### オプション2: デフォルト組織に移行（高度）

既存の共有Todoを保持したい場合は、各ユーザーごとにデフォルト組織を作成し、そこに移行できます。

**注意**: この方法は複雑で、ユーザー間の関係性を考慮する必要があります。

## 削除スクリプト（オプション1）

開発環境で以下のスクリプトを実行して、既存の共有Todoを削除できます。

### 実装方法

`services/migrationService.ts`を作成（または既存のファイルを使用）:

```typescript
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * 既存の共有Todoを削除
 */
export async function deleteSharedTodos(): Promise<number> {
	try {
		const q = query(collection(db, "todos"), where("shared", "==", true));

		const querySnapshot = await getDocs(q);
		let deletedCount = 0;

		for (const docSnapshot of querySnapshot.docs) {
			await deleteDoc(doc(db, "todos", docSnapshot.id));
			deletedCount++;
		}

		console.log(`🗑️ ${deletedCount}件の共有Todoを削除しました`);
		return deletedCount;
	} catch (error) {
		console.error("共有Todo削除エラー:", error);
		throw error;
	}
}
```

### 実行方法

1. アプリに一時的に削除ボタンを追加（管理者用）
2. ボタンを押すと`deleteSharedTodos()`を実行
3. 完了後、ボタンとスクリプトを削除

**または**、開発者ツールのコンソールから直接実行:

```typescript
import { deleteSharedTodos } from "./services/migrationService";

// 実行
deleteSharedTodos().then(() => {
	console.log("移行完了");
});
```

## 移行後の確認事項

1. ✅ Firestore Rulesが更新されているか確認
2. ✅ 必要なインデックスが作成されているか確認
3. ✅ 既存の`shared: true`のTodoが削除されているか確認
4. ✅ 組織の作成・参加が正常に動作するか確認
5. ✅ 組織内でのTodo作成・編集・削除が正常に動作するか確認
6. ✅ プッシュ通知が正常に送信されるか確認

## ユーザーへの通知

移行を実施する前に、ユーザーに以下を通知することを推奨します:

> 【重要なお知らせ】
>
> Todo共有機能が「組織」機能にアップグレードされました。
>
> **変更点:**
>
> - 複数の組織（家族、仕事チームなど）を作成できます
> - 組織ごとにTodoを管理できます
> - 既存の共有Todoは削除されますので、必要に応じて再度作成してください
>
> **新機能の使い方:**
>
> 1. ドロワーメニュー（左上のメニューボタン）を開く
> 2. 「組織を作成」をタップ
> 3. 招待コードを共有して、メンバーを招待
>
> ご不便をおかけしますが、より便利な機能をお楽しみください。

## トラブルシューティング

### エラー: "Missing or insufficient permissions"

- Firestore Rulesが正しく更新されていない可能性があります
- `FIRESTORE_RULES.md`の内容をFirebase Consoleで設定してください

### エラー: "The query requires an index"

- 必要なインデックスが作成されていません
- エラーメッセージ内のリンクをクリックして、自動的にインデックスを作成してください
- または、`FIRESTORE_RULES.md`に記載されたインデックスを手動で作成してください

### 組織のTodoが表示されない

- `organizationId`が正しく保存されているか確認してください
- Firebase Consoleで該当するTodoドキュメントを確認してください
- ユーザーが組織のメンバーに含まれているか確認してください
