type Todo = {
	id: string;
	userId: string;
	title: string;
	content: string;
	completed: boolean;
	shared: boolean; // 共有フラグ
};

export type { Todo };
