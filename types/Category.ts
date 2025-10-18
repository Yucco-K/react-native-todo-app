export type TodoCategory =
	| "work"
	| "shopping"
	| "personal"
	| "study"
	| "housework"
	| "other";

export const TODO_CATEGORIES = {
	work: "仕事",
	shopping: "買い物",
	personal: "プライベート",
	study: "勉強",
	housework: "家事",
	other: "その他",
} as const;

export const CATEGORY_OPTIONS: {
	value: TodoCategory;
	label: string;
	icon: string;
}[] = [
	{ value: "work", label: "仕事", icon: "💼" },
	{ value: "shopping", label: "買い物", icon: "🛒" },
	{ value: "personal", label: "プライベート", icon: "🎯" },
	{ value: "study", label: "勉強", icon: "📚" },
	{ value: "housework", label: "家事", icon: "🏠" },
	{ value: "other", label: "その他", icon: "📝" },
];
