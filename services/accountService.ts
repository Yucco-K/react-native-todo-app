import {
	deleteUser,
	EmailAuthProvider,
	reauthenticateWithCredential,
} from "firebase/auth";
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	where,
	writeBatch,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * アカウント削除前の再認証
 */
export async function reauthenticateUser(password: string): Promise<void> {
	const user = auth.currentUser;
	if (!user || !user.email) {
		throw new Error("ユーザーがログインしていません");
	}

	const credential = EmailAuthProvider.credential(user.email, password);
	await reauthenticateWithCredential(user, credential);
}

/**
 * ユーザーのすべてのデータを削除
 */
async function deleteUserData(userId: string): Promise<void> {
	const batch = writeBatch(db);

	// 1. ユーザードキュメントを削除
	const userRef = doc(db, "users", userId);
	batch.delete(userRef);

	// 2. ユーザーのTODOを削除
	const todosQuery = query(collection(db, "todos"), where("userId", "==", userId));
	const todosSnapshot = await getDocs(todosQuery);
	todosSnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	// 3. ユーザーの通知履歴を削除
	const notificationsQuery = query(
		collection(db, "notificationHistory"),
		where("userId", "==", userId)
	);
	const notificationsSnapshot = await getDocs(notificationsQuery);
	notificationsSnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	// 4. ユーザーの褒め言葉フィードバックを削除
	const feedbackQuery = query(
		collection(db, "praiseFeedback"),
		where("userId", "==", userId)
	);
	const feedbackSnapshot = await getDocs(feedbackQuery);
	feedbackSnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	// 5. ユーザーの統計情報を削除
	const statsRef = doc(db, "userStats", userId);
	batch.delete(statsRef);

	// バッチ実行
	await batch.commit();

	// 6. ユーザーが所有する組織を削除（バッチ外で実行）
	const orgsQuery = query(
		collection(db, "organizations"),
		where("ownerId", "==", userId)
	);
	const orgsSnapshot = await getDocs(orgsQuery);

	for (const orgDoc of orgsSnapshot.docs) {
		// 組織に関連する招待を削除
		const invitationsQuery = query(
			collection(db, "invitations"),
			where("organizationId", "==", orgDoc.id)
		);
		const invitationsSnapshot = await getDocs(invitationsQuery);

		for (const invDoc of invitationsSnapshot.docs) {
			await deleteDoc(invDoc.ref);
		}

		// 組織を削除
		await deleteDoc(orgDoc.ref);
	}

	// 7. ユーザーがメンバーとして参加している組織から削除
	const memberOrgsQuery = query(
		collection(db, "organizations"),
		where("memberIds", "array-contains", userId)
	);
	const memberOrgsSnapshot = await getDocs(memberOrgsQuery);

	for (const orgDoc of memberOrgsSnapshot.docs) {
		const orgData = orgDoc.data();
		
		// オーナーでない場合のみメンバーリストから削除
		if (orgData.ownerId !== userId) {
			const updatedMembers = (orgData.memberIds as string[]).filter(
				(memberId: string) => memberId !== userId
			);
			await setDoc(
				doc(db, "organizations", orgDoc.id),
				{ memberIds: updatedMembers },
				{ merge: true }
			);
		}
	}

	// 8. ユーザー宛ての招待を削除
	const userInvitationsQuery = query(
		collection(db, "invitations"),
		where("invitedEmail", "==", auth.currentUser?.email || "")
	);
	const userInvitationsSnapshot = await getDocs(userInvitationsQuery);

	for (const invDoc of userInvitationsSnapshot.docs) {
		await deleteDoc(invDoc.ref);
	}
}

/**
 * アカウントを完全に削除
 * 1. Firestoreのすべてのユーザーデータを削除
 * 2. Firebase Authenticationのユーザーを削除
 */
export async function deleteAccount(password: string): Promise<void> {
	const user = auth.currentUser;
	if (!user) {
		throw new Error("ユーザーがログインしていません");
	}

	try {
		// 1. パスワードで再認証（セキュリティ要件）
		await reauthenticateUser(password);

		const userId = user.uid;

		// 2. Firestoreのすべてのユーザーデータを削除
		await deleteUserData(userId);

		// 3. Firebase Authenticationのユーザーを削除
		await deleteUser(user);

		console.log("✅ アカウントを完全に削除しました");
	} catch (error) {
		console.error("❌ アカウント削除エラー:", error);
		throw error;
	}
}

