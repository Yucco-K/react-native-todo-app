import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type Theme = "light" | "dark";

type ThemeContextType = {
	theme: Theme;
	isDark: boolean;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@app_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
	const systemColorScheme = useColorScheme();
	const [theme, setTheme] = useState<Theme>("light");

	// 初回読み込み時に保存されたテーマを取得
	useEffect(() => {
		const loadTheme = async () => {
			try {
				const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (savedTheme === "dark" || savedTheme === "light") {
					setTheme(savedTheme);
				} else {
					// 保存されたテーマがない場合はシステム設定を使用
					setTheme(systemColorScheme === "dark" ? "dark" : "light");
				}
			} catch (error) {
				console.error("テーマの読み込みに失敗:", error);
			}
		};
		loadTheme();
	}, [systemColorScheme]);

	const toggleTheme = async () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
		} catch (error) {
			console.error("テーマの保存に失敗:", error);
		}
	};

	const value: ThemeContextType = {
		theme,
		isDark: theme === "dark",
		toggleTheme,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
