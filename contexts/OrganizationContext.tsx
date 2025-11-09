import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { getMyOrganizations } from "../services/organizationService";
import type { Organization } from "../types/Organization";
import { useAuth } from "./AuthContext";

type OrganizationContextType = {
	organizations: Organization[];
	selectedOrganization: Organization | null;
	selectOrganization: (org: Organization | null) => void;
	refreshOrganizations: () => Promise<void>;
	isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(
	undefined
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [selectedOrganization, setSelectedOrganization] =
		useState<Organization | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const refreshOrganizations = useCallback(async () => {
		// ログインしていない場合は何もしない
		if (!user) {
			return;
		}

		setIsLoading(true);
		try {
			const orgs = await getMyOrganizations();
			setOrganizations(orgs);

			// 選択中の組織が削除されていたらnullにする
			if (
				selectedOrganization &&
				!orgs.find((o) => o.id === selectedOrganization.id)
			) {
				setSelectedOrganization(null);
			}
		} catch (error) {
			console.error("Error fetching organizations:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user, selectedOrganization]);

	const selectOrganization = (org: Organization | null) => {
		console.log("🔄 OrganizationContext: 選択変更", {
			from: selectedOrganization?.name || "My List",
			to: org?.name || "My List",
			organizationId: org?.id || null,
		});
		setSelectedOrganization(org);
	};

	// ユーザーがログインしている場合のみ組織を取得
	useEffect(() => {
		if (user) {
			refreshOrganizations();
		} else {
			// ログアウト時は状態をクリア
			setOrganizations([]);
			setSelectedOrganization(null);
		}
	}, [user, refreshOrganizations]);

	return (
		<OrganizationContext.Provider
			value={{
				organizations,
				selectedOrganization,
				selectOrganization,
				refreshOrganizations,
				isLoading,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	const context = useContext(OrganizationContext);
	if (context === undefined) {
		throw new Error(
			"useOrganization must be used within an OrganizationProvider"
		);
	}
	return context;
}
