export type Organization = {
	id: string;
	name: string;
	ownerId: string;
	inviteCode: string; // 8桁英数字
	members: string[]; // ユーザーIDの配列
	createdAt: Date;
};

