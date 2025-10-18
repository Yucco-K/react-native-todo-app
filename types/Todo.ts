import type { TodoCategory } from "./Category";

type Todo = {
	id: string;
	userId: string;
	title: string;
	content: string;
	completed: boolean;
	shared: boolean; // 共有フラグ
	category: TodoCategory; // カテゴリ
	createdAt?: Date; // 作成日時
	completedAt?: Date; // 完了日時
	completedBy?: string; // 完了者のuserId
};

export type { Todo };
