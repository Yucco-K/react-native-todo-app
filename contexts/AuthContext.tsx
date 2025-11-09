import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	OAuthProvider,
	onAuthStateChanged,
	sendEmailVerification,
	signInWithCredential,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
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
		console.log("✅ Google Sign-In configured");
	}, []);

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
				// メール認証状態をFirestoreに同期
				try {
					const userDocRef = doc(db, "users", user.uid);
					const userDocSnap = await getDoc(userDocRef);

					if (userDocSnap.exists()) {
						const userData = userDocSnap.data();
						// Firebase AuthのemailVerifiedがtrueで、FirestoreのemailVerifiedがfalseの場合
						if (user.emailVerified && userData?.emailVerified === false) {
							// Firestoreを更新
							await setDoc(userDocRef, { emailVerified: true }, { merge: true });
							console.log("✅ メール認証完了をFirestoreに反映しました");
						}
					}
				} catch (error) {
					console.error("❌ メール認証状態の同期に失敗:", error);
				}

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
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const userId = userCredential.user.uid;

			console.log("✅ ユーザー作成成功:", { userId, email });

			// Firestoreのusersコレクションにユーザー情報を保存
			await setDoc(doc(db, "users", userId), {
				email: email,
				createdAt: new Date(),
				emailVerified: false,
			});
			console.log("✅ ユーザー情報をFirestoreに保存しました");

			// メール認証を送信
			await sendEmailVerification(userCredential.user);
			console.log("✅ 認証メールを送信しました:", email);

			// メール認証が完了するまでログアウト
			await signOut(auth);
			console.log("✅ メール認証待ちのためログアウトしました");
		} catch (error) {
			console.error("❌ サインアップエラー:", error);
			throw error;
		}
	};

	const signIn = async (email: string, password: string) => {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);

		const userId = userCredential.user.uid;
		const userEmail = userCredential.user.email;

		// メール認証チェック（新規登録直後のユーザーのみ）
		const isEmailPasswordUser = userCredential.user.providerData.some(
			(provider) => provider.providerId === "password",
		);

		if (isEmailPasswordUser && !userCredential.user.emailVerified) {
			// Firestoreでメール未認証フラグをチェック
			const userDocRef = doc(db, "users", userId);
			const userDocSnap = await getDoc(userDocRef);

			if (userDocSnap.exists()) {
				const userData = userDocSnap.data();
				// emailVerified が明示的に false の場合のみ（新規登録直後）
				if (userData?.emailVerified === false) {
					// 新規登録直後のユーザーはログインを拒否
					await signOut(auth);
					throw new Error("EMAIL_NOT_VERIFIED");
				}
				// emailVerified フィールドがない、またはtrueの場合はログインを許可
			}
		}

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

	const logout = async () => {
		console.log("🚪 ログアウト（プッシュトークンは保持）");
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
					console.log("✅ Google認証: ユーザー情報を新規作成:", {
						userId,
						email: userEmail,
					});
				}
			}

			console.log("✅ Google Sign-In successful");
		} catch (error) {
			console.error("❌ Google Sign-In error:", error);
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

			console.log("🍎 Apple Sign-In開始...");
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});
			console.log("🍎 Apple認証情報を取得しました");

			// IDトークンを取得
			const { identityToken } = credential;
			if (!identityToken) {
				throw new Error("Apple Sign-In failed: No identity token");
			}
			console.log("🍎 IDトークンを取得しました");

			// Firebaseの認証情報を作成
			const provider = new OAuthProvider("apple.com");
			const appleCredential = provider.credential({
				idToken: identityToken,
			});
			console.log("🍎 Firebase認証情報を作成しました");

			// Firebaseにサインイン
			console.log("🍎 Firebaseにサインイン中...");
			const userCredential = await signInWithCredential(auth, appleCredential);
			const userId = userCredential.user.uid;
			const userEmail = userCredential.user.email;
			console.log("🍎 Firebaseサインイン成功:", { userId, userEmail });

			// Firestoreにユーザー情報を保存
			if (userEmail) {
				const userDocRef = doc(db, "users", userId);
				const userDocSnap = await getDoc(userDocRef);

				if (!userDocSnap.exists()) {
					await setDoc(userDocRef, {
						email: userEmail,
						createdAt: new Date(),
					});
					console.log("✅ Apple認証: ユーザー情報を新規作成:", {
						userId,
						email: userEmail,
					});
				}
			}

			console.log("✅ Apple Sign-In successful");
		} catch (error) {
			if (error && typeof error === "object" && "code" in error) {
				if (error.code === "ERR_REQUEST_CANCELED") {
					// ユーザーがキャンセルした場合
					console.log("Apple Sign-In canceled by user");
					throw new Error("USER_CANCELED");
				}
			}
			console.error("❌ Apple Sign-In error:", error);
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
