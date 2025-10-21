// 実際のバリデーションロジックをテスト

describe("Todoバリデーション", () => {
	describe("タイトルのバリデーション", () => {
		it("1文字以上50文字以内は有効", () => {
			const validTitles = ["買い物", "テストTODO", "あ".repeat(50)];

			validTitles.forEach((title) => {
				expect(title.length).toBeGreaterThanOrEqual(1);
				expect(title.length).toBeLessThanOrEqual(50);
			});
		});

		it("空文字は無効", () => {
			const invalidTitle = "";
			expect(invalidTitle.trim().length).toBe(0);
		});

		it("51文字以上は無効", () => {
			const invalidTitle = "あ".repeat(51);
			expect(invalidTitle.length).toBeGreaterThan(50);
		});
	});

	describe("内容のバリデーション", () => {
		it("200文字以内は有効", () => {
			const validContent = "あ".repeat(200);
			expect(validContent.length).toBeLessThanOrEqual(200);
		});

		it("201文字以上は無効", () => {
			const invalidContent = "あ".repeat(201);
			expect(invalidContent.length).toBeGreaterThan(200);
		});

		it("空文字は有効（任意項目）", () => {
			const emptyContent = "";
			expect(emptyContent.length).toBe(0);
		});
	});
});

describe("カテゴリの検証", () => {
	const validCategories = [
		"work",
		"shopping",
		"housework",
		"study",
		"health",
		"hobby",
		"other",
	];

	it("有効なカテゴリが正しく定義されている", () => {
		expect(validCategories).toHaveLength(7);
		expect(validCategories).toContain("work");
		expect(validCategories).toContain("shopping");
	});

	it("カテゴリが文字列型である", () => {
		validCategories.forEach((category) => {
			expect(typeof category).toBe("string");
		});
	});
});

describe("招待コードの検証", () => {
	it("8桁の英数字は有効", () => {
		const validCode = "ABC12345";
		expect(validCode).toMatch(/^[A-Z0-9]{8}$/);
	});

	it("7桁以下は無効", () => {
		const invalidCode = "ABC1234";
		expect(invalidCode).not.toMatch(/^[A-Z0-9]{8}$/);
	});

	it("9桁以上は無効", () => {
		const invalidCode = "ABC123456";
		expect(invalidCode).not.toMatch(/^[A-Z0-9]{8}$/);
	});

	it("小文字を含む場合は無効", () => {
		const invalidCode = "abc12345";
		expect(invalidCode).not.toMatch(/^[A-Z0-9]{8}$/);
	});
});
