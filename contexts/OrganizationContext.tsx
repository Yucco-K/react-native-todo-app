import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { Organization } from "../types/Organization";
import { getMyOrganizations } from "../services/organizationService";

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
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [selectedOrganization, setSelectedOrganization] =
		useState<Organization | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const refreshOrganizations = async () => {
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
	};

	const selectOrganization = (org: Organization | null) => {
		setSelectedOrganization(org);
	};

	// 初回ロード
	useEffect(() => {
		refreshOrganizations();
	}, []);

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

