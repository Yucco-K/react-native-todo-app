import {
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { Invitation } from "../types/Invitation";
import type { Organization } from "../types/Organization";

const ORGANIZATIONS_COLLECTION = "organizations";
const INVITATIONS_COLLECTION = "invitations";

/**
 * 8桁のランダムな招待コードを生成
 */
function generateInviteCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
	let code = "";
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

/**
 * 組織を作成
 */
export async function createOrganization(name: string): Promise<Organization> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	const inviteCode = generateInviteCode();
	const newOrg = {
		name,
		ownerId: userId,
		inviteCode,
		members: [userId],
		createdAt: new Date(),
	};

	const docRef = await addDoc(collection(db, ORGANIZATIONS_COLLECTION), newOrg);

	return {
		id: docRef.id,
		...newOrg,
	};
}

/**
 * 自分が所属する組織一覧を取得
 */
export async function getMyOrganizations(): Promise<Organization[]> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		return [];
	}

	const q = query(
		collection(db, ORGANIZATIONS_COLLECTION),
		where("members", "array-contains", userId),
	);

	const querySnapshot = await getDocs(q);
	const organizations: Organization[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		organizations.push({
			id: doc.id,
			name: data.name,
			ownerId: data.ownerId,
			inviteCode: data.inviteCode,
			members: data.members,
			createdAt: data.createdAt?.toDate() || new Date(),
		});
	});

	return organizations;
}

/**
 * 組織のメンバー情報を取得
 */
export async function getOrganizationMembers(
	orgId: string,
): Promise<Array<{ userId: string; email: string; nickname?: string }>> {
	const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));
	if (!orgDoc.exists()) {
		throw new Error("組織が見つかりません");
	}

	const members = orgDoc.data().members as string[];
	const memberInfos: Array<{
		userId: string;
		email: string;
		nickname?: string;
	}> = [];

	// 各メンバーの情報を取得
	for (const userId of members) {
		const userDoc = await getDoc(doc(db, "users", userId));
		if (userDoc.exists()) {
			const userData = userDoc.data();
			memberInfos.push({
				userId,
				email: userData.email || "",
				nickname: userData.nickname,
			});
		}
	}

	return memberInfos;
}

/**
 * 招待コードで組織に参加
 */
export async function joinByInviteCode(code: string): Promise<Organization> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	// 招待コードで組織を検索
	const q = query(
		collection(db, ORGANIZATIONS_COLLECTION),
		where("inviteCode", "==", code.toUpperCase()),
	);

	const querySnapshot = await getDocs(q);
	if (querySnapshot.empty) {
		throw new Error("招待コードが無効です");
	}

	const orgDoc = querySnapshot.docs[0];
	const orgData = orgDoc.data();

	// 既にメンバーかチェック
	if (orgData.members.includes(userId)) {
		throw new Error("既にこの組織のメンバーです");
	}

	// メンバーに追加
	await updateDoc(doc(db, ORGANIZATIONS_COLLECTION, orgDoc.id), {
		members: arrayUnion(userId),
	});

	return {
		id: orgDoc.id,
		name: orgData.name,
		ownerId: orgData.ownerId,
		inviteCode: orgData.inviteCode,
		members: [...orgData.members, userId],
		createdAt: orgData.createdAt?.toDate() || new Date(),
	};
}

/**
 * メールアドレスでユーザーを招待
 */
export async function inviteByEmail(orgId: string, email: string): Promise<string> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	// 組織情報を取得
	const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));
	if (!orgDoc.exists()) {
		throw new Error("組織が見つかりません");
	}

	const orgData = orgDoc.data();

	// 招待者が組織のオーナーかチェック
	if (orgData.ownerId !== userId) {
		throw new Error("招待する権限がありません");
	}

	// デバッグ: users コレクション全体を確認
	const allUsersSnapshot = await getDocs(collection(db, "users"));
	console.log("👥 全ユーザー一覧:", {
		件数: allUsersSnapshot.size,
		ユーザー: allUsersSnapshot.docs.map((doc) => ({
			id: doc.id,
			email: doc.data().email,
		})),
	});

	// 招待されるユーザーを検索
	console.log("🔍 ユーザーを検索中:", { email });
	const usersQuery = query(collection(db, "users"), where("email", "==", email));
	const usersSnapshot = await getDocs(usersQuery);

	console.log("📊 検索結果:", {
		件数: usersSnapshot.size,
		見つかったユーザー: usersSnapshot.docs.map((doc) => ({
			id: doc.id,
			data: doc.data(),
		})),
	});

	if (usersSnapshot.empty) {
		throw new Error("指定されたメールアドレスのユーザーが見つかりません");
	}

	const invitedUserId = usersSnapshot.docs[0].id;
	console.log("✅ 招待対象ユーザー:", { invitedUserId, email });

	// 既にメンバーかチェック
	if (orgData.members.includes(invitedUserId)) {
		throw new Error("このユーザーは既にメンバーです");
	}

	// 既存の招待をチェック
	const invitationsQuery = query(
		collection(db, INVITATIONS_COLLECTION),
		where("organizationId", "==", orgId),
		where("invitedEmail", "==", email),
		where("status", "==", "pending"),
	);
	const invitationsSnapshot = await getDocs(invitationsQuery);

	if (!invitationsSnapshot.empty) {
		throw new Error("既に招待が送信されています");
	}

	// 招待を作成
	await addDoc(collection(db, INVITATIONS_COLLECTION), {
		organizationId: orgId,
		organizationName: orgData.name,
		invitedBy: userId,
		invitedEmail: email,
		status: "pending",
		createdAt: new Date(),
	});

	// 招待されたユーザーIDを返す
	return invitedUserId;
}

