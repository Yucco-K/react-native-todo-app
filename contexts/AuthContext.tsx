import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithCredential,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { registerForPushNotificationsAsync, savePushToken } from "../services/notificationService";
import { getUserNickname, saveUserNickname } from "../services/userService";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	nickname: string | null;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
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
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const userId = userCredential.user.uid;

		// Firestoreのusersコレクションにユーザー情報を保存
		await setDoc(doc(db, "users", userId), {
			email: email,
			createdAt: new Date(),
		});

		console.log("✅ ユーザー情報をFirestoreに保存:", { userId, email });
	};

	const signIn = async (email: string, password: string) => {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const userId = userCredential.user.uid;
		const userEmail = userCredential.user.email;

		// 既存ユーザーの場合、usersコレクションにドキュメントがなければ作成、あれば更新
		if (userEmail) {
			const userDocRef = doc(db, "users", userId);
			const userDocSnap = await getDoc(userDocRef);

			if (!userDocSnap.exists()) {
				await setDoc(userDocRef, {
					email: userEmail,
					createdAt: new Date(),
				});
				console.log("✅ ユーザー情報を新規作成:", {
					userId,
					email: userEmail,
				});
			} else {
				// 既存ドキュメントのemailフィールドがundefinedの場合は更新
				const existingEmail = userDocSnap.data()?.email;
				if (!existingEmail) {
					await setDoc(
						userDocRef,
						{
							email: userEmail,
						},
						{ merge: true },
					);
					console.log("✅ ユーザー情報を更新（email追加）:", {
						userId,
						email: userEmail,
					});
				}
			}
		}
	};

	const signInWithGoogle = async () => {
		try {
			// Web版のGoogle認証（Expo WebBrowserを使用）
			const { makeRedirectUri } = await import("expo-auth-session");
			const redirectUri = makeRedirectUri({
				scheme: "react-native-todo-app",
			});

			console.log("🔐 Google認証を開始:", redirectUri);

			// Google OAuth 2.0の認証URLを構築
			const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
			const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
				client_id: clientId,
				redirect_uri: redirectUri,
				response_type: "id_token",
				scope: "openid email profile",
				nonce: Math.random().toString(36).substring(7),
			})}`;

			// WebBrowserでGoogle認証画面を開く
			const { WebBrowser } = await import("expo-web-browser");
			const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

			if (result.type === "success" && result.url) {
				// URLからid_tokenを抽出
				const url = new URL(result.url);
				const idToken = url.searchParams.get("id_token") || url.hash.match(/id_token=([^&]+)/)?.[1];

				if (!idToken) {
					throw new Error("Google認証に失敗しました");
				}

				// Firebase認証
				const credential = GoogleAuthProvider.credential(idToken);
				const userCredential = await signInWithCredential(auth, credential);
				const userId = userCredential.user.uid;
				const userEmail = userCredential.user.email;

				// Firestoreにユーザー情報を保存
				if (userEmail) {
					const userDocRef = doc(db, "users", userId);
					const userDocSnap = await getDoc(userDocRef);

					if (!userDocSnap.exists()) {
						await setDoc(userDocRef, {
							email: userEmail,
							createdAt: new Date(),
						});
						console.log("✅ Google認証: ユーザー情報を新規作成:", {
							userId,
							email: userEmail,
						});
					}
				}
			} else {
				throw new Error("Google認証がキャンセルされました");
			}
		} catch (error) {
			console.error("❌ Google認証エラー:", error);
			throw error;
		}
	};

	const logout = async () => {
		// ログアウト時にpushTokenをクリアしない
		// 理由: savePushToken()で重複トークンは自動的に削除されるため、
		// ログアウト時にクリアする必要はない。
		// また、同じデバイスで複数ユーザーをテストする場合、
		// ログアウトするとそのユーザーのトークンが失われてしまう。
		console.log("🚪 ログアウト（プッシュトークンは保持）");
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
				signInWithGoogle,
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
