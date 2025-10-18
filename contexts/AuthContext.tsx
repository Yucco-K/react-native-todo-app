import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		console.log("🔐 AuthContext: 認証状態の監視を開始");
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			console.log("🔐 AuthContext: 認証状態変更", {
				isLoggedIn: !!user,
				email: user?.email,
			});
			setUser(user);
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const signUp = async (email: string, password: string) => {
		await createUserWithEmailAndPassword(auth, email, password);
	};

	const signIn = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password);
	};

	const logout = async () => {
		await signOut(auth);
	};

	return (
		<AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