/**
 * 自分への招待一覧を取得
 */
export async function getMyInvitations(): Promise<Invitation[]> {
	const userEmail = auth.currentUser?.email;
	if (!userEmail) {
		return [];
	}

	const q = query(
		collection(db, INVITATIONS_COLLECTION),
		where("invitedEmail", "==", userEmail),
		where("status", "==", "pending"),
	);

	const querySnapshot = await getDocs(q);
	const invitations: Invitation[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		invitations.push({
			id: doc.id,
			organizationId: data.organizationId,
			organizationName: data.organizationName,
			invitedBy: data.invitedBy,
			invitedEmail: data.invitedEmail,
			status: data.status,
			createdAt: data.createdAt?.toDate() || new Date(),
		});
	});

	return invitations;
}

/**
 * 招待を承認
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	const invitationDoc = await getDoc(doc(db, INVITATIONS_COLLECTION, invitationId));
	if (!invitationDoc.exists()) {
		throw new Error("招待が見つかりません");
	}

	const invitationData = invitationDoc.data();

	// 組織にメンバーを追加
	await updateDoc(doc(db, ORGANIZATIONS_COLLECTION, invitationData.organizationId), {
		members: arrayUnion(userId),
	});

	// 招待のステータスを更新
	await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
		status: "accepted",
	});
}

/**
 * 招待を拒否
 */
export async function declineInvitation(invitationId: string): Promise<void> {
	await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
		status: "declined",
	});
}

/**
 * メンバーを削除（オーナーのみ）
 */
export async function removeMember(orgId: string, memberUserId: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));
	if (!orgDoc.exists()) {
		throw new Error("組織が見つかりません");
	}

	const orgData = orgDoc.data();

	// オーナーかチェック
	if (orgData.ownerId !== userId) {
		throw new Error("メンバーを削除する権限がありません");
	}

	// オーナー自身は削除できない
	if (memberUserId === userId) {
		throw new Error("オーナーは削除できません");
	}

	// メンバーから削除
	await updateDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId), {
		members: arrayRemove(memberUserId),
	});
}

/**
 * 組織から退出（メンバーのみ、オーナーは不可）
 */
export async function leaveOrganization(orgId: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));
	if (!orgDoc.exists()) {
		throw new Error("組織が見つかりません");
	}

	const orgData = orgDoc.data();

	// オーナーは退出できない
	if (orgData.ownerId === userId) {
		throw new Error("オーナーは組織から退出できません。組織を削除してください。");
	}

	// メンバーから削除
	await updateDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId), {
		members: arrayRemove(userId),
	});
}

/**
 * 組織を削除（オーナーのみ）
 */
export async function deleteOrganization(orgId: string): Promise<void> {
	const userId = auth.currentUser?.uid;
	if (!userId) {
		throw new Error("ユーザーがログインしていません");
	}

	const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));
	if (!orgDoc.exists()) {
		throw new Error("組織が見つかりません");
	}

	const orgData = orgDoc.data();

	// オーナーかチェック
	if (orgData.ownerId !== userId) {
		throw new Error("組織を削除する権限がありません");
	}

	// 組織を削除
	await deleteDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));

	// 関連する招待を削除
	const invitationsQuery = query(
		collection(db, INVITATIONS_COLLECTION),
		where("organizationId", "==", orgId),
	);
	const invitationsSnapshot = await getDocs(invitationsQuery);

	const deletePromises = invitationsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
	await Promise.all(deletePromises);
}
