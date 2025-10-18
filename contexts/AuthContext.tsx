import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import {
	registerForPushNotificationsAsync,
	savePushToken,
} from "../services/notificationService";
import { getUserNickname, saveUserNickname } from "../services/userService";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	nickname: string | null;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	updateNickname: (nickname: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [nickname, setNickname] = useState<string | null>(null);

	useEffect(() => {
		console.log("🔐 AuthContext: 認証状態の監視を開始");
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			console.log("🔐 AuthContext: 認証状態変更", {
				isLoggedIn: !!user,
				email: user?.email,
			});
			setUser(user);
			setLoading(false);

			// ユーザーがログインしたらプッシュ通知を登録
			if (user) {
				try {
					const token = await registerForPushNotificationsAsync();
					if (token) {
						await savePushToken(token);
						console.log("✅ プッシュ通知トークンを登録しました");
					}
				} catch (error) {
					console.error("❌ プッシュ通知の登録に失敗:", error);
				}

				// ニックネームを取得
				try {
					const userNickname = await getUserNickname();
					setNickname(userNickname);
					console.log("✅ ニックネームを取得しました:", userNickname);
				} catch (error) {
					console.error("❌ ニックネームの取得に失敗:", error);
				}
			} else {
				setNickname(null);
			}
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

	const updateNickname = async (newNickname: string) => {
		await saveUserNickname(newNickname);
		setNickname(newNickname);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				nickname,
				signUp,
				signIn,
				logout,
				updateNickname,
			}}
		>
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
