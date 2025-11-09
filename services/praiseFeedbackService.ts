import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { TodoCategory } from "../types/Category";

const COLLECTION_NAME = "praiseFeedback";

export type FeedbackType = "like" | "dislike";

/**
 * 褒め言葉フィードバックを保存
 */
export const savePraiseFeedback = async (
	message: string,
	category: TodoCategory,
	feedbackType: FeedbackType,
): Promise<void> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			throw new Error("ユーザーがログインしていません");
		}

		await addDoc(collection(db, COLLECTION_NAME), {
			userId,
			message,
			category,
			feedbackType,
			createdAt: new Date(),
		});

	} catch (error) {
		throw error;
	}
};

/**
 * メッセージごとのスコアを計算
 * スコア = like数 - dislike数
 */
export const getMessageScores = async (): Promise<Record<string, number>> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return {};
		}

		const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
		const querySnapshot = await getDocs(q);

		const messageScores: Record<string, number> = {};

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const feedbackType = data.feedbackType as FeedbackType;
			const message = data.message as string;

			if (!messageScores[message]) {
				messageScores[message] = 0;
			}

			// like: +1, dislike: -1
			messageScores[message] += feedbackType === "like" ? 1 : -1;
		});


		return messageScores;
	} catch (error) {
		return {};
	}
};

/**
 * ユーザーの褒め言葉フィードバック統計を取得
 */
export const getUserPraiseStats = async (): Promise<{
	totalLikes: number;
	totalDislikes: number;
	likedCategories: Record<TodoCategory, number>;
	dislikedCategories: Record<TodoCategory, number>;
	likedMessages: string[];
	dislikedMessages: string[];
}> => {
	try {
		const userId = auth.currentUser?.uid;
		if (!userId) {
			return {
				totalLikes: 0,
				totalDislikes: 0,
				likedCategories: {} as Record<TodoCategory, number>,
				dislikedCategories: {} as Record<TodoCategory, number>,
				likedMessages: [],
				dislikedMessages: [],
			};
		}

		const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
		const querySnapshot = await getDocs(q);

		let totalLikes = 0;
		let totalDislikes = 0;
		const likedCategories: Record<TodoCategory, number> = {} as Record<TodoCategory, number>;
		const dislikedCategories: Record<TodoCategory, number> = {} as Record<TodoCategory, number>;
		const likedMessages: string[] = [];
		const dislikedMessages: string[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const feedbackType = data.feedbackType as FeedbackType;
			const category = data.category as TodoCategory;
			const message = data.message as string;

			if (feedbackType === "like") {
				totalLikes++;
				likedCategories[category] = (likedCategories[category] || 0) + 1;
				if (!likedMessages.includes(message)) {
					likedMessages.push(message);
				}
			} else if (feedbackType === "dislike") {
				totalDislikes++;
				dislikedCategories[category] = (dislikedCategories[category] || 0) + 1;
				if (!dislikedMessages.includes(message)) {
					dislikedMessages.push(message);
				}
			}
		});


		return {
			totalLikes,
			totalDislikes,
			likedCategories,
			dislikedCategories,
			likedMessages,
			dislikedMessages,
		};
	} catch (error) {
		throw error;
	}
};
