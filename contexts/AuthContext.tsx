import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	OAuthProvider,
	onAuthStateChanged,
	signInWithCredential,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";
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
	signInWithGoogle: () => Promise<void>;
	signInWithApple: () => Promise<void>;
	logout: () => Promise<void>;
	updateNickname: (nickname: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [nickname, setNickname] = useState<string | null>(null);

	useEffect(() => {
		// Google Sign-Inの設定
		GoogleSignin.configure({
			webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
			iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
		});
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
					}
				} catch (error) {
				}

				// ニックネームを取得
				try {
					const userNickname = await getUserNickname();
					setNickname(userNickname);
				} catch (error) {
				}
			} else {
				setNickname(null);
			}
		});

		return unsubscribe;
	}, []);

	const signUp = async (email: string, password: string) => {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		const userId = userCredential.user.uid;

		// Firestoreのusersコレクションにユーザー情報を保存
		await setDoc(doc(db, "users", userId), {
			email: email,
			createdAt: new Date(),
		});

	};

	const signIn = async (email: string, password: string) => {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		);
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
						{ merge: true }
					);
						userId,
						email: userEmail,
					});
				}
			}
		}
	};

	const logout = async () => {
		await signOut(auth);
	};

	const signInWithGoogle = async () => {
		try {
			// Google Sign-Inを実行
			await GoogleSignin.hasPlayServices();
			const userInfo = await GoogleSignin.signIn();

			// IDトークンを取得
			const idToken = userInfo.data?.idToken;
			if (!idToken) {
				throw new Error("Google Sign-In failed: No ID token");
			}

			// Firebaseの認証情報を作成
			const googleCredential = GoogleAuthProvider.credential(idToken);

			// Firebaseにサインイン
			const userCredential = await signInWithCredential(auth, googleCredential);
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
						userId,
						email: userEmail,
					});
				}
			}

		} catch (error) {
			throw error;
		}
	};

	const signInWithApple = async () => {
		try {
			// Apple Sign-Inが利用可能かチェック
			if (Platform.OS !== "ios") {
				throw new Error("Apple Sign-In is only available on iOS");
			}

			// Apple Sign-Inが利用可能か確認
			const isAvailable = await AppleAuthentication.isAvailableAsync();
			if (!isAvailable) {
				throw new Error("Apple Sign-In is not available on this device");
			}

			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});

			// IDトークンを取得
			const { identityToken } = credential;
			if (!identityToken) {
				throw new Error("Apple Sign-In failed: No identity token");
			}

			// Firebaseの認証情報を作成
			const provider = new OAuthProvider("apple.com");
			const appleCredential = provider.credential({
				idToken: identityToken,
			});

			// Firebaseにサインイン
			const userCredential = await signInWithCredential(auth, appleCredential);
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
						userId,
						email: userEmail,
					});
				}
			}

		} catch (error) {
			if (error && typeof error === "object" && "code" in error) {
				if (error.code === "ERR_REQUEST_CANCELED") {
					// ユーザーがキャンセルした場合は静かに処理
					return;
				}
			}
			throw error;
		}
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
				signInWithApple,
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
