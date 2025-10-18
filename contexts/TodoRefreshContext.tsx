import { createContext, useContext, useState } from "react";

type TodoRefreshContextType = {
	refreshTrigger: number;
	triggerRefresh: () => void;
};

const TodoRefreshContext = createContext<TodoRefreshContextType | undefined>(
	undefined
);

export function TodoRefreshProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const triggerRefresh = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<TodoRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
			{children}
		</TodoRefreshContext.Provider>
	);
}

export function useTodoRefresh() {
	const context = useContext(TodoRefreshContext);
	if (context === undefined) {
		throw new Error("useTodoRefresh must be used within TodoRefreshProvider");
	}
	return context;
}

