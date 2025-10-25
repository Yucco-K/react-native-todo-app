import type { Todo } from "../../types/Todo";

describe("Todo型の検証", () => {
	it("有効なTodoオブジェクトの構造", () => {
		const validTodo: Todo = {
			id: "test-id-123",
			userId: "user-123",
			title: "テストTODO",
			content: "テスト内容",
			completed: false,
			shared: false,
			organizationId: undefined,
			category: "work",
		};

		expect(validTodo.id).toBeDefined();
		expect(validTodo.userId).toBeDefined();
		expect(validTodo.title).toBeDefined();
		expect(typeof validTodo.completed).toBe("boolean");
		expect(typeof validTodo.shared).toBe("boolean");
	});

	it("必須フィールドの存在確認", () => {
		const todo: Todo = {
			id: "1",
			userId: "user1",
			title: "タイトル",
			content: "",
			completed: false,
			shared: false,
			organizationId: undefined,
			category: "other",
		};

		// 必須フィールドが存在することを確認
		expect(todo).toHaveProperty("id");
		expect(todo).toHaveProperty("userId");
		expect(todo).toHaveProperty("title");
		expect(todo).toHaveProperty("completed");
		expect(todo).toHaveProperty("shared");
	});

	it("オプショナルフィールドのテスト", () => {
		const todo: Todo = {
			id: "1",
			userId: "user1",
			title: "タイトル",
			content: "あり",
			completed: false,
			shared: false,
			organizationId: "org-123",
			category: "shopping",
		};

		expect(todo.content).toBeDefined();
		expect(todo.organizationId).toBeDefined();
		expect(todo.category).toBeDefined();
	});
});
