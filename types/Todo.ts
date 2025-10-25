import type { TodoCategory } from "@/types/Category";

type Todo = {
	id: string;
	userId: string;
	title: string;
	content: string;
	completed: boolean;
	shared: boolean; // 共有フラグ（非推奨、移行期間のみ保持）
	organizationId?: string; // 組織ID（nullなら個人用）
	category: TodoCategory; // カテゴリ
	createdAt?: Date; // 作成日時
	completedAt?: Date; // 完了日時
	completedBy?: string; // 完了者のuserId
	remindAt?: Date; // リマインド日時
	remindNotified?: boolean; // リマインド通知済みフラグ
};

export type { Todo };
