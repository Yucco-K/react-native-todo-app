export type InvitationStatus = "pending" | "accepted" | "declined";

export type Invitation = {
	id: string;
	organizationId: string;
	organizationName: string;
	invitedBy: string; // 招待者のユーザーID
	invitedEmail: string;
	status: InvitationStatus;
	createdAt: Date;
};
