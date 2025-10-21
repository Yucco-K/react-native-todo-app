import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
	getAuth,
	// @ts-expect-error - getReactNativePersistence is available but type definitions may be incomplete
	getReactNativePersistence,
	initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Firebaseの設定
// Firebase Console (https://console.firebase.google.com/) で取得した設定を入力してください
const firebaseConfig = {
	apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
	authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
	projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
	storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
	messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
	appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Authenticationのインスタンスを取得（AsyncStorageで永続化）
// HMR（Hot Module Replacement）対策: 既に初期化されている場合は getAuth を使用
const auth = (() => {
	try {
		return initializeAuth(app, {
			persistence: getReactNativePersistence(AsyncStorage),
		});
	} catch {
		// 既に初期化されている場合
		return getAuth(app);
	}
})();

export { auth };

// Firestoreのインスタンスを取得
export const db = getFirestore(app);

// Cloud Functionsのインスタンスを取得（東京リージョン）
export const functions = getFunctions(app, "asia-northeast1");
