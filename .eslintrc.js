module.exports = {
	root: true,
	extends: ["eslint:recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
		project: "./tsconfig.json",
	},
	env: {
		node: true,
		jest: true,
		browser: true,
		es2020: true,
	},
	rules: {
		// 既存のコードに影響しないよう、警告レベルに設定
		"@typescript-eslint/no-unused-vars": "warn",
		"no-console": "off", // console.logは許可
		"no-undef": "off", // TypeScriptで型チェック済み
	},
};
